import { For } from "solid-js";
import "./FaqSection.css";

interface FaqItem {
  question: string;
  paragraphs: string[];
  bullets?: string[];
}

const faqItems: FaqItem[] = [
  {
    question: "How does Assetar work?",
    paragraphs: [
      "When you fill in a transaction, we search the best available rates across partner exchanges so you can choose the offer that fits you best and swap directly with that provider. That removes the need to open an account on a centralized exchange just to make a single conversion.",
      "You send the chosen amount to the deposit address provided by the selected exchange, the trade is processed, and the destination coin is delivered straight to the wallet address you entered. It is designed to be faster and safer than managing multiple exchange accounts yourself.",
      "We also monitor rate reliability, transaction delays, maintenance windows, and server problems at partner exchanges to keep routing smoother and reduce abuse. If something goes wrong, support can step in and help investigate.",
      "Assetar provides the software layer that lets users compare exchanges and trade directly with them. We never receive, hold, or transfer the funds between the parties.",
    ],
  },
  {
    question: "Why trust us?",
    paragraphs: [
      "The service is designed around minimal data exposure. Logs are only kept when a partner exchange requires them, and each provider's policy is surfaced before a transaction is created.",
      "Logs stored by Assetar are not sold or shared with third parties and are only provided individually when law enforcement makes a valid request.",
      "JavaScript is used to improve usability, like selectors and interaction states, not to fingerprint or track users. For most features the site can still be used without JavaScript if that is your preference.",
      "Orders are only redirected to known and reliable instant exchanges. Those providers receive the deposit, execute the trade, and send funds directly to the destination address you chose. We never take custody of your coins during the process.",
    ],
  },
  {
    question: "What is the Assetar Guarantee?",
    paragraphs: [
      "Transactions created through the website are covered by the Assetar Guarantee. If a user does not receive funds and the selected exchange cannot provide sufficient proof of unusually high AML risk or a liquidity-provider AML block, Assetar reimburses up to the insured amount shown for that route.",
      "Coverage varies by exchange and can be checked through the shield indicator shown beside each exchange option. Trades with exchanges rated D are not covered. Trades blocked because of clearly high AML risk or mixer-related funds are also excluded.",
      "To request compensation, contact support by email or Telegram and include the transaction ID. Support will first try to resolve the issue with the selected exchange before reimbursement is considered.",
      "The resolution process may take a week or longer because the exchange is given time to provide evidence or complete its investigation.",
    ],
    bullets: [
      "The guarantee does not cover funds blocked because of proven AML issues.",
      "The refund process can take a week or longer while the case is reviewed with the partner exchange.",
    ],
  },
  {
    question: "What are the Swap Modes?",
    paragraphs: [
      "Standard Mode is the regular swap flow. You enter the amount you plan to send, choose the asset you want to receive, and compare the best floating and fixed rates from partner exchanges.",
      "Payment Mode is built for invoice-style payments. Instead of choosing the amount you will send, you choose the exact amount that must be received and then select which coin you want to pay with. This mode focuses on fixed-rate providers that support payout precision.",
      "The Buy/Sell tab is used for fiat on-ramp and off-ramp flows. It can have fewer crypto options available than swap mode, but users can sometimes bridge through a more common asset if they need to reach a less common coin.",
    ],
  },
  {
    question: "How does the Fiat Gateway (Buy/Sell) work?",
    paragraphs: [
      "In the Fiat Gateway Aggregator you choose the crypto to buy or sell, the fiat currency you want to use, and the amount to trade. The platform compares rates from partner providers and lets you pick the one you prefer.",
      "Depending on currency and provider, payment methods can include card payments, bank transfer, Google Pay, Apple Pay, UPI, IMPS, GCash, PayMaya, GrabPay, and others.",
      "To complete the trade you are redirected to the partner website, which may require JavaScript. Each provider sets its own KYC and verification policy, so users should review those terms before continuing.",
      "Assetar does not control partner KYC requirements and never has access to the fiat or crypto being transferred. The service only makes the referral and comparison layer available.",
    ],
  },
  {
    question: "How long does it take to complete a transaction?",
    paragraphs: [
      "Most swaps are completed in about 5 to 60 minutes. The actual time depends mainly on network congestion, blockchain confirmation speed, and the response time of the chosen exchange.",
      "Assets with slower confirmations naturally take longer, while faster networks usually finish sooner.",
      "An approximate ETA is shown during exchange selection based on recent provider history, which helps users choose between faster and slower routes.",
    ],
  },
  {
    question: "What fees are included in the rates shown?",
    paragraphs: [
      "The quoted rates already include network transaction fees and exchange fees. There is no extra charge added on top for using the aggregator instead of going directly to the selected exchange.",
      "Larger transactions often produce better effective rates because fixed network fees are spread across a bigger amount.",
      "The platform does receive a commission for referrals, but that comes out of the exchange fee and does not change the quoted rate shown to the user.",
      "Floating-rate offers shown on the exchange selection screen can be adjusted to better reflect expected final payout using each exchange's recent execution history. The status screen later shows the actual rate reported by the exchange.",
    ],
  },
  {
    question: "Is it really private? Isn't KYC required?",
    paragraphs: [
      "Each exchange has its own KYC and AML policy. A provider can halt a transaction and request verification before completing it, especially if the deposit triggers a risk review.",
      "Partner exchanges perform due diligence on incoming funds. Users are warned not to send funds with very high AML risk or funds associated with mixers or illegal activity, because those routes are likely to be refused.",
      "To make comparison easier, the platform assigns a simple KYC and AML rating to each exchange based on policies, direct provider answers, refund handling, and past history on Assetar.",
      "Some exchanges also require logs like IP, user agent, or accept-language to be retained at Assetar. Those requirements are disclosed on the exchange screen before a trade is created.",
    ],
    bullets: [
      "A: Uses its own liquidity and is privacy-friendly.",
      "B: Refunds most transactions that fail AML checks, except in rare legal-order or stolen-funds cases.",
      "C: Usually refunds failed AML checks, but liquidity-provider reviews may still require KYC or source-of-funds verification.",
      "D: Blocks failed AML checks until KYC or source-of-funds verification is passed.",
    ],
  },
  {
    question: "Why do only a few exchanges appear as options for my trade?",
    paragraphs: [
      "Some exchanges support very small trades, but many set higher minimums because network fees can destroy the economics of tiny swaps. If you are only checking rates, use an amount close to the one you actually plan to trade.",
      "Availability can also narrow when swapping directly between two less common assets. In those cases, routing through a more liquid intermediary coin can open up more provider options.",
    ],
  },
  {
    question: "What's the difference between Floating and Fixed Rate?",
    paragraphs: [
      "A floating rate is an estimate. After the exchange confirms your deposit, it recalculates the trade based on live market conditions. If the market has moved materially, some providers may ask whether you want to continue at the new rate or request a refund.",
      "Floating rates are usually better for regular conversions where you already know the amount you want to send. They tend to be more competitive than fixed rates.",
      "Fixed rates are more useful when the payout amount must be exact, such as paying an invoice. You lock in the amount of the sending coin required to receive a specific amount of the destination coin.",
      "Even fixed-rate quotes can still be refunded if the market moves too far before the provider can confirm the transaction. It is best to have the wallet ready before confirming so the quote does not expire.",
    ],
  },
  {
    question: "What happens if I send the wrong amount to the address provided?",
    paragraphs: [
      "It depends on the exchange. Some providers accept slightly different amounts and complete the trade proportionally. Others may halt the transaction or fail to detect the deposit cleanly.",
      "Users should always send the exact amount shown on the status page to avoid refund delays or support intervention. The status view can also indicate whether the selected provider requires exact amounts.",
    ],
  },
  {
    question: "My transaction has failed and I haven't got my funds back. What do I do now?",
    paragraphs: [
      "If a transaction fails and the refund has not arrived, contact support using the channels listed by the service and include the transaction details shown on the status page.",
      "You can also contact the selected exchange directly if you prefer, but support can step in to help review the case and push for a resolution when needed.",
    ],
  },
];

export default function FaqSection() {
  return (
    <section class="faq-section" id="faq">
      <div class="faq-section__intro">
        <p class="faq-section__eyebrow">F.A.Q.</p>
        <h2 class="faq-section__title">Clear answers before you commit to a route.</h2>
        <p class="faq-section__summary">
          Below are the most common questions about how the service works, what is covered, how privacy and KYC are handled, and what to expect if a transaction needs help.
        </p>

        <div class="faq-section__support-card">
          <p class="faq-section__support-kicker">Need help?</p>
          <p class="faq-section__support-copy">
            If your question is not covered here, reach out to support with the transaction ID and the team can review the case directly.
          </p>
        </div>
      </div>

      <div class="faq-section__list">
        <For each={faqItems}>
          {(item, index) => (
            <details class="faq-item" open={index() === 0}>
              <summary class="faq-item__summary">
                <span class="faq-item__question">{item.question}</span>
                <span class="faq-item__icon" aria-hidden="true" />
              </summary>

              <div class="faq-item__body">
                <For each={item.paragraphs}>
                  {paragraph => <p class="faq-item__copy">{paragraph}</p>}
                </For>

                {item.bullets ? (
                  <ul class="faq-item__bullets">
                    <For each={item.bullets}>
                      {bullet => <li class="faq-item__bullet">{bullet}</li>}
                    </For>
                  </ul>
                ) : null}
              </div>
            </details>
          )}
        </For>
      </div>
    </section>
  );
}
