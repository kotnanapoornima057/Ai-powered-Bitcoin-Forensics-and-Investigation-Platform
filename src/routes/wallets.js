import express from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);


/* =========================================================
   GET /api/wallets
   Wallet Directory
   ========================================================= */

router.get("/", async (req, res) => {
  try {
    const sort = req.query.sort || "risk";

    let orderBy;

    switch (sort) {
      case "transactions":
        orderBy = `
          transaction_count DESC,
          wallet_address ASC
        `;
        break;

      case "volume":
        orderBy = `
          (
            COALESCE(total_input, 0) +
            COALESCE(total_output, 0)
          ) DESC,
          wallet_address ASC
        `;
        break;

      case "address":
        orderBy = `
          wallet_address ASC
        `;
        break;

      case "risk":
      default:
        orderBy = `
          COALESCE(risk_score, 0) DESC,
          COALESCE(transaction_count, 0) DESC,
          wallet_address ASC
        `;
        break;
    }


    const result = await pool.query(`
      SELECT
        wallet_address,

        COALESCE(transaction_count, 0)::integer
          AS transaction_count,

        COALESCE(total_input, 0)::numeric
          AS total_input,

        COALESCE(total_output, 0)::numeric
          AS total_output,

        COALESCE(unique_ips, 0)::integer
          AS unique_ips,

        COALESCE(unique_counterparties, 0)::integer
          AS unique_counterparties,

        COALESCE(unique_countries, 0)::integer
          AS unique_countries,

        COALESCE(unique_asns, 0)::integer
          AS unique_asns,

        COALESCE(amount_mean, 0)::numeric
          AS amount_mean,

        COALESCE(amount_std, 0)::numeric
          AS amount_std,

        COALESCE(velocity, 0)::numeric
          AS velocity,

        COALESCE(anomaly_score, 0)::numeric
          AS anomaly_score,

        COALESCE(risk_score, 0)::numeric
          AS risk_score,

        COALESCE(confidence, 0)::numeric
          AS confidence,

        COALESCE(severity, 'Low')
          AS severity,

        COALESCE(
          explanation,
          '[]'::jsonb
        ) AS explanation,

        COALESCE(
          features,
          '{}'::jsonb
        ) AS features,

        updated_at

      FROM wallet_profiles

      ORDER BY ${orderBy}
    `);


    const wallets = result.rows.map((wallet) => ({
      ...wallet,

      transaction_count:
        Number(wallet.transaction_count || 0),

      total_input:
        Number(wallet.total_input || 0),

      total_output:
        Number(wallet.total_output || 0),

      unique_ips:
        Number(wallet.unique_ips || 0),

      unique_counterparties:
        Number(
          wallet.unique_counterparties || 0
        ),

      unique_countries:
        Number(
          wallet.unique_countries || 0
        ),

      unique_asns:
        Number(
          wallet.unique_asns || 0
        ),

      amount_mean:
        Number(wallet.amount_mean || 0),

      amount_std:
        Number(wallet.amount_std || 0),

      velocity:
        Number(wallet.velocity || 0),

      anomaly_score:
        Number(wallet.anomaly_score || 0),

      risk_score:
        Number(wallet.risk_score || 0),

      confidence:
        Number(wallet.confidence || 0),
    }));


    return res.json({
      wallets,
      count: wallets.length,
    });

  } catch (error) {
    console.error(
      "Wallet directory error:",
      error
    );

    return res.status(500).json({
      error: "Unable to load wallets.",
      details: error.message,
    });
  }
});


/* =========================================================
   GET /api/wallets/:address
   Wallet Investigation
   ========================================================= */

router.get("/:address", async (req, res) => {
  const address =
    decodeURIComponent(
      req.params.address
    );

  try {

    /* -----------------------------------------------------
       1. WALLET PROFILE
       ----------------------------------------------------- */

    const profileResult =
      await pool.query(
        `
        SELECT *
        FROM wallet_profiles
        WHERE wallet_address = $1
        LIMIT 1
        `,
        [address]
      );


    if (profileResult.rowCount === 0) {
      return res.status(404).json({
        error: "Wallet not found.",
      });
    }


    const profile =
      profileResult.rows[0];


    /* -----------------------------------------------------
       2. LATEST TRANSACTIONS

       DISTINCT ON prevents the same transaction from
       appearing multiple times when wallet_transactions
       contains multiple relationship rows.
       ----------------------------------------------------- */

    const transactionsResult =
      await pool.query(
        `
        SELECT DISTINCT ON (t.id)
          t.id,
          t.timestamp,
          t.txid,

          t.src_ip,
          t.dst_ip,

          t.src_port,
          t.dst_port,

          t.input_addresses,
          t.output_addresses,

          t.input_amounts,
          t.output_amounts,

          t.input_amount,
          t.output_amount,

          t.fee,
          t.script_type,

          t.geo_country,
          t.asn,

          wt.direction,
          wt.amount

        FROM wallet_transactions wt

        INNER JOIN transactions t
          ON t.id = wt.transaction_id

        WHERE
          wt.wallet_address = $1

        ORDER BY
          t.id,
          t.timestamp DESC NULLS LAST

        LIMIT 100
        `,
        [address]
      );


    /* -----------------------------------------------------
       3. ALERTS
       ----------------------------------------------------- */

    const alertsResult =
      await pool.query(
        `
        SELECT
          id,
          wallet_address,
          transaction_id,
          severity,
          risk_score,
          confidence,
          reason,
          evidence,
          created_at

        FROM alerts

        WHERE wallet_address = $1

        ORDER BY
          risk_score DESC,
          created_at DESC

        LIMIT 100
        `,
        [address]
      );


    /* -----------------------------------------------------
       4. NETWORK SUMMARY

       These values are already calculated by the
       analysis service and stored in wallet_profiles.

       We deliberately do not scan the transaction table
       again here.
       ----------------------------------------------------- */

    const network = {
      source_ips:
        Number(profile.unique_ips || 0),

      destination_ips:
        Number(profile.unique_ips || 0),

      countries:
        Number(
          profile.unique_countries || 0
        ),

      asns:
        Number(
          profile.unique_asns || 0
        ),
    };


    /* -----------------------------------------------------
       5. COUNTERPARTIES

       entity_edges is the derived relationship table,
       so we don't need an expensive transaction join.
       ----------------------------------------------------- */

    const counterpartiesResult =
      await pool.query(
        `
        SELECT DISTINCT
          CASE
            WHEN source_type = 'wallet'
              THEN source_id

            WHEN target_type = 'wallet'
              THEN target_id

            ELSE NULL
          END AS wallet_address

        FROM entity_edges

        WHERE
          (
            source_type = 'wallet'
            AND source_id = $1
          )

          OR

          (
            target_type = 'wallet'
            AND target_id = $1
          )

        LIMIT 1000
        `,
        [address]
      );


    const counterparties =
      counterpartiesResult.rows
        .filter(
          (row) =>
            row.wallet_address &&
            row.wallet_address !== address
        )
        .map(
          (row) => ({
            wallet_address:
              row.wallet_address,
          })
        );


    /* -----------------------------------------------------
       6. NORMALIZE PROFILE NUMBERS
       ----------------------------------------------------- */

    const normalizedProfile = {
      ...profile,

      transaction_count:
        Number(
          profile.transaction_count || 0
        ),

      total_input:
        Number(
          profile.total_input || 0
        ),

      total_output:
        Number(
          profile.total_output || 0
        ),

      unique_ips:
        Number(
          profile.unique_ips || 0
        ),

      unique_counterparties:
        Number(
          profile.unique_counterparties || 0
        ),

      unique_countries:
        Number(
          profile.unique_countries || 0
        ),

      unique_asns:
        Number(
          profile.unique_asns || 0
        ),

      amount_mean:
        Number(
          profile.amount_mean || 0
        ),

      amount_std:
        Number(
          profile.amount_std || 0
        ),

      velocity:
        Number(
          profile.velocity || 0
        ),

      anomaly_score:
        Number(
          profile.anomaly_score || 0
        ),

      risk_score:
        Number(
          profile.risk_score || 0
        ),

      confidence:
        Number(
          profile.confidence || 0
        ),
    };


    /* -----------------------------------------------------
       7. RESPONSE
       ----------------------------------------------------- */

    return res.json({
      wallet: normalizedProfile,

      transactions:
        transactionsResult.rows,

      alerts:
        alertsResult.rows,

      network,

      counterparties,
    });

  } catch (error) {

    console.error(
      "Wallet investigation error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to load wallet investigation.",

      details:
        error.message,
    });
  }
});


export default router;