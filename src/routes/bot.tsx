import { Title } from '@solidjs/meta';
import { Show } from 'solid-js';
import Header from '../components/Header/Header';
import SiteFooter from '../components/SiteFooter/SiteFooter';
import { SUPPORT_CONFIG } from '../config/support';
import { useLocale } from '../i18n/locale';
import './bot.css';

export default function BotPage() {
  const { t } = useLocale();

  return (
    <main class="bot-page">
      <Title>{`${t('bot.pageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="bot-page__hero">
        <div class="bot-page__shell">
          <div class="bot-page__hero-grid">
            <div class="bot-page__intro">
              <div class="bot-page__eyebrow">{t('bot.eyebrow')}</div>
              <h1 class="bot-page__title">{t('bot.title')}</h1>
              <p class="bot-page__copy">{t('bot.introCopy')}</p>
              <Show when={SUPPORT_CONFIG.swapBotIsTest}>
                <div class="bot-page__test-banner">{t('bot.testModeBanner')}</div>
              </Show>
            </div>

            <div class="bot-page__cta-card">
              <div class="bot-page__cta-icon" aria-hidden="true" />
              <div class="bot-page__cta-label">{t('bot.numberLabel')}</div>
              <div class="bot-page__cta-number">{SUPPORT_CONFIG.swapBotWhatsappDisplay}</div>
              <a
                class="bot-page__cta-button"
                href={SUPPORT_CONFIG.swapBotWhatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                {t('bot.openCta')}
              </a>
              <p class="bot-page__cta-note">{t('bot.note')}</p>
              <Show when={SUPPORT_CONFIG.swapBotIsTest}>
                <p class="bot-page__cta-note bot-page__cta-note--strong">{t('bot.testModeCopy')}</p>
              </Show>
            </div>
          </div>
        </div>
      </section>

      <section class="bot-page__section">
        <div class="bot-page__shell">
          <div class="bot-page__section-head">
            <div class="bot-page__section-kicker">{t('bot.flowKicker')}</div>
            <h2>{t('bot.flowTitle')}</h2>
            <p>{t('bot.flowCopy')}</p>
          </div>

          <div class="bot-page__steps">
            <article class="bot-page__step-card">
              <div class="bot-page__step-index">01</div>
              <h3>{t('bot.stepOneTitle')}</h3>
              <p>{t('bot.stepOneCopy')}</p>
            </article>

            <article class="bot-page__step-card">
              <div class="bot-page__step-index">02</div>
              <h3>{t('bot.stepTwoTitle')}</h3>
              <p>{t('bot.stepTwoCopy')}</p>
            </article>

            <article class="bot-page__step-card">
              <div class="bot-page__step-index">03</div>
              <h3>{t('bot.stepThreeTitle')}</h3>
              <p>{t('bot.stepThreeCopy')}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="bot-page__section bot-page__section--compact">
        <div class="bot-page__shell">
          <div class="bot-page__commands-card">
            <div class="bot-page__section-kicker">{t('bot.commandsKicker')}</div>
            <h2>{t('bot.commandsTitle')}</h2>
            <p>{t('bot.commandsIntro')}</p>

            <div class="bot-page__command-list">
              <div class="bot-page__command-item">
                <code>{t('bot.commandOne')}</code>
              </div>
              <div class="bot-page__command-item">
                <code>{t('bot.commandTwo')}</code>
              </div>
              <div class="bot-page__command-item">
                <code>{t('bot.commandThree')}</code>
              </div>
              <div class="bot-page__command-item">
                <code>{t('bot.commandFour')}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
