import fs from "node:fs/promises";
import path from "node:path";

let ranges = [];

function ipv4ToNumber(value) {
  const parts = String(value || "").split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256) + parts[3];
}

function parseRange(value) {
  const [address, prefix] = String(value || "").trim().split("/");
  const number = ipv4ToNumber(address);
  const bits = prefix === undefined ? 32 : Number(prefix);
  if (number === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return null;
  const size = 2 ** (32 - bits);
  const start = bits === 0 ? 0 : (number >>> 0) & ((0xffffffff << (32 - bits)) >>> 0);
  return { start, end: start + size - 1 };
}

async function loadRanges(filePath) {
  try {
    const lines = (await fs.readFile(filePath, "utf8")).split(/\r?\n/).filter(Boolean);
    const headers = lines.shift().split(",").map((item) => item.trim().toLowerCase());
    const networkIndex = headers.indexOf("network");
    const countryIndex = headers.indexOf("country");
    const asnIndex = headers.indexOf("asn");
    if (networkIndex < 0) return [];

    return lines.map((line) => {
      const fields = line.split(",").map((item) => item.trim());
      const range = parseRange(fields[networkIndex]);
      return range ? {
        ...range,
        country: countryIndex >= 0 ? fields[countryIndex] || null : null,
        asn: asnIndex >= 0 ? fields[asnIndex] || null : null,
      } : null;
    }).filter(Boolean).sort((left, right) => left.start - right.start);
  } catch {
    return [];
  }
}

export async function initializeGeoIp(filePath) {
  ranges = await loadRanges(path.resolve(filePath));
  return ranges.length;
}

export function lookupGeoIp(ip) {
  const number = ipv4ToNumber(ip);
  if (number === null || !ranges.length) return null;

  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const range = ranges[middle];
    if (number < range.start) high = middle - 1;
    else if (number > range.end) low = middle + 1;
    else return { country: range.country, asn: range.asn };
  }

  return null;
}
