import { A, useLocation, usePreloadRoute } from '@solidjs/router';
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
  const location = useLocation();
  const preloadRoute = usePreloadRoute();
  const { locale, switchLocale, t } = useLocale();
  const [languageMenuOpen, setLanguageMenuOpen] = createSignal(false);
  const [accountMenuOpen, setAccountMenuOpen] = createSignal(false);

  let languageMenuRef: HTMLDivElement | undefined;
  let accountMenuRef: HTMLDivElement | undefined;

  const warmGiftcardsRoute = () => {
    preloadRoute('/giftcards/', { preloadData: true });
  };

  const warmBotRoute = () => {
    preloadRoute('/bot', { preloadData: true });
  };

  onMount(() => {
    let idleCallbackId: number | undefined;
    let timeoutId: number | undefined;

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

    if ('requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(() => {
        warmGiftcardsRoute();
        warmBotRoute();
      }) as unknown as number;
    } else {
      timeoutId = window.setTimeout(() => {
        warmGiftcardsRoute();
        warmBotRoute();
      }, 500);
    }

    onCleanup(() => {
      window.removeEventListener('mousedown', handlePointerDown);

      if (idleCallbackId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    });
  });
  const selectedLanguage = () => getLocaleMeta(locale() as SupportedLocale);
  const swapActive = () =>
    !location.pathname.startsWith('/giftcards') && !location.pathname.startsWith('/bot');
  const giftcardsActive = () => location.pathname.startsWith('/giftcards');
  const botActive = () => location.pathname.startsWith('/bot');
  const accountHref = () => {
    const username = auth.user()?.username?.trim();

    if (auth.initialized() && auth.isAuthenticated() && username) {
      return `/profile/${encodeURIComponent(username)}`;
    }

    return '/login';
  };

  const NavItems = () => (
    <>
      <div class="site-nav__item">
        <A href="/#swap" class="site-nav__link" classList={{ active: swapActive() }}>
          <svg class="site-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16.44 3.1a1 1 0 0 1 1.41 0l2.75 2.75a1 1 0 0 1 0 1.41l-2.75 2.75a1 1 0 1 1-1.41-1.41l1.04-1.04H8a3 3 0 0 0-3 3 1 1 0 1 1-2 0 5 5 0 0 1 5-5h9.48l-1.04-1.04a1 1 0 0 1 0-1.41ZM19 13a1 1 0 0 1 1 1 5 5 0 0 1-5 5H5.52l1.04 1.04a1 1 0 1 1-1.41 1.41L2.4 18.71a1 1 0 0 1 0-1.41l2.75-2.75a1 1 0 1 1 1.41 1.41L5.52 17H15a3 3 0 0 0 3-3 1 1 0 0 1 1-1Z"
            />
          </svg>
          <span class="site-nav__label">{t('header.swap')}</span>
        </A>
      </div>

      <div class="site-nav__divider" aria-hidden="true" />

      <div class="site-nav__item">
        <A
          href="/giftcards/"
          class="site-nav__link"
          classList={{ active: giftcardsActive() }}
          onPointerEnter={warmGiftcardsRoute}
          onFocus={warmGiftcardsRoute}
        >
          <svg class="site-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M10.25 3A3.25 3.25 0 0 0 7 6.25c0 .65.19 1.25.5 1.75H5.5A2.5 2.5 0 0 0 3 10.5v2c0 .28.22.5.5.5H11V9.5H9.75a3.25 3.25 0 0 1 0-6.5h.5Zm3.5 0h.5a3.25 3.25 0 1 1 0 6.5H13V13h7.5c.28 0 .5-.22.5-.5v-2A2.5 2.5 0 0 0 18.5 8H16.5c.31-.5.5-1.1.5-1.75A3.25 3.25 0 0 0 13.75 3ZM3.5 14.5A.5.5 0 0 0 3 15v3.5A2.5 2.5 0 0 0 5.5 21H11v-6.5H3.5Zm9.5 0V21h5.5a2.5 2.5 0 0 0 2.5-2.5V15a.5.5 0 0 0-.5-.5H13Z"
            />
          </svg>
          <span class="site-nav__label">{t('header.giftcards')}</span>
        </A>
      </div>

      <div class="site-nav__divider" aria-hidden="true" />

      <div class="site-nav__item">
        <A
          href="/bot"
          class="site-nav__link"
          classList={{ active: botActive() }}
          onPointerEnter={warmBotRoute}
          onFocus={warmBotRoute}
        >
          <span class="site-nav__icon site-nav__icon--whatsapp" aria-hidden="true" />
          <span class="site-nav__label">{t('header.bot')}</span>
        </A>
      </div>
    </>
  );

  return (
    <header class="site-header">
      <div class="site-header__inner">
        <A href="/" class="site-brand" aria-label="Assetar home">
          <img
            class="site-brand__logo"
            src="/assetar%20logo%20with%20name%202.jpg"
            alt="Assetar"
            width="3508"
            height="2481"
          />
        </A>

        <nav class="site-nav" aria-label="Primary">
          <div class="site-nav__rail">
            <NavItems />
          </div>
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
                  <A class="site-account__menu-link" href={accountHref()}>
                    {auth.initialized() && auth.isAuthenticated() ? t('header.profile') : t('header.login')}
                  </A>
                  <A class="site-account__menu-link" href="/about">
                    {t('header.about')}
                  </A>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      <nav class="site-mobile-nav" aria-label="Primary">
        <div class="site-mobile-nav__shell">
          <div class="site-mobile-nav__scroll">
            <NavItems />
          </div>
        </div>
      </nav>
    </header>
  );
}
