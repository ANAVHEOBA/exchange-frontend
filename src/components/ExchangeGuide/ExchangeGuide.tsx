import { For, createMemo } from "solid-js";
import { useLocale } from "../../i18n/locale";
import "./ExchangeGuide.css";

export default function ExchangeGuide() {
  const { t } = useLocale();
  const highlights = createMemo(() => [
    {
      title: t('guide.highlightOneEyebrow'),
      copy: t('guide.highlightOneDescription'),
    },
    {
      title: t('guide.highlightTwoEyebrow'),
      copy: t('guide.highlightTwoDescription'),
    },
  ]);
  const steps = createMemo(() => [
    {
      number: "1",
      title: t('guide.stepOneTitle'),
      description: t('guide.stepOneDescription'),
    },
    {
      number: "2",
      title: t('guide.stepTwoTitle'),
      description: t('guide.stepTwoDescription'),
    },
    {
      number: "3",
      title: t('guide.stepThreeTitle'),
      description: t('guide.stepThreeDescription'),
    },
  ]);

  return (
    <section class="exchange-guide" id="how-it-works">
      <div class="exchange-guide__row">
        <div class="exchange-guide__overview">
          <article class="exchange-guide__overview-card">
            <div class="exchange-guide__overview-icon" aria-hidden="true">
              <svg viewBox="0 0 512 512">
                <path d="M504.971 359.029c9.373 9.373 9.373 24.569 0 33.941l-80 79.984c-15.01 15.01-40.971 4.49-40.971-16.971V416h-58.785a12.004 12.004 0 0 1-8.773-3.812l-70.556-75.596 53.333-57.143L352 336h32v-39.981c0-21.438 25.943-31.998 40.971-16.971l80 79.981zM12 176h84l52.781 56.551 53.333-57.143-70.556-75.596A11.999 11.999 0 0 0 122.785 96H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12zm372 0v39.984c0 21.46 25.961 31.98 40.971 16.971l80-79.984c9.373-9.373 9.373-24.569 0-33.941l-80-79.981C409.943 24.021 384 34.582 384 56.019V96h-58.785a12.004 12.004 0 0 0-8.773 3.812L96 336H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h110.785c3.326 0 6.503-1.381 8.773-3.812L352 176h32z" />
              </svg>
            </div>

            <For each={highlights()}>
              {highlight => (
                <div class="exchange-guide__overview-block">
                  <h3 class="exchange-guide__overview-title">{highlight.title}</h3>
                  <p class="exchange-guide__overview-copy">{highlight.copy}</p>
                </div>
              )}
            </For>
          </article>
        </div>

        <div class="exchange-guide__journey">
          <article class="exchange-guide__journey-card">
            <div class="exchange-guide__journey-header">
              <h3 class="exchange-guide__journey-title">{t('guide.stepsKicker')}</h3>
            </div>

            <div class="exchange-guide__step-list">
              <For each={steps()}>
                {(step, index) => (
                  <>
                    <article class="exchange-guide__step-row">
                      <div class="exchange-guide__step-index">
                        {step.number}
                        <span>.</span>
                      </div>
                      <div class="exchange-guide__step-body">
                        <p class="exchange-guide__step-copy">
                          <strong>{step.title}.</strong> {step.description}
                        </p>
                      </div>
                    </article>

                    <div
                      class="exchange-guide__step-divider"
                      classList={{ hidden: index() === steps().length - 1 }}
                      aria-hidden="true"
                    />
                  </>
                )}
              </For>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
