import { createMemo } from "solid-js";
import { useLocale } from "../../i18n/locale";
import "./ExchangeGuide.css";

export interface ExchangeGuideProps {
  ctaHref?: string;
}

export default function ExchangeGuide(props: ExchangeGuideProps) {
  const { t } = useLocale();
  const highlights = createMemo(() => [
    {
      eyebrow: t('guide.highlightOneEyebrow'),
      title: t('guide.highlightOneTitle'),
      description: t('guide.highlightOneDescription'),
      points: [
        t('guide.highlightOnePointOne'),
        t('guide.highlightOnePointTwo'),
        t('guide.highlightOnePointThree'),
      ],
    },
    {
      eyebrow: t('guide.highlightTwoEyebrow'),
      title: t('guide.highlightTwoTitle'),
      description: t('guide.highlightTwoDescription'),
      points: [
        t('guide.highlightTwoPointOne'),
        t('guide.highlightTwoPointTwo'),
        t('guide.highlightTwoPointThree'),
      ],
    },
  ]);
  const steps = createMemo(() => [
    {
      number: "01",
      title: t('guide.stepOneTitle'),
      description: t('guide.stepOneDescription'),
    },
    {
      number: "02",
      title: t('guide.stepTwoTitle'),
      description: t('guide.stepTwoDescription'),
    },
    {
      number: "03",
      title: t('guide.stepThreeTitle'),
      description: t('guide.stepThreeDescription'),
    },
  ]);

  return (
    <section class="exchange-guide" id="how-it-works">
      <div class="exchange-guide__intro">
        <div class="exchange-guide__kicker">{t('guide.kicker')}</div>
        <h2 class="exchange-guide__title">{t('guide.title')}</h2>
        <p class="exchange-guide__summary">{t('guide.summary')}</p>
      </div>

      <div class="exchange-guide__highlights">
        {highlights().map(highlight => (
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
          <p class="exchange-guide__steps-kicker">{t('guide.stepsKicker')}</p>
          <h3 class="exchange-guide__steps-title">{t('guide.stepsTitle')}</h3>
        </div>

        <a class="exchange-guide__cta" href={props.ctaHref ?? "#swap"}>
          {t('guide.cta')}
        </a>
      </div>

      <div class="exchange-guide__steps">
        {steps().map(step => (
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
