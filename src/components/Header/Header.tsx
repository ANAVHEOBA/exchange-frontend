import { For, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { useAuth } from '../../hooks/useAuth';
import { SUPPORTED_LOCALES, getLocaleMeta, type SupportedLocale } from '../../i18n/config';
import { useLocale } from '../../i18n/locale';
import './Header.css';

const languageOptions = SUPPORTED_LOCALES.map(locale => ({
  code: locale.code,
  shortCode: locale.shortCode,
  label: locale.nativeLabel,
  flag: locale.flagAsset,
})) as const;

export default function Header() {
  const auth = useAuth();
  const { locale, switchLocale, t } = useLocale();
  const [languageMenuOpen, setLanguageMenuOpen] = createSignal(false);
  const [accountMenuOpen, setAccountMenuOpen] = createSignal(false);

  let languageMenuRef: HTMLDivElement | undefined;
  let accountMenuRef: HTMLDivElement | undefined;

  onMount(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (languageMenuRef && !languageMenuRef.contains(target)) {
        setLanguageMenuOpen(false);
      }

      if (accountMenuRef && !accountMenuRef.contains(target)) {
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    onCleanup(() => {
      window.removeEventListener('mousedown', handlePointerDown);
    });
  });
  const selectedLanguage = () => getLocaleMeta(locale() as SupportedLocale);
  const accountHref = () => {
    const username = auth.user()?.username?.trim();

    if (auth.initialized() && auth.isAuthenticated() && username) {
      return `/profile/${encodeURIComponent(username)}`;
    }

    return '/login';
  };

  return (
    <header class="site-header">
      <div class="site-header__inner">
        <a href="/" class="site-brand" aria-label="Assetar home">
          <img
            class="site-brand__logo"
            src="/assetar%20logo%20with%20name%202.jpg"
            alt="Assetar"
            width="3508"
            height="2481"
          />
        </a>

        <nav class="site-nav" aria-label="Primary">
          <a href="/#swap" class="site-nav__link">
            {t('header.swap')}
          </a>
          <a href="/giftcards" class="site-nav__link">
            {t('header.giftcards')}
          </a>
        </nav>

        <div class="site-header__actions">
          <div class="site-header__toolbar">
            <div class="site-language" ref={languageMenuRef}>
              <button
                class="site-language__trigger"
                onClick={() => setLanguageMenuOpen(current => !current)}
                type="button"
                aria-expanded={languageMenuOpen()}
                aria-label={t('header.selectLanguage')}
              >
                <img class="site-language__flag" src={selectedLanguage().flagAsset} alt="" aria-hidden="true" />
                <span class="site-language__code">{selectedLanguage().shortCode}</span>
                <img
                  class="site-language__chevron"
                  classList={{ open: languageMenuOpen() }}
                  src="/country/ChevronDown.svg"
                  alt=""
                  aria-hidden="true"
                />
              </button>

              <Show when={languageMenuOpen()}>
                <div class="site-language__menu" role="menu" aria-label={t('header.language')}>
                  <div class="site-language__menu-header">
                    <div class="site-language__menu-title">{t('header.language')}</div>
                    <div class="site-language__menu-copy">{t('header.chooseLanguage')}</div>
                  </div>
                  <For each={languageOptions}>
                    {option => (
                      <button
                        class="site-language__option"
                        classList={{ active: selectedLanguage().code === option.code }}
                        onClick={() => {
                          switchLocale(option.code);
                          setLanguageMenuOpen(false);
                        }}
                        type="button"
                      >
                        <img class="site-language__flag" src={option.flag} alt="" aria-hidden="true" />
                        <span class="site-language__option-copy">
                          <span class="site-language__code">{option.shortCode}</span>
                          <span class="site-language__label">{option.label}</span>
                        </span>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            <div class="site-account" ref={accountMenuRef}>
              <button
                class="site-account__trigger"
                onClick={() => setAccountMenuOpen(current => !current)}
                type="button"
                aria-expanded={accountMenuOpen()}
                aria-label={t('header.openAccountMenu')}
              >
                <svg class="site-account__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.87 0-7 1.79-7 4v1h14v-1c0-2.21-3.13-4-7-4Z"
                  />
                </svg>
                <img
                  class="site-account__chevron"
                  classList={{ open: accountMenuOpen() }}
                  src="/country/ChevronDown.svg"
                  alt=""
                  aria-hidden="true"
                />
              </button>

              <Show when={accountMenuOpen()}>
                <div class="site-account__menu" role="menu" aria-label="Account">
                  <a class="site-account__menu-link" href={accountHref()}>
                    {auth.initialized() && auth.isAuthenticated() ? t('header.profile') : t('header.login')}
                  </a>
                  <a class="site-account__menu-link" href="/about">
                    {t('header.about')}
                  </a>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
