import { Match, Show, Switch, createSignal, onMount } from "solid-js";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/locale";
import "./AccountAccess.css";

type AuthMode = "login" | "register";

const DELETE_HISTORY_EMAIL = "mail@assetar.app";

export default function AccountAccess() {
  const auth = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = createSignal<AuthMode>("login");
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

  const [loginEmail, setLoginEmail] = createSignal("");
  const [loginPassword, setLoginPassword] = createSignal("");

  const [registerUsername, setRegisterUsername] = createSignal("");
  const [registerEmail, setRegisterEmail] = createSignal("");
  const [registerPassword, setRegisterPassword] = createSignal("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = createSignal("");

  onMount(() => {
    setMode("login");
    setSuccessMessage(null);
    auth.clearError();
  });

  const profileHref = () => {
    const username = auth.user()?.username?.trim();
    return username ? `/profile/${encodeURIComponent(username)}` : "/login";
  };

  const accountName = () =>
    auth.user()?.username?.trim() ||
    auth.user()?.email?.split("@")[0] ||
    t("account.yourAccount");

  const switchMode = (nextMode: AuthMode) => {
    if (mode() === nextMode) {
      return;
    }

    setMode(nextMode);
    setSuccessMessage(null);
    auth.clearError();
  };

  const handleLogin = async (event: Event) => {
    event.preventDefault();
    setSuccessMessage(null);

    try {
      await auth.login({
        email: loginEmail().trim(),
        password: loginPassword(),
      });
    } catch {
      // Store exposes the current auth error state.
    }
  };

  const handleRegister = async (event: Event) => {
    event.preventDefault();
    setSuccessMessage(null);

    try {
      await auth.register({
        username: registerUsername().trim(),
        email: registerEmail().trim(),
        password: registerPassword(),
        password_confirm: registerPasswordConfirm(),
      });

      setSuccessMessage(t("account.created"));
      setMode("login");
      setLoginEmail(registerEmail().trim());
      setLoginPassword("");
      auth.clearError();
    } catch {
      // Store exposes the current auth error state.
    }
  };

  const handleResendVerification = async () => {
    if (!loginEmail().trim()) {
      return;
    }

    setSuccessMessage(null);
    auth.clearError();

    try {
      await auth.requestVerification({ email: loginEmail().trim() });
      setSuccessMessage(t("account.verificationSent"));
    } catch {
      // Store exposes the current auth error state.
    }
  };

  const showResendVerification = () =>
    mode() === "login" &&
    Boolean(loginEmail().trim()) &&
    (auth.error()?.toLowerCase().includes("verify your email") ?? false);

  return (
    <section class="account-access">
      <div class="account-access__inner">
        <div class="account-access__copy">
          <h1 class="account-access__title">{t("account.title")}</h1>
          <p class="account-access__lead">{t("account.lead")}</p>
          <p class="account-access__text">
            {t("account.descriptionStart")}{" "}
            <a href={`mailto:${DELETE_HISTORY_EMAIL}`}>{DELETE_HISTORY_EMAIL}</a>.
          </p>
        </div>

        <aside class="account-access__card">
          <Show
            when={auth.initialized()}
            fallback={
              <>
                <div class="account-access__card-kicker">{t("account.cardKicker")}</div>
                <h2 class="account-access__card-title">{t("account.loginTitle")}</h2>
                <div class="account-access__status account-access__status--success">
                  {t("account.restoringSession")}
                </div>
              </>
            }
          >
            <Show
              when={auth.isAuthenticated()}
              fallback={
                <>
                  <div class="account-access__card-kicker">{t("account.cardKicker")}</div>
                  <h2 class="account-access__card-title">
                    {mode() === "login" ? t("account.loginTitle") : t("account.signUpTitle")}
                  </h2>

                  <Show when={successMessage()}>
                    <div class="account-access__status account-access__status--success">
                      {successMessage()}
                    </div>
                  </Show>

                  <Show when={auth.error()}>
                    <div class="account-access__status account-access__status--error">
                      {auth.error()}
                    </div>
                  </Show>

                  <Show when={showResendVerification()}>
                    <button
                      class="account-access__link"
                      disabled={auth.loading() || !loginEmail().trim()}
                      onClick={() => {
                        void handleResendVerification();
                      }}
                      type="button"
                    >
                      {auth.loading()
                        ? t("account.resendingVerification")
                        : t("account.resendVerification")}
                    </button>
                  </Show>

                  <Switch>
                    <Match when={mode() === "login"}>
                      <form class="account-access__form" onSubmit={handleLogin}>
                        <label class="account-access__field">
                          <span class="account-access__field-label">{t("account.email")}</span>
                          <input
                            class="account-access__input"
                            type="email"
                            autocomplete="email"
                            value={loginEmail()}
                            onInput={event => setLoginEmail(event.currentTarget.value)}
                            placeholder={t("account.enterEmail")}
                            required
                          />
                        </label>

                        <label class="account-access__field">
                          <span class="account-access__field-label">{t("account.password")}</span>
                          <input
                            class="account-access__input"
                            type="password"
                            autocomplete="current-password"
                            value={loginPassword()}
                            onInput={event => setLoginPassword(event.currentTarget.value)}
                            placeholder={t("account.enterPassword")}
                            required
                          />
                        </label>

                        <button
                          class="account-access__submit"
                          disabled={auth.loading()}
                          type="submit"
                        >
                          {auth.loading() ? t("account.entering") : t("account.enter")}
                        </button>

                        <button
                          class="account-access__link"
                          onClick={() => switchMode("register")}
                          type="button"
                        >
                          {t("account.notRegistered")}
                        </button>
                      </form>
                    </Match>

                    <Match when={mode() === "register"}>
                      <form class="account-access__form" onSubmit={handleRegister}>
                        <label class="account-access__field">
                          <span class="account-access__field-label">{t("account.username")}</span>
                          <input
                            class="account-access__input"
                            type="text"
                            autocomplete="username"
                            value={registerUsername()}
                            onInput={event => setRegisterUsername(event.currentTarget.value)}
                            placeholder={t("account.chooseUsername")}
                            required
                          />
                        </label>

                        <label class="account-access__field">
                          <span class="account-access__field-label">{t("account.email")}</span>
                          <input
                            class="account-access__input"
                            type="email"
                            autocomplete="email"
                            value={registerEmail()}
                            onInput={event => setRegisterEmail(event.currentTarget.value)}
                            placeholder={t("account.enterEmail")}
                            required
                          />
                        </label>

                        <label class="account-access__field">
                          <span class="account-access__field-label">{t("account.password")}</span>
                          <input
                            class="account-access__input"
                            type="password"
                            autocomplete="new-password"
                            value={registerPassword()}
                            onInput={event => setRegisterPassword(event.currentTarget.value)}
                            placeholder={t("account.createPassword")}
                            required
                          />
                        </label>

                        <label class="account-access__field">
                          <span class="account-access__field-label">{t("account.confirmPassword")}</span>
                          <input
                            class="account-access__input"
                            type="password"
                            autocomplete="new-password"
                            value={registerPasswordConfirm()}
                            onInput={event => setRegisterPasswordConfirm(event.currentTarget.value)}
                            placeholder={t("account.repeatPassword")}
                            required
                          />
                        </label>

                        <button
                          class="account-access__submit"
                          disabled={auth.loading()}
                          type="submit"
                        >
                          {auth.loading() ? t("account.creating") : t("account.signUp")}
                        </button>

                        <button
                          class="account-access__link"
                          onClick={() => switchMode("login")}
                          type="button"
                        >
                          {t("account.alreadyRegistered")}
                        </button>
                      </form>
                    </Match>
                  </Switch>
                </>
              }
            >
              <div class="account-access__session">
                <div class="account-access__card-kicker">{t("account.cardKicker")}</div>
                <div class="account-access__session-title">{t("account.welcomeBack")}</div>
                <p class="account-access__session-copy">
                  {t("account.signedInAs")} <strong>{accountName()}</strong>.
                </p>

                <div class="account-access__session-actions">
                  <a class="account-access__session-link" href={profileHref()}>
                    {t("account.viewProfile")}
                  </a>
                  <a class="account-access__session-link" href="/#swap">
                    {t("account.returnToExchange")}
                  </a>
                  <button
                    class="account-access__session-button"
                    disabled={auth.loading()}
                    onClick={() => {
                      void auth.logout();
                    }}
                    type="button"
                  >
                    {auth.loading() ? t("account.loggingOut") : t("account.logout")}
                  </button>
                </div>
              </div>
            </Show>
          </Show>
        </aside>
      </div>
    </section>
  );
}
