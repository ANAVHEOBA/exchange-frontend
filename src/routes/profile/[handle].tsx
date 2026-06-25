import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import { For, Show, createMemo, onMount } from 'solid-js';
import Header from '../../components/Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useAuth } from '../../hooks/useAuth';
import { useSwap } from '../../hooks/useSwap';
import { useLocale } from '../../i18n/locale';
import { format } from '../../utils/format';
import './profile.css';

const formatDateTime = (value?: string) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const csvEscape = (value: string | number | null | undefined) => {
  const normalized = value === null || value === undefined ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

export default function ProfilePage() {
  const params = useParams<{ handle: string }>();
  const auth = useAuth();
  const swap = useSwap();
  const { t } = useLocale();

  const requestedHandle = () => decodeURIComponent(params.handle ?? '');
  const currentHandle = () =>
    auth.user()?.username?.trim() ||
    auth.user()?.email?.split('@')[0] ||
    requestedHandle();
  const totalTrades = () => auth.user()?.total_trades ?? swap.history().length;
  const tradedVolume = () => auth.user()?.traded_value_btc ?? 0;
  const completedHistory = createMemo(() => swap.history());
  const btcValueForTrade = (amount: number, ticker: string, fallback: number, fallbackTicker: string) => {
    if (ticker.toLowerCase() === 'btc') {
      return amount;
    }

    if (fallbackTicker.toLowerCase() === 'btc') {
      return fallback;
    }

    return null;
  };
  const downloadHistory = () => {
    if (typeof window === 'undefined' || completedHistory().length === 0) {
      return;
    }

    const header = [
      'Date',
      'From Currency',
      'From Network',
      'Amount Sent',
      'To Currency',
      'To Network',
      'Amount Received',
      'BTC Value',
      'Provider',
      'Swap ID',
      'Status',
    ];
    const rows = completedHistory().map(item => {
      const btcValue = btcValueForTrade(
        item.amount,
        item.from_currency,
        item.actual_receive ?? item.estimated_receive,
        item.to_currency,
      );

      return [
        item.completed_at ?? item.created_at,
        item.from_currency.toUpperCase(),
        item.from_network,
        item.amount,
        item.to_currency.toUpperCase(),
        item.to_network,
        item.actual_receive ?? item.estimated_receive,
        btcValue ?? '',
        item.provider,
        item.id,
        item.status,
      ]
        .map(csvEscape)
        .join(',');
    });

    const csv = [header.map(csvEscape).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const href = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${currentHandle() || 'assetar'}-trade-history.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(href);
  };

  onMount(() => {
    void (async () => {
      try {
        if (!auth.initialized()) {
          await auth.initialize();
        }

        if (auth.isAuthenticated()) {
          await swap.loadHistory({ limit: 100, status: 'completed' });
        }
      } catch {
        // Store state is surfaced through the auth and swap hooks.
      }
    })();
  });

  return (
    <main class="profile-page">
      <Title>{`${t('profile.pageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="profile-page__hero pagecontent" id="hero">
        <div class="profile-page__shell profile-page__indexcontainer">
          <Show
            when={auth.initialized()}
            fallback={
              <div class="profile-page__feedback">{t('account.restoringSession')}</div>
            }
          >
            <Show
              when={auth.isAuthenticated()}
              fallback={
                <div class="profile-page__dashboard-card profile-page__dashboard-card--auth">
                  <svg class="profile-page__account-icon" fill="currentColor" viewBox="0 0 448 512" aria-hidden="true">
                    <path d="M224 0c70.7 0 128 57.3 128 128s-57.3 128-128 128s-128-57.3-128-128S153.3 0 224 0zM209.1 359.2l-18.6-31c-6.4-10.7 1.3-24.2 13.7-24.2H224h19.7c12.4 0 20.1 13.6 13.7 24.2l-18.6 31 33.4 123.9 39.5-161.2c77.2 12 136.3 78.8 136.3 159.4c0 17-13.8 30.7-30.7 30.7H265.1 182.9 30.7C13.8 512 0 498.2 0 481.3c0-80.6 59.1-147.4 136.3-159.4l39.5 161.2 33.4-123.9z" />
                  </svg>
                  <p class="profile-page__message">{t('profile.loginRequiredCopy')}</p>
                  <a class="profile-page__inline-link" href="/login">
                    {t('profile.goToLogin')}
                  </a>
                </div>
              }
            >
              <div class="profile-page__summary-row">
                <div class="profile-page__summary-column">
                  <div class="profile-page__dashboard-card">
                    <svg class="profile-page__account-icon" fill="currentColor" viewBox="0 0 448 512" aria-hidden="true">
                      <path d="M224 0c70.7 0 128 57.3 128 128s-57.3 128-128 128s-128-57.3-128-128S153.3 0 224 0zM209.1 359.2l-18.6-31c-6.4-10.7 1.3-24.2 13.7-24.2H224h19.7c12.4 0 20.1 13.6 13.7 24.2l-18.6 31 33.4 123.9 39.5-161.2c77.2 12 136.3 78.8 136.3 159.4c0 17-13.8 30.7-30.7 30.7H265.1 182.9 30.7C13.8 512 0 498.2 0 481.3c0-80.6 59.1-147.4 136.3-159.4l39.5 161.2 33.4-123.9z" />
                    </svg>
                    <p class="profile-page__message">{auth.user()?.email}</p>
                    <table class="profile-page__summary-table" aria-label="Profile summary">
                      <tbody>
                        <tr>
                          <th>{t('profile.username')}</th>
                          <td>{auth.user()?.username || currentHandle()}</td>
                        </tr>
                        <tr>
                          <th>{t('profile.totalTrades')}</th>
                          <td>{totalTrades()}</td>
                        </tr>
                        <tr>
                          <th>{t('profile.totalVolume')}</th>
                          <td>{format.number(tradedVolume(), 5)} BTC</td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="profile-page__message profile-page__message--compact">
                      <a class="profile-page__inline-link" href="/forgot-password">
                        {t('profile.requestPasswordChange')}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </Show>
          </Show>
        </div>
      </section>

      <Show when={auth.initialized() && auth.isAuthenticated()}>
        <section class="profile-page__history">
          <div class="profile-page__shell profile-page__indexcontainer">
            <h2 class="profile-page__history-title">{t('profile.completedTrades')}</h2>

            <Show when={swap.error()}>
              <div class="profile-page__feedback profile-page__feedback--error">{swap.error()}</div>
            </Show>

            <Show when={swap.historyLoading() && completedHistory().length === 0}>
              <div class="profile-page__feedback">{t('profile.loading')}</div>
            </Show>

            <button
              class="profile-page__download-link"
              disabled={swap.historyLoading() || completedHistory().length === 0}
              onClick={downloadHistory}
              type="button"
            >
              {swap.historyLoading() ? t('profile.downloadingHistory') : t('profile.downloadHistory')}
              <svg viewBox="0 0 512 512" aria-hidden="true">
                <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
              </svg>
            </button>

            <table class="profile-page__history-table" aria-label="Completed trades">
              <thead>
                <tr>
                  <th>{t('profile.created')}</th>
                  <th>{t('profile.amountSent')}</th>
                  <th>{t('profile.amountReceived')}</th>
                  <th>{t('profile.amountBtc')}</th>
                  <th>{t('profile.provider')}</th>
                  <th>{t('profile.assetarId')}</th>
                </tr>
              </thead>
              <tbody>
                <Show
                  when={completedHistory().length > 0}
                  fallback={
                    <tr>
                      <td class="profile-page__empty-row" colSpan={6}>
                        {swap.historyLoading() ? t('profile.loading') : t('profile.historyEmptyRow')}
                      </td>
                    </tr>
                  }
                >
                  <For each={completedHistory()}>
                    {item => {
                      const btcValue = btcValueForTrade(
                        item.amount,
                        item.from_currency,
                        item.actual_receive ?? item.estimated_receive,
                        item.to_currency,
                      );

                      return (
                        <tr>
                          <td>{formatDateTime(item.completed_at ?? item.created_at)}</td>
                          <td>{format.number(item.amount, 8)} {item.from_currency.toUpperCase()}</td>
                          <td>
                            {format.number(item.actual_receive ?? item.estimated_receive, 8)}{' '}
                            {item.to_currency.toUpperCase()}
                          </td>
                          <td>{btcValue === null ? '—' : `${format.number(btcValue, 8)} BTC`}</td>
                          <td>{item.provider}</td>
                          <td>
                            <a class="profile-page__table-link" href={`/swap/${item.id}`}>
                              {item.id}
                            </a>
                          </td>
                        </tr>
                      );
                    }}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>
        </section>
      </Show>

      <SiteFooter />
    </main>
  );
}
