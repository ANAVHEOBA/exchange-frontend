import { createSignal } from "solid-js";
import { useLocale } from "../../i18n/locale";
import "./PartnersWall.css";

const partnerFiles = [
  "Alfacash_square.png",
  "BitcoinVN_square.webp",
  "Cake_square.png",
  "Changee_square.jpg",
  "Changehero_square.png",
  "Changenow_square.png",
  "CoinCards.png",
  "CoinCraddle_square.jpg",
  "CoinsDo_square.png",
  "CryptoPower_square.png",
  "EasyBit_square.jpg",
  "ETHLatam.jpg",
  "ETZ_square.jpg",
  "Exolix_square.jpg",
  "Explace_square.jpg",
  "ExWell_square.webp",
  "FixedFloat_square.svg",
  "Godex_square.png",
  "Goexme_square.webp",
  "Intersend.jpg",
  "LetsExchange_square.png",
  "Monerocom_square.webp",
  "Monerokon_square2.png",
  "Monerotopia.webp",
  "MtPelerin_square.png",
  "Pegasusswap_square.jpg",
  "Quickex_square.webp",
  "Revuo_Monero_Square.jpg",
  "Shaman_square.jpg",
  "Simpleswap_square.png",
  "Stack_square.png",
  "StealthEX_square.png",
  "Swapgate_square.png",
  "Swapter_square.png",
  "Swaptrade_square.webp",
  "Swapuz_square.png",
  "VostoEmisio.jpg",
  "WAML.jpg",
  "WizardSwap_square.jpg",
  "XChange_square.png",
  "XGram_square.jpg",
];

const formatPartnerName = (fileName: string) => {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/_square2?/gi, "")
    .replace(/_square/gi, "")
    .replace(/_Square/gi, "")
    .replace(/_/g, " ")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
};

export default function PartnersWall() {
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = createSignal(false);

  return (
    <section class="partners-wall" id="partners">
      <div class="partners-wall__inner">
        <div class="partners-wall__intro">
          <p class="partners-wall__eyebrow">{t("partners.eyebrow")}</p>
          <h2 class="partners-wall__title">{t("partners.title")}</h2>
          <p class="partners-wall__summary">{t("partners.summary")}</p>
        </div>

        <div class="partners-wall__panel">
          <div class="partners-wall__panel-header">
            <h3 class="partners-wall__panel-title">{t("partners.panelTitle")}</h3>
            <p class="partners-wall__panel-copy">{partnerFiles.length} {t("partners.panelCopy")}</p>
          </div>

          <button
            type="button"
            class="partners-wall__mobile-toggle"
            aria-expanded={mobileOpen()}
            aria-controls="partners-wall-grid"
            onClick={() => setMobileOpen(open => !open)}
          >
            <span>{t("partners.browse")}</span>
            <span
              class="partners-wall__mobile-toggle-chevron"
              classList={{ "partners-wall__mobile-toggle-chevron--open": mobileOpen() }}
              aria-hidden="true"
            >
              ˅
            </span>
          </button>

          <div
            id="partners-wall-grid"
            class="partners-wall__grid"
            classList={{ "partners-wall__grid--mobile-open": mobileOpen() }}
          >
            {partnerFiles.map(fileName => (
              <div class="partners-wall__tile">
                <img
                  class="partners-wall__logo"
                  src={`/partners/${fileName}`}
                  alt={formatPartnerName(fileName)}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
