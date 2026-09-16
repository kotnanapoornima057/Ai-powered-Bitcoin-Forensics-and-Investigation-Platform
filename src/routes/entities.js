import express from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

/*
 * ENTITY DIRECTORY
 *
 * Returns wallets, IPs and transactions that
 * participate in entity relationships.
 */
router.get("/", async (req, res) => {
  try {
    const type = String(
      req.query.type || ""
    ).toLowerCase();

    const search = String(
      req.query.search || ""
    ).trim();

    const limit = Math.min(
      5000,
      Math.max(
        1,
        Number(req.query.limit || 500)
      )
    );

    const params = [];
    const conditions = [];

    if (
      ["wallet", "ip", "transaction"].includes(
        type
      )
    ) {
      params.push(type);

      conditions.push(
        `node_type = $${params.length}`
      );
    }

    if (search) {
      params.push(`%${search}%`);

      conditions.push(
        `node_id ILIKE $${params.length}`
      );
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    params.push(limit);

    const result = await pool.query(
      `
      SELECT
        node_type,
        node_id,
        COUNT(*)::integer AS connections

      FROM (
        SELECT
          source_type AS node_type,
          source_id AS node_id
        FROM entity_edges

        UNION ALL

        SELECT
          target_type AS node_type,
          target_id AS node_id
        FROM entity_edges
      ) x

      ${where}

      GROUP BY
        node_type,
        node_id

      ORDER BY
        connections DESC,
        node_type ASC,
        node_id ASC

      LIMIT $${params.length}
      `,
      params
    );

    return res.json({
      entities: result.rows,
    });
  } catch (error) {
    console.error(
      "Entity directory error:",
      error
    );

    return res.status(500).json({
      error: "Unable to load entities.",
      details: error.message,
    });
  }
});


/*
 * ENTITY SUMMARY
 */
router.get(
  "/summary",
  async (req, res) => {
    try {
      const [
        types,
        edges,
        clusters,
      ] = await Promise.all([
        pool.query(`
          SELECT
            node_type,
            COUNT(*)::integer AS count

          FROM (
            SELECT
              source_type AS node_type,
              source_id AS node_id
            FROM entity_edges

            UNION

            SELECT
              target_type AS node_type,
              target_id AS node_id
            FROM entity_edges
          ) x

          GROUP BY node_type
          ORDER BY node_type
        `),

        pool.query(`
          SELECT
            COUNT(*)::bigint AS count
          FROM entity_edges
        `),

        pool.query(`
          SELECT
            COUNT(*)::integer AS count
          FROM entity_clusters
        `),
      ]);

      const counts =
        Object.fromEntries(
          types.rows.map(
            (row) => [
              row.node_type,
              Number(row.count),
            ]
          )
        );

      return res.json({
        wallets:
          counts.wallet || 0,

        ips:
          counts.ip || 0,

        transactions:
          counts.transaction || 0,

        edges:
          Number(
            edges.rows[0]?.count || 0
          ),

        clusters:
          Number(
            clusters.rows[0]?.count || 0
          ),
      });
    } catch (error) {
      console.error(
        "Entity summary error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to load entity summary.",
        details: error.message,
      });
    }
  }
);


/*
 * ENTITY CLUSTERS
 *
 * These clusters are graph-connected components
 * created by the analysis pipeline.
 */
router.get(
  "/clusters",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          cluster_key,
          COALESCE(
            risk_score,
            0
          )::float AS risk_score,

          COALESCE(
            confidence,
            0
          )::float AS confidence,

          COALESCE(
            member_count,
            0
          )::integer AS member_count,

          COALESCE(
            explanation,
            '[]'::jsonb
          ) AS explanation,

          created_at

        FROM entity_clusters

        ORDER BY
          risk_score DESC,
          member_count DESC,
          id DESC

        LIMIT 5000
      `);

      return res.json({
        clusters: result.rows,
      });
    } catch (error) {
      console.error(
        "Entity clusters error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to load entity clusters.",
        details: error.message,
      });
    }
  }
);


/*
 * SINGLE CLUSTER DETAILS
 */
router.get(
  "/clusters/:id",
  async (req, res) => {
    try {
      const cluster =
        await pool.query(
          `
          SELECT *
          FROM entity_clusters
          WHERE id = $1
          `,
          [req.params.id]
        );

      if (!cluster.rowCount) {
        return res.status(404).json({
          error:
            "Cluster not found.",
        });
      }

      const members =
        await pool.query(
          `
          SELECT
            entity_type,
            entity_id

          FROM entity_cluster_members

          WHERE cluster_id = $1

          ORDER BY
            entity_type,
            entity_id
          `,
          [req.params.id]
        );

      return res.json({
        cluster:
          cluster.rows[0],

        members:
          members.rows,
      });
    } catch (error) {
      console.error(
        "Entity cluster detail error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to load cluster.",
        details: error.message,
      });
    }
  }
);


export default router;