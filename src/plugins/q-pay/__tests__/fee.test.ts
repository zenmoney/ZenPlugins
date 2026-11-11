import { convertTransactions, QPayAccountGraph, QPayHistory } from '../converters'

// Source: user-provided production log, 2026-11-08, plugin build unknown.
// Complete /wallet data, /cards item and /balance data, plus the complete
// three_ds fee and purchase rows from the same /cards/:id/transactions response.
// Card IDs, deposit addresses and resource URLs are sanitized for master.
// Existing <value> redactions are retained; the selected rows are not a full page.
it('imports a standalone 3DS commission as an expense without charging it again on the purchase', () => {
  const graph: QPayAccountGraph = {
    wallet: {
      total: {
        amount: '749.9949',
        currency: 'USD'
      },
      hidden: false,
      assets: [
        {
          asset: 'CASHBACK',
          symbol: 'CASHBACK',
          amount: '0',
          balance: '0',
          pending: '0',
          available: '0',
          fiat_equivalent: {
            amount: '0',
            currency: 'USD'
          },
          networks: [],
          type: 'bonus',
          icon_url: null,
          operation_mode: 'active'
        },
        {
          asset: 'USDC',
          symbol: 'USDC',
          amount: '0',
          balance: '0',
          pending: '0',
          available: '0',
          fiat_equivalent: {
            amount: '0',
            currency: 'USD'
          },
          networks: [
            {
              asset: 'USDC-ETH',
              symbol: 'USDC',
              network: 'ETH',
              decimals: 8,
              type: 'crypto',
              icon_url: 'https://example.invalid/resource',
              address: '0x0000000000000000000000000000000000000001',
              memo_tag: '<value>',
              balance: '0',
              pending: '0',
              available: '0',
              created_at: '2026-11-02T07:28:58.368Z',
              min_deposit_amount: '1',
              required_confirmations: 12,
              estimated_arrival_minutes: 5,
              token_standard: 'ERC-20'
            },
            {
              asset: 'USDC-TRX',
              symbol: 'USDC',
              network: 'TRX',
              decimals: 8,
              type: 'crypto',
              icon_url: 'https://example.invalid/resource',
              address: 'TsyntheticAddress00000000000000001',
              memo_tag: '<value>',
              balance: '0',
              pending: '0',
              available: '0',
              created_at: '2026-11-02T07:28:58.312Z',
              min_deposit_amount: '1',
              required_confirmations: 19,
              estimated_arrival_minutes: 3,
              token_standard: 'TRC-20'
            }
          ],
          type: 'crypto',
          icon_url: 'https://example.invalid/resource',
          operation_mode: 'active'
        },
        {
          asset: 'USDT',
          symbol: 'USDT',
          amount: '749.9949',
          balance: '749.9949',
          pending: '0',
          available: '749.9949',
          fiat_equivalent: {
            amount: '749.9949',
            currency: 'USD'
          },
          networks: [
            {
              asset: 'USDT-BSC',
              symbol: 'USDT',
              network: 'BSC',
              decimals: 8,
              type: 'crypto',
              icon_url: 'https://example.invalid/resource',
              address: '0x0000000000000000000000000000000000000001',
              memo_tag: '<value>',
              balance: '0',
              pending: '0',
              available: '0',
              created_at: '2026-11-02T07:28:58.249Z',
              min_deposit_amount: '1',
              required_confirmations: 15,
              estimated_arrival_minutes: 2,
              token_standard: 'BEP-20'
            },
            {
              asset: 'USDT-ETH',
              symbol: 'USDT',
              network: 'ETH',
              decimals: 8,
              type: 'crypto',
              icon_url: 'https://example.invalid/resource',
              address: '0x0000000000000000000000000000000000000001',
              memo_tag: '<value>',
              balance: '0',
              pending: '0',
              available: '0',
              created_at: '2026-11-02T07:28:58.106Z',
              min_deposit_amount: '1',
              required_confirmations: 12,
              estimated_arrival_minutes: 5,
              token_standard: 'ERC-20'
            },
            {
              asset: 'USDT-TRX',
              symbol: 'USDT',
              network: 'TRX',
              decimals: 8,
              type: 'crypto',
              icon_url: 'https://example.invalid/resource',
              address: 'TsyntheticAddress00000000000000001',
              memo_tag: '<value>',
              balance: '0',
              pending: '0',
              available: '0',
              created_at: '2026-11-02T07:28:57.040Z',
              min_deposit_amount: '1',
              required_confirmations: 19,
              estimated_arrival_minutes: 3,
              token_standard: 'TRC-20'
            }
          ],
          type: 'crypto',
          icon_url: 'https://example.invalid/resource',
          operation_mode: 'active'
        },
        {
          asset: 'RUB',
          symbol: 'RUB',
          amount: '0',
          balance: '0',
          pending: '0',
          available: '0',
          fiat_equivalent: {
            amount: '0',
            currency: 'USD'
          },
          networks: [
            {
              asset: 'RUB',
              symbol: 'RUB',
              network: 'fiat',
              decimals: 8,
              type: 'fiat',
              icon_url: 'https://example.invalid/resource',
              address: '<value>',
              memo_tag: '<value>',
              balance: '0',
              pending: '0',
              available: '0',
              created_at: null
            }
          ],
          type: 'fiat',
          icon_url: 'https://example.invalid/resource',
          operation_mode: 'active'
        },
        {
          asset: 'USD',
          symbol: 'USD',
          amount: '0',
          balance: '0',
          pending: '0',
          available: '0',
          fiat_equivalent: {
            amount: '0',
            currency: 'USD'
          },
          networks: [
            {
              asset: 'USD',
              symbol: 'USD',
              network: 'fiat',
              decimals: 8,
              type: 'fiat',
              icon_url: 'https://example.invalid/resource',
              address: '<value>',
              memo_tag: '<value>',
              balance: '0',
              pending: '0',
              available: '0',
              created_at: null
            }
          ],
          type: 'fiat',
          icon_url: 'https://example.invalid/resource',
          operation_mode: 'active'
        }
      ]
    },
    cards: [
      {
        card: {
          id: '00000000-0000-4000-8000-000000000003',
          display_name: 'Visa Ecommerce',
          image_url: 'https://example.invalid/resource',
          draw_scheme_mark: false,
          brand: 'VISA',
          type: 'virtual',
          masked_pan: null,
          first4: null,
          last4: null,
          expiry: null,
          currency: 'USD',
          status: 'active',
          provider_status: 'active',
          block_reason: null,
          recovery_action: null,
          block_source: null,
          frozen_by_support: false,
          activation_pin_length: 4,
          activation_bin: null,
          activation_fields: null,
          wallets: {
            apple_pay: true,
            google_pay: true,
            samsung_pay: true
          },
          can_unfreeze: false,
          archive: null,
          access: 'owner',
          owner_display_name: '<value>',
          requires_activation: false,
          issued_at: '2026-08-24T11:07:15.627Z',
          activated_at: '2026-08-24T11:07:15.627Z',
          shipping: null
        },
        balance: {
          currency: 'USD',
          available: '82.34',
          current: null,
          pending: null
        }
      }
    ]
  }
  const history: QPayHistory = {
    cards: [{
      cardId: '00000000-0000-4000-8000-000000000003',
      transactions: [{
        id: '00000000-0000-4000-8000-000000000030',
        type: 'fee',
        amount: '0.03',
        currency: 'USD',
        billing_amount: null,
        billing_currency: null,
        billing_fees: { billing_transaction_fee: '0' },
        total_debited: '0.03',
        total_debited_currency: 'USD',
        total_debited_final: true,
        debit_principal: null,
        debit_fees: [{ kind: 'three_ds', amount: '0.03' }],
        client_fee: null,
        amount_in_wallet: null,
        wallet_asset: null,
        funded_by: null,
        merchant_name: 'Etihad Airways',
        merchant_category: null,
        merchant_logo_url: null,
        merchant_logo_is_brand: false,
        merchant_category_logo_url: null,
        merchant_avatar_url: '<value>',
        merchant_category_icon_key: null,
        merchant_icon_mode: 'category',
        merchant_category_brand_color: null,
        merchant_address: 'US',
        merchant_city: null,
        merchant_country: 'US',
        merchant_website: 'https://www.etihad.com/',
        merchant_category_override: null,
        excluded_from_analytics: false,
        mcc_code: '3034',
        status: 'settled',
        decline_reason: null,
        authorized_at: '2026-11-08T17:37:15.072Z',
        settled_at: '2026-11-08T17:37:15.399Z'
      }, {
        id: '00000000-0000-4000-8000-000000000031',
        type: 'purchase',
        amount: '125.09',
        currency: 'USD',
        billing_amount: '126.15',
        billing_currency: 'USD',
        billing_fees: { billing_authz_fee: '0.63', billing_transaction_fee: '0' },
        total_debited: '126.78',
        total_debited_currency: 'USD',
        total_debited_final: true,
        debit_principal: '126.15',
        debit_fees: [{ kind: 'purchase_fee', amount: '0.63' }],
        client_fee: null,
        amount_in_wallet: null,
        wallet_asset: null,
        funded_by: null,
        merchant_name: 'Etihad Airways',
        merchant_category: null,
        merchant_logo_url: null,
        merchant_logo_is_brand: false,
        merchant_category_logo_url: null,
        merchant_avatar_url: '<value>',
        merchant_category_icon_key: null,
        merchant_icon_mode: 'category',
        merchant_category_brand_color: null,
        merchant_address: 'NEW YORK, US',
        merchant_city: 'NEW YORK',
        merchant_country: 'US',
        merchant_website: 'https://www.etihad.com/',
        merchant_category_override: null,
        excluded_from_analytics: false,
        mcc_code: '3034',
        status: 'settled',
        decline_reason: null,
        authorized_at: '2026-11-08T17:39:18.289Z',
        settled_at: '2026-11-08T17:39:19.947Z'
      }]
    }]
  }

  // AMOUNT-002: the fee-only row is its own expense; the purchase keeps only its own fee.
  expect(convertTransactions(graph, history)).toEqual([{
    hold: false,
    date: new Date('2026-11-08T17:37:15.072Z'),
    movements: [{
      id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000030',
      account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
      sum: -0.03,
      fee: 0,
      invoice: null
    }],
    merchant: { title: 'Etihad Airways', mcc: 3034, city: null, country: 'US', location: null },
    comment: null
  }, {
    hold: false,
    date: new Date('2026-11-08T17:39:18.289Z'),
    movements: [{
      id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000031',
      account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
      sum: -126.15,
      fee: -0.63,
      invoice: null
    }],
    merchant: { title: 'Etihad Airways', mcc: 3034, city: 'NEW YORK', country: 'US', location: null },
    comment: null
  }])
})
