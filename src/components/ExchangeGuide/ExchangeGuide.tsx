import "./ExchangeGuide.css";

const highlights = [
  {
    eyebrow: "Simple and Reliable",
    title: "Best-rate routing without touching your funds.",
    description:
      "At no extra cost, we find the best rates and redirect your order to known and reliable instant exchanges. We do not interfere with your transaction, and we never have access to your funds.",
    points: ["No custody", "Known exchange partners", "Support when a transaction needs help"],
  },
  {
    eyebrow: "Amazing Crypto Tools",
    title: "A wider crypto toolkit in one place.",
    description:
      "Swap into your preferred assets, handle crypto payments, or use connected services like prepaid cards and gift cards without bouncing between separate products.",
    points: ["Swaps", "Payments", "Prepaid and gift card flows"],
  },
];

const steps = [
  {
    number: "01",
    title: "Build your route",
    description:
      "Choose standard swap or payment mode, select the two assets, enter the amount, and start the exchange. The platform checks the market and gathers live quotes for you.",
  },
  {
    number: "02",
    title: "Pick the rate",
    description:
      "Compare the available options, choose your preferred rate, then enter the wallet address where you want to receive funds. For multi-network coins, confirm the correct network before continuing.",
  },
  {
    number: "03",
    title: "Send and track",
    description:
      "We generate the deposit address and exact amount to send. Complete the transfer from your wallet, then follow the status on the same screen until the destination crypto arrives.",
  },
];

export default function ExchangeGuide() {
  return (
    <section class="exchange-guide" id="how-it-works">
      <div class="exchange-guide__intro">
        <div class="exchange-guide__kicker">How It Works</div>
        <h2 class="exchange-guide__title">Simple routes. Reliable partners. Clear next steps.</h2>
        <p class="exchange-guide__summary">
          The section below explains the trust model, the extra tools around swaps, and the exact three-step flow a user follows from quote discovery to final delivery.
        </p>
      </div>

      <div class="exchange-guide__highlights">
        {highlights.map(highlight => (
          <article class="exchange-guide__card">
            <p class="exchange-guide__card-kicker">{highlight.eyebrow}</p>
            <h3 class="exchange-guide__card-title">{highlight.title}</h3>
            <p class="exchange-guide__card-copy">{highlight.description}</p>

            <div class="exchange-guide__chip-row" aria-label={`${highlight.eyebrow} highlights`}>
              {highlight.points.map(point => (
                <span class="exchange-guide__chip">{point}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div class="exchange-guide__steps-header">
        <div>
          <p class="exchange-guide__steps-kicker">Swap In 3 Simple Steps</p>
          <h3 class="exchange-guide__steps-title">From quote to payout without the guesswork.</h3>
        </div>

        <a class="exchange-guide__cta" href="#swap">
          Start exchange
        </a>
      </div>

      <div class="exchange-guide__steps">
        {steps.map(step => (
          <article class="exchange-guide__step">
            <span class="exchange-guide__step-number">{step.number}</span>
            <h4 class="exchange-guide__step-title">{step.title}</h4>
            <p class="exchange-guide__step-copy">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
