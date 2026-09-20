# Publishing to npm

The publish workflow runs when a `v*` tag is pushed. The tag must match the
version in `package.json`, and CI must pass before publishing.

## Authentication

For the first publication of `@cavoq/mcc-mnc-list`, add an npm token with write
access to the `@cavoq` scope and permission to bypass 2FA as the repository
Actions secret `NPM_TOKEN`.

Once the package exists, configure npm trusted publishing in its npm settings:

- Provider: GitHub Actions
- Organization or user: `cavoq`
- Repository: `mcc-mnc-list`
- Workflow: `publish.yml`
- Environment: leave blank
- Allowed actions: enable `npm publish`

The token can then be removed. The workflow supports both trusted publishing
and token authentication.

## Version tags

After committing and pushing the prepared release:

```bash
git tag -a v2.0.0 -m "Release 2.0.0"
git push origin v2.0.0
```

For subsequent releases, use `npm version patch`, `minor`, or `major` from a
clean working tree, then `git push origin HEAD --follow-tags`.

Stable versions publish under `latest`. Prereleases publish under `next`.
