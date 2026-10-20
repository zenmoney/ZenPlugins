export const additionalHistory: unknown[] = [
  {
    id: '00000000-0000-764c-8000-000000001000',
    transaction: {
      original: {
        amount: 600,
        currency: 'USD'
      },
      settlement: {
        amount: 600,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Money transfer',
      subTitle: null,
      createdAt: '2026-09-23T17:39:22Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3LXXX',
            direction: 'HTD_CREDIT'
          }
        ],
        card: null
      },
      party: {
        name: 'Taylor Example',
        addressLine1: null,
        addressLine2: null,
        account: {
          number: 'GB00000000000000001000',
          bic: null
        }
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: {
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: {}
  },
  {
    id: '00000000-0000-7c80-8000-000000001001',
    transaction: {
      original: {
        amount: 600,
        currency: 'USD'
      },
      settlement: {
        amount: 600,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Money transfer',
      subTitle: null,
      createdAt: '2026-08-24T13:27:20Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3LXXX',
            direction: 'HTD_CREDIT'
          }
        ],
        card: null
      },
      party: {
        name: 'Taylor Example',
        addressLine1: null,
        addressLine2: null,
        account: {
          number: 'GB00000000000000001000',
          bic: null
        }
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: {
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: {}
  },
  {
    id: '00000000-0000-3d8c-8000-000000001002',
    transaction: {
      original: {
        amount: 25,
        currency: 'EUR'
      },
      settlement: {
        amount: 25,
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
      transactionType: 'HTP_MONEYSEND',
      transactionSubtype: 'HST_CARD',
      status: 'HTS_ACCEPTED',
      title: '1005',
      subTitle: null,
      createdAt: '2026-07-05T19:22:29Z',
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
          maskedCardNumber: '555555******1005',
          cardAlias: null,
          type: 'Mastercard'
        }
      },
      party: {
        name: 'P2P',
        addressLine1: 'YEREVAN',
        addressLine2: 'ARM',
        account: null
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: null,
    tagMap: {
      ecommerceTransaction: 'true',
      withdrawalValue: '0 EUR'
    }
  },
  {
    id: '00000000-0000-3af7-8000-000000001003',
    transaction: {
      original: {
        amount: 25,
        currency: 'AMD'
      },
      settlement: {
        amount: 0.06,
        currency: 'EUR'
      },
      exchangeRate: '0.002400',
      fee: {
        amount: {
          amount: 0,
          currency: 'EUR'
        },
        chargeType: null
      },
      transactionType: 'HTP_MONEYSEND',
      transactionSubtype: 'HST_CARD',
      status: 'HTS_ACCEPTED',
      title: '1005',
      subTitle: null,
      createdAt: '2026-07-05T19:21:08Z',
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
          maskedCardNumber: '555555******1005',
          cardAlias: null,
          type: 'Mastercard'
        }
      },
      party: {
        name: 'P2P',
        addressLine1: 'YEREVAN',
        addressLine2: 'ARM',
        account: null
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: null,
    tagMap: {
      ecommerceTransaction: 'true',
      withdrawalValue: '0 AMD'
    }
  },
  {
    id: '00000000-0000-7dfa-8000-000000001004',
    transaction: {
      original: {
        amount: 500,
        currency: 'USD'
      },
      settlement: {
        amount: 500,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Add reference',
      subTitle: null,
      createdAt: '2026-06-29T09:22:34Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3LXXX',
            direction: 'HTD_CREDIT'
          }
        ],
        card: null
      },
      party: {
        name: 'Taylor Example',
        addressLine1: null,
        addressLine2: null,
        account: {
          number: 'GB00000000000000001000',
          bic: null
        }
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: {
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: {}
  },
  {
    id: '00000000-0000-7bb5-8000-000000001005',
    transaction: {
      original: {
        amount: 900,
        currency: 'USD'
      },
      settlement: {
        amount: 900,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Add reference',
      subTitle: null,
      createdAt: '2026-06-15T09:18:03Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3LXXX',
            direction: 'HTD_CREDIT'
          }
        ],
        card: null
      },
      party: {
        name: 'Taylor Example',
        addressLine1: null,
        addressLine2: null,
        account: {
          number: 'GB00000000000000001000',
          bic: null
        }
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: {
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: {}
  },
  {
    id: '00000000-0000-3ce3-8000-000000001006',
    transaction: {
      original: {
        amount: 20000,
        currency: 'RSD'
      },
      settlement: {
        amount: 170.89,
        currency: 'EUR'
      },
      exchangeRate: '0.008544',
      fee: {
        amount: {
          amount: 0,
          currency: 'EUR'
        },
        chargeType: null
      },
      transactionType: 'HTP_WITHDRAWAL',
      transactionSubtype: 'HST_CARD',
      status: 'HTS_ACCEPTED',
      title: '1004',
      subTitle: null,
      createdAt: '2026-06-04T15:40:13Z',
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
        name: 'BEOGRAD BULEVAR',
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
      ecommerceTransaction: 'false',
      withdrawalValue: '0 RSD'
    }
  },
  {
    id: '00000000-0000-79d1-8000-000000001007',
    transaction: {
      original: {
        amount: 700,
        currency: 'USD'
      },
      settlement: {
        amount: 700,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Add reference',
      subTitle: null,
      createdAt: '2026-05-28T10:16:39Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3LXXX',
            direction: 'HTD_CREDIT'
          }
        ],
        card: null
      },
      party: {
        name: 'Taylor Example',
        addressLine1: null,
        addressLine2: null,
        account: {
          number: 'GB00000000000000001000',
          bic: null
        }
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: {
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: {}
  },
  {
    id: '00000000-0000-736e-8000-000000001008',
    transaction: {
      original: {
        amount: 1000,
        currency: 'USD'
      },
      settlement: {
        amount: 1000,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Add reference',
      subTitle: null,
      createdAt: '2026-04-27T11:19:56Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3LXXX',
            direction: 'HTD_CREDIT'
          }
        ],
        card: null
      },
      party: {
        name: 'Taylor Example',
        addressLine1: null,
        addressLine2: null,
        account: {
          number: 'GB00000000000000001000',
          bic: null
        }
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: {
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: {}
  },
  {
    id: '00000000-0000-760b-8000-000000001009',
    transaction: {
      original: {
        amount: 90,
        currency: 'EUR'
      },
      settlement: {
        amount: 90,
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
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: null,
      status: 'HTS_ACCEPTED',
      title: 'ALEX EXAMPLE',
      subTitle: null,
      createdAt: '2026-02-12T16:24:53Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
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
        name: 'ALEX EXAMPLE',
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
    tagMap: {}
  },
  {
    id: '00000000-0000-7aaa-8000-000000001010',
    transaction: {
      original: {
        amount: 900,
        currency: 'USD'
      },
      settlement: {
        amount: 900,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Add reference',
      subTitle: null,
      createdAt: '2026-01-26T15:15:59Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3LXXX',
            direction: 'HTD_CREDIT'
          }
        ],
        card: null
      },
      party: {
        name: 'Taylor Example',
        addressLine1: null,
        addressLine2: null,
        account: {
          number: 'GB00000000000000001000',
          bic: null
        }
      },
      reasonDescription: null,
      reasonCode: null,
      externalTransactionUrl: null
    },
    action: {
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: {}
  },
  {
    id: '00000000-0000-32ba-8000-000000001011',
    transaction: {
      original: {
        amount: 500,
        currency: 'USD'
      },
      settlement: {
        amount: 500,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Add reference',
      subTitle: null,
      createdAt: '2025-12-26T06:59:10Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: '10000 Example City',
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3L',
            direction: 'HTD_CREDIT'
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
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: null
  },
  {
    id: '00000000-0000-31ab-8000-000000001012',
    transaction: {
      original: {
        amount: 500,
        currency: 'USD'
      },
      settlement: {
        amount: 500,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Add reference',
      subTitle: null,
      createdAt: '2025-12-15T11:40:15Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: '10000 Example City',
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3L',
            direction: 'HTD_CREDIT'
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
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: null
  },
  {
    id: '00000000-0000-308d-8000-000000001013',
    transaction: {
      original: {
        amount: 500,
        currency: 'USD'
      },
      settlement: {
        amount: 500,
        currency: 'USD'
      },
      exchangeRate: '1.000000',
      fee: {
        amount: {
          amount: 0,
          currency: 'USD'
        },
        chargeType: null
      },
      transactionType: 'HTP_TRANSFER_IN',
      transactionSubtype: 'HST_BUDDY',
      status: 'HTS_ACCEPTED',
      title: 'Add reference',
      subTitle: null,
      createdAt: '2025-12-01T14:37:46Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: '10000 Example City',
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            number: 'GB45TCCL00000000000001',
            bic: 'TCCLGB3L',
            direction: 'HTD_CREDIT'
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
      repeatable: false,
      returnable: true,
      type: 'BUDDY_TRANSFER'
    },
    tagMap: null
  },
  {
    id: '00000000-0000-3af9-8000-000000001014',
    transaction: {
      original: {
        amount: 3.86,
        currency: 'EUR'
      },
      settlement: {
        amount: 3.86,
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
      transactionType: 'HTP_CORRECTION',
      transactionSubtype: null,
      status: 'HTS_ACCEPTED',
      title: 'Fee for ATM withdrawal',
      subTitle: null,
      createdAt: '2024-05-07T15:51:40Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            number: 'LT733130000000000002',
            bic: null,
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
    id: '00000000-0000-32ed-8000-000000001015',
    transaction: {
      original: {
        amount: 1.08,
        currency: 'EUR'
      },
      settlement: {
        amount: 1.08,
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
      transactionType: 'HTP_CORRECTION',
      transactionSubtype: null,
      status: 'HTS_ACCEPTED',
      title: 'Fee for ATM withdrawal',
      subTitle: null,
      createdAt: '2024-04-21T10:43:45Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            number: 'LT733130000000000002',
            bic: null,
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
    id: '00000000-0000-33e8-8000-000000001016',
    transaction: {
      original: {
        amount: 1.5,
        currency: 'ILS'
      },
      settlement: {
        amount: 1.5,
        currency: 'ILS'
      },
      exchangeRate: null,
      fee: {
        amount: {
          amount: 0,
          currency: 'ILS'
        },
        chargeType: null
      },
      transactionType: 'HTP_CORRECTION',
      transactionSubtype: null,
      status: 'HTS_ACCEPTED',
      title: 'Fee for ATM withdrawal',
      subTitle: null,
      createdAt: '2024-03-11T16:24:32Z',
      owner: {
        name: 'Alex Example',
        addressLine1: 'Example Street 12/4',
        addressLine2: null,
        accounts: [
          {
            id: '00000000-0000-4000-8000-000000000016',
            number: 'LT000000000000001002',
            bic: null,
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
  }
]
