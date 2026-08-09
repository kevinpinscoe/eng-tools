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

# Known CVEs in the published image — NOTE: this scans your own platform only.
# See "Reproducing the scan yourself" below to check the other one.
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

## The CVE gate — what is checked, and what happens when it trips

Both workflows scan **each published platform digest** (`linux/amd64` and
`linux/arm64`) with Grype at `severity-cutoff: high` and upload each result to the
repository's **Security** tab. What they do with a finding differs on purpose:

| Image | Workflow | On a finding at or above high |
|---|---|---|
| `vX.Y.Z` | `docker-release.yml` | **Blocks.** The release does not publish. |
| `nightly` | `docker-nightly-release.yml` | **Warns.** The image still publishes; the finding lands in the Security tab. |

**The asymmetry is deliberate — do not "fix" it.** A tagged release is a deliberate act
with a human behind it, so blocking is the right response: the release simply does not
happen and someone is there to see why. A nightly is unattended and its entire value is
freshness. Blocking it would mean a base-image CVE stops `:nightly` updating while the
tag stays pullable, so consumers keep receiving an *older* image and nothing announces
that it froze. That failure mode is worse than the one blocking prevents. Nothing
escapes permanently either way: the same finding blocks the next tagged release.

Note that `fail-build: true` is not a count threshold — one finding at or above the
cutoff is enough to fail a tagged release.

The tagged gate was not always blocking. Measured 2026-08-04: **44 findings at or above
high** (10 critical, 34 high) out of 90 total, inherited from the `node:lts-slim` and
`nginx:stable-alpine` base images, and the gate ran warn-only because blocking would
have stopped every release from the first run.

Those findings were **removed rather than waived.** The last two were both libtiff
(CVE-2023-52356, CVE-2026-4775) with no fix available, so no rebuild would ever have
cleared them. Traced rather than assumed: libtiff arrived via
`nginx-module-image-filter` → `libgd` → `tiff`, bundled in `nginx:stable-alpine`. This
repo's `nginx.conf` is a single `try_files` block serving static assets, with no
`image_filter`, `njs`, `xslt` or `geoip` directive, so that module was shipped and never
invoked. The production stage moved to `nginx:alpine-slim`, which omits the whole chain.
The gate became blocking on 2026-08-08.

**Nothing here is suppressed.** There is no `.vex/openvex.json` in this repository, so
what you measure locally is what the gate measures. If you see a finding at or above
high, it is real. Two things not to do instead: do not raise `severity-cutoff` to make
findings disappear, and do not delete a scan step. A CVE that genuinely does not affect
this image gets an OpenVEX statement at `.vex/openvex.json`, passed to the scan step's
`vex:` input, and only with evidence that the vulnerable code is unreachable.

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

## Reproducing the scan yourself

`grype "$IMG"` against a multi-arch tag scans **only your own platform**. Grype resolves
a manifest list to whatever architecture you are running, so an `amd64` machine silently
never looks at the `arm64` image. To check a specific platform, scan that platform's own
digest:

```bash
IMG=ghcr.io/kevinpinscoe/eng-tools:nightly   # or a vX.Y.Z tag

# Your own platform — whatever the manifest list resolves to locally
grype "$IMG"

# A named platform, by its own digest. Swap arm64 for amd64 for the other one.
DIGEST=$(docker buildx imagetools inspect --raw "$IMG" \
  | jq -r '.manifests[] | select(.platform.architecture=="arm64" and .platform.os=="linux") | .digest')
grype "ghcr.io/kevinpinscoe/eng-tools@${DIGEST}"
```

This is exactly what both workflows do, so a local run of both platforms should agree
with the Security tab. The `.platform.os=="linux"` filter matters: a manifest list also
contains attestation manifests, which report architecture `unknown` and are not
scannable images.

Four SARIF categories appear in the Security tab, one per image per platform:
`grype-container-amd64` and `grype-container-arm64` from the tagged release, and
`grype-container-nightly-amd64` and `grype-container-nightly-arm64` from the nightly.
They are deliberately distinct — two uploads sharing a category overwrite each other,
so a shared name would show one result and silently discard the other. A retired
`grype-container` category may still be visible with stale results from before
2026-08-08; it is no longer written to.

## Two gaps that are now closed

Recorded because both were real, and both were fixed on 2026-08-08 rather than
discovered to be harmless:

- **`:nightly` was not CVE-scanned at all** until 2026-08-08. The gate lived only in the
  tagged release workflow, so a nightly could regress with nothing reporting it — on the
  image that changes *most* often. It now scans and reports on every run.
- **Grype scanned `linux/amd64` only** until 2026-08-08, in both workflows, because it
  resolves a multi-arch manifest to the runner's own platform. The `linux/arm64` image
  was built, signed and carried its own SBOM, but had never been checked for CVEs. Both
  workflows now resolve each platform's digest from the manifest list and scan it
  directly. (`anchore/scan-action` has no platform input, so this could not be fixed
  with a flag.)

## Rebuild trigger

A digest's SBOM and CVE posture are frozen at build time and only degrade afterwards.
Cut a new release when a base image or dependency updates — a scan that was clean six
months ago says nothing about today.

The nightly build covers this continuously for `main`: it rebuilds daily, scans both
platforms, and records the result in the Security tab. What it does not do is *block*,
so a nightly finding is a signal to cut a tagged release, not something that stops
`:nightly` from updating. Only tagged releases are gated.
