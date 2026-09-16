import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";

import pool from "../db/pool.js";
import config from "../config.js";

import {
  requireAuth
} from "../middleware/auth.js";

import {
  ingestFile
} from "../services/ingestionService.js";

import {
  rebuildAnalysis
} from "../services/analysisService.js";

const uploadDir = path.resolve(process.cwd(), "uploads");

await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    cb(null, `${Date.now()}-${safeName}`);
  },
});

const router = express.Router();

router.use(requireAuth);

const upload = multer({
  storage,
  limits: {
    fileSize: config.uploadMaxMb * 1024 * 1024,
  },
});

router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {

    if (!req.file) {

      return res
        .status(400)
        .json({
          error:
            "Upload a CSV, JSON or XML file."
        });
    }

    const ext =
      path.extname(
        req.file.originalname
      ).toLowerCase();

    if (
      ![
        ".csv",
        ".json",
        ".xml"
      ].includes(ext)
    ) {

      await fs
        .unlink(
          req.file.path
        )
        .catch(
          () => {}
        );

      return res
        .status(400)
        .json({
          error:
            "Only CSV, JSON and XML files are supported."
        });
    }

    let dataset = null;

    try {

      /*
       * Create dataset record.
       */

      const result =
        await pool.query(
          `
          INSERT INTO datasets
          (
            name,
            source_format,
            record_count,
            status,
            file_name,
            file_type,
            file_size
          )
          VALUES
          (
            $1,
            $2,
            0,
            'processing',
            $3,
            $4,
            $5
          )
          RETURNING *
          `,
          [
            req.file.originalname,
            ext.slice(1),
            req.file.originalname,
            ext.slice(1),
            req.file.size
          ]
        );

      dataset =
        result.rows[0];

      /* Keep the dashboard focused on the latest upload. */
      await pool.query(`
        DELETE FROM entity_cluster_members;
        DELETE FROM entity_clusters;
        DELETE FROM entity_edges;
        DELETE FROM alerts;
        DELETE FROM wallet_profiles;
        DELETE FROM ml_results;
        DELETE FROM ml_runs;
        DELETE FROM transactions;
      `);


      /* Ingest the selected offline format. */

      const count =
        await ingestFile(
          req.file.path,
          dataset.id,
          ext.slice(1)
        );


      /*
       * RUN FORENSIC ANALYSIS
       */

      const analysis =
        await rebuildAnalysis(
          dataset.id
        );


      /*
       * Mark dataset completed.
       */

      const completed =
        await pool.query(
          `
          UPDATE datasets
          SET
            record_count = $1,
            status = 'completed',
            processed_at = NOW(),
            updated_at = NOW()
          WHERE id = $2
          RETURNING *
          `,
          [
            count,
            dataset.id
          ]
        );


      return res
        .status(201)
        .json({

          message:
            "Dataset processed successfully.",

          dataset:
            completed.rows[0],

          analysis
        });

    } catch (error) {

      console.error(
        "Dataset ingestion error:",
        error
      );

      if (
        req.file?.path
      ) {

        await fs
          .unlink(
            req.file.path
          )
          .catch(
            () => {}
          );
      }

      if (dataset?.id) {

        await pool.query(
          `
          UPDATE datasets
          SET
            status = 'failed',
            error_message = $1,
            updated_at = NOW()
          WHERE id = $2
          `,
          [
            error.message ||
              "Dataset ingestion failed.",
            dataset.id
          ]
        )
        .catch(
          () => {}
        );
      }

      return res
        .status(500)
        .json({
          error:
            error.message ||
            "Dataset ingestion failed."
        });
    }
  }
);


/*
 * GET ALL DATASETS
 */

router.get(
  "/",
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            name,
            source_format,
            record_count,
            status,
            error_message,
            created_at,
            file_name,
            file_type,
            file_size,
            processed_at,
            updated_at
          FROM datasets
          ORDER BY
            created_at DESC
          `
        );

      res.json({
        datasets:
          result.rows
      });

    } catch (error) {

      console.error(
        error
      );

      res
        .status(500)
        .json({
          error:
            "Unable to load datasets."
        });
    }
  }
);


/*
 * GET SINGLE DATASET
 */

router.get(
  "/:id",
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT *
          FROM datasets
          WHERE id = $1
          `,
          [
            req.params.id
          ]
        );

      if (
        !result.rowCount
      ) {

        return res
          .status(404)
          .json({
            error:
              "Dataset not found."
          });
      }

      res.json({
        dataset:
          result.rows[0]
      });

    } catch (error) {

      console.error(
        error
      );

      res
        .status(500)
        .json({
          error:
            "Unable to load dataset."
        });
    }
  }
);

export default router;