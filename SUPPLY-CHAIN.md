# Supply chain — verifying a published image

This is a fork of [CorentinTh/it-tools](https://github.com/CorentinTh/it-tools) that
publishes its own images to `ghcr.io/kevinpinscoe/eng-tools`. This document describes
what those images carry and how to check it. It is fork-specific and has no upstream
counterpart.

Two images are published:

| Tag | Workflow | Trigger |
|---|---|---|
| `vX.Y.Z` | `.github/workflows/docker-release.yml` | annotated semver tag |
| `nightly` | `.github/workflows/docker-nightly-release.yml` | daily cron, and pushes to `main` |

Both are multi-arch (`linux/amd64`, `linux/arm64`) and both carry an **SPDX SBOM**,
**SLSA provenance**, and a **Cosign signature** bound to the pushed digest.

## Verifying

```bash
IMG=ghcr.io/kevinpinscoe/eng-tools:nightly   # or a vX.Y.Z tag

# What is inside the image
docker buildx imagetools inspect "$IMG" --format '{{ json .SBOM }}'

# Where and how it was built
docker buildx imagetools inspect "$IMG" --format '{{ json .Provenance }}'

# Who published it (tighten both regexes for real verification)
cosign verify "$IMG" \
  --certificate-identity-regexp='.*' \
  --certificate-oidc-issuer-regexp='.*'

# Known CVEs in the published image
grype "$IMG"
```

On tagged releases the per-platform SPDX documents are also attached to the GitHub
release. Those are a convenience copy for reading the inventory without a registry
client — **the registry attestation is the source of truth**, and the two can drift.

## `:nightly` was unsigned until 2026-08-04

Worth stating plainly rather than quietly fixing. The tagged release workflow signed
its images with Cosign from the start; the nightly workflow had no signing step at
all, so anyone pulling `ghcr.io/kevinpinscoe/eng-tools:nightly` before 2026-08-04 had
no way to verify who built it. It now signs and attests exactly as the tagged release
does. A nightly image changes more often than a tagged one, not less, so there was
never a good reason for it to carry less provenance.

## The CVE gate reports, it does not block

`docker-release.yml` scans the pushed digest with Grype at `severity-cutoff: high`,
uploads the result to the repository's **Security** tab, and does **not** fail the
build.

Measured 2026-08-04, before the gate was added: **44 findings at or above high** (10
critical, 34 high) out of 90 total, inherited from the `node:lts-slim` and
`nginx:stable-alpine` base images. `fail-build: true` would have blocked every
release from the first run.

When that baseline has been triaged, flip `fail-build` to `true` in
`docker-release.yml`. Two things not to do instead: do not raise `severity-cutoff` to
make findings disappear, and do not delete the step. A CVE that genuinely does not
affect this image is dispositioned with an OpenVEX statement at `.vex/openvex.json`
passed to the scan step's `vex:` input — there is none today because nothing is being
blocked.

## What the SBOM does not tell you

An SBOM is an inventory, not a clean bill of health. Specific to this image:

- **The production stage is `nginx:stable-alpine` and receives only `/app/dist`** —
  built assets, not installed packages. A scan of that stage alone would list nginx
  and Alpine and not one npm dependency, giving an inventory that looks complete
  while omitting everything the application is built from. The `build-stage` in the
  `Dockerfile` is therefore marked `BUILDKIT_SBOM_SCAN_STAGE=true`.

  **This is a one-line local divergence from upstream.** It sits at the top of that
  stage so it is easy to spot and re-apply after merging from `CorentinTh/it-tools`.
  If it goes missing in a merge, the SBOM silently loses the entire npm graph — it
  will not fail, it will just become wrong.
- **`nginx.conf` is `COPY`'d in** without package metadata and will not appear as a
  component.
- **Being listed is not being reachable.** A package can appear with a CVE whose
  vulnerable code this image never executes. That is what VEX is for.
- **Generators disagree.** Two SBOMs of this image, from different tools, will not
  match line for line.

## Known gaps

- **Grype scans `linux/amd64` only.** It resolves a multi-arch manifest to the
  runner's own platform. The `linux/arm64` image is built, signed, and has its own
  SBOM, but nothing scans it for CVEs.
- **`:nightly` is not CVE-scanned at all.** The gate is on the tagged release
  workflow only. A nightly image can therefore regress without anything reporting it.

## Rebuild trigger

A digest's SBOM and CVE posture are frozen at build time and only degrade afterwards.
Cut a new release when a base image or dependency updates — a scan that was clean six
months ago says nothing about today. The nightly build partly covers this for `main`,
but only tagged releases are gated and recorded.
