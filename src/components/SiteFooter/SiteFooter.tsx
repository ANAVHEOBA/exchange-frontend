import "./SiteFooter.css";

const supportItems = [
  {
    label: "@AssetarSupportBot",
    href: "https://t.me/AssetarSupportBot",
  },
  {
    label: "support@assetar.app",
    href: "mailto:support@assetar.app",
  },
];

const contactItems = [
  {
    label: "mail@assetar.app",
    href: "mailto:mail@assetar.app",
  },
];

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Terms of Use" },
  { label: "Privacy Policy" },
  { label: "About", href: "/about" },
];

export default function SiteFooter() {
  return (
    <footer class="site-footer" id="contact">
      <div class="site-footer__inner">
        <div class="site-footer__brand">
          <a class="site-footer__brand-link" href="/">
            Assetar.app
          </a>
          <p class="site-footer__copyright">© Reta Development Assets LLC</p>
        </div>

        <div class="site-footer__column">
          <h3 class="site-footer__heading">Support:</h3>
          <div class="site-footer__items">
            {supportItems.map(item => (
              <a class="site-footer__item" href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div class="site-footer__column">
          <h3 class="site-footer__heading">Contact Us:</h3>
          <div class="site-footer__items">
            {contactItems.map(item =>
              item.href ? (
                <a class="site-footer__item" href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <span class="site-footer__item site-footer__item--muted">{item.label}</span>
              ),
            )}
          </div>
        </div>

        <nav class="site-footer__column site-footer__column--nav" aria-label="Footer">
          <div class="site-footer__items">
            {footerLinks.map(item =>
              item.href ? (
                <a class="site-footer__item" href={item.href}>
                  {item.label}
                </a>
              ) : (
                <span class="site-footer__item site-footer__item--muted">{item.label}</span>
              ),
            )}
          </div>
        </nav>
      </div>
    </footer>
  );
}
