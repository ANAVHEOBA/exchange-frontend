import { createContext, createEffect, createMemo, createSignal, useContext, type JSX } from 'solid-js';

import {
  DEFAULT_LOCALE,
  getIntlLocale,
  normalizeLocale,
  persistLocale,
  type SupportedLocale,
} from './config';
import { translate } from './messages';

interface I18nContextValue {
  locale: () => SupportedLocale;
  intlLocale: () => string;
  t: (key: string) => string;
  switchLocale: (nextLocale: SupportedLocale) => void;
}

const I18nContext = createContext<I18nContextValue>();

export function I18nProvider(props: { children: JSX.Element; forcedLocale?: SupportedLocale }) {
  const [locale, setLocale] = createSignal<SupportedLocale>(props.forcedLocale ?? DEFAULT_LOCALE);

  createEffect(() => {
    const nextLocale = props.forcedLocale ?? DEFAULT_LOCALE;
    setLocale(current => (current === nextLocale ? current : nextLocale));
  });

  createEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale();
    }
  });

  const intlLocale = createMemo(() => getIntlLocale(locale()));
  const switchLocale = (nextLocale: SupportedLocale) => {
    const normalized = normalizeLocale(nextLocale);
    if (normalized === locale()) {
      return;
    }

    setLocale(normalized);
    persistLocale(normalized);

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const contextValue: I18nContextValue = {
    locale,
    intlLocale,
    t: key => translate(locale(), key),
    switchLocale,
  };

  return <I18nContext.Provider value={contextValue}>{props.children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider.');
  }

  return context;
}
