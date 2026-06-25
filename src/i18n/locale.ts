export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  getIntlLocale,
  getLocaleMeta,
  normalizeLocale,
  persistLocale,
  resolveClientPreferredLocale,
  resolveServerPreferredLocale,
  type SupportedLocale,
} from './config';
export { I18nProvider, useI18n } from './context';
export { translate } from './messages';

export { useI18n as useLocale } from './context';
