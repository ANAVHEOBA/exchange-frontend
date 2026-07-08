// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGiftcardPaymentUri,
  formatGiftcardDetailLabel,
  getGiftcardExtraEntries,
  getGiftcardOrderStatusTone,
  shouldStopGiftcardOrderPolling,
} from './order-status.model.ts';

test('buildGiftcardPaymentUri returns a bitcoin payment uri for mainnet assets', () => {
  assert.equal(
    buildGiftcardPaymentUri('BTC', 'Mainnet', 'bc1qexample', 0.015),
    'bitcoin:bc1qexample?amount=0.015',
  );
});

test('buildGiftcardPaymentUri preserves monero tx_amount semantics', () => {
  assert.equal(
    buildGiftcardPaymentUri('XMR', 'Mainnet', '49abc', 0.75),
    'monero:49abc?tx_amount=0.75',
  );
});

test('buildGiftcardPaymentUri returns null for non-native networks', () => {
  assert.equal(
    buildGiftcardPaymentUri('USDT', 'TRC20', 'TExample', 42),
    null,
  );
});

test('getGiftcardOrderStatusTone maps success, warning, and danger states', () => {
  assert.equal(getGiftcardOrderStatusTone('delivered'), 'success');
  assert.equal(getGiftcardOrderStatusTone('waiting_funds'), 'warning');
  assert.equal(getGiftcardOrderStatusTone('failed'), 'danger');
});

test('shouldStopGiftcardOrderPolling only stops for terminal states', () => {
  assert.equal(shouldStopGiftcardOrderPolling({ status: 'queued' }), false);
  assert.equal(shouldStopGiftcardOrderPolling({ status: 'completed' }), true);
});

test('getGiftcardExtraEntries omits duplicated core detail keys', () => {
  const entries = getGiftcardExtraEntries({
    activation_link: null,
    email: null,
    extra: {
      card_pin: '1234',
      id: 'hidden',
      instructions: ['step one', 'step two'],
    },
    hashout: null,
    id: null,
    redeem_code: null,
    status: null,
    value: null,
  });

  assert.deepEqual(entries, [
    ['card_pin', '1234'],
    ['instructions', '["step one","step two"]'],
  ]);
});

test('formatGiftcardDetailLabel turns snake_case into readable labels', () => {
  assert.equal(formatGiftcardDetailLabel('card_pin'), 'Card Pin');
});
