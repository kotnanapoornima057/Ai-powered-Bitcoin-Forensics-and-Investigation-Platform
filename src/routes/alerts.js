import express from "express";
import pool from "../db/pool.js";
import {
  requireAuth
} from "../middleware/auth.js";

const router =
  express.Router();

router.use(requireAuth);

router.get(
  "/",
  async (req, res) => {
    try {
      const severity =
        String(
          req.query.severity || ""
        ).toLowerCase();

      const search =
        String(
          req.query.search || ""
        ).trim();

      const params = [];
      const conditions = [];

      if (
        [
          "critical",
          "high",
          "medium",
          "low"
        ].includes(severity)
      ) {
        params.push(severity);

        conditions.push(
          `severity=$${params.length}`
        );
      }

      if (search) {
        params.push(
          `%${search}%`
        );

        conditions.push(`
          (
            COALESCE(
              wallet_address,
              ''
            ) ILIKE $${params.length}

            OR

            COALESCE(
              reason,
              ''
            ) ILIKE $${params.length}
          )
        `);
      }

      const where =
        conditions.length
          ? `WHERE ${conditions.join(
              " AND "
            )}`
          : "";

      const result =
        await pool.query(
          `
          SELECT
            id,
            wallet_address,
            transaction_id,
            severity,
            risk_score::float,
            confidence::float,
            reason,
            evidence,
            created_at
          FROM alerts

          ${where}

          ORDER BY
            risk_score DESC,
            created_at DESC

          LIMIT 5000
          `,
          params
        );

      res.json({
        total:
          result.rowCount,

        alerts:
          result.rows
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Unable to load alerts."
      });
    }
  }
);

router.get(
  "/:id",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT *
          FROM alerts
          WHERE id=$1
          `,
          [req.params.id]
        );

      if (!result.rowCount) {
        return res.status(404).json({
          error:
            "Alert not found."
        });
      }

      res.json({
        alert:
          result.rows[0]
      });
    } catch {
      res.status(500).json({
        error:
          "Unable to load alert."
      });
    }
  }
);

export default router;