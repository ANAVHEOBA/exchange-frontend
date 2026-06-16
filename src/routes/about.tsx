import { Title } from '@solidjs/meta';
import { Show, createSignal, onMount } from 'solid-js';
import { swapApi } from '../api/endpoints/swap';
import type { DonationTargetResponse } from '../types/swap';
import Header from '../components/Header/Header';
import DonationWidget from '../components/DonationWidget/DonationWidget';
import FaqSection from '../components/FaqSection/FaqSection';
import PartnersWall from '../components/PartnersWall/PartnersWall';
import SiteFooter from '../components/SiteFooter/SiteFooter';
import { useLocale } from '../i18n/locale';
import './about.css';

export default function About() {
  const { t } = useLocale();
  const [donationTarget, setDonationTarget] = createSignal<DonationTargetResponse | null>(null);
  const reassurancePanels = [
    {
      title: t('about.whyCardOneTitle'),
      copy: t('about.whyCardOneCopy'),
    },
    {
      title: t('about.whyCardTwoTitle'),
      copy: t('about.whyCardTwoCopy'),
    },
  ];
  const donationSteps = [
    {
      title: t('about.stepOneTitle'),
      copy: t('about.stepOneCopy'),
    },
    {
      title: t('about.stepTwoTitle'),
      copy: t('about.stepTwoCopy'),
    },
    {
      title: t('about.stepThreeTitle'),
      copy: t('about.stepThreeCopy'),
    },
  ];
  const contactPoints = [
    { label: t('about.supportLabel'), href: 'mailto:support@assetar.app', value: 'support@assetar.app' },
    { label: t('about.generalLabel'), href: 'mailto:mail@assetar.app', value: 'mail@assetar.app' },
  ];
  const trustBadges = [t('about.badgeOne'), t('about.badgeTwo'), t('about.badgeThree')];

  onMount(async () => {
    try {
      const target = await swapApi.getDonationTarget();
      setDonationTarget(target);
    } catch (error) {
      console.error('Failed to load hosted donation target', error);
    }
  });

  return (
    <main class="about-page">
      <Title>About | ASSETAR</Title>
      <Header />

      <section class="about-page__hero">
        <div class="about-page__shell">
          <div class="about-page__hero-grid">
            <article class="about-page__hero-card" id="about">
              <p class="about-page__eyebrow">{t('about.eyebrow')}</p>
              <h1 class="about-page__title">{t('about.title')}</h1>
              <p class="about-page__copy">{t('about.copyOne')}</p>
              <p class="about-page__copy">{t('about.copyTwo')}</p>

              <div class="about-page__badge-row" aria-label="Assetar route highlights">
                {trustBadges.map(badge => (
                  <span class="about-page__badge">{badge}</span>
                ))}
              </div>

              <div class="about-page__contact-card" aria-label="Support contacts">
                {contactPoints.map(contact => (
                  <a class="about-page__contact-row" href={contact.href}>
                    <span class="about-page__contact-label">{contact.label}</span>
                    <strong class="about-page__contact-value">{contact.value}</strong>
                  </a>
                ))}
              </div>

              <div class="about-page__address-card">
                <p class="about-page__address-kicker">{t('about.donationAddress')}</p>
                <Show
                  when={donationTarget()}
                  fallback={<p class="about-page__address-loading">{t('about.donationAddressLoading')}</p>}
                >
                  {target => {
                    const hostedTarget = target();

                    return (
                      <>
                        <p class="about-page__address-network">
                          {hostedTarget.label ?? 'Donation target'} ·{' '}
                          {hostedTarget.to.toUpperCase()} / {hostedTarget.network_to}
                        </p>
                        <p class="about-page__address-value">{hostedTarget.recipient_address}</p>
                        <Show when={hostedTarget.recipient_extra_id}>
                          <p class="about-page__address-extra">
                            Extra ID: {hostedTarget.recipient_extra_id}
                          </p>
                        </Show>
                      </>
                    );
                  }}
                </Show>
              </div>
            </article>

            <div class="about-page__widget-panel">
              <DonationWidget />
            </div>
          </div>
        </div>
      </section>

      <section class="about-page__story">
        <div class="about-page__shell about-page__story-grid">
          <article class="about-page__info-panel">
            <p class="about-page__section-kicker">{t('about.whyKicker')}</p>
            <h2 class="about-page__panel-title">{t('about.whyTitle')}</h2>

            <div class="about-page__panel-stack">
              {reassurancePanels.map(panel => (
                <div class="about-page__panel-card">
                  <h3 class="about-page__panel-card-title">{panel.title}</h3>
                  <p class="about-page__panel-card-copy">{panel.copy}</p>
                </div>
              ))}
            </div>
          </article>

          <article class="about-page__steps-panel" id="how-it-works">
            <p class="about-page__section-kicker">{t('about.stepsKicker')}</p>
            <h2 class="about-page__panel-title">{t('about.stepsTitle')}</h2>

            <div class="about-page__steps">
              {donationSteps.map((step, index) => (
                <div class="about-page__step">
                  <div class="about-page__step-index">
                    {index + 1}
                    <span class="about-page__step-index-dot">.</span>
                  </div>
                  <div class="about-page__step-body">
                    <h3 class="about-page__step-title">{step.title}</h3>
                    <p class="about-page__step-copy">{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <FaqSection />
      <PartnersWall />
      <SiteFooter />
    </main>
  );
}
