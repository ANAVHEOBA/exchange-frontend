import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import Header from '../components/Header/Header';
import SiteFooter from '../components/SiteFooter/SiteFooter';
import SwapModal from '../components/SwapModal/SwapModal';
import type { RateType } from '../types/rate';
import './exchange.css';

const resolveRateType = (value?: string): RateType => {
  return value === 'fixed' ? 'fixed' : 'floating';
};

export default function ExchangePage() {
  const [searchParams] = useSearchParams();

  return (
    <main class="exchange-page">
      <Title>Confirm Exchange | ASSETAR</Title>
      <Header />

      <section class="exchange-page__shell">
        <div class="exchange-page__intro">
          <div class="exchange-page__eyebrow">Exchange</div>
          <h1 class="exchange-page__title">Compare routes on a dedicated screen.</h1>
          <p class="exchange-page__copy">
            Review your pair, add addresses, and choose between floating and fixed
            provider routes without stacking the whole flow under the homepage hero.
          </p>
        </div>

        <div class="exchange-page__content">
          <SwapModal
            layout="page"
            initialFromTicker={searchParams.from}
            initialFromNetwork={searchParams.network_from}
            initialToTicker={searchParams.to}
            initialToNetwork={searchParams.network_to}
            initialAmount={searchParams.amount}
            initialRateType={resolveRateType(searchParams.rate_type)}
          />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
