import express from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);


/* =========================
   DASHBOARD SUMMARY
========================= */

router.get("/summary", async (req, res) => {
  try {
    const [
      transactions,
      wallets,
      ips,
      suspicious,
      highRisk,
      averageRisk
    ] = await Promise.all([

      pool.query(
        "SELECT COUNT(*)::BIGINT AS count " +
        "FROM (" +
        "SELECT COALESCE(NULLIF(TRIM(txid), ''), 'row-' || id::text) AS transaction_key " +
        "FROM transactions " +
        "GROUP BY COALESCE(NULLIF(TRIM(txid), ''), 'row-' || id::text)" +
        ") unique_transactions"
      ),

      pool.query(
        "SELECT COUNT(*)::BIGINT AS count " +
        "FROM wallet_profiles"
      ),

      pool.query(
        "SELECT COUNT(*)::BIGINT AS count " +
        "FROM (" +
        "SELECT NULLIF(TRIM(src_ip::text), '') AS ip " +
        "FROM transactions " +
        "WHERE src_ip IS NOT NULL " +
        "UNION " +
        "SELECT NULLIF(TRIM(dst_ip::text), '') AS ip " +
        "FROM transactions " +
        "WHERE dst_ip IS NOT NULL" +
        ") x " +
        "WHERE ip IS NOT NULL"
      ),

      pool.query(
        "SELECT COUNT(*)::BIGINT AS count " +
        "FROM wallet_profiles " +
        "WHERE risk_score >= 40"
      ),

      pool.query(
        "SELECT COUNT(*)::BIGINT AS count " +
        "FROM wallet_profiles " +
        "WHERE risk_score >= 80"
      ),

      pool.query(
        "SELECT COALESCE(AVG(risk_score), 0)::float AS value " +
        "FROM wallet_profiles"
      )

    ]);

    res.json({
      transactions: Number(transactions.rows[0].count),
      wallets: Number(wallets.rows[0].count),
      ips: Number(ips.rows[0].count),
      suspicious: Number(suspicious.rows[0].count),
      highRisk: Number(highRisk.rows[0].count),
      averageRisk: Number(averageRisk.rows[0].value)
    });

  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      error: "Unable to load dashboard summary."
    });
  }
});


/* =========================
   LATEST TRANSACTIONS
========================= */

router.get("/transactions", async (req, res) => {
  try {

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(req.query.limit || 10)
      )
    );

    const search = String(
      req.query.search || ""
    ).trim();

    const params = [];
    let where = "";

    if (search) {

      params.push("%" + search + "%");

      where =
        " AND (" +
        "COALESCE(txid, '') ILIKE $1 " +
        "OR COALESCE(input_addresses::text, '') ILIKE $1 " +
        "OR COALESCE(output_addresses::text, '') ILIKE $1 " +
        "OR COALESCE(src_ip::text, '') ILIKE $1 " +
        "OR COALESCE(dst_ip::text, '') ILIKE $1 " +
        "OR COALESCE(geo_country, '') ILIKE $1" +
        ")";
    }


    params.push(limit);

    const limitParameter = "$" + params.length;


    const sql =
      "SELECT " +
      "id, " +
      "timestamp, " +
      "txid, " +
      "src_ip, " +
      "dst_ip, " +
      "src_port, " +
      "dst_port, " +
      "input_addresses, " +
      "output_addresses, " +
      "input_amount, " +
      "output_amount, " +
      "fee, " +
      "script_type, " +
      "geo_country, " +
      "asn " +

      "FROM (" +

      "SELECT DISTINCT ON (" +
      "COALESCE(NULLIF(TRIM(txid), ''), 'row-' || id::text)" +
      ") " +

      "id, " +
      "timestamp, " +
      "txid, " +
      "src_ip, " +
      "dst_ip, " +
      "src_port, " +
      "dst_port, " +
      "input_addresses, " +
      "output_addresses, " +
      "input_amount, " +
      "output_amount, " +
      "fee, " +
      "script_type, " +
      "geo_country, " +
      "asn " +

      "FROM transactions " +

      "WHERE " +

      "jsonb_array_length(COALESCE(input_addresses, '[]'::jsonb)) > 0 " +

      "AND " +

      "jsonb_array_length(COALESCE(output_addresses, '[]'::jsonb)) > 0 " +

      "AND NOT (" +

      "input_addresses @> output_addresses " +
      "AND " +
      "output_addresses @> input_addresses" +

      ")" +

      where +

      " ORDER BY " +

      "COALESCE(NULLIF(TRIM(txid), ''), 'row-' || id::text), " +

      "CASE " +
      "WHEN jsonb_array_length(COALESCE(input_addresses, '[]'::jsonb)) > 0 " +
      "THEN 1 ELSE 0 " +
      "END DESC, " +

      "CASE " +
      "WHEN jsonb_array_length(COALESCE(output_addresses, '[]'::jsonb)) > 0 " +
      "THEN 1 ELSE 0 " +
      "END DESC, " +

      "timestamp DESC NULLS LAST, " +
      "id DESC" +

      ") unique_transactions " +

      "ORDER BY timestamp DESC NULLS LAST, id DESC " +

      "LIMIT " +
      limitParameter;


    const result = await pool.query(
      sql,
      params
    );


    res.json({
      transactions: result.rows
    });

  } catch (error) {

    console.error(
      "Dashboard transactions error:",
      error
    );

    res.status(500).json({
      error: "Unable to load transactions."
    });
  }
});


export default router;