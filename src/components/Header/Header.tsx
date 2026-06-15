import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import './Header.css';

const LANGUAGE_STORAGE_KEY = 'assetar.language';
const LANGUAGE_COOKIE_KEY = 'assetar.locale';

const navItems = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

const languageOptions = [
  { code: 'EN', lang: 'en', label: 'English', flag: '/country/USAFlagIcon.jpg' },
  { code: 'BR', lang: 'pt-BR', label: 'Português', flag: '/country/BrazilFlagIcon.jpg' },
  { code: 'DE', lang: 'de', label: 'Deutsch', flag: '/country/GermanyFlagIcon.jpg' },
  { code: 'EL', lang: 'el', label: 'Ελληνικά', flag: '/country/GreekFlagIcon.png' },
  { code: 'ES', lang: 'es', label: 'Español', flag: '/country/SpainFlagIcon.jpg' },
  { code: 'FR', lang: 'fr', label: 'Français', flag: '/country/FranceFlagIcon.jpg' },
  { code: 'HI', lang: 'hi', label: 'हिन्दी', flag: '/country/HindiFlagIcon.png' },
  { code: 'HR', lang: 'hr', label: 'Hrvatski', flag: '/country/CroatiaFlagIcon.png' },
  { code: 'HU', lang: 'hu', label: 'Magyar', flag: '/country/HungaryFlagIcon.png' },
  { code: 'ID', lang: 'id', label: 'Indonesia', flag: '/country/IndonesiaFlagIcon.png' },
  { code: 'IT', lang: 'it', label: 'Italiano', flag: '/country/ItalyFlagIcon.png' },
  { code: 'KO', lang: 'ko', label: '한국어', flag: '/country/KoreaFlagIcon.png' },
  { code: 'NL', lang: 'nl', label: 'Nederlands', flag: '/country/DutchFlagIcon.jpg' },
  { code: 'PL', lang: 'pl', label: 'Polski', flag: '/country/PolandFlagIcon.jpg' },
  { code: 'RU', lang: 'ru', label: 'Русский', flag: '/country/RussiaFlagIcon.webp' },
  { code: 'SR', lang: 'sr', label: 'Српски', flag: '/country/SerbianFlagIcon.png' },
  { code: 'SV', lang: 'sv', label: 'Svenska', flag: '/country/SwedenFlagIcon.png' },
  { code: 'TH', lang: 'th', label: 'ไทย', flag: '/country/ThailandFlagIcon.png' },
  { code: 'TR', lang: 'tr', label: 'Türkçe', flag: '/country/TurkeyFlagIcon.png' },
  { code: 'ZH', lang: 'zh', label: '中文', flag: '/country/ChineseFlagIcon.png' },
] as const;

export default function Header() {
  const [selectedLanguage, setSelectedLanguage] = createSignal(languageOptions[0]);
  const [languageMenuOpen, setLanguageMenuOpen] = createSignal(false);
  const [accountMenuOpen, setAccountMenuOpen] = createSignal(false);

  let languageMenuRef: HTMLDivElement | undefined;
  let accountMenuRef: HTMLDivElement | undefined;

  onMount(() => {
    try {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const cookieLanguage = document.cookie
        .split(';')
        .map(part => part.trim())
        .find(part => part.startsWith(`${LANGUAGE_COOKIE_KEY}=`))
        ?.split('=')[1];
      const browserLanguage = window.navigator.language;
      const matchedLanguage = languageOptions.find(option => {
        return (
          option.lang === savedLanguage ||
          option.code.toLowerCase() === savedLanguage?.toLowerCase() ||
          option.lang === cookieLanguage ||
          option.code.toLowerCase() === cookieLanguage?.toLowerCase()
        );
      }) ?? languageOptions.find(option => {
        return browserLanguage.toLowerCase().startsWith(option.lang.toLowerCase());
      });

      if (matchedLanguage) {
        setSelectedLanguage(matchedLanguage);
      }
    } catch {
      // Ignore storage access restrictions and fall back to English.
    }

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

  createEffect(() => {
    const language = selectedLanguage();

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language.lang;
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language.lang);
      } catch {
        // Ignore storage access restrictions and keep the in-memory choice.
      }
    }

    if (typeof document !== 'undefined') {
      document.cookie = `${LANGUAGE_COOKIE_KEY}=${encodeURIComponent(language.lang)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
  });

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
          {navItems.map(item => (
            <a href={item.href} class="site-nav__link">
              {item.label}
            </a>
          ))}
        </nav>

        <div class="site-header__actions">
          <div class="site-header__toolbar">
            <div class="site-language" ref={languageMenuRef}>
              <button
                class="site-language__trigger"
                onClick={() => setLanguageMenuOpen(current => !current)}
                type="button"
                aria-expanded={languageMenuOpen()}
                aria-label="Select language"
              >
                <img class="site-language__flag" src={selectedLanguage().flag} alt="" aria-hidden="true" />
                <span class="site-language__code">{selectedLanguage().code}</span>
                <img
                  class="site-language__chevron"
                  classList={{ open: languageMenuOpen() }}
                  src="/country/ChevronDown.svg"
                  alt=""
                  aria-hidden="true"
                />
              </button>

              <Show when={languageMenuOpen()}>
                <div class="site-language__menu" role="menu" aria-label="Languages">
                  <div class="site-language__menu-header">
                    <div class="site-language__menu-title">Language</div>
                    <div class="site-language__menu-copy">Choose interface language</div>
                  </div>
                  <For each={languageOptions}>
                    {option => (
                      <button
                        class="site-language__option"
                        classList={{ active: selectedLanguage().code === option.code }}
                        onClick={() => {
                          setSelectedLanguage(option);
                          setLanguageMenuOpen(false);
                        }}
                        type="button"
                      >
                        <img class="site-language__flag" src={option.flag} alt="" aria-hidden="true" />
                        <span class="site-language__option-copy">
                          <span class="site-language__code">{option.code}</span>
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
                aria-label="Open account menu"
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
                  <a class="site-account__menu-link" href="/login">
                    Login
                  </a>
                  <a class="site-account__menu-link" href="/about">
                    About
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
