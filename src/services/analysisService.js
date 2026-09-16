/*
 * Bitcoin Forensics
 * Wallet Analysis + Machine Learning Service
 *
 * Builds wallet-level forensic features from PostgreSQL,
 * runs a dependency-free Isolation Forest,
 * creates explainable wallet risk scores,
 * stores ML results and alerts.
 */

import pool from "../db/pool.js";
import config from "../config.js";

// ============================================================
// FEATURE DEFINITIONS
// ============================================================

export const EXPLAINABLE_FEATURES = [
  {
    key: "transaction_count",
    label: "Transaction Count",
    weight: 0.20,
  },
  {
    key: "total_input",
    label: "Total Input Volume",
    weight: 0.18,
  },
  {
    key: "total_output",
    label: "Total Output Volume",
    weight: 0.10,
  },
  {
    key: "unique_ips",
    label: "Network IP Diversity",
    weight: 0.15,
  },
  {
    key: "unique_counterparties",
    label: "Counterparty Diversity",
    weight: 0.10,
  },
  {
    key: "unique_countries",
    label: "Geographic Diversity",
    weight: 0.05,
  },
  {
    key: "unique_asns",
    label: "ASN Diversity",
    weight: 0.05,
  },
  {
    key: "unique_ports",
    label: "Network Port Diversity",
    weight: 0.04,
  },
  {
    key: "timing_variability",
    label: "Timing Variability",
    weight: 0.03,
  },
  {
    key: "amount_mean",
    label: "Average Transaction Amount",
    weight: 0.04,
  },
  {
    key: "amount_std",
    label: "Transaction Amount Variability",
    weight: 0.03,
  },
  {
    key: "velocity",
    label: "Transaction Velocity",
    weight: 0.03,
  },
];

export const WALLET_FEATURES =
  EXPLAINABLE_FEATURES.map(
    (item) => item.key
  );

// ============================================================
// BASIC HELPERS
// ============================================================

function safeNumber(value, fallback = 0) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function mean(values) {
  if (!Array.isArray(values)) {
    return 0;
  }

  const numbers = values
    .map(Number)
    .filter(Number.isFinite);

  if (!numbers.length) {
    return 0;
  }

  return (
    numbers.reduce(
      (sum, value) => sum + value,
      0
    ) / numbers.length
  );
}

function std(values) {
  if (!Array.isArray(values)) {
    return 0;
  }

  const numbers = values
    .map(Number)
    .filter(Number.isFinite);

  if (numbers.length < 2) {
    return 0;
  }

  const average = mean(numbers);

  const variance =
    numbers.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - average,
          2
        ),
      0
    ) / numbers.length;

  return Math.sqrt(variance);
}

function percentile(values, p) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return 0;
  }

  const sorted = values
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!sorted.length) {
    return 0;
  }

  const probability = clamp(
    Number(p) || 0,
    0,
    1
  );

  const index =
    (sorted.length - 1) *
    probability;

  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = index - lower;

  return (
    sorted[lower] +
    (sorted[upper] - sorted[lower]) *
      weight
  );
}

function percentileFromSorted(sorted, p) {
  if (!Array.isArray(sorted) || sorted.length === 0) {
    return 0;
  }

  const probability = clamp(Number(p) || 0, 0, 1);
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = index - lower;

  return sorted[lower] +
    (sorted[upper] - sorted[lower]) * weight;
}

function createPopulationStatistics(population) {
  const statistics = new Map();

  for (const definition of EXPLAINABLE_FEATURES) {
    const values = population
      .map((item) => safeNumber(item[definition.key]))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    statistics.set(definition.key, {
      values,
      mean: mean(values),
      std: std(values),
      median: percentileFromSorted(values, 0.50),
      p90: percentileFromSorted(values, 0.90),
      p95: percentileFromSorted(values, 0.95),
    });
  }

  return statistics;
}

function randomInt(max) {
  if (max <= 0) {
    return 0;
  }

  return Math.floor(
    Math.random() * max
  );
}

// ============================================================
// ISOLATION FOREST
// ============================================================

function cFactor(n) {
  if (!Number.isFinite(n) || n <= 1) {
    return 0;
  }

  if (n === 2) {
    return 1;
  }

  return (
    2 *
      (Math.log(n - 1) + 0.5772156649) -
    (2 * (n - 1)) / n
  );
}

function buildTree(
  rows,
  depth,
  maxDepth
) {
  if (
    !Array.isArray(rows) ||
    rows.length <= 1 ||
    depth >= maxDepth
  ) {
    return {
      leaf: true,
      size: rows?.length || 0,
    };
  }

  const featureCount =
    rows[0]?.features?.length || 0;

  if (!featureCount) {
    return {
      leaf: true,
      size: rows.length,
    };
  }

  const availableFeatures = [];

  for (
    let i = 0;
    i < featureCount;
    i++
  ) {
    const values = rows
      .map((row) =>
        Number(row.features[i])
      )
      .filter(Number.isFinite);

    if (!values.length) {
      continue;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min < max) {
      availableFeatures.push(i);
    }
  }

  if (!availableFeatures.length) {
    return {
      leaf: true,
      size: rows.length,
    };
  }

  const feature =
    availableFeatures[
      randomInt(
        availableFeatures.length
      )
    ];

  const values = rows
    .map((row) =>
      Number(row.features[feature])
    )
    .filter(Number.isFinite);

  const min = Math.min(...values);
  const max = Math.max(...values);

  const split =
    min +
    Math.random() *
      (max - min);

  const left = [];
  const right = [];

  for (const row of rows) {
    const value =
      Number(row.features[feature]);

    if (!Number.isFinite(value)) {
      right.push(row);
      continue;
    }

    if (value < split) {
      left.push(row);
    } else {
      right.push(row);
    }
  }

  if (
    !left.length ||
    !right.length
  ) {
    return {
      leaf: true,
      size: rows.length,
    };
  }

  return {
    leaf: false,
    feature,
    split,

    left: buildTree(
      left,
      depth + 1,
      maxDepth
    ),

    right: buildTree(
      right,
      depth + 1,
      maxDepth
    ),
  };
}

function pathLength(
  features,
  tree,
  depth = 0
) {
  if (!tree || tree.leaf) {
    return (
      depth +
      cFactor(tree?.size || 0)
    );
  }

  const value = Number(
    features[tree.feature]
  );

  if (
    Number.isFinite(value) &&
    value < tree.split
  ) {
    return pathLength(
      features,
      tree.left,
      depth + 1
    );
  }

  return pathLength(
    features,
    tree.right,
    depth + 1
  );
}

// ============================================================
// CREATE FEATURES
// ============================================================

export function createWalletFeatures(
  rows
) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => ({
    ...row,

    features: [
      safeNumber(row.transaction_count),
      safeNumber(row.total_input),
      safeNumber(row.total_output),
      safeNumber(row.unique_ips),
      safeNumber(row.unique_counterparties),
      safeNumber(row.unique_countries),
      safeNumber(row.unique_asns),
      safeNumber(row.unique_ports),
      safeNumber(row.amount_mean),
      safeNumber(row.amount_std),
      safeNumber(row.velocity),
      safeNumber(row.timing_variability),
    ],
  }));
}

// ============================================================
// TRAIN ISOLATION FOREST
// ============================================================

export function trainIsolationForest(
  rows,
  treeCount = 80,
  sampleSize = 256
) {
  if (
    !Array.isArray(rows) ||
    rows.length < 3
  ) {
    return rows.map((row) => ({
      wallet_address:
        row.wallet_address,

      anomaly_score: 0,
    }));
  }

  const safeTreeCount =
    Math.max(
      10,
      Math.min(
        200,
        Number(treeCount) || 80
      )
    );

  const safeSampleSize =
    Math.max(
      8,
      Math.min(
        1024,
        Number(sampleSize) || 256
      )
    );

  let sample;

  if (
    rows.length <=
    safeSampleSize
  ) {
    sample = [...rows];
  } else {
    const shuffled = [...rows];

    for (
      let i =
        shuffled.length - 1;
      i > 0;
      i--
    ) {
      const j =
        randomInt(i + 1);

      [
        shuffled[i],
        shuffled[j],
      ] = [
        shuffled[j],
        shuffled[i],
      ];
    }

    sample =
      shuffled.slice(
        0,
        safeSampleSize
      );
  }

  const maxDepth =
    Math.ceil(
      Math.log2(
        Math.max(
          2,
          sample.length
        )
      )
    );

  const trees = [];

  for (
    let i = 0;
    i < safeTreeCount;
    i++
  ) {
    const shuffled = [...sample];

    for (
      let j =
        shuffled.length - 1;
      j > 0;
      j--
    ) {
      const k =
        randomInt(j + 1);

      [
        shuffled[j],
        shuffled[k],
      ] = [
        shuffled[k],
        shuffled[j],
      ];
    }

    trees.push(
      buildTree(
        shuffled,
        0,
        maxDepth
      )
    );
  }

  const normalization =
    cFactor(
      sample.length
    );

  if (!normalization) {
    return rows.map((row) => ({
      wallet_address:
        row.wallet_address,

      anomaly_score: 0,
    }));
  }

  return rows.map((row) => {
    let totalPath = 0;

    for (const tree of trees) {
      totalPath += pathLength(
        row.features,
        tree
      );
    }

    const averagePath =
      totalPath /
      trees.length;

    const anomalyScore =
      Math.pow(
        2,
        -averagePath /
          normalization
      );

    return {
      wallet_address:
        row.wallet_address,

      anomaly_score:
        clamp(
          anomalyScore,
          0,
          1
        ),
    };
  });
}

// ============================================================
// BEHAVIORAL EVIDENCE
// ============================================================

function calculateBehaviorEvidence(
  wallet,
  population,
  populationStatistics = createPopulationStatistics(population)
) {
  if (
    !wallet ||
    !Array.isArray(population) ||
    !population.length
  ) {
    return 0;
  }

  let weightedScore = 0;
  let totalWeight = 0;

  for (
    const definition
    of EXPLAINABLE_FEATURES
  ) {
    const statistics =
      populationStatistics.get(definition.key);

    if (!statistics?.values.length) {
      continue;
    }

    const value =
      safeNumber(
        wallet[definition.key]
      );

    const p90 = statistics.p90;
    const p95 = statistics.p95;

    let evidence = 0;

    if (p95 > p90) {
      evidence =
        (value - p90) /
        (p95 - p90);
    } else if (p90 > 0) {
      evidence =
        (value - p90) /
        p90;
    }

    evidence =
      clamp(
        evidence,
        0,
        1
      );

    weightedScore +=
      evidence *
      definition.weight;

    totalWeight +=
      definition.weight;
  }

  if (!totalWeight) {
    return 0;
  }

  return clamp(
    weightedScore /
      totalWeight,
    0,
    1
  );
}

// ============================================================
// SEVERITY
// ============================================================

function getSeverity(
  riskScore
) {
  if (riskScore >= 80) {
    return "critical";
  }

  if (riskScore >= 60) {
    return "high";
  }

  if (riskScore >= 40) {
    return "medium";
  }

  return "low";
}

// ============================================================
// SCORE WALLETS
// ============================================================

export function scoreWallets(
  features,
  options = {}
) {
  if (
    !Array.isArray(features) ||
    !features.length
  ) {
    return [];
  }

  const treeCount =
    Number(
      options.treeCount ??
        options.mlTrees ??
        80
    );

  const sampleSize =
    Number(
      options.sampleSize ??
        256
    );

  const modelScores =
    trainIsolationForest(
      features,
      treeCount,
      sampleSize
    );

  const anomalyValues =
    modelScores.map(
      (item) =>
        safeNumber(
          item.anomaly_score
        )
    );

  const low =
    percentile(
      anomalyValues,
      0.05
    );

  const high =
    percentile(
      anomalyValues,
      0.95
    );

  const scoreMap =
    new Map();

  for (const item of modelScores) {
    scoreMap.set(
      item.wallet_address,
      safeNumber(
        item.anomaly_score
      )
    );
  }

  const populationStatistics =
    createPopulationStatistics(features);

  return features.map(
    (wallet) => {
      const anomaly =
        scoreMap.get(
          wallet.wallet_address
        ) ?? 0;

      let normalizedML = 0;

      if (high > low) {
        normalizedML =
          (anomaly - low) /
          (high - low);
      } else {
        normalizedML = 0.5;
      }

      normalizedML =
        clamp(
          normalizedML,
          0,
          1
        );

      const behavioralEvidence =
        calculateBehaviorEvidence(
          wallet,
          features,
          populationStatistics
        );

      const combinedScore =
        normalizedML * 0.80 +
        behavioralEvidence * 0.20;

      const riskScore =
        Math.round(
          clamp(
            combinedScore,
            0,
            1
          ) * 100
        );

      const mlRiskScore =
        Math.round(
          normalizedML * 100
        );

      const behavioralScore =
        Math.round(
          behavioralEvidence * 100
        );

      const distance =
        Math.abs(
          combinedScore - 0.5
        );

      const confidence =
        Math.round(
          clamp(
            50 +
              distance * 90,
            50,
            95
          )
        );

      return {
        ...wallet,

        anomaly_score:
          Number(
            anomaly.toFixed(6)
          ),

        ml_risk_score:
          mlRiskScore,

        behavioral_score:
          behavioralScore,

        risk_score:
          riskScore,

        confidence,

        severity:
          getSeverity(
            riskScore
          ),
      };
    }
  );
}

// ============================================================
// EXPLANATIONS
// ============================================================

export function explainWalletRisk(
  wallet,
  population = [],
  anomalyScore = 0,
  populationStatistics = createPopulationStatistics(population)
) {
  if (!wallet) {
    return [];
  }

  const explanations = [];

  for (
    const definition
    of EXPLAINABLE_FEATURES
  ) {
    const statistics =
      populationStatistics.get(definition.key);

    if (!statistics?.values.length) {
      continue;
    }

    const value =
      safeNumber(
        wallet[definition.key]
      );

    const p50 = statistics.median;
    const p90 = statistics.p90;
    const p95 = statistics.p95;

    let percentileRank = 50;

    if (value <= p50) {
      percentileRank = 50;
    } else if (value >= p95) {
      percentileRank = 95;
    } else if (p95 > p50) {
      percentileRank =
        50 +
        ((value - p50) /
          (p95 - p50)) *
          45;
    }

    percentileRank =
      clamp(
        percentileRank,
        0,
        100
      );

    const points =
      clamp(
        ((percentileRank - 50) /
          50) *
          100,
        0,
        100
      );

    let description;

    if (percentileRank >= 95) {
      description =
        `${definition.label} is extremely high compared with the wallet population.`;
    } else if (
      percentileRank >= 90
    ) {
      description =
        `${definition.label} is unusually high compared with the wallet population.`;
    } else if (
      percentileRank >= 75
    ) {
      description =
        `${definition.label} is above the normal population range.`;
    } else {
      description =
        `${definition.label} is within the normal population range.`;
    }

    explanations.push({
      label:
        definition.label,

      feature:
        definition.key,

      value,

      percentile:
        Number(
          percentileRank.toFixed(1)
        ),

      points:
        Number(
          points.toFixed(1)
        ),

      population_mean:
        Number(
          statistics.mean.toFixed(6)
        ),

      population_std:
        Number(
          statistics.std.toFixed(6)
        ),

      population_median:
        Number(
          p50.toFixed(6)
        ),

      population_p90:
        Number(
          p90.toFixed(6)
        ),

      population_p95:
        Number(
          p95.toFixed(6)
        ),

      description,
    });
  }

  const safeAnomaly =
    clamp(
      safeNumber(
        anomalyScore
      ),
      0,
      1
    );

  explanations.push({
    label:
      "Isolation Forest Anomaly Score",

    feature:
      "isolation_forest_anomaly",

    value:
      Number(
        safeAnomaly.toFixed(6)
      ),

    percentile:
      Number(
        (
          safeAnomaly * 100
        ).toFixed(1)
      ),

    points:
      Number(
        (
          safeAnomaly * 100
        ).toFixed(1)
      ),

    population_mean: null,
    population_std: null,
    population_median: null,
    population_p90: null,
    population_p95: null,

    description:
      "Primary machine-learning anomaly score generated by the Isolation Forest model.",
  });

  explanations.sort(
    (a, b) =>
      safeNumber(b.points) -
      safeNumber(a.points)
  );

  return explanations;
}

// ============================================================
// BUILD WALLET AGGREGATES FROM TRANSACTIONS
// ============================================================

async function buildWalletAggregates() {
  const result =
    await pool.query(`
      SELECT
        id,
        timestamp,
        src_ip,
        dst_ip,
        src_port,
        dst_port,
        txid,
        input_addresses,
        output_addresses,
        input_amounts,
        output_amounts,
        input_amount,
        output_amount,
        geo_country,
        asn
      FROM transactions
      ORDER BY id
    `);

  const wallets =
    new Map();

  function getWallet(address) {
    if (!address) {
      return null;
    }

    const clean =
      String(address).trim();

    if (!clean) {
      return null;
    }

    if (!wallets.has(clean)) {
      wallets.set(clean, {
        wallet_address: clean,

        transactionIds:
          new Set(),

        inputTotal: 0,
        outputTotal: 0,

        amounts: [],

        ips: new Set(),

        counterparties:
          new Set(),

        countries:
          new Set(),

        asns:
          new Set(),

        ports:
          new Set(),

        timestamps: [],
      });
    }

    return wallets.get(clean);
  }

  for (const tx of result.rows) {
    const inputs =
      Array.isArray(
        tx.input_addresses
      )
        ? tx.input_addresses
        : [];

    const outputs =
      Array.isArray(
        tx.output_addresses
      )
        ? tx.output_addresses
        : [];

    const inputAmounts =
      Array.isArray(
        tx.input_amounts
      )
        ? tx.input_amounts
        : [];

    const outputAmounts =
      Array.isArray(
        tx.output_amounts
      )
        ? tx.output_amounts
        : [];

    const allWallets =
      new Set([
        ...inputs,
        ...outputs,
      ]);

    for (const address of allWallets) {
      getWallet(address);
    }

    for (
      let i = 0;
      i < inputs.length;
      i++
    ) {
      const wallet =
        getWallet(
          inputs[i]
        );

      if (!wallet) {
        continue;
      }

      wallet.transactionIds.add(
        tx.id
      );

      const amount =
        safeNumber(
          inputAmounts[i],
          0
        );

      wallet.inputTotal +=
        amount;

      if (amount > 0) {
        wallet.amounts.push(
          amount
        );
      }

      if (tx.timestamp) {
        wallet.timestamps.push(
          new Date(
            tx.timestamp
          )
        );
      }

      if (tx.src_ip) {
        wallet.ips.add(
          String(tx.src_ip)
        );
      }

      if (tx.geo_country) {
        wallet.countries.add(
          String(
            tx.geo_country
          )
        );
      }

      if (tx.asn) {
        wallet.asns.add(
          String(tx.asn)
        );
      }

      if (tx.src_port !== null && tx.src_port !== undefined) {
        wallet.ports.add(String(tx.src_port));
      }

      if (tx.dst_port !== null && tx.dst_port !== undefined) {
        wallet.ports.add(String(tx.dst_port));
      }

      for (const output of outputs) {
        if (
          output &&
          output !== inputs[i]
        ) {
          wallet.counterparties.add(
            String(output)
          );
        }
      }
    }

    for (
      let i = 0;
      i < outputs.length;
      i++
    ) {
      const wallet =
        getWallet(
          outputs[i]
        );

      if (!wallet) {
        continue;
      }

      wallet.transactionIds.add(
        tx.id
      );

      const amount =
        safeNumber(
          outputAmounts[i],
          0
        );

      wallet.outputTotal +=
        amount;

      if (amount > 0) {
        wallet.amounts.push(
          amount
        );
      }

      if (tx.timestamp) {
        wallet.timestamps.push(
          new Date(
            tx.timestamp
          )
        );
      }

      if (tx.dst_ip) {
        wallet.ips.add(
          String(tx.dst_ip)
        );
      }

      if (tx.geo_country) {
        wallet.countries.add(
          String(
            tx.geo_country
          )
        );
      }

      if (tx.asn) {
        wallet.asns.add(
          String(tx.asn)
        );
      }

      if (tx.src_port !== null && tx.src_port !== undefined) {
        wallet.ports.add(String(tx.src_port));
      }

      if (tx.dst_port !== null && tx.dst_port !== undefined) {
        wallet.ports.add(String(tx.dst_port));
      }

      for (const input of inputs) {
        if (
          input &&
          input !== outputs[i]
        ) {
          wallet.counterparties.add(
            String(input)
          );
        }
      }
    }
  }

  return Array.from(
    wallets.values()
  ).map((wallet) => {
    const timestamps =
      wallet.timestamps
        .filter(
          (date) =>
            date instanceof Date &&
            !Number.isNaN(
              date.getTime()
            )
        )
        .sort(
          (a, b) =>
            a.getTime() -
            b.getTime()
        );

    let velocity = 0;
    const intervals = [];

    for (let index = 1; index < timestamps.length; index++) {
      intervals.push(
        (timestamps[index].getTime() - timestamps[index - 1].getTime()) / 1000
      );
    }

    if (
      timestamps.length >= 2
    ) {
      const first =
        timestamps[0].getTime();

      const last =
        timestamps[
          timestamps.length - 1
        ].getTime();

      const days =
        Math.max(
          1,
          (
            last - first
          ) /
            (
              1000 *
              60 *
              60 *
              24
            )
        );

      velocity =
        wallet.transactionIds.size /
        days;
    } else {
      velocity =
        wallet.transactionIds.size;
    }

    const timing_variability = std(intervals);

    return {
      wallet_address:
        wallet.wallet_address,

      transaction_count:
        wallet.transactionIds.size,

      total_input:
        wallet.inputTotal,

      total_output:
        wallet.outputTotal,

      unique_ips:
        wallet.ips.size,

      unique_counterparties:
        wallet.counterparties.size,

      unique_countries:
        wallet.countries.size,

      unique_asns:
        wallet.asns.size,

      unique_ports:
        wallet.ports.size,

      timing_variability,

      amount_mean:
        mean(
          wallet.amounts
        ),

      amount_std:
        std(
          wallet.amounts
        ),

      velocity,
    };
  });
}

// ============================================================
// REBUILD WALLET TRANSACTION LINKS
// ============================================================

async function rebuildWalletTransactions() {
  await pool.query(
    `DELETE FROM wallet_transactions`
  );

  await pool.query(`
    INSERT INTO wallet_transactions
    (
      wallet_address,
      transaction_id,
      direction,
      amount
    )
    SELECT
      TRIM(address),
      transaction_id,
      direction,
      amount
    FROM (
      SELECT
        t.id AS transaction_id,
        input_address.address,
        'input' AS direction,
        COALESCE(
          NULLIF(t.input_amounts ->>
            (input_address.position - 1)::text, '')::numeric,
          t.input_amount,
          0
        ) AS amount
      FROM transactions t
      CROSS JOIN LATERAL jsonb_array_elements_text(
        COALESCE(t.input_addresses, '[]'::jsonb)
      ) WITH ORDINALITY AS input_address(address, position)

      UNION ALL

      SELECT
        t.id AS transaction_id,
        output_address.address,
        'output' AS direction,
        COALESCE(
          NULLIF(t.output_amounts ->>
            (output_address.position - 1)::text, '')::numeric,
          t.output_amount,
          0
        ) AS amount
      FROM transactions t
      CROSS JOIN LATERAL jsonb_array_elements_text(
        COALESCE(t.output_addresses, '[]'::jsonb)
      ) WITH ORDINALITY AS output_address(address, position)
    ) relationships
    WHERE TRIM(address) <> ''
    ON CONFLICT
    (
      wallet_address,
      transaction_id,
      direction
    )
    DO UPDATE SET
      amount = EXCLUDED.amount
  `);
}

// ============================================================
// BUILD ENTITY EDGES
// ============================================================

async function rebuildEntityEdges() {
  await pool.query(
    `DELETE FROM entity_edges`
  );

  await pool.query(`
    INSERT INTO entity_edges
    (
      source_type,
      source_id,
      target_type,
      target_id,
      relation,
      weight
    )
    SELECT
      source_type,
      source_id,
      target_type,
      target_id,
      relation,
      1
    FROM (
      SELECT
        'wallet' AS source_type,
        input_address.address AS source_id,
        'transaction' AS target_type,
        t.txid AS target_id,
        'input' AS relation
      FROM transactions t
      CROSS JOIN LATERAL jsonb_array_elements_text(
        COALESCE(t.input_addresses, '[]'::jsonb)
      ) AS input_address(address)
      WHERE NULLIF(TRIM(t.txid), '') IS NOT NULL

      UNION ALL

      SELECT
        'transaction',
        t.txid,
        'wallet',
        output_address.address,
        'output'
      FROM transactions t
      CROSS JOIN LATERAL jsonb_array_elements_text(
        COALESCE(t.output_addresses, '[]'::jsonb)
      ) AS output_address(address)
      WHERE NULLIF(TRIM(t.txid), '') IS NOT NULL

      UNION ALL

      SELECT
        'wallet',
        input_address.address,
        'ip',
        t.src_ip::text,
        'observed_from'
      FROM transactions t
      CROSS JOIN LATERAL jsonb_array_elements_text(
        COALESCE(t.input_addresses, '[]'::jsonb)
      ) AS input_address(address)
      WHERE t.src_ip IS NOT NULL

      UNION ALL

      SELECT
        'wallet',
        output_address.address,
        'ip',
        t.dst_ip::text,
        'observed_at'
      FROM transactions t
      CROSS JOIN LATERAL jsonb_array_elements_text(
        COALESCE(t.output_addresses, '[]'::jsonb)
      ) AS output_address(address)
      WHERE t.dst_ip IS NOT NULL

      UNION ALL

      SELECT
        'ip',
        src_ip::text,
        'ip',
        dst_ip::text,
        'network_flow'
      FROM transactions
      WHERE src_ip IS NOT NULL
        AND dst_ip IS NOT NULL
    ) relationships
    WHERE NULLIF(TRIM(source_id), '') IS NOT NULL
      AND NULLIF(TRIM(target_id), '') IS NOT NULL
    ON CONFLICT DO NOTHING
  `);
}

// ============================================================
// SAVE WALLET PROFILES
// ============================================================

async function saveWalletProfiles(
  scoredWallets,
  explanationsMap
) {
  await pool.query(
    `DELETE FROM wallet_profiles`
  );

  const rows = scoredWallets.map((wallet) => ({
    ...wallet,
    explanation:
      explanationsMap.get(wallet.wallet_address) || [],
    features: {
      transaction_count: wallet.transaction_count,
      total_input: wallet.total_input,
      total_output: wallet.total_output,
      unique_ips: wallet.unique_ips,
      unique_counterparties: wallet.unique_counterparties,
      unique_countries: wallet.unique_countries,
      unique_asns: wallet.unique_asns,
      unique_ports: wallet.unique_ports,
      timing_variability: wallet.timing_variability,
      amount_mean: wallet.amount_mean,
      amount_std: wallet.amount_std,
      velocity: wallet.velocity,
      ml_risk_score: wallet.ml_risk_score,
      behavioral_score: wallet.behavioral_score,
    },
  }));

  await pool.query(
    `
    INSERT INTO wallet_profiles
    (
      wallet_address, transaction_count, total_input, total_output,
      unique_ips, unique_counterparties, unique_countries, unique_asns,
      amount_mean, amount_std, velocity, anomaly_score, risk_score,
      confidence, severity, explanation, features, updated_at
    )
    SELECT
      wallet_address, transaction_count, total_input, total_output,
      unique_ips, unique_counterparties, unique_countries, unique_asns,
      amount_mean, amount_std, velocity, anomaly_score, risk_score,
      confidence, severity, explanation, features, NOW()
    FROM jsonb_to_recordset($1::jsonb) AS rows(
      wallet_address text, transaction_count bigint, total_input numeric,
      total_output numeric, unique_ips bigint, unique_counterparties bigint,
      unique_countries bigint, unique_asns bigint, unique_ports bigint,
      amount_mean numeric, amount_std numeric, velocity numeric,
      anomaly_score numeric, risk_score numeric, confidence numeric,
      severity text, explanation jsonb, features jsonb
    )
    `,
    [JSON.stringify(rows)]
  );
}

// ============================================================
// SAVE ML RESULTS
// ============================================================

async function saveMlResults(
  datasetId,
  scoredWallets,
  explanationsMap
) {
  const run =
    await pool.query(
      `
      INSERT INTO ml_runs
      (
        dataset_id,
        model_name,
        model_version,
        sample_size,
        entity_count,
        started_at,
        completed_at,
        metadata
      )
      VALUES
      (
        $1,
        'Dependency-Free Isolation Forest',
        '1.0',
        $2,
        $3,
        NOW(),
        NOW(),
        $4
      )
      RETURNING id
      `,
      [
        datasetId || null,
        config.mlSampleSize,
        scoredWallets.length,
        JSON.stringify({
          algorithm:
            "Isolation Forest",

          trees: config.mlTrees,

          sampleSize: config.mlSampleSize,

          featureCount:
            WALLET_FEATURES.length,

          mlWeight: 0.80,

          behavioralWeight:
            0.20,
        }),
      ]
    );

  const runId =
    run.rows[0].id;

  const rows = scoredWallets.map((wallet) => ({
    wallet_address: wallet.wallet_address,
    anomaly_score: wallet.anomaly_score,
    prediction: wallet.severity,
    features: {
      transaction_count: wallet.transaction_count,
      total_input: wallet.total_input,
      total_output: wallet.total_output,
      unique_ips: wallet.unique_ips,
      unique_counterparties: wallet.unique_counterparties,
      unique_countries: wallet.unique_countries,
      unique_asns: wallet.unique_asns,
      unique_ports: wallet.unique_ports,
      timing_variability: wallet.timing_variability,
      amount_mean: wallet.amount_mean,
      amount_std: wallet.amount_std,
      velocity: wallet.velocity,
    },
    explanation:
      explanationsMap.get(wallet.wallet_address) || [],
  }));

  await pool.query(
    `
    INSERT INTO ml_results
      (ml_run_id, wallet_address, anomaly_score, prediction, features, explanation)
    SELECT $1, wallet_address, anomaly_score, prediction, features, explanation
    FROM jsonb_to_recordset($2::jsonb) AS rows(
      wallet_address text, anomaly_score numeric, prediction text,
      features jsonb, explanation jsonb
    )
    `,
    [runId, JSON.stringify(rows)]
  );

  return runId;
}

// ============================================================
// CREATE ALERTS
// ============================================================

async function createAlerts(
  scoredWallets,
  explanationsMap
) {
  await pool.query(
    `DELETE FROM alerts`
  );

  const rows = scoredWallets
    .filter((wallet) => wallet.risk_score >= 40)
    .map((wallet) => {
      const explanations =
        explanationsMap.get(wallet.wallet_address) || [];

      const factors = explanations
        .filter((item) =>
          item.feature !== "isolation_forest_anomaly" &&
          safeNumber(item.points) >= 40
        )
        .slice(0, 3);

      return {
        wallet_address: wallet.wallet_address,
        severity: wallet.severity,
        risk_score: wallet.risk_score,
        confidence: wallet.confidence,
        reason: factors.length
          ? `AI anomaly detected: ${factors.map((item) => item.label).join(", ")}`
          : "AI anomaly detected by Isolation Forest",
        evidence: {
          anomaly_score: wallet.anomaly_score,
          ml_risk_score: wallet.ml_risk_score,
          behavioral_score: wallet.behavioral_score,
          factors,
        },
      };
    });

  await pool.query(
    `
    INSERT INTO alerts
      (wallet_address, transaction_id, severity, risk_score, confidence, reason, evidence)
    SELECT
      rows.wallet_address,
      significant_transaction.transaction_id,
      rows.severity,
      rows.risk_score,
      rows.confidence,
      rows.reason,
      rows.evidence || jsonb_build_object(
        'transaction_id', significant_transaction.transaction_id
      )
    FROM jsonb_to_recordset($1::jsonb) AS rows(
      wallet_address text, severity text, risk_score numeric,
      confidence numeric, reason text, evidence jsonb
    )
    LEFT JOIN LATERAL (
      SELECT wt.transaction_id
      FROM wallet_transactions wt
      WHERE wt.wallet_address = rows.wallet_address
      ORDER BY COALESCE(wt.amount, 0) DESC, wt.transaction_id DESC
      LIMIT 1
    ) significant_transaction ON true
    `,
    [JSON.stringify(rows)]
  );
}

// ============================================================
// REBUILD ENTITY CLUSTERS
// ============================================================

async function rebuildEntityClusters() {
  await pool.query(
    `DELETE FROM entity_cluster_members`
  );

  await pool.query(
    `DELETE FROM entity_clusters`
  );

  await pool.query(`
    WITH RECURSIVE edge_pairs AS (
      SELECT
        source_type || ':' || source_id AS node,
        target_type || ':' || target_id AS neighbor
      FROM entity_edges

      UNION

      SELECT
        target_type || ':' || target_id,
        source_type || ':' || source_id
      FROM entity_edges
    ), graph_nodes AS (
      SELECT node FROM edge_pairs
      UNION
      SELECT neighbor FROM edge_pairs
    ), reachable(root, node) AS (
      SELECT node, node
      FROM graph_nodes

      UNION

      SELECT reachable.root, edge_pairs.neighbor
      FROM reachable
      INNER JOIN edge_pairs
        ON edge_pairs.node = reachable.node
    ), components AS (
      SELECT node, MIN(root) AS component
      FROM reachable
      GROUP BY node
    )
    INSERT INTO entity_clusters
    (
      cluster_key,
      risk_score,
      confidence,
      member_count,
      explanation
    )
    SELECT
      'component-' || md5(component),
      COALESCE(
        MAX(wp.risk_score) FILTER (WHERE c.node LIKE 'wallet:%'),
        0
      ),
      COALESCE(
        AVG(wp.confidence) FILTER (WHERE c.node LIKE 'wallet:%'),
        0
      ),
      COUNT(*),
      jsonb_build_object(
        'connected_component', component,
        'entity_count', COUNT(*)
      )
    FROM components c
    LEFT JOIN wallet_profiles wp
      ON c.node = 'wallet:' || wp.wallet_address
    GROUP BY component
  `);

  await pool.query(`
    WITH RECURSIVE edge_pairs AS (
      SELECT
        source_type || ':' || source_id AS node,
        target_type || ':' || target_id AS neighbor
      FROM entity_edges

      UNION

      SELECT
        target_type || ':' || target_id,
        source_type || ':' || source_id
      FROM entity_edges
    ), graph_nodes AS (
      SELECT node FROM edge_pairs
      UNION
      SELECT neighbor FROM edge_pairs
    ), reachable(root, node) AS (
      SELECT node, node
      FROM graph_nodes

      UNION

      SELECT reachable.root, edge_pairs.neighbor
      FROM reachable
      INNER JOIN edge_pairs
        ON edge_pairs.node = reachable.node
    ), components AS (
      SELECT node, MIN(root) AS component
      FROM reachable
      GROUP BY node
    )
    INSERT INTO entity_cluster_members
    (
      cluster_id,
      entity_type,
      entity_id
    )
    SELECT
      clusters.id,
      split_part(c.node, ':', 1),
      substring(c.node FROM position(':' IN c.node) + 1)
    FROM components c
    INNER JOIN entity_clusters clusters
      ON clusters.cluster_key = 'component-' || md5(c.component)
  `);
}

// ============================================================
// MAIN ANALYSIS PIPELINE
// ============================================================

export async function rebuildAnalysis(
  datasetId
) {
  console.log(
    "=========================================="
  );

  console.log(
    "STARTING WALLET FORENSIC ANALYSIS"
  );

  console.log(
    "Dataset:",
    datasetId
  );

  console.log(
    "=========================================="
  );

  /*
   * Step 1
   * Rebuild wallet transaction relationships.
   */

  console.log(
    "Step 1/7: rebuilding wallet transactions..."
  );

  await rebuildWalletTransactions();

  /*
   * Step 2
   * Build wallet-level features.
   */

  console.log(
    "Step 2/7: building wallet features..."
  );

  const walletRows =
    await buildWalletAggregates();

  console.log(
    `Wallets discovered: ${walletRows.length}`
  );

  if (!walletRows.length) {
    throw new Error(
      "No wallet addresses were found in the transactions. Check that the uploaded CSV contains valid From_Address and To_Address values."
    );
  }

  /*
   * Step 3
   * Convert to ML feature vectors.
   */

  console.log(
    "Step 3/7: creating ML feature vectors..."
  );

  const features =
    createWalletFeatures(
      walletRows
    );

  /*
   * Step 4
   * Run Isolation Forest.
   */

  console.log(
    "Step 4/7: running Isolation Forest..."
  );

  const scoredWallets =
    scoreWallets(
      features,
      {
        treeCount: config.mlTrees,
        sampleSize: config.mlSampleSize,
      }
    );

  /*
   * Step 5
   * Generate explanations.
   */

  console.log(
    "Step 5/7: generating explanations..."
  );

  const explanationsMap =
    new Map();

  const populationStatistics =
    createPopulationStatistics(walletRows);

  for (const wallet of scoredWallets) {
    const explanation =
      explainWalletRisk(
        wallet,
        walletRows,
        wallet.anomaly_score,
        populationStatistics
      );

    explanationsMap.set(
      wallet.wallet_address,
      explanation
    );
  }

  /*
   * Step 6
   * Save analysis.
   */

  console.log(
    "Step 6/7: saving ML results, profiles and alerts..."
  );

  await saveWalletProfiles(
    scoredWallets,
    explanationsMap
  );

  const mlRunId =
    await saveMlResults(
      datasetId,
      scoredWallets,
      explanationsMap
    );

  await createAlerts(
    scoredWallets,
    explanationsMap
  );

  /*
   * Step 7
   * Rebuild graph relationships.
   */

  console.log(
    "Step 7/7: rebuilding entity graph..."
  );

  await rebuildEntityEdges();

  await rebuildEntityClusters();

  /*
   * Summary.
   */

  const critical =
    scoredWallets.filter(
      (wallet) =>
        wallet.severity ===
        "critical"
    ).length;

  const high =
    scoredWallets.filter(
      (wallet) =>
        wallet.severity ===
        "high"
    ).length;

  const medium =
    scoredWallets.filter(
      (wallet) =>
        wallet.severity ===
        "medium"
    ).length;

  const low =
    scoredWallets.filter(
      (wallet) =>
        wallet.severity ===
        "low"
    ).length;

  const averageRisk =
    scoredWallets.length
      ? scoredWallets.reduce(
          (sum, wallet) =>
            sum +
            safeNumber(
              wallet.risk_score
            ),
          0
        ) /
        scoredWallets.length
      : 0;

  console.log(
    "=========================================="
  );

  console.log(
    "WALLET FORENSIC ANALYSIS COMPLETED"
  );

  console.log(
    `Wallets: ${scoredWallets.length}`
  );

  console.log(
    `Critical: ${critical}`
  );

  console.log(
    `High: ${high}`
  );

  console.log(
    `Medium: ${medium}`
  );

  console.log(
    `Low: ${low}`
  );

  console.log(
    `Average risk: ${averageRisk.toFixed(2)}`
  );

  console.log(
    `ML run ID: ${mlRunId}`
  );

  console.log(
    "=========================================="
  );

  return {
    datasetId,

    walletsAnalyzed:
      scoredWallets.length,

    critical,

    high,

    medium,

    low,

    averageRisk:
      Number(
        averageRisk.toFixed(2)
      ),

    mlRunId,

    model: {
      name:
        "Dependency-Free Isolation Forest",

      algorithm:
        "Isolation Forest",

      trees: config.mlTrees,

      sampleSize: config.mlSampleSize,

      featureCount:
        WALLET_FEATURES.length,

      mlWeight: 0.80,

      behavioralWeight: 0.20,
    },
  };
}

// ============================================================
// MODEL INFORMATION
// ============================================================

export function getModelInfo() {
  return {
    name:
      "Dependency-Free Isolation Forest",

    algorithm:
      "Isolation Forest",

    trees: config.mlTrees,

    sampleSize: config.mlSampleSize,

    featureCount:
      WALLET_FEATURES.length,

    features:
      [...WALLET_FEATURES],

    explainableFeatures:
      EXPLAINABLE_FEATURES,

    mlWeight: 0.80,

    behavioralWeight: 0.20,

    riskRange:
      "0-100",

    severityThresholds: {
      low: "0-39",
      medium: "40-59",
      high: "60-79",
      critical: "80-100",
    },
  };
}