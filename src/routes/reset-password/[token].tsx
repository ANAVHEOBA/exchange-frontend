import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { authApi } from '../../api/endpoints/auth';
import Header from '../../components/Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useLocale } from '../../i18n/locale';
import '../profile/profile.css';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message ?? 'Unknown error');
  }

  return 'Unknown error';
};

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const { t } = useLocale();
  const [password, setPassword] = createSignal('');
  const [passwordConfirm, setPasswordConfirm] = createSignal('');
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [submitting, setSubmitting] = createSignal(false);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await authApi.resetPassword({
        token: decodeURIComponent(params.token ?? ''),
        password: password(),
        password_confirm: passwordConfirm(),
      });
      setMessage(response.message);
      setPassword('');
      setPasswordConfirm('');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main class="profile-page">
      <Title>{`${t('account.resetPasswordPageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="profile-page__hero pagecontent" id="hero">
        <div class="profile-page__shell profile-page__indexcontainer">
          <div class="profile-page__summary-row">
            <div class="profile-page__summary-column">
              <div class="profile-page__dashboard-card">
                <svg class="profile-page__account-icon" fill="currentColor" viewBox="0 0 448 512" aria-hidden="true">
                  <path d="M224 0c70.7 0 128 57.3 128 128s-57.3 128-128 128s-128-57.3-128-128S153.3 0 224 0zM209.1 359.2l-18.6-31c-6.4-10.7 1.3-24.2 13.7-24.2H224h19.7c12.4 0 20.1 13.6 13.7 24.2l-18.6 31 33.4 123.9 39.5-161.2c77.2 12 136.3 78.8 136.3 159.4c0 17-13.8 30.7-30.7 30.7H265.1 182.9 30.7C13.8 512 0 498.2 0 481.3c0-80.6 59.1-147.4 136.3-159.4l39.5 161.2 33.4-123.9z" />
                </svg>
                <p class="profile-page__message">{t('account.resetPasswordLead')}</p>

                <form class="profile-page__password-form" onSubmit={handleSubmit}>
                  <label class="profile-page__password-label">
                    {t('account.password')}
                    <input
                      class="profile-page__password-input"
                      type="password"
                      autocomplete="new-password"
                      value={password()}
                      onInput={event => setPassword(event.currentTarget.value)}
                      placeholder={t('account.createPassword')}
                      required
                    />
                  </label>

                  <label class="profile-page__password-label">
                    {t('account.confirmPassword')}
                    <input
                      class="profile-page__password-input"
                      type="password"
                      autocomplete="new-password"
                      value={passwordConfirm()}
                      onInput={event => setPasswordConfirm(event.currentTarget.value)}
                      placeholder={t('account.repeatPassword')}
                      required
                    />
                  </label>

                  <button class="profile-page__password-submit" disabled={submitting()} type="submit">
                    {submitting() ? t('account.resetPasswordSubmitting') : t('account.resetPasswordSubmit')}
                  </button>
                </form>

                {message() ? (
                  <p class="profile-page__message">
                    {message()} <a class="profile-page__inline-link" href="/login">{t('account.loginTitle')}</a>
                  </p>
                ) : null}
                {error() ? <p class="profile-page__error">{error()}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
