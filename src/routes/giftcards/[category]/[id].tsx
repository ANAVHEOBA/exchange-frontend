import { Title } from '@solidjs/meta';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { createMemo, onMount } from 'solid-js';
import Header from '../../../components/Header/Header';
import SiteFooter from '../../../components/SiteFooter/SiteFooter';
import { DEFAULT_CATEGORY, resolveCountryCode } from '../../../config/giftcards';
import { useLocale } from '../../../i18n/locale';
import '../../giftcards.css';

const readSearchParam = (value?: string | string[]): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

export default function GiftCardProductRedirectPage() {
  const params = useParams<{ category: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLocale();

  const destination = createMemo(() => {
    const country = resolveCountryCode(readSearchParam(searchParams.country));
    const category =
      decodeURIComponent(params.category ?? DEFAULT_CATEGORY).trim() || DEFAULT_CATEGORY;
    const productId = decodeURIComponent(params.id ?? '').trim();
    const query = new URLSearchParams({
      country,
      product: productId,
    });

    if (category !== DEFAULT_CATEGORY) {
      query.set('category', category);
    }

    return `/giftcards/?${query.toString()}`;
  });

  onMount(() => {
    void navigate(destination(), { replace: true });
  });

  return (
    <main class="giftcard-product-page">
      <Title>{`${t('giftcards.pageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="giftcard-product-page__section">
        <div class="giftcard-product-page__shell">
          <div class="giftcard-product-page__feedback">{t('giftcards.loading')}</div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
