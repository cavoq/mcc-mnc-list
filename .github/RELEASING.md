# Publishing to npm

The release workflow runs when a `v*` tag is pushed. The tag must match the
version in `package.json`, and CI must pass before publishing.

## Authentication

Configure npm trusted publishing in the package settings:

- Provider: GitHub Actions
- Organization or user: `cavoq`
- Repository: `mcc-mnc-list`
- Workflow: `release.yml`
- Environment: leave blank
- Allowed actions: enable `npm publish`

The workflow uses OIDC trusted publishing and does not use an npm token.

## Version tags

After committing and pushing the prepared release:

```bash
git tag -a v2.0.0 -m "Release 2.0.0"
git push origin v2.0.0
```

For subsequent releases, use `npm version patch`, `minor`, or `major` from a
clean working tree, then `git push origin HEAD --follow-tags`.

Stable versions publish under `latest`. Prereleases publish under `next`.
