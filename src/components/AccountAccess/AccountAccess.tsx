import { Match, Show, Switch, createSignal, onMount } from "solid-js";
import { useAuth } from "../../hooks/useAuth";
import "./AccountAccess.css";

type AuthMode = "login" | "register";

const DELETE_HISTORY_EMAIL = "mail@assetar.app";

export default function AccountAccess() {
  const auth = useAuth();
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

    void auth.initialize().catch(() => {
      // Auth store already captures initialization errors.
    });
  });

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

      setSuccessMessage("Account created. Log in to continue.");
      setMode("login");
      setLoginEmail(registerEmail().trim());
      setLoginPassword("");
      auth.clearError();
    } catch {
      // Store exposes the current auth error state.
    }
  };

  return (
    <section class="account-access">
      <div class="account-access__inner">
        <div class="account-access__copy">
          <h1 class="account-access__title">Account Login</h1>
          <p class="account-access__lead">Register and log in to keep track of your trades</p>
          <p class="account-access__text">
            Just create your user account and you can see a list of all your swaps on your profile
            page. You can permanently delete your user and trade history at any time by sending an
            email to <a href={`mailto:${DELETE_HISTORY_EMAIL}`}>{DELETE_HISTORY_EMAIL}</a>.
          </p>
        </div>

        <aside class="account-access__card">
          <Show
            when={auth.isAuthenticated()}
            fallback={
              <>
                <div class="account-access__card-kicker">Account</div>
                <h2 class="account-access__card-title">
                  {mode() === "login" ? "Log In" : "Sign Up"}
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

                <Switch>
                  <Match when={mode() === "login"}>
                    <form class="account-access__form" onSubmit={handleLogin}>
                      <label class="account-access__field">
                        <span class="account-access__field-label">Email</span>
                        <input
                          class="account-access__input"
                          type="email"
                          autocomplete="email"
                          value={loginEmail()}
                          onInput={event => setLoginEmail(event.currentTarget.value)}
                          placeholder="Enter your email"
                          required
                        />
                      </label>

                      <label class="account-access__field">
                        <span class="account-access__field-label">Password</span>
                        <input
                          class="account-access__input"
                          type="password"
                          autocomplete="current-password"
                          value={loginPassword()}
                          onInput={event => setLoginPassword(event.currentTarget.value)}
                          placeholder="Enter your password"
                          required
                        />
                      </label>

                      <button
                        class="account-access__submit"
                        disabled={auth.loading()}
                        type="submit"
                      >
                        {auth.loading() ? "Entering..." : "Enter"}
                      </button>

                      <button
                        class="account-access__link"
                        onClick={() => switchMode("register")}
                        type="button"
                      >
                        Not registered? Sign Up.
                      </button>
                    </form>
                  </Match>

                  <Match when={mode() === "register"}>
                    <form class="account-access__form" onSubmit={handleRegister}>
                      <label class="account-access__field">
                        <span class="account-access__field-label">Username</span>
                        <input
                          class="account-access__input"
                          type="text"
                          autocomplete="username"
                          value={registerUsername()}
                          onInput={event => setRegisterUsername(event.currentTarget.value)}
                          placeholder="Choose a username"
                          required
                        />
                      </label>

                      <label class="account-access__field">
                        <span class="account-access__field-label">Email</span>
                        <input
                          class="account-access__input"
                          type="email"
                          autocomplete="email"
                          value={registerEmail()}
                          onInput={event => setRegisterEmail(event.currentTarget.value)}
                          placeholder="Enter your email"
                          required
                        />
                      </label>

                      <label class="account-access__field">
                        <span class="account-access__field-label">Password</span>
                        <input
                          class="account-access__input"
                          type="password"
                          autocomplete="new-password"
                          value={registerPassword()}
                          onInput={event => setRegisterPassword(event.currentTarget.value)}
                          placeholder="Create a password"
                          required
                        />
                      </label>

                      <label class="account-access__field">
                        <span class="account-access__field-label">Confirm Password</span>
                        <input
                          class="account-access__input"
                          type="password"
                          autocomplete="new-password"
                          value={registerPasswordConfirm()}
                          onInput={event => setRegisterPasswordConfirm(event.currentTarget.value)}
                          placeholder="Repeat your password"
                          required
                        />
                      </label>

                      <button
                        class="account-access__submit"
                        disabled={auth.loading()}
                        type="submit"
                      >
                        {auth.loading() ? "Creating..." : "Sign Up"}
                      </button>

                      <button
                        class="account-access__link"
                        onClick={() => switchMode("login")}
                        type="button"
                      >
                        Already registered? Login.
                      </button>
                    </form>
                  </Match>
                </Switch>
              </>
            }
          >
            <div class="account-access__session">
              <div class="account-access__card-kicker">Account</div>
              <div class="account-access__session-title">You are already logged in.</div>
              <p class="account-access__session-copy">
                Signed in as{" "}
                <strong>{auth.user()?.email ?? auth.user()?.username ?? "your account"}</strong>.
              </p>

              <div class="account-access__session-actions">
                <a class="account-access__session-link" href="/#swap">
                  Return to exchange
                </a>
                <button
                  class="account-access__session-button"
                  disabled={auth.loading()}
                  onClick={() => {
                    void auth.logout();
                  }}
                  type="button"
                >
                  {auth.loading() ? "Logging Out..." : "Logout"}
                </button>
              </div>
            </div>
          </Show>
        </aside>
      </div>
    </section>
  );
}
