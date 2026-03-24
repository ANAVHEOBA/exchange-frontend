import "./Hero.css";
import SwapModal from "../SwapModal/SwapModal";

export default function Hero() {
  return (
    <section class="hero-shell" id="swap">
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">
            Swap any volume.
            <br />
            <span class="hero-subtitle">Be private.</span>
          </h1>
          <p class="hero-description">
            Unleash Crypto Freedom: Limitless, Trustworthy, and Sign-Up Free
          </p>
        </div>

        <div class="swap-widget-wrapper">
          <SwapModal />
        </div>
      </div>
    </section>
  );
}
