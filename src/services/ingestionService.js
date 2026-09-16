import fs from "node:fs/promises";

import pool from "../db/pool.js";
import config from "../config.js";

import {
  streamRecords
} from "./parsers.js";

import {
  initializeGeoIp,
  lookupGeoIp
} from "./geoIpService.js";


/*
|--------------------------------------------------------------------------
| TRANSACTION INSERT
|--------------------------------------------------------------------------
*/

const INSERT_COLUMNS = `
INSERT INTO transactions
(
  dataset_id,
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
  fee,
  script_type,
  geo_country,
  asn,
  raw
)
`;


/*
|--------------------------------------------------------------------------
| JSON HELPER
|--------------------------------------------------------------------------
*/

function toJson(value) {

  if (
    value === undefined ||
    value === null
  ) {
    return JSON.stringify([]);
  }

  return JSON.stringify(value);
}


/*
|--------------------------------------------------------------------------
| WALLET ADDRESS VALIDATION
|--------------------------------------------------------------------------
*/

function isValidWallet(
  wallet
) {

  if (
    wallet === undefined ||
    wallet === null
  ) {
    return false;
  }

  const value =
    String(wallet).trim();

  if (!value) {
    return false;
  }

  const invalid = new Set([
    "Block Reward / Unknown",
    "Unknown",
    "OP_RETURN / Unknown",
    "N/A",
    "NA",
    "null",
    "NULL",
    "-"
  ]);

  if (
    invalid.has(value)
  ) {
    return false;
  }

  return true;
}


/*
|--------------------------------------------------------------------------
| INSERT BATCH
|--------------------------------------------------------------------------
*/

async function insertBatch(
  client,
  datasetId,
  batch
) {
  const values = [];
  const placeholders = [];

  batch.forEach((row, rowIndex) => {
    const sourceGeo = lookupGeoIp(row.src_ip);
    const destinationGeo = lookupGeoIp(row.dst_ip);
    const geoCountry = row.geo_country ||
      sourceGeo?.country ||
      destinationGeo?.country ||
      null;
    const asn = row.asn ||
      sourceGeo?.asn ||
      destinationGeo?.asn ||
      null;

    const inputAddresses =
      Array.isArray(
        row.input_addresses
      )
        ? row.input_addresses
        : [];

    const outputAddresses =
      Array.isArray(
        row.output_addresses
      )
        ? row.output_addresses
        : [];

    const inputAmounts =
      Array.isArray(
        row.input_amounts
      )
        ? row.input_amounts
        : [];

    const outputAmounts =
      Array.isArray(
        row.output_amounts
      )
        ? row.output_amounts
        : [];


    /*
     * ------------------------------------------------------------
     * INSERT TRANSACTION
     * ------------------------------------------------------------
     */

    const rowValues = [
      datasetId,

          row.timestamp,

          row.src_ip ||
            null,

          row.dst_ip ||
            null,

          row.src_port,

          row.dst_port,

          row.txid ||
            null,

          toJson(
            inputAddresses
          ),

          toJson(
            outputAddresses
          ),

          toJson(
            inputAmounts
          ),

          toJson(
            outputAmounts
          ),

          row.input_amount,

          row.output_amount,

          row.fee,

          row.script_type,

          geoCountry,

          asn,

      JSON.stringify(row.raw || {})
    ];

    const offset = rowIndex * rowValues.length;
    placeholders.push(
      `(${rowValues.map((_, index) => `$${offset + index + 1}`).join(",")})`
    );
    values.push(...rowValues);
  });

  if (values.length) {
    await client.query(
      `${INSERT_COLUMNS} VALUES ${placeholders.join(",")}`,
      values
    );
  }
}


/*
|--------------------------------------------------------------------------
| CSV INGESTION
|--------------------------------------------------------------------------
*/

export async function ingestFile(
  filePath,
  datasetId,
  format = "csv"
) {

  const client =
    await pool.connect();

  await initializeGeoIp(config.geoIpDbPath);


  let count = 0;

  let batch = [];
  const maxBatchRows = Math.min(
    config.ingestionBatchSize,
    3000
  );


  /*
   * Debug counters
   */

  let rowsWithInputWallet =
    0;

  let rowsWithOutputWallet =
    0;


  try {

    /*
     * ----------------------------------------------------------
     * STREAM CSV
     * ----------------------------------------------------------
     */

    for await (
      const record
      of streamRecords(filePath, format)
    ) {

      batch.push(record);


      if (
        record.input_addresses?.length
      ) {
        rowsWithInputWallet++;
      }


      if (
        record.output_addresses?.length
      ) {
        rowsWithOutputWallet++;
      }


      /*
       * --------------------------------------------------------
       * BATCH INSERT
       * --------------------------------------------------------
       */

      if (
        batch.length >=
        maxBatchRows
      ) {

        await client.query(
          "BEGIN"
        );


        await insertBatch(
          client,
          datasetId,
          batch
        );


        await client.query(
          "COMMIT"
        );


        count +=
          batch.length;


        batch = [];


        /*
         * Update progress
         */

        await pool.query(
          `
          UPDATE datasets
          SET
            record_count = $1,
            updated_at = NOW()
          WHERE id = $2
          `,
          [
            count,
            datasetId
          ]
        );

      }
    }


    /*
     * ----------------------------------------------------------
     * REMAINING BATCH
     * ----------------------------------------------------------
     */

    if (
      batch.length > 0
    ) {

      await client.query(
        "BEGIN"
      );


      await insertBatch(
        client,
        datasetId,
        batch
      );


      await client.query(
        "COMMIT"
      );


      count +=
        batch.length;

    }


    /*
     * ----------------------------------------------------------
     * MARK DATASET COMPLETE
     * ----------------------------------------------------------
     */

    await pool.query(
      `
      UPDATE datasets

      SET
        record_count = $1,
        status = 'completed',
        completed_at = NOW(),
        processed_at = NOW(),
        updated_at = NOW(),
        error_message = NULL

      WHERE id = $2
      `,
      [
        count,
        datasetId
      ]
    );


    /*
     * ----------------------------------------------------------
     * DEBUG INFORMATION
     * ----------------------------------------------------------
     */

    console.log(
      "=========================================="
    );

    console.log(
      "CSV INGESTION COMPLETED"
    );

    console.log(
      `Total records: ${count}`
    );

    console.log(
      `Rows with input wallets: ${rowsWithInputWallet}`
    );

    console.log(
      `Rows with output wallets: ${rowsWithOutputWallet}`
    );

    console.log(
      "=========================================="
    );


    return count;


  } catch (
    error
  ) {

    /*
     * Rollback current transaction
     */

    await client
      .query(
        "ROLLBACK"
      )
      .catch(
        () => {}
      );


    /*
     * Mark dataset failed
     */

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
        error.message,
        datasetId
      ]
    );


    console.error(
      "CSV ingestion failed:",
      error
    );


    throw error;


  } finally {

    client.release();


    /*
     * Remove uploaded file
     */

    await fs
      .unlink(
        filePath
      )
      .catch(
        () => {}
      );

  }
}

export function ingestCsv(filePath, datasetId) {
  return ingestFile(filePath, datasetId, "csv");
}