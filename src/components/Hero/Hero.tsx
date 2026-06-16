import "./Hero.css";
import { useLocale } from "../../i18n/locale";
import SwapModal from "../SwapModal/SwapModal";

export default function Hero() {
  const { t } = useLocale();

  return (
    <section class="hero-shell" id="swap">
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">
            {t('hero.titleLead')}
            <br />
            <span class="hero-subtitle">{t('hero.titleAccent')}</span>
          </h1>
          <p class="hero-description">{t('hero.description')}</p>
        </div>

        <div class="swap-widget-wrapper">
          <SwapModal />
        </div>
      </div>
    </section>
  );
}
