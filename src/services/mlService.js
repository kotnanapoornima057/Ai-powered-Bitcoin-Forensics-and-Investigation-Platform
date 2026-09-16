/*
 * Bitcoin Forensics - Machine Learning Service
 *
 * Dependency-free Isolation Forest implementation.
 *
 * Input:
 *   Wallet-level behavioral features
 *
 * Output:
 *   anomaly_score : 0..1
 *   risk_score    : 0..100
 *   confidence    : 0..99
 *   severity      : low | medium | high | critical
 *
 * The model is intentionally implemented without external ML
 * dependencies so the application can operate offline.
 */

// ------------------------------------------------------------
// BASIC STATISTICS
// ------------------------------------------------------------

function mean(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const numbers = values
    .map(Number)
    .filter(Number.isFinite);

  if (!numbers.length) {
    return 0;
  }

  return (
    numbers.reduce((sum, value) => sum + value, 0) /
    numbers.length
  );
}

function std(values) {
  if (!Array.isArray(values) || values.length < 2) {
    return 0;
  }

  const numbers = values
    .map(Number)
    .filter(Number.isFinite);

  if (numbers.length < 2) {
    return 0;
  }

  const m = mean(numbers);

  return Math.sqrt(
    numbers.reduce(
      (sum, value) =>
        sum + Math.pow(value - m, 2),
      0
    ) / numbers.length
  );
}

// ------------------------------------------------------------
// ISOLATION FOREST MATHEMATICS
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// RANDOM INTEGER
// ------------------------------------------------------------

function randomInt(max) {
  if (max <= 0) {
    return 0;
  }

  return Math.floor(Math.random() * max);
}

// ------------------------------------------------------------
// BUILD ISOLATION TREE
// ------------------------------------------------------------

function buildTree(rows, depth, maxDepth) {
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

  for (let i = 0; i < featureCount; i++) {
    const values = rows
      .map((row) => Number(row.features[i]))
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
      randomInt(availableFeatures.length)
    ];

  const values = rows
    .map((row) => Number(row.features[feature]))
    .filter(Number.isFinite);

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return {
      leaf: true,
      size: rows.length,
    };
  }

  const split =
    min + Math.random() * (max - min);

  const left = [];
  const right = [];

  for (const row of rows) {
    const value = Number(row.features[feature]);

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

  if (!left.length || !right.length) {
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

// ------------------------------------------------------------
// PATH LENGTH
// ------------------------------------------------------------

function pathLength(features, tree, depth = 0) {
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

// ------------------------------------------------------------
// PERCENTILE
// ------------------------------------------------------------

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

  const probability = Math.max(
    0,
    Math.min(1, Number(p) || 0)
  );

  const index =
    (sorted.length - 1) * probability;

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

// ------------------------------------------------------------
// NORMALIZATION HELPERS
// ------------------------------------------------------------

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

// ------------------------------------------------------------
// FEATURE DEFINITIONS
// ------------------------------------------------------------

export const WALLET_FEATURES = [
  "transaction_count",
  "total_input",
  "total_output",
  "unique_ips",
  "unique_counterparties",
  "unique_countries",
  "unique_asns",
  "amount_mean",
  "amount_std",
  "velocity",
];

// ------------------------------------------------------------
// CREATE WALLET FEATURE VECTORS
// ------------------------------------------------------------

export function createWalletFeatures(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const transactionCount =
      safeNumber(
        row.transaction_count
      );

    const totalInput =
      safeNumber(
        row.total_input
      );

    const totalOutput =
      safeNumber(
        row.total_output
      );

    const uniqueIps =
      safeNumber(
        row.unique_ips
      );

    const uniqueCounterparties =
      safeNumber(
        row.unique_counterparties
      );

    const uniqueCountries =
      safeNumber(
        row.unique_countries
      );

    const uniqueAsns =
      safeNumber(
        row.unique_asns
      );

    const amountMean =
      safeNumber(
        row.amount_mean
      );

    const amountStd =
      safeNumber(
        row.amount_std
      );

    const velocity =
      safeNumber(
        row.velocity
      );

    return {
      ...row,

      features: [
        transactionCount,
        totalInput,
        totalOutput,
        uniqueIps,
        uniqueCounterparties,
        uniqueCountries,
        uniqueAsns,
        amountMean,
        amountStd,
        velocity,
      ],
    };
  });
}

// ------------------------------------------------------------
// ISOLATION FOREST
// ------------------------------------------------------------

export function trainIsolationForest(
  rows,
  treeCount = 80,
  sampleSize = 256
) {
  if (
    !Array.isArray(rows) ||
    rows.length < 3
  ) {
    return [];
  }

  const safeTreeCount = Math.max(
    10,
    Math.min(200, Number(treeCount) || 80)
  );

  const safeSampleSize = Math.max(
    8,
    Math.min(1024, Number(sampleSize) || 256)
  );

  // Do not modify the original rows array.
  let sample;

  if (rows.length <= safeSampleSize) {
    sample = [...rows];
  } else {
    const shuffled = [...rows];

    for (
      let i = shuffled.length - 1;
      i > 0;
      i--
    ) {
      const j = randomInt(i + 1);

      [
        shuffled[i],
        shuffled[j],
      ] = [
        shuffled[j],
        shuffled[i],
      ];
    }

    sample = shuffled.slice(
      0,
      safeSampleSize
    );
  }

  const maxDepth = Math.ceil(
    Math.log2(
      Math.max(2, sample.length)
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
      let j = shuffled.length - 1;
      j > 0;
      j--
    ) {
      const k = randomInt(j + 1);

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
    cFactor(sample.length);

  if (!normalization) {
    return rows.map((row) => ({
      wallet_address:
        row.wallet_address,

      anomaly_score: 0,
    }));
  }

  return rows.map((row) => {
    const averagePath =
      trees.reduce(
        (sum, tree) =>
          sum +
          pathLength(
            row.features,
            tree
          ),
        0
      ) / trees.length;

    const score = Math.pow(
      2,
      -averagePath /
        normalization
    );

    return {
      wallet_address:
        row.wallet_address,

      anomaly_score: clamp(
        score,
        0,
        1
      ),
    };
  });
}

// ------------------------------------------------------------
// BEHAVIORAL EVIDENCE
// ------------------------------------------------------------
//
// This is NOT a replacement for Isolation Forest.
// It is a secondary explainability layer.
//
// The final risk combines:
//
// 80% Isolation Forest anomaly score
// 20% behavioral evidence
//
// This makes the result easier to explain while still
// keeping the ML model as the primary detector.
// ------------------------------------------------------------

const BEHAVIOR_WEIGHTS = {
  transaction_count: 0.25,
  total_input: 0.20,
  total_output: 0.10,
  unique_ips: 0.15,
  unique_counterparties: 0.10,
  unique_countries: 0.05,
  unique_asns: 0.05,
  amount_mean: 0.04,
  amount_std: 0.03,
  velocity: 0.03,
};

function calculateBehaviorEvidence(
  wallet,
  population
) {
  let weightedScore = 0;
  let totalWeight = 0;

  for (const feature of WALLET_FEATURES) {
    const weight =
      BEHAVIOR_WEIGHTS[feature] || 0;

    if (!weight) {
      continue;
    }

    const value = safeNumber(
      wallet[feature]
    );

    const populationValues =
      population
        .map((item) =>
          safeNumber(
            item[feature]
          )
        )
        .filter(Number.isFinite);

    if (!populationValues.length) {
      continue;
    }

    const p90 = percentile(
      populationValues,
      0.90
    );

    const p95 = percentile(
      populationValues,
      0.95
    );

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

    evidence = clamp(
      evidence,
      0,
      1
    );

    weightedScore +=
      evidence * weight;

    totalWeight += weight;
  }

  if (!totalWeight) {
    return 0;
  }

  return clamp(
    weightedScore / totalWeight,
    0,
    1
  );
}

// ------------------------------------------------------------
// RISK SEVERITY
// ------------------------------------------------------------

function getSeverity(riskScore) {
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

// ------------------------------------------------------------
// SCORE WALLETS
// ------------------------------------------------------------

export function scoreWallets(
  features,
  options = {}
) {
  if (
    !Array.isArray(features) ||
    features.length === 0
  ) {
    return [];
  }

  const treeCount =
    Number(options.treeCount) || 80;

  const sampleSize =
    Number(options.sampleSize) || 256;

  const scores =
    trainIsolationForest(
      features,
      treeCount,
      sampleSize
    );

  const anomalyValues =
    scores.map(
      (item) =>
        safeNumber(
          item.anomaly_score
        )
    );

  /*
   * Isolation Forest produces higher anomaly scores
   * for more isolated observations.
   *
   * We use the 5th and 95th percentile as population
   * boundaries instead of 10th/90th so fewer wallets
   * are automatically clipped to 0 or 100.
   */

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
    new Map(
      scores.map(
        (item) => [
          item.wallet_address,
          safeNumber(
            item.anomaly_score
          ),
        ]
      )
    );

  return features.map(
    (wallet) => {
      const anomaly =
        scoreMap.get(
          wallet.wallet_address
        ) ?? 0;

      let normalizedML;

      if (high > low) {
        normalizedML =
          (anomaly - low) /
          (high - low);
      } else {
        normalizedML = anomaly;
      }

      normalizedML = clamp(
        normalizedML,
        0,
        1
      );

      /*
       * Behavioral evidence is calculated independently
       * from the Isolation Forest.
       */
      const behavioralEvidence =
        calculateBehaviorEvidence(
          wallet,
          features
        );

      /*
       * ML remains the primary detector.
       */
      const combinedScore =
        normalizedML * 0.80 +
        behavioralEvidence * 0.20;

      const riskScore = Math.round(
        clamp(
          combinedScore,
          0,
          1
        ) * 100
      );

      /*
       * Confidence reflects how far the final score
       * is from the uncertain middle range.
       */
      const distanceFromMiddle =
        Math.abs(
          combinedScore - 0.5
        );

      const confidence = Math.round(
        clamp(
          50 +
            distanceFromMiddle *
              90,
          50,
          95
        )
      );

      const severity =
        getSeverity(
          riskScore
        );

      return {
        ...wallet,

        anomaly_score:
          Number(
            anomaly.toFixed(6)
          ),

        ml_risk_score:
          Math.round(
            normalizedML * 100
          ),

        behavioral_score:
          Math.round(
            behavioralEvidence * 100
          ),

        risk_score:
          riskScore,

        confidence,

        severity,
      };
    }
  );
}

// ------------------------------------------------------------
// EXPLAIN A SINGLE WALLET SCORE
// ------------------------------------------------------------
//
// This helper can be used by analysisService.js to generate
// explainable evidence for alerts and wallet investigations.
// ------------------------------------------------------------

export function explainWalletRisk(
  wallet,
  population = [],
  anomalyScore = 0
) {
  if (!wallet) {
    return [];
  }

  const explanations = [];

  for (const feature of WALLET_FEATURES) {
    const value =
      safeNumber(
        wallet[feature]
      );

    const populationValues =
      population
        .map((item) =>
          safeNumber(
            item[feature]
          )
        )
        .filter(Number.isFinite);

    if (!populationValues.length) {
      continue;
    }

    const p50 =
      percentile(
        populationValues,
        0.50
      );

    const p90 =
      percentile(
        populationValues,
        0.90
      );

    const p95 =
      percentile(
        populationValues,
        0.95
      );

    let percentileRank = 0;

    if (value <= p50) {
      percentileRank = 50;
    } else if (
      value >= p95
    ) {
      percentileRank = 95;
    } else if (
      p95 > p50
    ) {
      percentileRank =
        50 +
        ((value - p50) /
          (p95 - p50)) *
          45;
    }

    percentileRank = clamp(
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

    explanations.push({
      feature,
      value,
      percentile:
        Number(
          percentileRank.toFixed(1)
        ),
      points:
        Number(
          points.toFixed(1)
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
    });
  }

  /*
   * Explicitly include the actual ML anomaly score.
   */
  explanations.push({
    feature:
      "isolation_forest_anomaly",
    value:
      Number(
        safeNumber(
          anomalyScore
        ).toFixed(6)
      ),
    percentile:
      Number(
        (
          safeNumber(
            anomalyScore
          ) * 100
        ).toFixed(1)
      ),
    points:
      Number(
        (
          safeNumber(
            anomalyScore
          ) * 100
        ).toFixed(1)
      ),
    population_median: null,
    population_p90: null,
    population_p95: null,
  });

  /*
   * Highest evidence first.
   */
  explanations.sort(
    (a, b) =>
      safeNumber(
        b.points
      ) -
      safeNumber(
        a.points
      )
  );

  return explanations;
}

// ------------------------------------------------------------
// MODEL INFORMATION
// ------------------------------------------------------------

export function getModelInfo() {
  return {
    name:
      "Dependency-Free Isolation Forest",

    algorithm:
      "Isolation Forest",

    trees: 80,

    sampleSize: 256,

    featureCount:
      WALLET_FEATURES.length,

    features:
      [...WALLET_FEATURES],

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