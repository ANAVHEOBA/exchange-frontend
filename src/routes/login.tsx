import { Title } from "@solidjs/meta";
import AccountAccess from "../components/AccountAccess/AccountAccess";
import Header from "../components/Header/Header";
import SiteFooter from "../components/SiteFooter/SiteFooter";
import { useLocale } from "../i18n/locale";

export default function LoginPage() {
  const { t } = useLocale();

  return (
    <main style={{ 'min-height': '100vh' }}>
      <Title>{`${t('account.pageTitle')} | ASSETAR`}</Title>
      <Header />
      <AccountAccess />
      <SiteFooter />
    </main>
  );
}
