export const historyPages: unknown[] = [
  {
    historyEntries: [
      {
        id: '00000000-0000-7000-8000-000000000036',
        transaction: {
          original: {
            amount: 852.0,
            currency: 'EUR'
          },
          settlement: {
            amount: 852.0,
            currency: 'EUR'
          },
          exchangeRate: '1.000000',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_TRANSFER_OUT',
          transactionSubtype: 'HST_BUDDY',
          status: 'HTS_ACCEPTED',
          title: 'Money transfer',
          subTitle: null,
          createdAt: '2026-10-13T20:39:04Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: null
          },
          party: {
            name: 'Taylor Example',
            addressLine1: null,
            addressLine2: null,
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: {
          repeatable: true,
          returnable: false,
          type: 'BUDDY_TRANSFER'
        },
        tagMap: {}
      },
      {
        id: '00000000-0000-3000-8000-000000000037',
        transaction: {
          original: {
            amount: 2.25,
            currency: 'EUR'
          },
          settlement: {
            amount: 2.25,
            currency: 'EUR'
          },
          exchangeRate: null,
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_FEE',
          transactionSubtype: 'HST_TRANSACTION_FEE',
          status: 'HTS_ACCEPTED',
          title: 'Fee for account top-up Apple Pay **1001',
          subTitle: null,
          createdAt: '2026-10-13T20:37:56Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '41111111******1001',
              cardAlias: null,
              type: 'Visa'
            }
          },
          party: {
            name: 'UAB ZEN.COM',
            addressLine1: 'Konstitucijos av. 18B',
            addressLine2: 'LT-09308 Vilnius',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {}
      },
      {
        id: '00000000-0000-7000-8000-000000000038',
        transaction: {
          original: {
            amount: 77.25,
            currency: 'EUR'
          },
          settlement: {
            amount: 77.25,
            currency: 'EUR'
          },
          exchangeRate: null,
          fee: {
            amount: {
              amount: 2.25,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_TOP_UP',
          transactionSubtype: 'TPM_APPLE',
          status: 'HTS_ACCEPTED',
          title: 'ZEN account top-up Apple Pay **1001',
          subTitle: null,
          createdAt: '2026-10-13T20:37:56Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              }
            ],
            card: {
              maskedCardNumber: '41111111******1001',
              cardAlias: null,
              type: 'Visa'
            }
          },
          party: {
            name: 'UAB ZEN.COM',
            addressLine1: 'Konstitucijos av. 18B',
            addressLine2: 'LT-09308 Vilnius',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          paymentSourceChannel: 'PTS_ETS_TOPUP'
        }
      },
      {
        id: '00000000-0000-3000-8000-000000000039',
        transaction: {
          original: {
            amount: 2.25,
            currency: 'EUR'
          },
          settlement: {
            amount: 2.25,
            currency: 'EUR'
          },
          exchangeRate: null,
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_FEE',
          transactionSubtype: 'HST_TRANSACTION_FEE',
          status: 'HTS_REJECTED',
          title: 'Fee for account top-up Mastercard **1002',
          subTitle: null,
          createdAt: '2026-10-13T20:37:18Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '55555555******1002',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'UAB ZEN.COM',
            addressLine1: 'Konstitucijos av. 18B',
            addressLine2: 'LT-09308 Vilnius',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {}
      },
      {
        id: '00000000-0000-7000-8000-000000000040',
        transaction: {
          original: {
            amount: 77.25,
            currency: 'EUR'
          },
          settlement: {
            amount: 77.25,
            currency: 'EUR'
          },
          exchangeRate: null,
          fee: {
            amount: {
              amount: 2.25,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_TOP_UP',
          transactionSubtype: 'TPM_CARD',
          status: 'HTS_REJECTED',
          title: 'ZEN account top-up Mastercard **1002',
          subTitle: null,
          createdAt: '2026-10-13T20:37:18Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              }
            ],
            card: {
              maskedCardNumber: '55555555******1002',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'UAB ZEN.COM',
            addressLine1: 'Konstitucijos av. 18B',
            addressLine2: 'LT-09308 Vilnius',
            account: null
          },
          reasonDescription: '(Transaction failed)',
          reasonCode: 'HRR_ECOM_E00066',
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          paymentSourceChannel: 'PTS_ETS_TOPUP'
        }
      },
      {
        id: '00000000-0000-7000-8000-000000000041',
        transaction: {
          original: {
            amount: 120.89,
            currency: 'USD'
          },
          settlement: {
            amount: 107.31,
            currency: 'EUR'
          },
          exchangeRate: '0.887690',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_EXCHANGE',
          transactionSubtype: null,
          status: 'HTS_ACCEPTED',
          title: 'Exchange USD to EUR',
          subTitle: null,
          createdAt: '2026-10-13T20:36:51Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4 10000 Example City',
            addressLine2: null,
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22XXX',
                direction: 'HTD_CREDIT'
              },
              {
                id: '00000000-0000-4000-8000-000000000002',
                number: 'LT463130000000000003',
                bic: 'BZENLT22XXX',
                direction: 'HTD_DEBIT'
              }
            ],
            card: null
          },
          party: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4 10000 Example City',
            addressLine2: null,
            account: {
              number: 'LT463130000000000003',
              bic: 'BZENLT22XXX'
            }
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {}
      },
      {
        id: '00000000-0000-3000-8000-000000000042',
        transaction: {
          original: {
            amount: 1.2,
            currency: 'EUR'
          },
          settlement: {
            amount: 1.2,
            currency: 'EUR'
          },
          exchangeRate: null,
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_FEE',
          transactionSubtype: 'HST_TRANSACTION_FEE',
          status: 'HTS_ACCEPTED',
          title: 'Fee for account top-up Mastercard **1002',
          subTitle: null,
          createdAt: '2026-10-13T20:22:02Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '55555555******1002',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'UAB ZEN.COM',
            addressLine1: 'Konstitucijos av. 18B',
            addressLine2: 'LT-09308 Vilnius',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {}
      },
      {
        id: '00000000-0000-7000-8000-000000000043',
        transaction: {
          original: {
            amount: 41.2,
            currency: 'EUR'
          },
          settlement: {
            amount: 41.2,
            currency: 'EUR'
          },
          exchangeRate: null,
          fee: {
            amount: {
              amount: 1.2,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_TOP_UP',
          transactionSubtype: 'TPM_CARD',
          status: 'HTS_ACCEPTED',
          title: 'ZEN account top-up Mastercard **1002',
          subTitle: null,
          createdAt: '2026-10-13T20:22:02Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              }
            ],
            card: {
              maskedCardNumber: '55555555******1002',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'UAB ZEN.COM',
            addressLine1: 'Konstitucijos av. 18B',
            addressLine2: 'LT-09308 Vilnius',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          paymentSourceChannel: 'PTS_ETS_TOPUP'
        }
      },
      {
        id: '00000000-0000-3000-8000-000000000044',
        transaction: {
          original: {
            amount: 18.9,
            currency: 'EUR'
          },
          settlement: {
            amount: 18.9,
            currency: 'EUR'
          },
          exchangeRate: null,
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_FEE',
          transactionSubtype: 'HST_TRANSACTION_FEE',
          status: 'HTS_ACCEPTED',
          title: 'Fee for account top-up Visa **1003',
          subTitle: null,
          createdAt: '2026-10-13T20:17:15Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '41111111******1003',
              cardAlias: null,
              type: 'Visa'
            }
          },
          party: {
            name: 'UAB ZEN.COM',
            addressLine1: 'Konstitucijos av. 18B',
            addressLine2: 'LT-09308 Vilnius',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {}
      },
      {
        id: '00000000-0000-7000-8000-000000000045',
        transaction: {
          original: {
            amount: 648.9,
            currency: 'EUR'
          },
          settlement: {
            amount: 648.9,
            currency: 'EUR'
          },
          exchangeRate: null,
          fee: {
            amount: {
              amount: 18.9,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_TOP_UP',
          transactionSubtype: 'TPM_CARD',
          status: 'HTS_ACCEPTED',
          title: 'ZEN account top-up Visa **1003',
          subTitle: null,
          createdAt: '2026-10-13T20:17:15Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              }
            ],
            card: {
              maskedCardNumber: '41111111******1003',
              cardAlias: null,
              type: 'Visa'
            }
          },
          party: {
            name: 'UAB ZEN.COM',
            addressLine1: 'Konstitucijos av. 18B',
            addressLine2: 'LT-09308 Vilnius',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          paymentSourceChannel: 'PTS_ETS_TOPUP'
        }
      }
    ],
    isLastPage: false
  },
  {
    historyEntries: [
      {
        id: '00000000-0000-7000-8000-000000000046',
        transaction: {
          original: {
            amount: 13.12,
            currency: 'USD'
          },
          settlement: {
            amount: 11.19,
            currency: 'EUR'
          },
          exchangeRate: '0.853396',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_EXCHANGE',
          transactionSubtype: 'HST_AUTO_EXCHANGE',
          status: 'HTS_ACCEPTED',
          title: 'Exchange USD to EUR',
          subTitle: '1 USD = 0.853396 EUR',
          createdAt: '2026-09-27T16:16:13Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              },
              {
                id: '00000000-0000-4000-8000-000000000002',
                number: 'GB45TCCL00000000000001',
                bic: 'TCCLGB3L',
                direction: 'HTD_DEBIT'
              }
            ],
            card: null
          },
          party: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            account: {
              number: 'GB45TCCL00000000000001',
              bic: 'TCCLGB3L'
            }
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: null
      },
      {
        id: '00000000-0000-3000-8000-000000000047',
        transaction: {
          original: {
            amount: 1309.65,
            currency: 'RSD'
          },
          settlement: {
            amount: 11.19,
            currency: 'EUR'
          },
          exchangeRate: '0.008544',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_PURCHASE',
          transactionSubtype: 'HST_CARD',
          status: 'HTS_ACCEPTED',
          title: '1004',
          subTitle: null,
          createdAt: '2026-09-27T16:16:12Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '555555******1004',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'MP101 OAZA',
            addressLine1: 'BEOGRAD',
            addressLine2: 'SRB',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          ecommerceTransaction: 'false'
        }
      },
      {
        id: '00000000-0000-7000-8000-000000000048',
        transaction: {
          original: {
            amount: 10.12,
            currency: 'USD'
          },
          settlement: {
            amount: 8.63,
            currency: 'EUR'
          },
          exchangeRate: '0.853399',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_EXCHANGE',
          transactionSubtype: 'HST_AUTO_EXCHANGE',
          status: 'HTS_ACCEPTED',
          title: 'Exchange USD to EUR',
          subTitle: '1 USD = 0.853399 EUR',
          createdAt: '2026-09-27T16:03:42Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              },
              {
                id: '00000000-0000-4000-8000-000000000002',
                number: 'GB45TCCL00000000000001',
                bic: 'TCCLGB3L',
                direction: 'HTD_DEBIT'
              }
            ],
            card: null
          },
          party: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            account: {
              number: 'GB45TCCL00000000000001',
              bic: 'TCCLGB3L'
            }
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: null
      },
      {
        id: '00000000-0000-3000-8000-000000000049',
        transaction: {
          original: {
            amount: 1010.0,
            currency: 'RSD'
          },
          settlement: {
            amount: 8.63,
            currency: 'EUR'
          },
          exchangeRate: '0.008545',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_PURCHASE',
          transactionSubtype: 'HST_CARD',
          status: 'HTS_ACCEPTED',
          title: '1004',
          subTitle: null,
          createdAt: '2026-09-27T16:03:42Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '555555******1004',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'DING YI FENG',
            addressLine1: 'BEOGRAD',
            addressLine2: 'SRB',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          ecommerceTransaction: 'false'
        }
      },
      {
        id: '00000000-0000-7000-8000-000000000050',
        transaction: {
          original: {
            amount: 10.72,
            currency: 'USD'
          },
          settlement: {
            amount: 9.14,
            currency: 'EUR'
          },
          exchangeRate: '0.853395',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_EXCHANGE',
          transactionSubtype: 'HST_AUTO_EXCHANGE',
          status: 'HTS_ACCEPTED',
          title: 'Exchange USD to EUR',
          subTitle: '1 USD = 0.853395 EUR',
          createdAt: '2026-09-27T15:53:48Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              },
              {
                id: '00000000-0000-4000-8000-000000000002',
                number: 'GB45TCCL00000000000001',
                bic: 'TCCLGB3L',
                direction: 'HTD_DEBIT'
              }
            ],
            card: null
          },
          party: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            account: {
              number: 'GB45TCCL00000000000001',
              bic: 'TCCLGB3L'
            }
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: null
      },
      {
        id: '00000000-0000-3000-8000-000000000051',
        transaction: {
          original: {
            amount: 1070.0,
            currency: 'RSD'
          },
          settlement: {
            amount: 9.14,
            currency: 'EUR'
          },
          exchangeRate: '0.008542',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_PURCHASE',
          transactionSubtype: 'HST_CARD',
          status: 'HTS_ACCEPTED',
          title: '1004',
          subTitle: null,
          createdAt: '2026-09-27T15:53:46Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '555555******1004',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'PANDA STYLE',
            addressLine1: 'BEOGRAD',
            addressLine2: 'SRB',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          ecommerceTransaction: 'false'
        }
      },
      {
        id: '00000000-0000-7000-8000-000000000052',
        transaction: {
          original: {
            amount: 122.67,
            currency: 'USD'
          },
          settlement: {
            amount: 104.68,
            currency: 'EUR'
          },
          exchangeRate: '0.853402',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_EXCHANGE',
          transactionSubtype: 'HST_AUTO_EXCHANGE',
          status: 'HTS_ACCEPTED',
          title: 'Exchange USD to EUR',
          subTitle: '1 USD = 0.853402 EUR',
          createdAt: '2026-09-27T12:39:00Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              },
              {
                id: '00000000-0000-4000-8000-000000000002',
                number: 'GB45TCCL00000000000001',
                bic: 'TCCLGB3L',
                direction: 'HTD_DEBIT'
              }
            ],
            card: null
          },
          party: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            account: {
              number: 'GB45TCCL00000000000001',
              bic: 'TCCLGB3L'
            }
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: null
      },
      {
        id: '00000000-0000-3000-8000-000000000053',
        transaction: {
          original: {
            amount: 12252.25,
            currency: 'RSD'
          },
          settlement: {
            amount: 104.68,
            currency: 'EUR'
          },
          exchangeRate: '0.008544',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_PURCHASE',
          transactionSubtype: 'HST_CARD',
          status: 'HTS_ACCEPTED',
          title: '1004',
          subTitle: null,
          createdAt: '2026-09-27T12:39:00Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '555555******1004',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'LIDL 156 BEOGRAD',
            addressLine1: 'BEOGRAD',
            addressLine2: 'SRB',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          ecommerceTransaction: 'false'
        }
      },
      {
        id: '00000000-0000-7000-8000-000000000054',
        transaction: {
          original: {
            amount: 34.71,
            currency: 'USD'
          },
          settlement: {
            amount: 30.16,
            currency: 'EUR'
          },
          exchangeRate: '0.869098',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_EXCHANGE',
          transactionSubtype: 'HST_AUTO_EXCHANGE',
          status: 'HTS_ACCEPTED',
          title: 'Exchange USD to EUR',
          subTitle: '1 USD = 0.869098 EUR',
          createdAt: '2026-09-26T12:30:44Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_CREDIT'
              },
              {
                id: '00000000-0000-4000-8000-000000000002',
                number: 'GB45TCCL00000000000001',
                bic: 'TCCLGB3L',
                direction: 'HTD_DEBIT'
              }
            ],
            card: null
          },
          party: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            account: {
              number: 'GB45TCCL00000000000001',
              bic: 'TCCLGB3L'
            }
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: null
      },
      {
        id: '00000000-0000-3000-8000-000000000055',
        transaction: {
          original: {
            amount: 3529.8,
            currency: 'RSD'
          },
          settlement: {
            amount: 30.16,
            currency: 'EUR'
          },
          exchangeRate: '0.008544',
          fee: {
            amount: {
              amount: 0.0,
              currency: 'EUR'
            },
            chargeType: null
          },
          transactionType: 'HTP_PURCHASE',
          transactionSubtype: 'HST_CARD',
          status: 'HTS_ACCEPTED',
          title: '1005',
          subTitle: null,
          createdAt: '2026-09-26T12:30:44Z',
          owner: {
            name: 'Alex Example',
            addressLine1: 'Example Street 12/4',
            addressLine2: '10000 Example City',
            accounts: [
              {
                id: '00000000-0000-4000-8000-000000000001',
                number: 'LT733130000000000002',
                bic: 'BZENLT22',
                direction: 'HTD_DEBIT'
              }
            ],
            card: {
              maskedCardNumber: '555555******1005',
              cardAlias: null,
              type: 'Mastercard'
            }
          },
          party: {
            name: 'Wolt doo',
            addressLine1: 'Belgrade',
            addressLine2: 'SRB',
            account: null
          },
          reasonDescription: null,
          reasonCode: null,
          externalTransactionUrl: null
        },
        action: null,
        tagMap: {
          ecommerceTransaction: 'true'
        }
      }
    ],
    isLastPage: false
  }
]
