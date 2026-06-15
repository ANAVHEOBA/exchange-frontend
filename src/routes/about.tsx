import { Title } from '@solidjs/meta';
import { Show, createSignal, onMount } from 'solid-js';
import { swapApi } from '../api/endpoints/swap';
import type { DonationTargetResponse } from '../types/swap';
import Header from '../components/Header/Header';
import DonationWidget from '../components/DonationWidget/DonationWidget';
import FaqSection from '../components/FaqSection/FaqSection';
import PartnersWall from '../components/PartnersWall/PartnersWall';
import SiteFooter from '../components/SiteFooter/SiteFooter';
import './about.css';

const reassurancePanels = [
  {
    title: 'Simple and reliable',
    copy:
      'At no extra cost, Assetar compares live partner routes so donors can choose a provider with clear pricing, visible payout estimates, and a non-custodial settlement flow.',
  },
  {
    title: 'Amazing crypto tools',
    copy:
      'Swap discovery, hosted donations, recipient validation, and live status tracking all stay inside the same interface so donors move from quote to settlement without juggling multiple dashboards.',
  },
];

const donationSteps = [
  {
    title: 'Choose the asset you want to send',
    copy:
      'Pick the coin and network you want to send, set the amount, and let Assetar query live partner routes for the hosted donation target.',
  },
  {
    title: 'Select the route that fits',
    copy:
      'Review floating and fixed quotes, compare providers, and choose the route that fits your timing and expected receive amount.',
  },
  {
    title: 'Send once and track live',
    copy:
      'Create the checkout, send the deposit once, and keep the status page open to follow confirmations, expiry, and provider updates in real time.',
  },
];

const contactPoints = [
  { label: 'Support', href: 'mailto:support@assetar.app', value: 'support@assetar.app' },
  { label: 'General', href: 'mailto:mail@assetar.app', value: 'mail@assetar.app' },
];

const trustBadges = [
  'Non-custodial routing',
  'Hosted donation target',
  'Live provider comparison',
];

export default function About() {
  const [donationTarget, setDonationTarget] = createSignal<DonationTargetResponse | null>(null);

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
              <p class="about-page__eyebrow">About Assetar</p>
              <h1 class="about-page__title">Private swap routing with a hosted donation flow.</h1>
              <p class="about-page__copy">
                Assetar compares live swap providers, surfaces the routes that are actually available,
                and keeps the execution flow non-custodial from quote discovery through settlement.
              </p>
              <p class="about-page__copy">
                The donation flow uses a server-controlled target wallet. Donors only choose the asset
                they want to send, the provider they prefer, and the amount. The selected provider then
                settles directly to the hosted donation address configured on the backend.
              </p>

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
                <p class="about-page__address-kicker">Hosted donation address</p>
                <Show
                  when={donationTarget()}
                  fallback={<p class="about-page__address-loading">Loading current donation target...</p>}
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
            <p class="about-page__section-kicker">Why Assetar</p>
            <h2 class="about-page__panel-title">A cleaner route from donor intent to settled payout.</h2>

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
            <p class="about-page__section-kicker">How It Works</p>
            <h2 class="about-page__panel-title">Swap in 3 simple steps.</h2>

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
