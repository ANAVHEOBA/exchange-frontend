import { Match, Show, Switch } from 'solid-js';
import type { Currency } from '../../../../types/currency';
import type { AddressValidationController } from '../../model';
import './RecipientAddressForm.css';

export interface ExtraIdFieldConfig {
  value: string;
  label: string;
  placeholder: string;
  helper: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  inputMode?: 'text' | 'numeric';
  onInput: (value: string) => void;
}

export interface RecipientAddressFormProps {
  currency: Currency | null;
  refundCurrency?: Currency | null;
  address: string;
  refundAddress?: string;
  recipientExtraIdField?: ExtraIdFieldConfig | null;
  refundExtraIdField?: ExtraIdFieldConfig | null;
  onInput: (value: string) => void;
  onRefundInput?: (value: string) => void;
  validation: AddressValidationController;
}

const buildRecipientPlaceholder = (currency: Currency | null): string => {
  if (!currency) {
    return 'Select the destination currency first.';
  }

  return `Insert a ${currency.name} address (network: ${currency.network})`;
};

const buildRefundPlaceholder = (currency: Currency | null | undefined): string => {
  if (!currency) {
    return 'Provide a refund address if you want one.';
  }

  return `Optional ${currency.name} refund address (${currency.network})`;
};

export default function RecipientAddressForm(props: RecipientAddressFormProps) {
  const handleBlur = () => {
    if (!props.validation.canValidate()) {
      return;
    }

    void props.validation.validate().catch(() => {
      // The validation hook exposes the current error state for rendering.
    });
  };

  const runValidation = () => {
    void props.validation.validate().catch(() => {
      // The validation hook exposes the current error state for rendering.
    });
  };

  return (
    <section class="recipient-address">
      <div class="recipient-address__field-group">
        <div class="recipient-address__field-head">
          <div class="recipient-address__label">Your receiving address</div>
          <button
            class="recipient-address__validate"
            disabled={!props.validation.canValidate() || props.validation.validating()}
            onClick={runValidation}
            type="button"
          >
            {props.validation.validating() ? 'Validating...' : 'Validate'}
          </button>
        </div>

        <input
          class="recipient-address__input"
          type="text"
          placeholder={buildRecipientPlaceholder(props.currency)}
          value={props.address}
          onInput={event => props.onInput(event.currentTarget.value)}
          onBlur={handleBlur}
        />

        <div class="recipient-address__helper">
          <Show when={props.currency} fallback="Select the destination currency first.">
            Validate the destination wallet for {props.currency!.ticker} on {props.currency!.network}.
          </Show>
        </div>

        <Show when={props.currency?.memo}>
          <div class="recipient-address__helper">
            This currency may also require a memo or extra ID during swap creation.
          </div>
        </Show>

        <Show when={props.recipientExtraIdField}>
          {field => (
            <div class="recipient-address__subfield">
              <div class="recipient-address__field-head recipient-address__field-head--subfield">
                <div class="recipient-address__label">{field().label}</div>
                <div
                  classList={{
                    'recipient-address__required': Boolean(field().required),
                    'recipient-address__optional': !field().required,
                  }}
                >
                  {field().required ? 'Required' : 'Optional'}
                </div>
              </div>

              <input
                class="recipient-address__input"
                disabled={field().disabled}
                inputMode={field().inputMode}
                type="text"
                placeholder={field().placeholder}
                value={field().value}
                onInput={event => field().onInput(event.currentTarget.value)}
              />

              <div class="recipient-address__helper">{field().helper}</div>

              <Show when={field().error}>
                <div class="recipient-address__status recipient-address__status--error">
                  {field().error}
                </div>
              </Show>
            </div>
          )}
        </Show>

        <Switch>
          <Match when={props.validation.status() === 'valid'}>
            <div class="recipient-address__status recipient-address__status--valid">
              Address validated for {props.currency?.ticker} on {props.currency?.network}.
            </div>
          </Match>

          <Match when={props.validation.status() === 'invalid'}>
            <div class="recipient-address__status recipient-address__status--invalid">
              This address is not valid for the selected destination currency and network.
            </div>
          </Match>

          <Match when={props.validation.status() === 'error'}>
            <div class="recipient-address__status recipient-address__status--error">
              {props.validation.error() ?? 'Address validation failed.'}
            </div>
          </Match>

          <Match when={props.validation.status() === 'validating'}>
            <div class="recipient-address__status">
              Checking the address against the backend validator...
            </div>
          </Match>

          <Match when={props.address.trim().length > 0 && !props.validation.isCurrentInputValidated()}>
            <div class="recipient-address__status">
              Address changed. Validate again before continuing.
            </div>
          </Match>
        </Switch>
      </div>

      <Show when={props.onRefundInput}>
        <div class="recipient-address__field-group">
          <div class="recipient-address__field-head">
            <div class="recipient-address__label">Provide a refund address</div>
            <div class="recipient-address__optional">Optional</div>
          </div>

          <input
            class="recipient-address__input"
            type="text"
            placeholder={buildRefundPlaceholder(props.refundCurrency)}
            value={props.refundAddress ?? ''}
            onInput={event => props.onRefundInput?.(event.currentTarget.value)}
          />

          <div class="recipient-address__helper">
            Use this if you want the provider to have a return address available when a route fails.
          </div>

          <Show when={props.refundExtraIdField}>
            {field => (
              <div class="recipient-address__subfield">
                <div class="recipient-address__field-head recipient-address__field-head--subfield">
                  <div class="recipient-address__label">{field().label}</div>
                  <div
                    classList={{
                      'recipient-address__required': Boolean(field().required),
                      'recipient-address__optional': !field().required,
                    }}
                  >
                    {field().required ? 'Required' : 'Optional'}
                  </div>
                </div>

                <input
                  class="recipient-address__input"
                  disabled={field().disabled}
                  inputMode={field().inputMode}
                  type="text"
                  placeholder={field().placeholder}
                  value={field().value}
                  onInput={event => field().onInput(event.currentTarget.value)}
                />

                <div class="recipient-address__helper">{field().helper}</div>

                <Show when={field().error}>
                  <div class="recipient-address__status recipient-address__status--error">
                    {field().error}
                  </div>
                </Show>
              </div>
            )}
          </Show>
        </div>
      </Show>
    </section>
  );
}
