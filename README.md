# Engineering Tools — Specialized Fork

**Engineering Tools** (`eng-tools`) is a downstream fork of [`CorentinTh/it-tools`](https://github.com/CorentinTh/it-tools).

The original project, **IT Tools**, is a collection of useful browser-based tools for developers and people working in IT. The original project, design, structure, application framework, and broad tool concept belong to the upstream project and its contributors.

## Purpose of this fork

This fork exists because I like the structure, user experience, and tool format of IT Tools, but I want to add utilities that are more specialized than the general-purpose tools normally expected in the upstream project.

The tools added here may be useful to a smaller subset of users, such as people with specific infrastructure, operations, homelab, documentation, or workflow needs. They are not necessarily intended to be broadly useful to the wider IT Tools community.

For that reason, I do not intend to submit every tool added here back to the upstream project. This fork should be treated as a separate, opinionated variant rather than a staging area for upstream contributions.

## Relationship to upstream

Primary credit goes to the upstream project:

* Upstream repository: [`CorentinTh/it-tools`](https://github.com/CorentinTh/it-tools)
* Original author: Corentin Thomasset
* Original project website: [`it-tools.tech`](https://it-tools.tech)

This fork may periodically pull changes from upstream when practical, but it should not be assumed to match upstream behavior, upstream releases, or upstream deployment artifacts.

## Contributing

Issues and pull requests in this repository should relate to this fork's specialized purpose.

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

## Repository Layout

```
it-tools/
├── .github/
│   └── workflows/        # ci, e2e-tests, docker nightly/release, releases
├── _templates/           # Hygen code generation templates (new tool boilerplate)
├── locales/              # i18n translation files (en, de, es, fr, pt, zh, …)
├── public/               # Static assets served as-is (icons, robots.txt)
├── scripts/              # Build and release helper scripts
├── src/
│   ├── components/       # Shared Vue components
│   ├── composable/       # Vue composables
│   ├── modules/          # App-level modules (command palette, etc.)
│   ├── pages/            # Route-level pages
│   ├── stores/           # Pinia stores
│   ├── tools/            # Individual tool implementations (one dir per tool)
│   └── ui/               # UI component library
├── Dockerfile            # Container image build
├── nginx.conf            # nginx config used inside the Docker image
├── package.json
├── playwright.config.ts  # E2E test configuration
├── vite.config.ts        # Build configuration
└── unocss.config.ts      # UnoCSS (utility CSS) configuration
```

## License

This fork remains licensed under the GNU GPLv3, consistent with the upstream project.

See [`LICENSE`](LICENSE).

## Modification notice

This repository (`eng-tools`) is a modified downstream fork of `CorentinTh/it-tools`.

Modifications in this fork are maintained by Kevin Inscoe and are intended for specialized tools and workflows that may not fit the upstream project's general-purpose scope.
