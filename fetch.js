"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const WIKI_URL = "https://en.wikipedia.org/wiki/Mobile_country_code";
const WIKI_URL_REGIONS = [
  "https://en.wikipedia.org/wiki/Mobile_Network_Codes_in_ITU_region_2xx_(Europe)",
  "https://en.wikipedia.org/wiki/Mobile_Network_Codes_in_ITU_region_3xx_(North_America)",
  "https://en.wikipedia.org/wiki/Mobile_Network_Codes_in_ITU_region_4xx_(Asia)",
  "https://en.wikipedia.org/wiki/Mobile_Network_Codes_in_ITU_region_5xx_(Oceania)",
  "https://en.wikipedia.org/wiki/Mobile_Network_Codes_in_ITU_region_6xx_(Africa)",
  "https://en.wikipedia.org/wiki/Mobile_Network_Codes_in_ITU_region_7xx_(South_America)",
];

const MCC_MNC_OUTPUT_FILE = path.join(__dirname, "mcc-mnc-list.json");
const STATUS_CODES_OUTPUT_FILE = path.join(__dirname, "status-codes.json");

async function fetch() {
  const records = [];
  const statusCodes = [];

  for (const region of WIKI_URL_REGIONS) {
    await collect(region, records, statusCodes);
    console.log(region, records.length, statusCodes.length);
  }

  await collect(WIKI_URL, records, statusCodes, true);
  console.log(WIKI_URL, records.length, statusCodes.length);

  await writeData(records, statusCodes);
}

async function collect(from, records, statusCodes, globals = false) {
  const response = await globalThis.fetch(from, {
    headers: {
      "User-Agent": "mcc-mnc-list/2.0 (https://github.com/cavoq/mcc-mnc-list)",
    },
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${from}`);
  }

  const dom = new JSDOM(await response.text());

  try {
    const content = dom.window.document.querySelector(
      "#mw-content-text > .mw-parser-output, body > .mw-parser-output"
    );

    if (!content) {
      throw new Error(`Wikipedia article content was not found: ${from}`);
    }

    removeCiteReferences(content);

    // Headings and tables can be nested inside Wikipedia section elements.
    const children = content.querySelectorAll("h2, h3, h4, table");
    const previousCount = records.length;
    let recordType = null;
    let countryInfo = { name: null, code: null };

    for (const node of children) {
      // Ignore hidden headings used as link targets inside table cells.
      if (node.parentElement.closest("table")) {
        continue;
      }

      if (node.nodeName === "H2") {
        recordType = getRecordType(node);
        countryInfo = { name: null, code: null };
        continue;
      }

      if (node.nodeName === "H3" || node.nodeName === "H4") {
        countryInfo = getCountryInfo(node);
        continue;
      }

      if (!recordType || (globals && recordType === "National")) {
        continue;
      }

      const rows = getTableRows(node);
      const headings = rows[0];

      if (
        !headings ||
        headings.length < 2 ||
        getCellText(headings[0]) !== "MCC" ||
        getCellText(headings[1]) !== "MNC"
      ) {
        continue;
      }

      if (recordType === "National" && !countryInfo.code) {
        throw new Error(`Operator table has no country heading: ${from}`);
      }

      for (const cols of rows.slice(1)) {
        if (cols.every((cell) => cell.nodeName === "TH")) {
          continue;
        }

        // Wikipedia occasionally omits the final, empty notes cell.
        if (cols.length < 6 || cols.length > 7) {
          throw new Error(`Unexpected operator row in ${from}`);
        }

        const mcc = getCellText(cols[0], true);
        const mnc = getCellText(cols[1]);

        if (!/^\d{3}$/.test(mcc) || !mnc) {
          throw new Error(`Invalid MCC/MNC row: ${mcc}/${mnc}`);
        }

        let status = getCellText(cols[4]);

        if (/^not (operational|opearational)$/i.test(status)) {
          status = "Not operational";
        }
        if (/^operational$/i.test(status)) {
          status = "Operational";
        }

        if (status && statusCodes.indexOf(status) === -1) {
          statusCodes.push(status);
        }

        records.push({
          type: recordType,
          countryName: countryInfo.name,
          countryCode: countryInfo.code,
          mcc: mcc,
          mnc: mnc,
          brand: getCellText(cols[2]),
          operator: getCellText(cols[3]),
          status: status,
          bands: getCellText(cols[5]),
          notes: cols[6] ? getCellText(cols[6]) : null,
        });
      }
    }

    const pageRecords = records.slice(previousCount);

    if (!pageRecords.length) {
      throw new Error(`No operator records found: ${from}`);
    }

    if (globals) {
      for (const type of ["Test", "International"]) {
        if (!pageRecords.some((record) => record.type === type)) {
          throw new Error(`Missing ${type} operator table: ${from}`);
        }
      }
    }
  } finally {
    dom.window.close();
  }
}

async function writeData(records, statusCodes) {
  let previous;

  try {
    previous = JSON.parse(await fs.readFile(MCC_MNC_OUTPUT_FILE, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  if (!records.length) {
    throw new Error("Refusing to save an empty list");
  }

  if (previous && records.length < previous.length * 0.8) {
    throw new Error(
      `Refusing suspicious list shrinkage: ${previous.length} to ${records.length} records`
    );
  }

  statusCodes.sort();

  const outputs = [
    [MCC_MNC_OUTPUT_FILE, records],
    [STATUS_CODES_OUTPUT_FILE, statusCodes],
  ];

  // Finish every download and validation before replacing either data file.
  try {
    for (const [file, data] of outputs) {
      await fs.writeFile(`${file}.tmp`, JSON.stringify(data, null, 2) + "\n");
    }

    for (const [file] of outputs) {
      await fs.rename(`${file}.tmp`, file);
    }
  } finally {
    for (const [file] of outputs) {
      await fs.rm(`${file}.tmp`, { force: true });
    }
  }

  console.log("MCC-MNC list saved to " + MCC_MNC_OUTPUT_FILE);
  console.log("Total " + records.length + " records");
  console.log("Status codes saved to " + STATUS_CODES_OUTPUT_FILE);
}

function getRecordType(node) {
  const recordTypeMap = {
    "National operators": "National",
    "Test networks": "Test",
    "International operators": "International",
  };

  return recordTypeMap[cleanup(node.textContent)] || null;
}

function getCountryInfo(node) {
  const countryText = cleanup(node.textContent);
  const match =
    countryText &&
    countryText.match(/^(.*?)\s+[–—-]\s+([A-Z]{2}(?:[-/][A-Z]{2})*)$/);

  return {
    name: match ? match[1] : null,
    code: match ? match[2] : null,
  };
}

function getTableRows(table) {
  const rows = [];
  const spans = [];

  for (const row of table.rows) {
    const cells = Array.from(row.cells);
    const cols = [];
    let index = 0;

    // Carry merged cells forward so column positions remain consistent.
    while (cells.length || spans[index]) {
      const span = spans[index];

      if (span) {
        cols.push(span.cell);
        span.remaining--;

        if (span.remaining === 0) {
          delete spans[index];
        }

        index++;
        continue;
      }

      const cell = cells.shift();

      for (let column = 0; column < cell.colSpan; column++) {
        cols.push(cell);

        if (cell.rowSpan > 1) {
          spans[index] = { cell: cell, remaining: cell.rowSpan - 1 };
        }

        index++;
      }
    }

    rows.push(cols);
  }

  return rows;
}

function getCellText(cell, isMcc = false) {
  const copy = cell.cloneNode(true);

  if (isMcc) {
    // Some MCC cells contain a hidden heading used as a link target.
    for (const node of copy.querySelectorAll("div")) {
      node.remove();
    }
  }

  for (const node of copy.querySelectorAll("br")) {
    node.replaceWith(" / ");
  }

  return cleanup(copy.textContent);
}

function removeCiteReferences(content) {
  const references = content.querySelectorAll(
    "sup.reference, sup.mw-ref, .mw-editsection, a[href*='#cite_note']"
  );

  for (const reference of references) {
    reference.remove();
  }
}

function cleanup(str) {
  str = str.replace(/\[(?:\d+(?:[ ,–-]\d+)*|citation needed)\]/gi, "");
  str = str.replace(/[“”]/g, '"');
  str = str.replace(/\s+/g, " ").trim();

  return str.length ? str : null;
}

fetch().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
