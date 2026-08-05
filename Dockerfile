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
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
