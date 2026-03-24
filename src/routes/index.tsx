import { Title } from "@solidjs/meta";
import ExchangeGuide from "../components/ExchangeGuide/ExchangeGuide";
import FaqSection from "../components/FaqSection/FaqSection";
import Header from "../components/Header/Header";
import Hero from "../components/Hero/Hero";
import PartnersWall from "../components/PartnersWall/PartnersWall";
import SiteFooter from "../components/SiteFooter/SiteFooter";

export default function Home() {
  return (
    <main style={{ 'min-height': '100vh' }}>
      <Title>ASSETAR</Title>
      <Header />
      <Hero />
      <ExchangeGuide />
      <FaqSection />
      <PartnersWall />
      <SiteFooter />
    </main>
  );
}
