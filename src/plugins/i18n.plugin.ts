import messages from '@intlify/unplugin-vue-i18n/messages';
import { get } from '@vueuse/core';
import type { Plugin } from 'vue';
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages,
});

export const i18nPlugin: Plugin = {
  install: (app) => {
    app.use(i18n);
  },
};

/**
 * Translate from OUTSIDE a Vue component.
 *
 * This is not a convenience wrapper around `$t` and it cannot be deleted in favour
 * of one. Every tool's `index.ts` calls it at module scope:
 *
 *     export const tool = defineTool({
 *       name: translate('tools.bcrypt.title'),
 *       ...
 *     });
 *
 * That runs at import time, with no component instance, so neither `$t` (a
 * component global property) nor `useI18n()` (needs a setup context) is available.
 * Reaching `i18n.global` directly is the only option. ~88 tools use it, twice each.
 *
 * ---
 *
 * IT BEHAVES DIFFERENTLY FROM `$t` ON A MISSING KEY, AND THAT MATTERS.
 *
 * `$t` honours `fallbackLocale`. This does not: `te()` checks the CURRENT locale
 * only, and a missing key returns the key itself, so the UI renders the literal
 * string `tools.foo.title`.
 *
 * That difference is load-bearing for the About page. `locales/en.yml` is the only
 * locale carrying an `about:` block — the other eight had theirs deleted during the
 * 2026-08-06 de-fork rather than translated, because they described the upstream
 * project. `src/pages/About.vue` uses `$t('about.content')`, so those locales fall
 * back to English. `createI18n` above sets `locale: 'en'` and no explicit
 * `fallbackLocale`, and vue-i18n defaults the fallback to the `locale` value.
 *
 * So: do NOT set an explicit `fallbackLocale` without checking the About page, and
 * do NOT "tidy" `About.vue` to use this helper. Either change makes eight locales
 * render `about.content` as literal text. Nothing would error.
 *
 * ---
 *
 * KNOWN LIMITATION — tool names do not follow the locale selector.
 *
 * `defineTool` spreads a plain object, so `name` and `description` are strings
 * evaluated once at import, in whatever locale was active then — always `en`.
 * Switching locale at runtime re-renders component text but leaves tool names and
 * descriptions in English. Inherited from upstream, not introduced here.
 *
 * Fixing it means making those fields lazy (a getter or a key resolved at render
 * time) across every tool, which would also remove the need for this helper. Worth
 * doing together if either is ever tackled.
 */
export const translate = function (localeKey: string) {
  const hasKey = i18n.global.te(localeKey, get(i18n.global.locale));
  return hasKey ? i18n.global.t(localeKey) : localeKey;
};
