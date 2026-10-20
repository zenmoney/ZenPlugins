export const terminalHistory: unknown = {
  historyEntries: [
    {
      id: '00000000-0000-41f6-8000-000000001017',
      transaction: {
        original: {
          amount: 102,
          currency: 'EUR'
        },
        settlement: {
          amount: 102,
          currency: 'EUR'
        },
        exchangeRate: null,
        fee: {
          amount: {
            amount: 2,
            currency: 'EUR'
          },
          chargeType: null
        },
        transactionType: 'HTP_TOP_UP',
        transactionSubtype: 'TPM_DRAGON',
        status: 'HTS_REJECTED',
        title: 'ZEN account top-up Digital Currency',
        subTitle: null,
        createdAt: '2023-10-31T20:39:44Z',
        owner: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: null,
          accounts: [
            {
              id: '00000000-0000-4000-8000-000000000001',
              number: 'LT733130000000000002',
              bic: 'BZENLT22',
              direction: 'HTD_CREDIT'
            }
          ],
          card: {
            maskedCardNumber: null,
            cardAlias: null,
            type: 'Mastercard'
          }
        },
        party: {
          name: 'ZEN.COM UAB',
          addressLine1: 'Lvivo g. 25-104',
          addressLine2: 'LT-09320 Vilnius',
          account: null
        },
        reasonDescription: '(Transaction time expired)',
        reasonCode: 'HRR_TOPUP_CT0002',
        externalTransactionUrl: null
      },
      action: null,
      tagMap: null
    },
    {
      id: '00000000-0000-39c5-8000-000000001018',
      transaction: {
        original: {
          amount: 11.63,
          currency: 'EUR'
        },
        settlement: {
          amount: 11.63,
          currency: 'EUR'
        },
        exchangeRate: '1.000000',
        fee: {
          amount: {
            amount: 0,
            currency: 'EUR'
          },
          chargeType: null
        },
        transactionType: 'HTP_PURCHASE',
        transactionSubtype: 'HST_CARD',
        status: 'HTS_ACCEPTED',
        title: '1005',
        subTitle: null,
        createdAt: '2023-10-13T21:05:32Z',
        owner: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: null,
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
          name: 'ITLDC.COM',
          addressLine1: 'ORLANDO',
          addressLine2: 'USA',
          account: null
        },
        reasonDescription: null,
        reasonCode: null,
        externalTransactionUrl: null
      },
      action: null,
      tagMap: null
    },
    {
      id: '00000000-0000-4588-8000-000000001019',
      transaction: {
        original: {
          amount: 100,
          currency: 'ILS'
        },
        settlement: {
          amount: 23.06,
          currency: 'EUR'
        },
        exchangeRate: '0.230600',
        fee: {
          amount: {
            amount: 0,
            currency: 'EUR'
          },
          chargeType: null
        },
        transactionType: 'HTP_EXCHANGE',
        transactionSubtype: null,
        status: 'HTS_ACCEPTED',
        title: 'Exchange ILS to EUR',
        subTitle: null,
        createdAt: '2023-10-13T21:05:07Z',
        owner: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: '10000 Example City',
          accounts: [
            {
              id: '00000000-0000-4000-8000-000000000001',
              number: 'LT733130000000000002',
              bic: 'BZENLT22XXX',
              direction: 'HTD_CREDIT'
            },
            {
              id: '00000000-0000-4000-8000-000000000016',
              number: 'LT000000000000001002',
              bic: 'BZENLT22XXX',
              direction: 'HTD_DEBIT'
            }
          ],
          card: null
        },
        party: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: '',
          account: {
            number: 'LT000000000000001002',
            bic: 'BZENLT22XXX'
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
      id: '00000000-0000-338b-8000-000000001020',
      transaction: {
        original: {
          amount: 11.63,
          currency: 'EUR'
        },
        settlement: {
          amount: 11.63,
          currency: 'EUR'
        },
        exchangeRate: '1.000000',
        fee: {
          amount: {
            amount: 0,
            currency: 'EUR'
          },
          chargeType: null
        },
        transactionType: 'HTP_PURCHASE',
        transactionSubtype: 'HST_CARD',
        status: 'HTS_REJECTED',
        title: '1005',
        subTitle: null,
        createdAt: '2023-10-13T21:03:29Z',
        owner: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: null,
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
          name: 'ITLDC.COM',
          addressLine1: 'USA',
          addressLine2: 'USA',
          account: null
        },
        reasonDescription: '(Not enough funds on your account)',
        reasonCode: 'HRR_CARD_0003',
        externalTransactionUrl: null
      },
      action: null,
      tagMap: null
    },
    {
      id: '00000000-0000-3596-8000-000000001021',
      transaction: {
        original: {
          amount: 10,
          currency: 'ILS'
        },
        settlement: {
          amount: 10,
          currency: 'ILS'
        },
        exchangeRate: '1.000000',
        fee: {
          amount: {
            amount: 0,
            currency: 'ILS'
          },
          chargeType: null
        },
        transactionType: 'HTP_PURCHASE',
        transactionSubtype: 'HST_CARD',
        status: 'HTS_ACCEPTED',
        title: '1005',
        subTitle: null,
        createdAt: '2023-10-02T16:06:01Z',
        owner: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: null,
          accounts: [
            {
              id: '00000000-0000-4000-8000-000000000016',
              number: 'GB45TCCL00000000000001',
              bic: 'TCCLGB3L',
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
          name: 'PAUSE 24/7',
          addressLine1: 'NATANYA',
          addressLine2: 'ISR',
          account: null
        },
        reasonDescription: null,
        reasonCode: null,
        externalTransactionUrl: null
      },
      action: null,
      tagMap: null
    },
    {
      id: '00000000-0000-4ffd-8000-000000001022',
      transaction: {
        original: {
          amount: 99.9,
          currency: 'EUR'
        },
        settlement: {
          amount: 400.28,
          currency: 'ILS'
        },
        exchangeRate: '4.006842',
        fee: {
          amount: {
            amount: 0,
            currency: 'ILS'
          },
          chargeType: null
        },
        transactionType: 'HTP_EXCHANGE',
        transactionSubtype: null,
        status: 'HTS_ACCEPTED',
        title: 'Exchange EUR to ILS',
        subTitle: null,
        createdAt: '2023-10-02T12:24:09Z',
        owner: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: '10000 Example City',
          accounts: [
            {
              id: '00000000-0000-4000-8000-000000000016',
              number: 'LT000000000000001002',
              bic: 'BZENLT22XXX',
              direction: 'HTD_CREDIT'
            },
            {
              id: '00000000-0000-4000-8000-000000000001',
              number: 'LT733130000000000002',
              bic: 'BZENLT22XXX',
              direction: 'HTD_DEBIT'
            }
          ],
          card: null
        },
        party: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: '',
          account: {
            number: 'LT733130000000000002',
            bic: 'BZENLT22XXX'
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
      id: '00000000-0000-3a95-8000-000000001023',
      transaction: {
        original: {
          amount: 0.1,
          currency: 'EUR'
        },
        settlement: {
          amount: 0.1,
          currency: 'EUR'
        },
        exchangeRate: null,
        fee: {
          amount: {
            amount: 0,
            currency: 'EUR'
          },
          chargeType: null
        },
        transactionType: 'HTP_FEE',
        transactionSubtype: 'HST_TRANSACTION_FEE',
        status: 'HTS_ACCEPTED',
        title: 'Fee for processing transaction',
        subTitle: null,
        createdAt: '2023-10-02T05:50:01Z',
        owner: {
          name: 'Alex Example',
          addressLine1: null,
          addressLine2: null,
          accounts: [
            {
              id: '00000000-0000-4000-8000-000000000001',
              number: 'LT733130000000000002',
              bic: 'BZENLT22XXX',
              direction: 'HTD_DEBIT'
            }
          ],
          card: null
        },
        party: {
          name: 'ZEN.COM UAB',
          addressLine1: 'Lvivo g. 25-104',
          addressLine2: 'LT-09320 Vilnius',
          account: null
        },
        reasonDescription: null,
        reasonCode: null,
        externalTransactionUrl: null
      },
      action: null,
      tagMap: null
    },
    {
      id: '00000000-0000-47d1-8000-000000001024',
      transaction: {
        original: {
          amount: 100,
          currency: 'EUR'
        },
        settlement: {
          amount: 100,
          currency: 'EUR'
        },
        exchangeRate: '1.000000',
        fee: {
          amount: {
            amount: 0.1,
            currency: 'EUR'
          },
          chargeType: null
        },
        transactionType: 'HTP_TRANSFER_IN',
        transactionSubtype: null,
        status: 'HTS_ACCEPTED',
        title: 'VARYANITSA KONSTANTIN',
        subTitle: null,
        createdAt: '2023-10-02T05:50:01Z',
        owner: {
          name: 'Alex Example',
          addressLine1: null,
          addressLine2: null,
          accounts: [
            {
              id: '00000000-0000-4000-8000-000000000001',
              number: 'LT733130000000000002',
              bic: 'BZENLT22XXX',
              direction: 'HTD_CREDIT'
            }
          ],
          card: null
        },
        party: {
          name: 'Alex Example',
          addressLine1: 'Example Street 12/4',
          addressLine2: null,
          account: {
            number: 'BE00000000001001',
            bic: 'TRWIBEB1XXX'
          }
        },
        reasonDescription: null,
        reasonCode: null,
        externalTransactionUrl: null
      },
      action: {
        repeatable: false,
        returnable: true,
        type: 'PAYMENT'
      },
      tagMap: null
    }
  ],
  isLastPage: true
}
