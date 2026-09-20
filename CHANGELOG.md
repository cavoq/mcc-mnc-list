# Changelog

## 2.0.0

### Migration

- Install `@cavoq/mcc-mnc-list` and update imports from `mcc-mnc-list` to `@cavoq/mcc-mnc-list`.
- Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`, as required by jsdom 30. The previous package did not declare its transitive runtime requirements.
- TypeScript callers must handle nullable operator metadata and `undefined` from `find()`. Numeric filters and null filter objects now match the documented runtime API.
- Zero and empty-string filters are applied instead of being ignored. Arrays are rejected as filter objects, and combining MCC+MNC with a separate MCC or MNC always fails, including zero values.

### Maintenance

- Refresh all seven Wikipedia source pages on 2026-09-12: 3,467 records (previously 3,446) and 14 status codes.
- Parse nested Wikipedia sections and both wrapped and direct headings. Preserve the country heading for international territories, rowspans, and rows without a final notes cell.
- Remove citations without truncating the preceding text; preserve meaningful bracketed text and separate line breaks.
- Propagate download, parse, and write errors with a failing exit code. Validate all sources and reject suspicious shrinkage before replacing data.
- Update jsdom 28.1.0 → 30.0.1, AVA 6.4.1 → 8.0.1, ESLint 10.0.1 → 10.10.0, and globals 17.3.0 → 17.12.0. `@eslint/js` 10.0.1 is already current. Pin pnpm 10.34.5 and refresh the lockfile.
- Add CI across Node 22, 24, and 26, plus npm publishing on matching version tags with prerelease handling and OIDC/token authentication.
- Limit package contents to the library, types, updater, data, and standard npm documentation. Use locked production dependencies and a writable work directory in Docker.
