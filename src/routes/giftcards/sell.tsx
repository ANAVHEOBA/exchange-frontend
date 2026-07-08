import { Title } from '@solidjs/meta';
import { A } from '@solidjs/router';
import Header from '../../components/Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { SUPPORT_CONFIG } from '../../config/support';
import { useLocale } from '../../i18n/locale';
import '../giftcards.css';

export default function SellGiftCardsPage() {
  const { t } = useLocale();

  return (
    <main class="giftcards-page">
      <Title>{`${t('giftcards.sellPageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="giftcards-page__hero">
        <div class="giftcards-page__shell">
          <div class="giftcards-page__intro">
            <div class="giftcards-page__eyebrow">{t('header.giftcards')}</div>
            <h1 class="giftcards-page__title">{t('giftcards.sellTitle')}</h1>
            <p class="giftcards-page__copy">{t('giftcards.sellIntroCopy')}</p>
            <div class="giftcards-page__mode-switch">
              <A class="giftcards-page__mode-pill" href="/giftcards/">
                {t('giftcards.buyMode')}
              </A>
              <A
                class="giftcards-page__mode-pill giftcards-page__mode-pill--active"
                href="/giftcards/sell"
              >
                {t('giftcards.sellMode')}
              </A>
            </div>
          </div>
        </div>
      </section>

      <section class="giftcards-page__sell-section">
        <div class="giftcards-page__shell">
          <div class="giftcards-page__sell-layout">
            <div class="giftcards-page__sell-card">
              <div class="giftcards-page__sell-kicker">{t('giftcards.sellHowItWorksKicker')}</div>
              <h2>{t('giftcards.sellHowItWorksTitle')}</h2>
              <p>{t('giftcards.sellHowItWorksCopy')}</p>

              <div class="giftcards-page__sell-steps">
                <div class="giftcards-page__sell-step">
                  <span>01</span>
                  <div>
                    <strong>{t('giftcards.sellStepOneTitle')}</strong>
                    <p>{t('giftcards.sellStepOneCopy')}</p>
                  </div>
                </div>
                <div class="giftcards-page__sell-step">
                  <span>02</span>
                  <div>
                    <strong>{t('giftcards.sellStepTwoTitle')}</strong>
                    <p>{t('giftcards.sellStepTwoCopy')}</p>
                  </div>
                </div>
                <div class="giftcards-page__sell-step">
                  <span>03</span>
                  <div>
                    <strong>{t('giftcards.sellStepThreeTitle')}</strong>
                    <p>{t('giftcards.sellStepThreeCopy')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="giftcards-page__sell-card giftcards-page__sell-card--contact">
              <div class="giftcards-page__sell-kicker">{t('giftcards.sellContactKicker')}</div>
              <h2>{t('giftcards.sellContactTitle')}</h2>
              <p>{t('giftcards.sellContactCopy')}</p>

              <div class="giftcards-page__sell-number">{SUPPORT_CONFIG.sellGiftcardWhatsappDisplay}</div>

              <div class="giftcards-page__sell-checklist">
                <div>{t('giftcards.sellChecklistTitle')}</div>
                <ul>
                  <li>{t('giftcards.sellChecklistOne')}</li>
                  <li>{t('giftcards.sellChecklistTwo')}</li>
                  <li>{t('giftcards.sellChecklistThree')}</li>
                  <li>{t('giftcards.sellChecklistFour')}</li>
                </ul>
              </div>

              <a
                class="giftcards-page__sell-cta"
                href={SUPPORT_CONFIG.sellGiftcardWhatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                {t('giftcards.sellOpenWhatsapp')}
              </a>

              <p class="giftcards-page__sell-note">{t('giftcards.sellNote')}</p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
