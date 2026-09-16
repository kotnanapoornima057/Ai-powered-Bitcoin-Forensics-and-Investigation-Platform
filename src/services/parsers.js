import fs from "node:fs";
import fsp from "node:fs/promises";
import { parse } from "csv-parse";
import { XMLParser } from "fast-xml-parser";

const arr = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return [];
  }

  return Array.isArray(value)
    ? value
    : [value];
};

const first = (obj, keys) => {
  for (const key of keys) {
    if (
      obj &&
      obj[key] !== undefined &&
      obj[key] !== null &&
      String(obj[key]).trim() !== ""
    ) {
      return obj[key];
    }
  }

  return null;
};

function normalizeArray(value) {
  return arr(value)
    .flatMap((item) => {
      if (typeof item === "string") {
        const text = item.trim();

        if (!text) {
          return [];
        }

        // JSON array
        if (text.startsWith("[")) {
          try {
            const parsed = JSON.parse(text);

            return arr(parsed)
              .flatMap((x) => {
                if (
                  x &&
                  typeof x === "object"
                ) {
                  const address = first(x, [
                    "address",
                    "wallet",
                    "value",
                    "text"
                  ]);

                  return address
                    ? [String(address).trim()]
                    : [];
                }

                return x !== null &&
                  x !== undefined
                  ? [String(x).trim()]
                  : [];
              })
              .filter(Boolean);
          } catch {
            // Continue below
          }
        }

        return text
          .split(/[|;,]/)
          .map((x) => x.trim())
          .filter(Boolean);
      }

      if (
        item &&
        typeof item === "object"
      ) {
        const address = first(item, [
          "address",
          "wallet",
          "value",
          "text"
        ]);

        return address
          ? [String(address).trim()]
          : [];
      }

      return item !== undefined &&
        item !== null
        ? [String(item).trim()]
        : [];
    })
    .filter(Boolean);
}

function normalizeNumbers(value) {
  return arr(value)
    .flatMap((item) => {
      if (
        typeof item === "string"
      ) {
        const text = item.trim();

        if (!text) {
          return [];
        }

        // JSON array
        if (text.startsWith("[")) {
          try {
            const parsed = JSON.parse(text);

            return arr(parsed)
              .map(Number)
              .filter(Number.isFinite);
          } catch {
            // Continue below
          }
        }

        // Comma / pipe / semicolon separated
        if (/[|;,]/.test(text)) {
          return text
            .split(/[|;,]/)
            .map((x) => Number(x.trim()))
            .filter(Number.isFinite);
        }
      }

      const number = Number(item);

      return Number.isFinite(number)
        ? [number]
        : [];
    });
}

function cleanWalletAddress(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const address =
    String(value).trim();

  if (!address) {
    return null;
  }

  const invalidValues = new Set([
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
    invalidValues.has(address)
  ) {
    return null;
  }

  return address;
}

export function normalizeRecord(
  record = {}
) {

  /*
   * ------------------------------------------------------------
   * WALLET ADDRESSES
   * ------------------------------------------------------------
   */

  const inputAddresses =
    normalizeArray(
      first(record, [
        "From_Address",
        "from_address",
        "From Address",
        "from address",

        "input_addresses",
        "input_address",
        "inputs",

        "from",
        "sender",
        "source_wallet"
      ])
    )
      .map(cleanWalletAddress)
      .filter(Boolean);

  const outputAddresses =
    normalizeArray(
      first(record, [
        "To_Address",
        "to_address",
        "To Address",
        "to address",

        "output_addresses",
        "output_address",
        "outputs",

        "to",
        "receiver",
        "destination_wallet"
      ])
    )
      .map(cleanWalletAddress)
      .filter(Boolean);


  /*
   * ------------------------------------------------------------
   * AMOUNTS
   * ------------------------------------------------------------
   */

  const inputAmounts =
    normalizeNumbers(
      first(record, [
        "From_Amount_BTC",
        "from_amount_btc",
        "From Amount BTC",
        "from amount btc",

        "input_amounts",
        "input_amount",
        "amount_in"
      ])
    );

  const outputAmounts =
    normalizeNumbers(
      first(record, [
        "To_Amount_BTC",
        "to_amount_btc",
        "To Amount BTC",
        "to amount btc",

        "output_amounts",
        "output_amount",
        "amount_out",
        "amount"
      ])
    );


  /*
   * ------------------------------------------------------------
   * TOTAL INPUT / OUTPUT AMOUNT
   * ------------------------------------------------------------
   */

  const inputAmountRaw =
    first(record, [
      "From_Amount_BTC",
      "from_amount_btc",
      "From Amount BTC",

      "input_amount",
      "amount_in"
    ]);

  const outputAmountRaw =
    first(record, [
      "To_Amount_BTC",
      "to_amount_btc",
      "To Amount BTC",

      "output_amount",
      "amount_out",
      "amount"
    ]);

  const inputAmountNumber =
    Number(inputAmountRaw);

  const outputAmountNumber =
    Number(outputAmountRaw);

  const inputAmount =
    Number.isFinite(
      inputAmountNumber
    )
      ? inputAmountNumber
      : inputAmounts.reduce(
          (sum, value) =>
            sum + value,
          0
        );

  const outputAmount =
    Number.isFinite(
      outputAmountNumber
    )
      ? outputAmountNumber
      : outputAmounts.reduce(
          (sum, value) =>
            sum + value,
          0
        );


  /*
   * ------------------------------------------------------------
   * TIMESTAMP
   * ------------------------------------------------------------
   */

  const timestamp =
    first(record, [
      "Timestamp",
      "timestamp",
      "Time",
      "time",
      "datetime",
      "date"
    ]);

  const parsedDate =
    timestamp &&
    !Number.isNaN(
      new Date(timestamp).getTime()
    )
      ? new Date(timestamp)
      : null;


  /*
   * ------------------------------------------------------------
   * IP ADDRESSES
   * ------------------------------------------------------------
   */

  const srcIp =
    first(record, [
      "From_IP",
      "from_ip",
      "From IP",
      "from ip",

      "src_ip",
      "source_ip",
      "srcIP"
    ]);

  const dstIp =
    first(record, [
      "To_IP",
      "to_ip",
      "To IP",
      "to ip",

      "dst_ip",
      "destination_ip",
      "dstIP"
    ]);


  /*
   * ------------------------------------------------------------
   * PORTS
   * ------------------------------------------------------------
   */

  const srcPortRaw =
    first(record, [
      "From_Port",
      "from_port",
      "From Port",
      "from port",

      "src_port",
      "source_port"
    ]);

  const dstPortRaw =
    first(record, [
      "To_Port",
      "to_port",
      "To Port",
      "to port",

      "dst_port",
      "destination_port"
    ]);

  const srcPortNumber =
    Number(srcPortRaw);

  const dstPortNumber =
    Number(dstPortRaw);

  const srcPort =
    Number.isInteger(
      srcPortNumber
    )
      ? srcPortNumber
      : null;

  const dstPort =
    Number.isInteger(
      dstPortNumber
    )
      ? dstPortNumber
      : null;


  /*
   * ------------------------------------------------------------
   * TXID
   * ------------------------------------------------------------
   */

  const txid =
    first(record, [
      "TXID",
      "txid",
      "TxID",
      "transaction_id",
      "transactionId",
      "hash"
    ]);


  /*
   * ------------------------------------------------------------
   * FEE
   * ------------------------------------------------------------
   */

  const feeRaw =
    first(record, [
      "Fee_Sats",
      "fee_sats",
      "Fee Sats",

      "fee",
      "transaction_fee"
    ]);

  const feeNumber =
    Number(feeRaw);

  const fee =
    Number.isFinite(
      feeNumber
    )
      ? feeNumber
      : null;


  /*
   * ------------------------------------------------------------
   * COUNTRY
   * ------------------------------------------------------------
   */

  const fromCountry =
    first(record, [
      "From_Country",
      "from_country",
      "From Country",
      "from country"
    ]);

  const toCountry =
    first(record, [
      "To_Country",
      "to_country",
      "To Country",
      "to country"
    ]);

  let geoCountry = null;

  if (
    fromCountry &&
    toCountry
  ) {
    geoCountry =
      `${String(fromCountry).trim()} -> ${String(toCountry).trim()}`;
  } else {
    geoCountry =
      fromCountry ||
      toCountry ||
      null;
  }


  /*
   * ------------------------------------------------------------
   * ASN
   * ------------------------------------------------------------
   */

  const asn =
    first(record, [
      "asn",
      "AS",
      "ASN",
      "autonomous_system"
    ]);


  /*
   * ------------------------------------------------------------
   * SCRIPT TYPE
   * ------------------------------------------------------------
   */

  const scriptType =
    first(record, [
      "script_type",
      "scriptType",
      "Script_Type"
    ]);


  /*
   * ------------------------------------------------------------
   * NORMALIZED RECORD
   * ------------------------------------------------------------
   */

  return {
    timestamp: parsedDate,

    src_ip:
      srcIp
        ? String(srcIp).trim()
        : null,

    dst_ip:
      dstIp
        ? String(dstIp).trim()
        : null,

    src_port:
      srcPort,

    dst_port:
      dstPort,

    txid:
      txid
        ? String(txid).trim()
        : null,

    input_addresses:
      inputAddresses,

    output_addresses:
      outputAddresses,

    input_amounts:
      inputAmounts,

    output_amounts:
      outputAmounts,

    input_amount:
      Number.isFinite(
        inputAmount
      )
        ? inputAmount
        : null,

    output_amount:
      Number.isFinite(
        outputAmount
      )
        ? outputAmount
        : null,

    fee,

    script_type:
      scriptType
        ? String(scriptType).trim()
        : null,

    geo_country:
      geoCountry
        ? String(geoCountry).trim()
        : null,

    asn:
      asn
        ? String(asn).trim()
        : null,

    raw:
      record
  };
}


/*
 * ------------------------------------------------------------
 * STREAM CSV
 * ------------------------------------------------------------
 */

export async function* streamCsv(
  filePath
) {

  const parser =
    fs
      .createReadStream(filePath)
      .pipe(
        parse({
          columns: true,

          skip_empty_lines:
            true,

          relax_column_count:
            true,

          bom:
            true,

          trim:
            true,

          relax_quotes:
            true
        })
      );

  for await (
    const record of parser
  ) {

    const normalized =
      normalizeRecord(record);

    /*
     * Debug the first few records.
     * This is extremely useful for confirming
     * that wallet addresses are being detected.
     */

    yield normalized;
  }
}

function findRecords(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      return child;
    }
  }

  return [value];
}

export async function* streamJson(filePath) {
  const text = await fsp.readFile(filePath, "utf8");
  const parsed = JSON.parse(text);

  for (const record of findRecords(parsed)) {
    yield normalizeRecord(record);
  }
}

export async function* streamXml(filePath) {
  const text = await fsp.readFile(filePath, "utf8");
  const parsed = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: true,
    trimValues: true,
  }).parse(text);

  for (const record of findRecords(parsed)) {
    yield normalizeRecord(record);
  }
}

export function streamRecords(filePath, format = "csv") {
  if (format === "json") {
    return streamJson(filePath);
  }

  if (format === "xml") {
    return streamXml(filePath);
  }

  return streamCsv(filePath);
}