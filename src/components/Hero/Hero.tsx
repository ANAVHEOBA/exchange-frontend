import "./Hero.css";
import SwapModal from "../SwapModal/SwapModal";

export default function Hero() {
  return (
    <section class="hero-container">
      <div class="hero-content">
        <h1 class="hero-title">
          Trade Cryptocurrency<br />
          <span class="hero-subtitle">Privately</span>
        </h1>
        <h2 class="hero-tagline">
          Fast<span class="dot">.</span> Safe<span class="dot">.</span> Easy<span class="dot">.</span>
        </h2>
      </div>
      <div class="swap-widget-wrapper">
        <SwapModal />
      </div>
    </section>
  );
}
