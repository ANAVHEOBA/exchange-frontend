import { Title } from '@solidjs/meta';
import Header from '../components/Header/Header';
import DonationWidget from '../components/DonationWidget/DonationWidget';
import SiteFooter from '../components/SiteFooter/SiteFooter';
import './about.css';

const operatingPrinciples = [
  {
    title: 'Direct provider settlement',
    copy:
      'The hosted donation flow stays non-custodial. The selected provider receives the deposit and settles the payout directly to the fixed donation wallet.',
  },
  {
    title: 'Server-controlled target',
    copy:
      'The recipient wallet is configured on the backend, not supplied by the browser. That keeps the donation target consistent and prevents client-side tampering.',
  },
  {
    title: 'Route visibility before checkout',
    copy:
      'Donors can compare live providers, floating or fixed routes, and expected receive amounts before generating deposit instructions.',
  },
];

const donationSteps = [
  {
    title: 'Choose the asset you want to send',
    copy:
      'Pick any supported source currency, set the amount, and compare provider routes without leaving the Assetar interface.',
  },
  {
    title: 'Select the route that fits',
    copy:
      'Choose between floating and fixed routes, review the provider and expected receive amount, then generate the checkout.',
  },
  {
    title: 'Send once and track live',
    copy:
      'After checkout is created, the status page keeps the deposit instructions, expiry window, and provider updates visible in real time.',
  },
];

const contactPoints = [
  { label: 'Support', href: 'mailto:support@assetar.app', value: 'support@assetar.app' },
  { label: 'General', href: 'mailto:mail@assetar.app', value: 'mail@assetar.app' },
];

export default function About() {
  return (
    <main class="about-page">
      <Title>About | ASSETAR</Title>
      <Header />

      <section class="about-page__hero">
        <div class="about-page__shell">
          <div class="about-page__eyebrow">About</div>
          <div class="about-page__hero-grid">
            <div class="about-page__intro">
              <h1 class="about-page__title">Assetar Exchange routes donations through live swap providers.</h1>
              <p class="about-page__copy">
                Assetar is built to compare live partner routes, keep swap execution non-custodial,
                and move donors from quote discovery to a real checkout with less friction.
              </p>
              <p class="about-page__copy">
                The hosted donation flow uses a server-controlled target wallet. Donors choose what they
                want to send, the selected provider receives the deposit, and the payout settles directly
                to the configured donation address.
              </p>

              <div class="about-page__contact-card" aria-label="Support contacts">
                {contactPoints.map(contact => (
                  <a class="about-page__contact-row" href={contact.href}>
                    <span class="about-page__contact-label">{contact.label}</span>
                    <strong class="about-page__contact-value">{contact.value}</strong>
                  </a>
                ))}
              </div>
            </div>

            <DonationWidget />
          </div>
        </div>
      </section>

      <section class="about-page__section">
        <div class="about-page__shell">
          <div class="about-page__section-header">
            <p class="about-page__section-kicker">How It Works</p>
            <h2 class="about-page__section-title">The donation route stays visible from quote to payout.</h2>
            <p class="about-page__section-copy">
              The flow mirrors the standard swap mechanics, but the destination wallet is hosted on the
              backend so the browser only needs to choose the send side, amount, and provider route.
            </p>
          </div>

          <div class="about-page__principles">
            {donationSteps.map(step => (
              <article class="about-page__principle">
                <h3 class="about-page__principle-title">{step.title}</h3>
                <p class="about-page__principle-copy">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section class="about-page__section about-page__section--accent">
        <div class="about-page__shell">
          <div class="about-page__section-header">
            <p class="about-page__section-kicker">Operating Principles</p>
            <h2 class="about-page__section-title">Software layer first, custody never.</h2>
          </div>

          <div class="about-page__principles about-page__principles--compact">
            {operatingPrinciples.map(principle => (
              <article class="about-page__principle">
                <h3 class="about-page__principle-title">{principle.title}</h3>
                <p class="about-page__principle-copy">{principle.copy}</p>
              </article>
            ))}
          </div>

          <div class="about-page__summary-card">
            <p>
              Assetar Exchange does not take custody of the funds moving through this donation flow.
              It acts as the route-comparison and workflow layer that helps donors discover providers,
              generate a checkout, and track the transaction after deposit.
            </p>
            <p>
              That makes the product best understood as hosted swap software with a fixed donation target,
              not a custodial wallet or centralized venue. The partner provider remains the direct
              counterparty processing the deposit and payout.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
