import express from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

/*
 * GET /api/graph
 *
 * Builds the investigation graph from:
 *
 *   Wallets
 *   Transactions
 *   IP addresses
 *
 * The graph is created from the actual ingested data.
 *
 * No wallet addresses are manufactured or modified.
 */

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(
      3000,
      Math.max(
        100,
        Number(req.query.limit || 1500)
      )
    );

    const requestedType = String(
      req.query.type || "all"
    ).toLowerCase();

    const allowedTypes = [
      "all",
      "wallet",
      "transaction",
      "ip"
    ];

    const type = allowedTypes.includes(
      requestedType
    )
      ? requestedType
      : "all";

    /*
     * ------------------------------------------------------------
     * LOAD ENTITY EDGES
     * ------------------------------------------------------------
     */

    let query = `
      SELECT
        source_type,
        source_id,
        target_type,
        target_id,
        relation,
        weight,
        metadata
      FROM entity_edges
    `;

    const params = [];

    if (type !== "all") {
      params.push(type);

      query += `
        WHERE
          source_type = $1
          OR target_type = $1
      `;
    }

    query += `
      ORDER BY
        weight DESC NULLS LAST,
        source_id,
        target_id
      LIMIT ${limit}
    `;

    const edgeResult =
      await pool.query(
        query,
        params
      );

    /*
     * ------------------------------------------------------------
     * CREATE NODES
     * ------------------------------------------------------------
     */

    const nodes = new Map();

    function addNode(
      entityType,
      entityId
    ) {
      if (
        entityId === null ||
        entityId === undefined
      ) {
        return;
      }

      const id =
        String(entityId).trim();

      if (!id) {
        return;
      }

      const key =
        `${entityType}:${id}`;

      if (!nodes.has(key)) {
        nodes.set(
          key,
          {
            id: key,
            type: entityType,
            label: id
          }
        );
      }
    }

    /*
     * ------------------------------------------------------------
     * CREATE EDGES
     * ------------------------------------------------------------
     */

    const edges =
      edgeResult.rows.map(
        (edge, index) => {

          addNode(
            edge.source_type,
            edge.source_id
          );

          addNode(
            edge.target_type,
            edge.target_id
          );

          return {
            id: `edge-${index}`,

            source:
              `${edge.source_type}:${edge.source_id}`,

            target:
              `${edge.target_type}:${edge.target_id}`,

            relation:
              edge.relation || "related",

            weight:
              Number(edge.weight || 1),

            metadata:
              edge.metadata || {}
          };
        }
      );

    /*
     * ------------------------------------------------------------
     * NODE TYPE SUMMARY
     * ------------------------------------------------------------
     */

    const nodeTypeCounts = {
      wallet: 0,
      transaction: 0,
      ip: 0
    };

    for (const node of nodes.values()) {
      if (
        Object.prototype.hasOwnProperty.call(
          nodeTypeCounts,
          node.type
        )
      ) {
        nodeTypeCounts[node.type]++;
      }
    }

    /*
     * ------------------------------------------------------------
     * RELATION SUMMARY
     * ------------------------------------------------------------
     */

    const relationCounts = {};

    for (const edge of edges) {
      const relation =
        edge.relation || "related";

      relationCounts[relation] =
        (relationCounts[relation] || 0) + 1;
    }

    /*
     * ------------------------------------------------------------
     * GRAPH SUMMARY
     * ------------------------------------------------------------
     */

    return res.json({
      nodes: Array.from(
        nodes.values()
      ),

      edges,

      summary: {
        nodes: nodes.size,

        edges: edges.length,

        wallets:
          nodeTypeCounts.wallet,

        transactions:
          nodeTypeCounts.transaction,

        ips:
          nodeTypeCounts.ip,

        relations:
          relationCounts
      }
    });

  } catch (error) {

    console.error(
      "Graph query error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to load transaction graph.",

      details:
        error.message
    });
  }
});


/*
 * ------------------------------------------------------------
 * WALLET-SPECIFIC GRAPH
 * ------------------------------------------------------------
 *
 * GET /api/graph/wallet/:address
 *
 * Used from Wallet Investigation.
 */

router.get(
  "/wallet/:address",
  async (req, res) => {

    const address =
      req.params.address;

    try {

      const result =
        await pool.query(
          `
          SELECT
            source_type,
            source_id,
            target_type,
            target_id,
            relation,
            weight,
            metadata

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

          ORDER BY
            weight DESC NULLS LAST
          LIMIT 1000
          `,
          [address]
        );


      const nodes =
        new Map();


      function addNode(
        entityType,
        entityId
      ) {

        if (
          entityId === null ||
          entityId === undefined
        ) {
          return;
        }

        const id =
          String(entityId).trim();

        if (!id) {
          return;
        }

        const key =
          `${entityType}:${id}`;

        if (!nodes.has(key)) {

          nodes.set(
            key,
            {
              id: key,
              type: entityType,
              label: id
            }
          );
        }
      }


      const edges =
        result.rows.map(
          (edge, index) => {

            addNode(
              edge.source_type,
              edge.source_id
            );

            addNode(
              edge.target_type,
              edge.target_id
            );

            return {

              id:
                `wallet-edge-${index}`,

              source:
                `${edge.source_type}:${edge.source_id}`,

              target:
                `${edge.target_type}:${edge.target_id}`,

              relation:
                edge.relation || "related",

              weight:
                Number(edge.weight || 1),

              metadata:
                edge.metadata || {}
            };
          }
        );


      /*
       * Always include the investigated wallet.
       */

      addNode(
        "wallet",
        address
      );


      return res.json({

        wallet:
          address,

        nodes:
          Array.from(
            nodes.values()
          ),

        edges,

        summary: {
          nodes:
            nodes.size,

          edges:
            edges.length
        }

      });

    } catch (error) {

      console.error(
        "Wallet graph error:",
        error
      );

      return res.status(500).json({

        error:
          "Unable to load wallet graph.",

        details:
          error.message

      });
    }
  }
);


export default router;