import { createMemo, createSignal, type Accessor } from 'solid-js';
import { validationApi } from '../api';
import type { Currency } from '../../../types/currency';
import type { ValidateAddressResponse } from '../../../types/validation';

export type AddressValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'error';

type ValidatableCurrency = Pick<Currency, 'ticker' | 'network' | 'memo'>;

export interface UseAddressValidationOptions {
  address: Accessor<string>;
  currency: Accessor<ValidatableCurrency | null>;
}

export interface AddressValidationController {
  address: Accessor<string>;
  currency: Accessor<ValidatableCurrency | null>;
  canValidate: Accessor<boolean>;
  validating: Accessor<boolean>;
  status: Accessor<AddressValidationStatus>;
  result: Accessor<ValidateAddressResponse | null>;
  error: Accessor<string | null>;
  isValid: Accessor<boolean>;
  isCurrentInputValidated: Accessor<boolean>;
  validate: () => Promise<ValidateAddressResponse | null>;
  clear: () => void;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Address validation failed.';
};

const buildCurrencyKey = (currency: ValidatableCurrency | null): string | null => {
  if (!currency) {
    return null;
  }

  return `${currency.ticker}:${currency.network}`;
};

export function useAddressValidation(options: UseAddressValidationOptions): AddressValidationController {
  const [result, setResult] = createSignal<ValidateAddressResponse | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [validating, setValidating] = createSignal(false);
  const [validatedAddress, setValidatedAddress] = createSignal<string | null>(null);
  const [validatedCurrencyKey, setValidatedCurrencyKey] = createSignal<string | null>(null);

  const trimmedAddress = createMemo(() => options.address().trim());
  const currentCurrencyKey = createMemo(() => buildCurrencyKey(options.currency()));

  const canValidate = createMemo(() => Boolean(trimmedAddress() && options.currency()));

  const isCurrentInputValidated = createMemo(() => {
    return Boolean(
      trimmedAddress() &&
      currentCurrencyKey() &&
      validatedAddress() === trimmedAddress() &&
      validatedCurrencyKey() === currentCurrencyKey()
    );
  });

  const currentResult = createMemo(() => {
    return isCurrentInputValidated() ? result() : null;
  });

  const currentError = createMemo(() => {
    return isCurrentInputValidated() ? error() : null;
  });

  const status = createMemo<AddressValidationStatus>(() => {
    if (validating()) {
      return 'validating';
    }

    if (!trimmedAddress() || !currentCurrencyKey() || !isCurrentInputValidated()) {
      return 'idle';
    }

    if (currentError()) {
      return 'error';
    }

    if (!currentResult()) {
      return 'idle';
    }

    return currentResult()!.valid ? 'valid' : 'invalid';
  });

  const clear = () => {
    setResult(null);
    setError(null);
    setValidatedAddress(null);
    setValidatedCurrencyKey(null);
  };

  const validate = async (): Promise<ValidateAddressResponse | null> => {
    const currency = options.currency();
    const address = trimmedAddress();

    if (!currency || !address) {
      clear();
      return null;
    }

    if (validating()) {
      return currentResult();
    }

    if (isCurrentInputValidated() && currentResult()) {
      return currentResult();
    }

    setValidating(true);
    setError(null);

    try {
      const response = await validationApi.validateForCurrency(
        address,
        currency.ticker,
        currency.network,
      );

      setValidatedAddress(address);
      setValidatedCurrencyKey(buildCurrencyKey(currency));
      setResult(response);
      setError(null);
      return response;
    } catch (nextError) {
      setValidatedAddress(address);
      setValidatedCurrencyKey(buildCurrencyKey(currency));
      setResult(null);
      setError(getErrorMessage(nextError));
      throw nextError;
    } finally {
      setValidating(false);
    }
  };

  return {
    address: trimmedAddress,
    currency: options.currency,
    canValidate,
    validating,
    status,
    result: currentResult,
    error: currentError,
    isValid: createMemo(() => Boolean(currentResult()?.valid)),
    isCurrentInputValidated,
    validate,
    clear,
  };
}
