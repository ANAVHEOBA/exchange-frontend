import { Title } from "@solidjs/meta";
import AccountAccess from "../components/AccountAccess/AccountAccess";
import Header from "../components/Header/Header";
import SiteFooter from "../components/SiteFooter/SiteFooter";

export default function LoginPage() {
  return (
    <main style={{ 'min-height': '100vh' }}>
      <Title>Login | ASSETAR</Title>
      <Header />
      <AccountAccess />
      <SiteFooter />
    </main>
  );
}
