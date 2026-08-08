# build stage
FROM node:lts-slim AS build-stage

# Include this stage in the SBOM attestation.
#
# The production stage is nginx:stable-alpine and receives only /app/dist — built
# assets, not installed packages. A final-stage-only scan therefore lists nginx and
# Alpine and not one npm dependency, producing an inventory that looks complete and
# omits everything this application is actually built from.
#
# This is a local divergence from CorentinTh/it-tools upstream. It is one line and
# deliberately kept at the top of the stage so it is easy to re-apply after a merge.
ARG BUILDKIT_SBOM_SCAN_STAGE=true
ARG COMMIT_SHA=""
ARG COMMIT_DATE=""
# Set environment variables for non-interactive npm installs
ENV NPM_CONFIG_LOGLEVEL warn
ENV CI true
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm i --frozen-lockfile
COPY . .
RUN pnpm build

# production stage
# alpine-slim, not stable-alpine.
#
# stable-alpine bundles the optional nginx modules — image-filter, njs, xslt, geoip.
# image-filter pulls libgd, which pulls tiff, which was this image's only remaining
# high-severity exposure: CVE-2023-52356 and CVE-2026-4775 in tiff 4.7.1-r0, neither
# with a fix available, so no rebuild would ever have cleared them.
#
# nginx.conf here serves static files and nothing else — a single try_files block, no
# image_filter, njs, xslt or geoip directive — so none of those modules were ever
# loaded. alpine-slim omits them and their dependency chain: verified no libtiff and
# no nginx-module-* packages at all.
#
# If a directive from one of those modules is ever added, this must move back to
# stable-alpine and the tiff findings return as a real exposure.
FROM nginx:alpine-slim AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
