const test = require("ava").default;
const mcc_mnc_list = require("./index");

test("all()", (t) => {
  t.is(typeof mcc_mnc_list.all, "function");
  t.truthy(Array.isArray(mcc_mnc_list.all()));
  t.truthy(mcc_mnc_list.all().length > 0);
});

test("statusCodes()", (t) => {
  t.is(typeof mcc_mnc_list.statusCodes, "function");
  t.truthy(Array.isArray(mcc_mnc_list.statusCodes()));
  t.truthy(mcc_mnc_list.statusCodes().length > 0);
});

test("filter()", (t) => {
  t.is(typeof mcc_mnc_list.filter, "function");
  t.truthy(Array.isArray(mcc_mnc_list.filter()));
  t.truthy(mcc_mnc_list.filter().length > 0);
  t.truthy(mcc_mnc_list.filter({}).length > 0);
});

test("filter() not object parameter exceptions", (t) => {
  t.throws(function () {
    return mcc_mnc_list.filter(1);
  });
  t.throws(function () {
    return mcc_mnc_list.filter("");
  });
});

test("filter() status code", (t) => {
  t.truthy(Array.isArray(mcc_mnc_list.filter({ statusCode: "Operational" })));
  t.throws(function () {
    return mcc_mnc_list.filter({ statusCode: "NotExistentStatusCode" });
  });
});

test("filter() mcc", (t) => {
  t.truthy(Array.isArray(mcc_mnc_list.filter({ mcc: "216" })));
  t.truthy(Array.isArray(mcc_mnc_list.filter({ mcc: 216 })));
  t.throws(function () {
    return mcc_mnc_list.filter({ mcc: {} });
  });
});

test("filter() mnc", (t) => {
  t.truthy(Array.isArray(mcc_mnc_list.filter({ mnc: "30" })));
  t.truthy(Array.isArray(mcc_mnc_list.filter({ mnc: 30 })));
  t.throws(function () {
    return mcc_mnc_list.filter({ mnc: {} });
  });
});

test("filter() mccmnc", (t) => {
  t.truthy(Array.isArray(mcc_mnc_list.filter({ mccmnc: "21630" })));
  t.truthy(Array.isArray(mcc_mnc_list.filter({ mccmnc: 21630 })));
  t.throws(function () {
    return mcc_mnc_list.filter({ mccmnc: {} });
  });
  t.throws(function () {
    return mcc_mnc_list.filter({ mccmnc: "21630", mcc: "216" });
  });
  t.throws(function () {
    return mcc_mnc_list.filter({ mccmnc: "21630", mnc: "30" });
  });
});

test("filter() mcc, mnc", (t) => {
  t.truthy(Array.isArray(mcc_mnc_list.filter({ mcc: "216", mnc: "30" })));
  t.truthy(Array.isArray(mcc_mnc_list.filter({ mcc: 216, mnc: 30 })));
  t.truthy(mcc_mnc_list.filter({ mcc: "216", mnc: "30" }).length === 1);
});

test("filter() country code should be a string", (t) => {
  t.throws(function () {
    return mcc_mnc_list.filter({ countryCode: 0 });
  });
  t.throws(function () {
    return mcc_mnc_list.filter({ countryCode: {} });
  });
});

test("filter() country code", (t) => {
  t.truthy(Array.isArray(mcc_mnc_list.filter({ countryCode: "US" })));
  t.truthy(
    Array.isArray(
      mcc_mnc_list.filter({ statusCode: "Operational", countryCode: "US" })
    )
  );
  t.truthy(
    mcc_mnc_list.filter({ statusCode: "Operational", countryCode: "US" })
      .length > 1
  );
});

test("filter() returns matching records", (t) => {
  const expected = mcc_mnc_list.all().filter(
    (record) => record.mcc === "216" && record.mnc === "30"
  );

  t.true(expected.length > 0);
  t.deepEqual(mcc_mnc_list.filter({ mccmnc: "21630" }), expected);
  t.deepEqual(mcc_mnc_list.filter({ mcc: 216, mnc: 30 }), expected);

  const records = mcc_mnc_list.filter({
    countryCode: "US",
    statusCode: "Operational",
  });

  t.true(records.length > 0);
  t.true(
    records.every(
      (record) => record.countryCode === "US" && record.status === "Operational"
    )
  );
});

test("filter() preserves leading zeros and distinguishes MNC widths", (t) => {
  const short = mcc_mnc_list.find({ mccmnc: "00101" });
  const long = mcc_mnc_list.find({ mccmnc: "001001" });

  t.is(short.mnc, "01");
  t.is(long.mnc, "001");
  t.not(short, long);
});

test("filter() does not ignore zero or empty filter values", (t) => {
  for (const key of ["mcc", "mnc", "mccmnc"]) {
    t.deepEqual(
      mcc_mnc_list.filter({ [key]: 0 }),
      mcc_mnc_list.filter({ [key]: "0" })
    );
    t.true(
      mcc_mnc_list.filter({ [key]: 0 }).length < mcc_mnc_list.all().length
    );
    t.deepEqual(mcc_mnc_list.filter({ [key]: "" }), []);
  }

  t.deepEqual(mcc_mnc_list.filter({ countryCode: "" }), []);
  t.throws(function () {
    return mcc_mnc_list.filter({ statusCode: "" });
  });
  t.throws(function () {
    return mcc_mnc_list.filter({ mccmnc: "21630", mnc: 0 });
  });
  t.throws(function () {
    return mcc_mnc_list.filter([]);
  });
});

test("find() returns the first match or undefined", (t) => {
  t.is(
    mcc_mnc_list.find({ mcc: "216" }),
    mcc_mnc_list.filter({ mcc: "216" })[0]
  );
  t.is(mcc_mnc_list.find({ mcc: "no match" }), undefined);
  t.is(mcc_mnc_list.find(null), mcc_mnc_list.all()[0]);
});

test("checked-in data contains valid records and matching status codes", (t) => {
  const records = mcc_mnc_list.all();
  const fields = [
    "type",
    "countryName",
    "countryCode",
    "mcc",
    "mnc",
    "brand",
    "operator",
    "status",
    "bands",
    "notes",
  ].sort();

  t.true(records.length > 3000);
  t.deepEqual(
    [...new Set(records.map((record) => record.type))].sort(),
    ["International", "National", "Test"]
  );

  for (const record of records) {
    t.deepEqual(Object.keys(record).sort(), fields);
    t.regex(record.mcc, /^\d{3}$/);

    // Keep extended private-network MNCs from the source intact.
    t.is(typeof record.mnc, "string");
    t.true(record.mnc.length > 0);

    for (const value of Object.values(record)) {
      t.true(value === null || typeof value === "string");
    }

    if (record.type === "National") {
      t.truthy(record.countryName);
      t.regex(record.countryCode, /^[A-Z]{2}(?:[-/][A-Z]{2})*$/);
    }
  }

  const statusCodes = records.map((record) => record.status).filter(Boolean);

  t.deepEqual(mcc_mnc_list.statusCodes(), [...new Set(statusCodes)].sort());
});
