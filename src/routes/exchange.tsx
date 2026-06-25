import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import Header from '../components/Header/Header';
import SiteFooter from '../components/SiteFooter/SiteFooter';
import SwapModal from '../components/SwapModal/SwapModal';
import { useLocale } from '../i18n/locale';
import type { RateType } from '../types/rate';
import './exchange.css';

const resolveRateType = (value?: string): RateType => {
  return value === 'fixed' ? 'fixed' : 'floating';
};

export default function ExchangePage() {
  const [searchParams] = useSearchParams();
  const { t } = useLocale();

  return (
    <main class="exchange-page">
      <Title>{`${t('exchange.title')} | ASSETAR`}</Title>
      <Header />

      <section class="exchange-page__shell">
        <div class="exchange-page__intro">
          <div class="exchange-page__eyebrow">{t('exchange.eyebrow')}</div>
          <h1 class="exchange-page__title">{t('exchange.title')}</h1>
          <p class="exchange-page__copy">{t('exchange.copy')}</p>
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
