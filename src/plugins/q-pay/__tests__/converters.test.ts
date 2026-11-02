import { convertAccounts, convertTransactions, QPayAccountGraph, QPayHistory } from '../converters'

describe('Q-Pay current application conversion', () => {
  // Source: authorized pay.quantera.pro application 1.5.770, 2026-11-02.
  // Complete /wallet data, /cards item graph, card balance, selected ledger items,
  // their complete /operations/{id} detail items and complete card transaction rows.
  // Personal identifiers/names and financial amounts/dates were replaced consistently;
  // shape, technical enums, precision and financial relationships were preserved.
  // Selected histories are projected pages, not a claim of complete historical coverage.
  it('keeps aggregate wallet balances, reconciles actual card funding, and counts purchase fees once', () => {
    const graph: QPayAccountGraph = {
      wallet: {
        total: {
          amount: '1499.9898',
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
                memo_tag: null,
                balance: '0',
                pending: '0',
                available: '0',
                created_at: '2026-01-06T07:28:58.368Z',
                min_deposit_amount: '2',
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
                memo_tag: null,
                balance: '0',
                pending: '0',
                available: '0',
                created_at: '2026-01-06T07:28:58.312Z',
                min_deposit_amount: '2',
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
            amount: '1499.9898',
            balance: '1499.9898',
            pending: '0',
            available: '1499.9898',
            fiat_equivalent: {
              amount: '1499.9898',
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
                memo_tag: null,
                balance: '0',
                pending: '0',
                available: '0',
                created_at: '2026-01-06T07:28:58.249Z',
                min_deposit_amount: '2',
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
                memo_tag: null,
                balance: '0',
                pending: '0',
                available: '0',
                created_at: '2026-01-06T07:28:58.106Z',
                min_deposit_amount: '2',
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
                memo_tag: null,
                balance: '0',
                pending: '0',
                available: '0',
                created_at: '2026-01-06T07:28:57.040Z',
                min_deposit_amount: '2',
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
                address: null,
                memo_tag: null,
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
                address: null,
                memo_tag: null,
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
            display_name: 'Synthetic',
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
            owner_display_name: null,
            requires_activation: false,
            issued_at: '2025-10-28T11:07:15.627Z',
            activated_at: '2025-10-28T11:07:15.627Z',
            shipping: null
          },
          balance: {
            currency: 'USD',
            available: '823.70',
            current: null,
            pending: null
          }
        }
      ]
    }
    const history: QPayHistory = {
      operations: [
        {
          operation: {
            id: 'legacy-balance-00000000-0000-4000-8000-000000000005-USDT',
            type: 'withdrawal',
            kind: 'balance_unification',
            status: 'success',
            direction: 'debit',
            title: 'Balance unification',
            subtitle: 'USDT',
            asset: 'USDT',
            amount: {
              amount: '20.00',
              currency: 'USDT'
            },
            amount_exact: '20.00000000',
            cashflow_amount: null,
            occurred_at: '2026-01-02T20:48:44.268Z'
          },
          detail: {
            id: 'legacy-balance-00000000-0000-4000-8000-000000000005-USDT',
            type: 'withdrawal',
            kind: 'balance_unification',
            status: 'success',
            direction: 'debit',
            title: 'Balance unification',
            subtitle: 'USDT',
            asset: 'USDT',
            amount: {
              amount: '20.00',
              currency: 'USDT'
            },
            amount_exact: '20.00000000',
            cashflow_amount: null,
            occurred_at: '2026-01-02T20:48:44.268Z',
            category: 'Balance unification',
            fee: null,
            fee_details: null,
            details: {
              network: null,
              tx_hash: null,
              address: null,
              block_explorer_url: null,
              message: null
            }
          }
        },
        {
          operation: {
            id: 'legacy-card-recharge-00000000-0000-4000-8000-000000000006',
            type: 'card',
            kind: 'card_recharge',
            status: 'success',
            direction: 'debit',
            title: 'Card recharge',
            subtitle: 'USDT',
            asset: 'USDT',
            amount: {
              amount: '500.00',
              currency: 'USDT'
            },
            amount_exact: '500.00000000',
            cashflow_amount: null,
            occurred_at: '2025-12-28T04:11:35.67Z',
            card_id: '00000000-0000-4000-8000-000000000003'
          },
          detail: {
            id: 'legacy-card-recharge-00000000-0000-4000-8000-000000000006',
            type: 'card',
            kind: 'card_recharge',
            status: 'success',
            direction: 'debit',
            title: 'Card recharge',
            subtitle: 'USDT',
            asset: 'USDT',
            amount: {
              amount: '500.00',
              currency: 'USDT'
            },
            amount_exact: '500.00000000',
            cashflow_amount: null,
            occurred_at: '2025-12-28T04:11:35.670Z',
            card_id: '00000000-0000-4000-8000-000000000003',
            category: 'Card recharge',
            fee: null,
            fee_details: null,
            details: {
              network: null,
              tx_hash: null,
              address: null,
              block_explorer_url: null,
              message: null
            }
          }
        },
        {
          operation: {
            id: 'crypto-deposit-00000000-0000-4000-8000-000000000007',
            type: 'deposit',
            kind: 'crypto_deposit',
            status: 'success',
            direction: 'credit',
            title: 'Deposit',
            subtitle: 'USDT',
            asset: 'USDT',
            amount: {
              amount: '1999.98',
              currency: 'USDT'
            },
            amount_exact: '1999.98000000',
            cashflow_amount: '1999.98000000',
            occurred_at: '2025-12-28T04:06:30.101Z'
          },
          detail: {
            id: 'crypto-deposit-00000000-0000-4000-8000-000000000007',
            type: 'deposit',
            kind: 'crypto_deposit',
            status: 'success',
            direction: 'credit',
            title: 'Deposit',
            subtitle: 'USDT',
            asset: 'USDT',
            amount: {
              amount: '1999.98',
              currency: 'USDT'
            },
            amount_exact: '1999.98000000',
            cashflow_amount: '1999.98000000',
            occurred_at: '2025-12-28T04:06:30.101Z',
            category: 'Deposits',
            fee: {
              amount: '0.000000',
              currency: 'USDT'
            },
            fee_details: {
              currency: 'USDT',
              amount_gross: '1999.980000',
              amount_net: '1999.980000',
              fee_total: '0.000000',
              fee_percent: '0.0000',
              pricing_source: 'tariff',
              in_rate: false,
              provisional: false
            },
            details: {
              network: 'BSC',
              tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
              address: null,
              block_explorer_url: 'https://bscscan.com/tx/0x0000000000000000000000000000000000000000000000000000000000000001',
              message: null
            }
          }
        },
        {
          operation: {
            id: 'crypto-deposit-00000000-0000-4000-8000-000000000009',
            type: 'deposit',
            kind: 'crypto_deposit',
            status: 'success',
            direction: 'credit',
            title: 'Deposit',
            subtitle: 'USDT',
            asset: 'USDT',
            amount: {
              amount: '633.68',
              currency: 'USDT'
            },
            amount_exact: '633.67900000',
            cashflow_amount: '633.67900000',
            occurred_at: '2025-12-18T04:35:10.721Z'
          },
          detail: {
            id: 'crypto-deposit-00000000-0000-4000-8000-000000000009',
            type: 'deposit',
            kind: 'crypto_deposit',
            status: 'success',
            direction: 'credit',
            title: 'Deposit',
            subtitle: 'USDT',
            asset: 'USDT',
            amount: {
              amount: '633.68',
              currency: 'USDT'
            },
            amount_exact: '633.67900000',
            cashflow_amount: '633.67900000',
            occurred_at: '2025-12-18T04:35:10.721Z',
            category: 'Deposits',
            fee: {
              amount: '0.000000',
              currency: 'USDT'
            },
            fee_details: {
              currency: 'USDT',
              amount_gross: '633.679000',
              amount_net: '633.679000',
              fee_total: '0.000000',
              fee_percent: '0.0000',
              pricing_source: 'tariff',
              in_rate: false,
              provisional: false
            },
            details: {
              network: 'BSC',
              tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
              address: null,
              block_explorer_url: 'https://bscscan.com/tx/0x0000000000000000000000000000000000000000000000000000000000000002',
              message: null
            }
          }
        },
        {
          operation: {
            amount: {
              amount: '90.00',
              currency: 'USDT'
            },
            amount_exact: '90.00000000',
            asset: 'USDT',
            card_id: '00000000-0000-4000-8000-000000000003',
            cashflow_amount: '90.00000000',
            category: 'Card issuance',
            details: {
              address: null,
              block_explorer_url: null,
              message: null,
              network: null,
              tx_hash: null
            },
            direction: 'debit',
            fee: null,
            fee_details: null,
            id: 'legacy-card-issuance-00000000-0000-4000-8000-000000000021',
            kind: 'card_issuance',
            occurred_at: '2025-10-28T11:07:15.627Z',
            status: 'success',
            subtitle: 'USDT',
            title: 'Card issuance',
            type: 'card'
          },
          detail: {
            amount: {
              amount: '90.00',
              currency: 'USDT'
            },
            amount_exact: '90.00000000',
            asset: 'USDT',
            card_id: '00000000-0000-4000-8000-000000000003',
            cashflow_amount: '90.00000000',
            category: 'Card issuance',
            details: {
              address: null,
              block_explorer_url: null,
              message: null,
              network: null,
              tx_hash: null
            },
            direction: 'debit',
            fee: null,
            fee_details: null,
            id: 'legacy-card-issuance-00000000-0000-4000-8000-000000000021',
            kind: 'card_issuance',
            occurred_at: '2025-10-28T11:07:15.627Z',
            status: 'success',
            subtitle: 'USDT',
            title: 'Card issuance',
            type: 'card'
          }
        },
        {
          operation: {
            amount: {
              amount: '633.68',
              currency: 'USDT'
            },
            amount_exact: '633.68000000',
            asset: 'USDT',
            card_id: '00000000-0000-4000-8000-000000000003',
            cashflow_amount: null,
            direction: 'debit',
            id: 'legacy-card-recharge-00000000-0000-4000-8000-000000000008',
            kind: 'card_recharge',
            occurred_at: '2025-12-18T04:36:23.379Z',
            status: 'success',
            subtitle: 'USDT',
            title: 'Card recharge',
            type: 'card'
          },
          detail: {
            amount: {
              amount: '633.68',
              currency: 'USDT'
            },
            amount_exact: '633.68000000',
            asset: 'USDT',
            card_id: '00000000-0000-4000-8000-000000000003',
            cashflow_amount: null,
            category: 'Card recharge',
            details: {
              address: null,
              block_explorer_url: null,
              message: null,
              network: null,
              tx_hash: null
            },
            direction: 'debit',
            fee: null,
            fee_details: null,
            id: 'legacy-card-recharge-00000000-0000-4000-8000-000000000008',
            kind: 'card_recharge',
            occurred_at: '2025-12-18T04:36:23.379Z',
            status: 'success',
            subtitle: 'USDT',
            title: 'Card recharge',
            type: 'card'
          }
        }
      ],
      cards: [
        {
          cardId: '00000000-0000-4000-8000-000000000003',
          transactions: [
            {
              id: '00000000-0000-4000-8000-000000000010',
              type: 'purchase',
              amount: '40',
              currency: 'USD',
              billing_amount: '40.34',
              billing_currency: 'USD',
              billing_fees: {
                billing_authz_fee: '0.2',
                billing_transaction_fee: '0'
              },
              total_debited: '40.54',
              total_debited_currency: 'USD',
              total_debited_final: true,
              debit_principal: '40.34',
              debit_fees: [
                {
                  kind: 'purchase_fee',
                  amount: '0.2'
                }
              ],
              client_fee: null,
              amount_in_wallet: null,
              wallet_asset: null,
              funded_by: null,
              merchant_name: 'Synthetic',
              merchant_category: 'Software',
              merchant_logo_url: null,
              merchant_logo_is_brand: false,
              merchant_category_logo_url: null,
              merchant_avatar_url: null,
              merchant_category_icon_key: 'laptop',
              merchant_icon_mode: 'category',
              merchant_category_brand_color: '#0891B2',
              merchant_address: 'synthetic-11',
              merchant_city: '0',
              merchant_country: 'US',
              merchant_website: 'https://example.invalid/resource',
              merchant_category_override: null,
              excluded_from_analytics: false,
              mcc_code: '5734',
              status: 'settled',
              decline_reason: null,
              authorized_at: '2025-12-30T07:40:26.721Z',
              settled_at: '2025-12-30T07:40:28.022Z'
            },
            {
              id: '00000000-0000-4000-8000-000000000013',
              type: 'topup',
              amount: '481.50',
              currency: 'USD',
              billing_amount: null,
              billing_currency: null,
              billing_fees: {
                legacy_fee_total: '18.5000'
              },
              total_debited: '481.50',
              total_debited_currency: 'USD',
              total_debited_final: true,
              debit_principal: '481.50',
              debit_fees: [],
              client_fee: null,
              amount_in_wallet: '500',
              wallet_asset: 'USDT',
              funded_by: null,
              merchant_name: null,
              merchant_category: null,
              merchant_logo_url: null,
              merchant_logo_is_brand: null,
              merchant_category_logo_url: null,
              merchant_avatar_url: null,
              merchant_category_icon_key: null,
              merchant_icon_mode: 'brand',
              merchant_category_brand_color: null,
              merchant_address: null,
              merchant_city: null,
              merchant_country: null,
              merchant_website: null,
              merchant_category_override: null,
              excluded_from_analytics: false,
              mcc_code: null,
              status: 'settled',
              decline_reason: null,
              authorized_at: '2025-12-28T04:12:28.633Z',
              settled_at: '2025-12-28T04:12:28.633Z'
            },
            {
              amount: '38.02',
              amount_in_wallet: null,
              authorized_at: '2025-12-20T07:29:44.400Z',
              billing_amount: '43.54',
              billing_currency: 'USD',
              billing_fees: {
                billing_authz_fee: '0.22',
                billing_transaction_fee: '0'
              },
              client_fee: null,
              currency: 'EUR',
              debit_fees: [
                {
                  amount: '0.22',
                  kind: 'purchase_fee'
                }
              ],
              debit_principal: '43.54',
              decline_reason: null,
              excluded_from_analytics: false,
              funded_by: null,
              id: '00000000-0000-4000-8000-000000000020',
              mcc_code: '5734',
              merchant_address: 'Synthetic',
              merchant_avatar_url: null,
              merchant_category: 'Software',
              merchant_category_brand_color: '#0891B2',
              merchant_category_icon_key: 'laptop',
              merchant_category_logo_url: null,
              merchant_category_override: null,
              merchant_city: 'Synthetic',
              merchant_country: 'IE',
              merchant_icon_mode: 'category',
              merchant_logo_is_brand: false,
              merchant_logo_url: null,
              merchant_name: 'Synthetic',
              merchant_website: 'https://example.invalid',
              settled_at: '2025-12-20T07:29:45.665Z',
              status: 'settled',
              total_debited: '43.76',
              total_debited_currency: 'USD',
              total_debited_final: true,
              type: 'purchase',
              wallet_asset: null
            },
            {
              amount: '14157.48',
              amount_in_wallet: null,
              authorized_at: '2025-11-11T08:35:11.597Z',
              billing_amount: '46.46',
              billing_currency: 'USD',
              billing_fees: {
                billing_authz_fee: '0.24',
                billing_transaction_fee: '0'
              },
              client_fee: null,
              currency: 'HUF',
              debit_fees: [
                {
                  amount: '0.24',
                  kind: 'purchase_fee'
                }
              ],
              debit_principal: '46.46',
              decline_reason: null,
              excluded_from_analytics: false,
              funded_by: null,
              id: '00000000-0000-4000-8000-000000000021',
              mcc_code: '5734',
              merchant_address: 'Synthetic',
              merchant_avatar_url: null,
              merchant_category: 'Software',
              merchant_category_brand_color: '#0891B2',
              merchant_category_icon_key: 'laptop',
              merchant_category_logo_url: null,
              merchant_category_override: null,
              merchant_city: 'Synthetic',
              merchant_country: 'IE',
              merchant_icon_mode: 'category',
              merchant_logo_is_brand: false,
              merchant_logo_url: null,
              merchant_name: 'Synthetic',
              merchant_website: 'https://example.invalid',
              settled_at: '2025-11-11T08:35:14.009Z',
              status: 'settled',
              total_debited: '46.70',
              total_debited_currency: 'USD',
              total_debited_final: true,
              type: 'purchase',
              wallet_asset: null
            },
            {
              amount: '0.4',
              amount_in_wallet: null,
              authorized_at: '2025-11-11T09:59:16.587Z',
              billing_amount: null,
              billing_currency: null,
              billing_fees: {
                billing_transaction_fee: '0'
              },
              client_fee: null,
              currency: 'USD',
              debit_fees: [
                {
                  amount: '0.4',
                  kind: 'other'
                }
              ],
              debit_principal: null,
              decline_reason: null,
              excluded_from_analytics: false,
              funded_by: null,
              id: '00000000-0000-4000-8000-000000000022',
              mcc_code: null,
              merchant_address: null,
              merchant_avatar_url: null,
              merchant_category: null,
              merchant_category_brand_color: null,
              merchant_category_icon_key: null,
              merchant_category_logo_url: null,
              merchant_category_override: null,
              merchant_city: null,
              merchant_country: null,
              merchant_icon_mode: 'brand',
              merchant_logo_is_brand: null,
              merchant_logo_url: null,
              merchant_name: null,
              merchant_website: null,
              settled_at: '2025-11-11T09:59:16.587Z',
              status: 'settled',
              total_debited: '0.4',
              total_debited_currency: 'USD',
              total_debited_final: true,
              type: 'fee',
              wallet_asset: null
            },
            {
              amount: '610.2338',
              amount_in_wallet: '633.68',
              authorized_at: '2025-12-18T04:37:32.804Z',
              billing_amount: null,
              billing_currency: null,
              billing_fees: {
                legacy_fee_total: '23.4462'
              },
              client_fee: null,
              currency: 'USD',
              debit_fees: [],
              debit_principal: '610.2338',
              decline_reason: null,
              excluded_from_analytics: false,
              funded_by: null,
              id: '00000000-0000-4000-8000-000000000023',
              mcc_code: null,
              merchant_address: null,
              merchant_avatar_url: null,
              merchant_category: null,
              merchant_category_brand_color: null,
              merchant_category_icon_key: null,
              merchant_category_logo_url: null,
              merchant_category_override: null,
              merchant_city: null,
              merchant_country: null,
              merchant_icon_mode: 'brand',
              merchant_logo_is_brand: null,
              merchant_logo_url: null,
              merchant_name: null,
              merchant_website: null,
              settled_at: '2025-12-18T04:37:32.804Z',
              status: 'settled',
              total_debited: '610.2338',
              total_debited_currency: 'USD',
              total_debited_final: true,
              type: 'topup',
              wallet_asset: 'USDT'
            },
            {
              amount: '20',
              amount_in_wallet: '20',
              authorized_at: '2025-10-28T11:08:33.520Z',
              billing_amount: null,
              billing_currency: null,
              billing_fees: null,
              client_fee: null,
              currency: 'USD',
              debit_fees: [],
              debit_principal: '20',
              decline_reason: null,
              excluded_from_analytics: false,
              funded_by: null,
              id: '00000000-0000-4000-8000-000000000024',
              mcc_code: null,
              merchant_address: null,
              merchant_avatar_url: null,
              merchant_category: null,
              merchant_category_brand_color: null,
              merchant_category_icon_key: null,
              merchant_category_logo_url: null,
              merchant_category_override: null,
              merchant_city: null,
              merchant_country: null,
              merchant_icon_mode: 'brand',
              merchant_logo_is_brand: null,
              merchant_logo_url: null,
              merchant_name: null,
              merchant_website: null,
              settled_at: '2025-10-28T11:08:33.520Z',
              status: 'settled',
              total_debited: '20',
              total_debited_currency: 'USD',
              total_debited_final: true,
              type: 'topup',
              wallet_asset: 'USDT'
            }
          ]
        }
      ]
    }

    expect(convertAccounts(graph)).toEqual([
      {
        accounts: [
          { id: 'q-pay:wallet:USDC', type: 'checking', title: 'Q-Pay USDC', instrument: 'USD', balance: 0, syncIds: ['q-pay:wallet:USDC'], savings: false },
          { id: 'q-pay:wallet:USDT', type: 'checking', title: 'Q-Pay USDT', instrument: 'USDT', balance: 1499.9898, syncIds: ['q-pay:wallet:USDT'], savings: false },
          { id: 'q-pay:wallet:RUB', type: 'checking', title: 'Q-Pay RUB', instrument: 'RUB', balance: 0, syncIds: ['q-pay:wallet:RUB'], savings: false },
          { id: 'q-pay:wallet:USD', type: 'checking', title: 'Q-Pay USD', instrument: 'USD', balance: 0, syncIds: ['q-pay:wallet:USD'], savings: false }
        ],
        fetchParams: { kind: 'wallet' }
      },
      {
        account: {
          id: 'q-pay:card:00000000-0000-4000-8000-000000000003',
          type: 'ccard',
          title: 'Synthetic',
          instrument: 'USD',
          balance: 823.7,
          available: 823.7,
          syncIds: ['q-pay:card:00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003'],
          savings: false
        },
        fetchParams: { kind: 'card', cardId: '00000000-0000-4000-8000-000000000003' }
      }
    ])

    expect(convertTransactions(graph, history)).toEqual([
      {
        hold: false,
        date: new Date('2025-10-28T11:07:15.627Z'),
        movements: [{
          id: 'q-pay:wallet-tx:legacy-card-issuance-00000000-0000-4000-8000-000000000021',
          account: { id: 'q-pay:wallet:USDT' },
          sum: -90,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: 'Card issuance'
      },
      {
        hold: false,
        date: new Date('2025-10-28T11:08:33.520Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000024',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: 20,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-11-11T08:35:11.597Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000021',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: -46.46,
          fee: -0.24,
          invoice: { sum: -14157.48, instrument: 'HUF' }
        }],
        merchant: { title: 'Synthetic', mcc: 5734, city: 'Synthetic', country: 'IE', location: null },
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-11-11T09:59:16.587Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000022',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: 0,
          fee: -0.4,
          invoice: null
        }],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-18T04:35:10.721Z'),
        movements: [{
          id: 'q-pay:wallet-tx:crypto-deposit-00000000-0000-4000-8000-000000000009',
          account: { id: 'q-pay:wallet:USDT' },
          sum: 633.679,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-18T04:36:23.379Z'),
        movements: [
          {
            id: 'q-pay:wallet-tx:legacy-card-recharge-00000000-0000-4000-8000-000000000008',
            account: { id: 'q-pay:wallet:USDT' },
            sum: -633.68,
            fee: 0,
            invoice: null
          },
          {
            id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000023',
            account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
            sum: 610.2338,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-20T07:29:44.400Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000020',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: -43.54,
          fee: -0.22,
          invoice: { sum: -38.02, instrument: 'EUR' }
        }],
        merchant: { title: 'Synthetic', mcc: 5734, city: 'Synthetic', country: 'IE', location: null },
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-28T04:06:30.101Z'),
        movements: [{
          id: 'q-pay:wallet-tx:crypto-deposit-00000000-0000-4000-8000-000000000007',
          account: { id: 'q-pay:wallet:USDT' },
          sum: 1999.98,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-28T04:11:35.670Z'),
        movements: [
          {
            id: 'q-pay:wallet-tx:legacy-card-recharge-00000000-0000-4000-8000-000000000006',
            account: { id: 'q-pay:wallet:USDT' },
            sum: -500,
            fee: 0,
            invoice: null
          },
          {
            id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000013',
            account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
            sum: 481.5,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-30T07:40:26.721Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000010',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: -40.34,
          fee: -0.2,
          invoice: null
        }],
        merchant: { title: 'Synthetic', mcc: 5734, city: '0', country: 'US', location: null },
        comment: null
      },
      {
        hold: false,
        date: new Date('2026-01-02T20:48:44.268Z'),
        movements: [{
          id: 'q-pay:wallet-tx:legacy-balance-00000000-0000-4000-8000-000000000005-USDT',
          account: { id: 'q-pay:wallet:USDT' },
          sum: -20,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: 'Balance unification'
      }
    ])

    // A skipped wallet history is local state, not an invented missing bank side.
    expect(convertTransactions(graph, { operations: [], cards: history.cards })).toEqual([
      {
        hold: false,
        date: new Date('2025-10-28T11:08:33.520Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000024',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: 20,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-11-11T08:35:11.597Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000021',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: -46.46,
          fee: -0.24,
          invoice: { sum: -14157.48, instrument: 'HUF' }
        }],
        merchant: { title: 'Synthetic', mcc: 5734, city: 'Synthetic', country: 'IE', location: null },
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-11-11T09:59:16.587Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000022',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: 0,
          fee: -0.4,
          invoice: null
        }],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-18T04:37:32.804Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000023',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: 610.2338,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-20T07:29:44.400Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000020',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: -43.54,
          fee: -0.22,
          invoice: { sum: -38.02, instrument: 'EUR' }
        }],
        merchant: { title: 'Synthetic', mcc: 5734, city: 'Synthetic', country: 'IE', location: null },
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-28T04:12:28.633Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000013',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: 481.5,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2025-12-30T07:40:26.721Z'),
        movements: [{
          id: 'q-pay:card-tx:00000000-0000-4000-8000-000000000010',
          account: { id: 'q-pay:card:00000000-0000-4000-8000-000000000003' },
          sum: -40.34,
          fee: -0.2,
          invoice: null
        }],
        merchant: { title: 'Synthetic', mcc: 5734, city: '0', country: 'US', location: null },
        comment: null
      }
    ])
  })
})
