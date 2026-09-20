"use strict";

const fs = require("node:fs");
const { version } = require("../package.json");

function checkRelease(tag, packageVersion) {
  // Accept canonical SemVer release and prerelease tags, with no build metadata.
  const number = "(?:0|[1-9][0-9]*)";
  const identifier = `(?:${number}|[0-9]*[A-Za-z-][0-9A-Za-z-]*)`;
  const semver = new RegExp(
    `^v${number}\\.${number}\\.${number}(?:-${identifier}(?:\\.${identifier})*)?$`
  );

  if (!semver.test(tag) || tag !== `v${packageVersion}`) {
    throw new Error(
      `Release tag ${tag} must be a SemVer tag matching package.json (v${packageVersion})`
    );
  }

  return packageVersion.includes("-") ? "next" : "latest";
}

if (require.main === module) {
  const distTag = checkRelease(process.env.GITHUB_REF_NAME, version);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `dist_tag=${distTag}\n`);
  }

  console.log(`Validated v${version}; npm dist-tag: ${distTag}`);
}

module.exports = { checkRelease };
