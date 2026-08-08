# Contributing to Eng Tools

This is a derivative of [CorentinTh/it-tools](https://github.com/CorentinTh/it-tools),
detached from the upstream fork network on 2026-08-06 and maintained independently.
It remains GPL-3.0 and keeps its attribution to the original project.

This file covers the conventions that are **not** obvious from reading the code, and
in particular the two places where doing the natural thing quietly breaks something.

## Internationalisation

Nine locales live in `locales/`. `en.yml` is the source of truth; the rest are
translations of it.

### There are two translation paths and they are not interchangeable

| From | Use | On a missing key |
|---|---|---|
| Inside a Vue component | `$t('key')` or `useI18n()` | Falls back to English |
| Outside a component (module scope) | `translate('key')` from `@/plugins/i18n.plugin` | **Renders the raw key string** |

`translate()` exists because every tool's `index.ts` declares its name and
description at import time, where no component instance exists and `$t` is
unavailable. It is not a redundant wrapper — roughly 88 tools depend on it — and it
cannot be replaced by `$t` without restructuring how tools declare themselves.

### Only `en.yml` has an `about:` block, deliberately

The other eight locales had theirs **deleted** during the de-fork rather than
translated, because they described the upstream project. `src/pages/About.vue` uses
`$t`, so those locales fall back to the English text — current and accurate — instead
of rendering stale prose about a different product.

This rests on two things that look like tidy-up targets:

1. **`createI18n` sets `locale: 'en'` with no explicit `fallbackLocale`.** vue-i18n
   defaults the fallback to the `locale` value. Setting `fallbackLocale` explicitly
   without checking the About page can break the fallback.
2. **`About.vue` uses `$t`, not `translate()`.** Switching it to the helper — which
   sits in the same file and looks equivalent — would make eight locales render the
   literal string `about.content`.

Neither would raise an error. Both would ship.

The same pattern is the right way to handle any upstream-specific prose: delete the
block from the non-English locales and let it fall back. Translating it instead
guarantees it goes stale the next time the English changes, with nothing to flag it.

### Known limitation — tool names do not follow the locale selector

`defineTool` spreads a plain object, so a tool's `name` and `description` are strings
evaluated once at import, always in English. Changing locale at runtime re-renders
component text but leaves tool names and descriptions untranslated. This is inherited
from upstream.

Fixing it means making those fields lazy across every tool, which would also remove
the need for `translate()`. If either is ever tackled, do both.

## Adding a tool

Create `src/tools/<tool-name>/index.ts`:

```ts
import { IconName } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.<tool-name>.title'),
  path: '/<tool-name>',
  description: translate('tools.<tool-name>.description'),
  keywords: ['...'],
  component: () => import('./<tool-name>.vue'),
  icon: IconName,
});
```

Add the matching `tools.<tool-name>.title` and `.description` keys to `locales/en.yml`,
register the tool in `src/tools/index.ts`, and leave the other locale files alone —
they fall back to English until someone translates them.

Use `translate()` here, not `$t`. This file is evaluated outside any component.

## Before opening a PR

```bash
pnpm i
pnpm typecheck      # vue-tsc
pnpm lint           # eslint
pnpm test           # vitest
```

## Things that are deliberate — please do not "fix" them

- **`.github/FUNDING.yml` points at `CorentinTh`**, and the in-app support button
  links to the original author's Buy Me a Coffee page. The button is labelled
  "Buy them (not me) a coffee". This is intentional.
- **`LICENSE` (GPL-3.0) and the upstream credit in `README.md` stay as they are.**
  Eng Tools is a derivative work.
- **Non-English locales have no `about:` block.** See above.

## Container images and supply chain

Images are published to `ghcr.io/kevinpinscoe/eng-tools` with an SPDX SBOM, SLSA
provenance and a Cosign signature bound to the digest, and are CVE-scanned with
Grype. The tagged release blocks on high or critical findings; the nightly reports
without blocking, deliberately. See [SUPPLY-CHAIN.md](SUPPLY-CHAIN.md) for how to
verify an image and what the SBOM does and does not cover.
