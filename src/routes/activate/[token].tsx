import { Title } from "@solidjs/meta";
import { A, useParams } from "@solidjs/router";
import { Match, Switch, createSignal, onMount } from "solid-js";
import Header from "../../components/Header/Header";
import SiteFooter from "../../components/SiteFooter/SiteFooter";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/locale";
import "../../components/AccountAccess/AccountAccess.css";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Verification failed.";
};

export default function ActivatePage() {
  const auth = useAuth();
  const { t } = useLocale();
  const params = useParams<{ token: string }>();
  const [loading, setLoading] = createSignal(true);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const runVerification = async () => {
    const token = params.token?.trim();

    setLoading(true);
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Missing verification token.");
      setLoading(false);
      return;
    }

    try {
      const response = await auth.verifyEmail(token);
      setMessage(response.message ?? t("account.activationSuccessTitle"));
    } catch (verificationError) {
      setError(getErrorMessage(verificationError));
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    void runVerification();
  });

  return (
    <main style={{ "min-height": "100vh" }}>
      <Title>{`${t("account.activationPageTitle")} | ASSETAR`}</Title>
      <Header />

      <section class="account-access">
        <div class="account-access__inner">
          <div class="account-access__copy">
            <h1 class="account-access__title">{t("account.activationTitle")}</h1>
            <p class="account-access__lead">{t("account.activationLead")}</p>
          </div>

          <aside class="account-access__card">
            <div class="account-access__card-kicker">{t("account.cardKicker")}</div>

            <Switch>
              <Match when={loading()}>
                <h2 class="account-access__card-title">{t("account.activationTitle")}</h2>
                <div class="account-access__status account-access__status--success">
                  {t("account.activationChecking")}
                </div>
              </Match>

              <Match when={error()}>
                <h2 class="account-access__card-title">{t("account.activationErrorTitle")}</h2>
                <div class="account-access__status account-access__status--error">
                  {error()}
                </div>
                <div class="account-access__session-actions">
                  <button
                    class="account-access__session-button"
                    disabled={loading()}
                    onClick={() => {
                      void runVerification();
                    }}
                    type="button"
                  >
                    {t("account.activationRetry")}
                  </button>
                  <A class="account-access__session-link" href="/login">
                    {t("account.activationBackToLogin")}
                  </A>
                </div>
              </Match>

              <Match when={message()}>
                <h2 class="account-access__card-title">{t("account.activationSuccessTitle")}</h2>
                <div class="account-access__status account-access__status--success">
                  {message()}
                </div>
                <div class="account-access__session-actions">
                  <A class="account-access__session-link" href="/login">
                    {t("account.activationBackToLogin")}
                  </A>
                  <A class="account-access__session-button" href="/#swap">
                    {t("account.returnToExchange")}
                  </A>
                </div>
              </Match>
            </Switch>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
