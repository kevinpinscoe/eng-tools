# Engineering Tools

**Engineering Tools** (`eng-tools`) is an independent project derived from [`CorentinTh/it-tools`](https://github.com/CorentinTh/it-tools).

This repository began as a fork of **IT Tools**, a collection of useful browser-based tools for developers and people working in IT. The original project, design, structure, application framework, and broad tool concept come from the upstream project and its contributors.

## Project direction

This project is now maintained as its own repository rather than as a GitHub fork. It keeps the foundation inherited from IT Tools while moving in a more specialized direction.

Tools added here may be useful to a smaller subset of users, such as people with specific infrastructure, operations, homelab, documentation, or workflow needs. They are not necessarily intended to be broadly useful to the wider IT Tools community.

For that reason, this repository should be treated as a separate, opinionated project rather than a staging area for upstream contributions.

## Original project credit

Engineering Tools would not exist without IT Tools. Primary credit for the original project goes to:

* Upstream repository: [`CorentinTh/it-tools`](https://github.com/CorentinTh/it-tools)
* Original author: Corentin Thomasset
* Original project website: [`it-tools.tech`](https://it-tools.tech)

This repository is not affiliated with, endorsed by, or maintained by the IT Tools project. It should not be assumed to match upstream behavior, upstream releases, or upstream deployment artifacts.

## Contributing

Issues and pull requests in this repository should relate to this project's specialized purpose.

For general IT Tools bugs, feature requests, or broadly useful tools, consider contributing directly to the upstream project instead:

https://github.com/CorentinTh/it-tools

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) with the following extensions:

- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [i18n Ally](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally)

with the following settings:

```json
{
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "i18n-ally.localesPaths": ["locales", "src/tools/*/locales"],
  "i18n-ally.keystyle": "nested"
}
```

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

### Create a new tool

To create a new tool, there is a script that generates the boilerplate of the new tool, simply run:

```sh
pnpm run script:create:tool my-tool-name
```

It will create a directory in `src/tools` with the correct files, and the import in `src/tools/index.ts`. You will just need to add the imported tool in the proper category and develop the tool.

## Build Verification

Every production build bakes the last git commit's SHA and timestamp directly into the app. This lets humans and automated checks confirm that what's running on a web server matches the expected build.

### Footer display

The sidebar footer shows the version, short commit SHA (linked to GitHub), and the commit timestamp in UTC:

```
Eng Tools v1.2.3 · abc1234 · 2026-05-28 21:14 UTC
```

### Machine-readable endpoint

Every build also emits a `/build-info.json` file served at the root of the site:

```sh
curl https://<your-host>/build-info.json
```

```json
{
  "version": "1.2.3",
  "commitSha": "3538ef1708ce7243204be068ebcd566e4cdab6d5",
  "commitDate": "2026-05-28 21:14:48 -0400",
  "builtAt": "2026-05-28T21:30:00.000Z"
}
```

Use `commitSha` to verify the running build matches the expected git ref, or `builtAt` to confirm deployment freshness. This file is generated at build time and never committed to the repository.

## Docker

Pre-built images are published to GHCR:

```sh
docker pull ghcr.io/kevinpinscoe/eng-tools:nightly
docker run -p 8080:80 ghcr.io/kevinpinscoe/eng-tools:nightly
```

The container listens on **port 80**. Map it to any host port you like (`-p <host>:80`).

Available tags: `nightly` (built from `main` when there are new commits), semver releases (`v1.2.3`).

For reproducible deployments, pin to the image digest rather than the floating `:nightly` tag:

```sh
# Get the current digest
docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/kevinpinscoe/eng-tools:nightly

# Pull and run by digest
docker run -p 8080:80 ghcr.io/kevinpinscoe/eng-tools@sha256:<digest>
```

## Repository Layout

```
eng-tools/
├── .github/
│   ├── workflows/            # ci, e2e-tests, docker nightly/release, releases
│   ├── ISSUE_TEMPLATE/       # GitHub issue templates
│   └── PULL_REQUEST_TEMPLATE/
├── _templates/               # Hygen code generation templates (new tool boilerplate)
├── locales/                  # i18n translation files (en, de, es, fr, pt, zh, …)
├── public/                   # Static assets served as-is (icons, robots.txt)
├── scripts/                  # Build and release helper scripts
├── src/
│   ├── assets/               # Images and static assets bundled by Vite
│   ├── components/           # Shared Vue components
│   ├── composable/           # Vue composables
│   ├── layouts/              # Page layout wrappers
│   ├── modules/              # App-level modules (command palette, etc.)
│   ├── pages/                # Route-level pages
│   ├── plugins/              # Vue plugin registrations
│   ├── stores/               # Pinia stores
│   ├── tools/                # Individual tool implementations (one dir per tool)
│   ├── ui/                   # UI component library
│   └── utils/                # Shared utility functions
├── CHANGELOG.md
├── Dockerfile                # Container image build (exposes port 80)
├── mise.toml                 # Tool version pins (node, pnpm)
├── nginx.conf                # nginx config used inside the Docker image
├── package.json
├── playwright.config.ts      # E2E test configuration
├── renovate.json             # Renovate dependency update config
├── tsconfig.json
├── unocss.config.ts          # UnoCSS (utility CSS) configuration
└── vite.config.ts            # Build configuration
```

## License

This project remains licensed under the GNU GPLv3, consistent with the upstream project.

See [`LICENSE`](LICENSE).

## Modification notice

This repository (`eng-tools`) began as a fork of `CorentinTh/it-tools` and is now maintained as an independent project.

Modifications in this repository are maintained by Kevin Inscoe and are intended for specialized tools and workflows that may not fit the upstream project's general-purpose scope.
