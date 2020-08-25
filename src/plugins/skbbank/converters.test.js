import { convertAccount, convertCard, convertDeposit, convertTransaction } from './converters'

describe('convertCard', () => {
  it('should convert debit card account', () => {
    const account = convertCard({
      id: '4141414',
      state_description: 'Действующая',
      blocked: false,
      name: 'Mastercard Unembossed',
      customName: false,
      amount: 12345.00,
      currency: 'RUB',
      pan: '123456******7890',
      cardholderName: '',
      category: 'card',
      expDate: '2024-01-31',
      balance: 12345.00,
      availableBalance: 12345.00,
      holdAmount: 623.87,
      primaryAccount: '40817810700012345678',
      accountId: 85851280,
      tariffLink: 'https://www.skbbank.ru/chastnym-licam/karty/icard',
      cardId: '4141414',
      brand: 'Mastercard Unembossed',
      storedId: 31072020,
      limits: [],
      status: '00',
      status_desc: 'Карта не блокирована',
      state: '2',
      kind: 'debit',
      loan_funds: 0.00,
      own_funds: 12345.00,
      used_loan_funds: 0.00,
      smsPhone: '79000000000',
      smsType: null,
      packageCashBack: 'forbidden',
      packageFreeCashOut: 'off',
      packageServ: false,
      paymentSystem: 'MC',
      limit_set_available: false,
      own_customer_card: true,
      holder_name: 'Иванов Иван Иванович',
      smsNotify: 30.00,
      highCashBack: 30.00,
      freeWithdraw: 30.00,
      canViewCvv2: false,
      smsService: false
    })

    expect(account).toEqual({
      id: '40817810700012345678',
      type: 'ccard',
      title: 'Mastercard Unembossed',
      instrument: 'RUB',
      balance: 12345.00,
      creditLimit: 0,
      storedId: '31072020',
      syncID: [
        '7890'
      ]
    })
  })
})

describe('convertAccount', () => {
  it('should convert current account', () => {
    const account = convertAccount({
      id: 42424242,
      customName: false,
      name: 'Счет RUB',
      productName: 'Счет RUB',
      number: '40817810900087654321',
      state: 'Открыт',
      stateCode: 'open',
      amount: 1000.00,
      type: 'current',
      registryAmount: 0,
      registry2Amount: 0,
      balance: 1000.00,
      currency: 'RUB',
      availableBalance: 1000.00,
      availBalanceRub: 1000.00,
      startDate: '08.08.2020',
      order: 99,
      category: 'account',
      requisites: {
        bankName: 'ФИЛИАЛ "МОСКОВСКИЙ" ПАО "СКБ-БАНК"',
        address: 'Россия, 109004, Москва г, Москва г, Николоямская ул, д.40/22, корп.4',
        bic: '044520000',
        inn: '',
        kpp: '775002001',
        corrAccount: '30101810045250000472'
      },
      allowInPayments: true,
      allowOutPayments: true,
      allowLoanRepayment: true,
      tariffPlanName: 'Универсальный',
      tariffPlanCode: '',
      tariffPlanLinkToRules: '',
      specType: 'EX',
      mostActive: false,
      pdfLink: '/export/account/pdf?id=42424242',
      overdraft: false,
      sbpDefault: false,
      bonusProgramState: 'forbidden',
      availableBonuses: 0,
      accruedBonuses: 0,
      nextAccrualDate: null,
      lockedAmount: 0,
      canClose: true,
      bonusProgramGroup: {
        firstCategory: '0',
        secondCategory: '0',
        thirdCategory: '0',
        selectCategoryDate: null
      },
      petitionId: 850361797
    })

    expect(account).toEqual({
      id: '40817810900087654321',
      type: 'checking',
      title: 'Счет RUB',
      instrument: 'RUB',
      balance: 1000.00,
      creditLimit: 0,
      syncID: [
        '4321'
      ]
    })
  })
})

describe('convertDeposit', () => {
  it('should convert deposit', () => {
    const deposit = convertDeposit({
      id: 850348772,
      bank_system_id: '16748162',
      contract_number: '30016740929',
      contract_date: '08.08.2020',
      close_account: '40817810700012345678',
      capitalization: true,
      currency: 'RUB',
      opening_balance: 10000.00,
      min_balance: 10000.00,
      balance: 10000.00,
      percentPaidPeriod: 'В конце срока',
      duration: '270',
      open_date: '08.08.2020',
      end_date: '05.05.2021',
      early_close: true,
      rate: 5.2000,
      ratePeriods: [],
      balanceRub: 10000.00,
      account: '42305810330000000042',
      branch_id: 69559,
      allow_out_payments: false,
      allow_in_payments: false,
      percent_manageable: false,
      capital_manageable: false,
      percent_account: '42305810330000000042',
      auto_prolongation: false,
      state: 'open',
      state_description: 'Действующий',
      customName: false,
      name: 'Исполнение желаний + (срочный вклад)',
      productName: 'Исполнение желаний + (срочный вклад)',
      percent_paid: 0.00,
      percent_accrued: 0.00,
      requisites: {
        bankName: 'ФИЛИАЛ "МОСКОВСКИЙ" ПАО "СКБ-БАНК"',
        address: 'Россия, 109004, Москва г, Москва г, Николоямская ул, д.40/22, корп.4',
        bic: '044520000',
        inn: '',
        kpp: '775002001',
        corrAccount: '30101810045250000472'
      },
      petitionId: 850348751,
      interestType: null,
      charity: 'forbidden'
    })
    expect(deposit).toEqual({
      id: '42305810330000000042',
      type: 'deposit',
      title: 'Исполнение желаний + (срочный вклад)',
      instrument: 'RUB',
      balance: 10000,
      capitalization: true,
      percent: 5.2,
      startDate: '08.08.2020',
      payoffInterval: null,
      payoffStep: 0,
      endDateOffset: 270,
      endDateOffsetInterval: 'day',
      syncID: ['0042']
    })
  })
})

describe('convertTransaction', () => {
  it('should convert usual payment', () => {
    const transaction = convertTransaction({
      info: {
        id: 900000001,
        operationType: 'card_transaction',
        skbPaymentOperationType: null,
        subType: 'purchase',
        hasOfdReceipt: false
      },
      view: {
        operationIcon: 'https://ib.delo.ru/imgcache/br21046010ic350545280v0.png',
        descriptions: {
          operationDescription: 'Пятерочка',
          productDescription: 'Mastercard Unembossed',
          productType: 'С карты'
        },
        amounts: {
          amount: 789.67,
          currency: 'RUB',
          feeAmount: 0,
          feeCurrency: 'RUB',
          bonusAmount: 0,
          bonusCurrency: 'RUB',
          cashBackAmount: 0,
          cashBackCurrency: 'RUB'
        },
        mainRequisite: 'МСС: 5411',
        actions: ['sendCheck', 'print', 'dispute'],
        category: {
          id: 394010344,
          internalCode: 'supermarket',
          name: 'Супермаркеты'
        },
        state: 'accepted',
        dateCreated: '2020-08-09T17:55:44+05:00',
        payWallet: true,
        direction: 'debit',
        comment: null,
        productAccount: '40817810700012345678',
        productCardId: 85858585
      }
    })
    expect(transaction).toEqual({
      id: '900000001',
      hold: true,
      date: '2020-08-09T17:55:44+05:00',
      income: 0,
      incomeAccount: '40817810700012345678',
      mcc: 5411,
      outcome: 789.67,
      outcomeAccount: '40817810700012345678',
      payee: 'Пятерочка'
    })
  })

  it('should convert transfer', () => {
    const transaction = convertTransaction({
      info: {
        id: 900000001,
        operationType: 'payment',
        skbPaymentOperationType: 'transfer_rub',
        subType: 'transfer_rub',
        hasOfdReceipt: false
      },
      view: {
        operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846246.png',
        descriptions: {
          operationDescription: 'Между счетами',
          productDescription: 'Счет RUB',
          productType: 'Со счета'
        },
        amounts: {
          amount: 1000,
          currency: 'RUB',
          feeAmount: 0,
          feeCurrency: 'RUB',
          bonusAmount: 0,
          bonusCurrency: null,
          cashBackAmount: 0,
          cashBackCurrency: null
        },
        mainRequisite: 'На "Счет Mastercard Unembossed"',
        actions: ['sendCheck', 'print', 'toFavorite', 'repeatable'],
        category: {
          id: 394010367,
          internalCode: 'transfer',
          name: 'Переводы'
        },
        state: 'processed',
        dateCreated: '2020-08-09T19:23:32+05:00',
        payWallet: false,
        direction: 'internal',
        comment: null,
        productAccount: '40817810900016392697',
        productCardId: null
      },
      details: {
        actions: ['sendCheck', 'print', 'toFavorite', 'repeatable'],
        amount: 1000,
        'another-person-payment': null,
        bankSystemId: '6741705204',
        bonusAmount: null,
        category: {
          id: 394010367,
          name: 'Переводы'
        },
        charge: '2020-08-09T00:00:00+05:00',
        comment: null,
        controlValue: null,
        convAmount: null,
        convCurrency: null,
        counterpartyId: null,
        'create-date': '2020-08-09T19:23:32+05:00',
        currency: 'RUB',
        data_contacts: {},
        dateCreated: '2020-08-09T19:23:32+05:00',
        'debtor-city': null,
        'debtor-flat': null,
        'debtor-house': null,
        'debtor-inn': null,
        'debtor-kpp': null,
        'debtor-lastname': null,
        'debtor-middlename': null,
        'debtor-name': null,
        'debtor-nonResident': null,
        'debtor-street': null,
        'debtor-type': null,
        direction: 'internal',
        ekassir: false,
        feeAmount: 0,
        feeCurrency: 'RUB',
        fields: {},
        firstCurrency: null,
        icon: {
          hash: '1a751336e99fa57c3295ab785571db69',
          url: '/imgcache/bankData628293674_1a751336e99fa57c3295ab785571db69.png'
        },
        internalCode: null,
        kvvo: null,
        limit: null,
        linked_document_id: null,
        linked_document_type: null,
        mainRequisite: 'На "Счет Mastercard Unembossed"',
        nds: 20,
        ndsType: '3',
        operationDescription: 'Между счетами',
        operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846246.png',
        'order-date': '2020-08-09',
        orderedRequisites: [],
        originalRegistry: null,
        outdated: false,
        'payee-account': '40817810700012345678',
        'payee-bank-account': '30101810045250000000',
        'payee-bank-bic': '044520000',
        'payee-bank-name': 'ФИЛИАЛ "МОСКОВСКИЙ" ПАО "СКБ-БАНК"',
        'payee-card': null,
        'payee-card-id': null,
        'payee-card-mask-pan': null,
        'payee-inn': null,
        'payee-kpp': null,
        'payee-member-id': null,
        'payee-name': 'Иванов Иван Иванович',
        'payee-phone': null,
        'payer-account': '40817810900087654321',
        'payer-bank-account': '30101810045250000000',
        'payer-bank-bic': '044520000',
        'payer-bank-name': 'ФИЛИАЛ "МОСКОВСКИЙ" ПАО "СКБ-БАНК"',
        'payer-card': null,
        'payer-card-mask-pan': null,
        'payer-inn': null,
        'payer-kpp': null,
        'payment-date': null,
        'payment-kind': null,
        'payment-number': '3',
        'payment-operation-type': 'transfer',
        'payment-type': null,
        payout: null,
        'payout.date': null,
        'payout.type': null,
        pointOfInitiationMethod: null,
        priority: '5',
        productAccount: '40817810900087654321',
        productCardId: null,
        productDescription: 'Счет RUB',
        productType: 'Со счета',
        profit: null,
        purpose: 'Перевод между счетами.',
        purposeCode: null,
        qrIdentifier: null,
        rate: null,
        reason: null,
        registryPaidAmount: null,
        requisites: {},
        'rest-amount': null,
        revokeRejectReason: null,
        secondCurrency: 'RUB',
        skbPaymentOperationType: 'transfer_rub',
        state: 'processed',
        uin: null
      }
    })
    expect(transaction).toEqual({
      id: '900000001',
      hold: false,
      date: '2020-08-09T19:23:32+05:00',
      income: 1000,
      incomeAccount: '40817810900087654321',
      outcome: 1000,
      outcomeAccount: '40817810700012345678',
      comment: 'Между счетами'
    })
  })

  it('should convert payment in foreign currency', () => {
    const transaction = convertTransaction({
      info: {
        id: 347900002,
        operationType: 'card_transaction',
        skbPaymentOperationType: null,
        subType: 'purchase',
        hasOfdReceipt: false
      },
      view: {
        operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010347v11.png',
        descriptions: {
          operationDescription: 'RESTORAN "VASILKI"',
          productDescription: 'Mastercard Unembossed',
          productType: 'С карты'
        },
        amounts: {
          amount: 43.95,
          currency: 'BYN',
          feeAmount: 0,
          feeCurrency: 'RUB',
          bonusAmount: 0,
          bonusCurrency: 'RUB',
          cashBackAmount: 0,
          cashBackCurrency: 'RUB'
        },
        mainRequisite: 'МСС: 5812',
        actions: ['sendCheck', 'print'],
        category: {
          id: 394010347,
          internalCode: 'restaurant',
          name: 'Рестораны и кафе'
        },
        state: 'processed',
        dateCreated: '2020-07-21T22:17:05+05:00',
        payWallet: false,
        direction: 'debit',
        comment: null,
        productAccount: '40817810700012345678',
        productCardId: 85858585
      },
      details: {
        id: 347900002,
        payerAccount: '40817810700012345678',
        payerBic: '044520000',
        payeeAccount: null,
        payeeBic: null,
        dateCreated: '2020-07-21T22:17:05+05:00',
        chargeDate: '2020-07-23T00:19:04+05:00',
        cardId: 4141414,
        description: 'Оплата',
        amount: 43.95,
        currency: 'BYN',
        feeAmount: 0,
        feeCurrency: 'RUB',
        convAmount: 1430.9,
        convCurrency: 'RUB',
        terminal: {
          name: 'RESTORAN "VASILKI"',
          address: 'PR.MOSKOVSKIY,9/1',
          city: 'VITEBSK'
        },
        authCode: '777777',
        mccCode: '5812',
        purpose: 'Списание со счета по операции: Оплата RESTORAN "VASILKI"    \\PR.MOSKOVSKIY,9/1\\VITEBSK      \\210013    BLRBLR',
        state: 'processed',
        payWallet: false,
        payWalletDeviceName: null,
        payWalletType: null,
        firstCurrency: 'BYN',
        secondCurrency: 'RUB',
        rate: 32.56,
        cashBackAmount: 0,
        cashBackCurrency: 'RUB',
        bonusAmount: 0,
        bonusCurrency: 'RUB',
        operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010347v11.png',
        descriptions: {
          operationDescription: 'RESTORAN "VASILKI"',
          productDescription: 'Mastercard Unembossed',
          productType: 'С карты'
        },
        category: {
          id: 394010347,
          name: 'Рестораны и кафе'
        },
        direction: 'debit',
        mainRequisite: 'MCC: 5812',
        productAccount: '40817810700012345678',
        productCardId: 85858585,
        actions: ['sendCheck', 'print'],
        ofdReceipt: null
      }
    })
    expect(transaction).toEqual({
      id: '347900002',
      hold: false,
      date: '2020-07-21T22:17:05+05:00',
      income: 0,
      incomeAccount: '40817810700012345678',
      outcome: 1430.9,
      outcomeAccount: '40817810700012345678',
      mcc: 5812,
      opOutcome: 43.95,
      opOutcomeInstrument: 'BYN',
      payee: 'RESTORAN "VASILKI"'
    })
  })
  it('should convert account transaction', () => {
    const transaction = convertTransaction({
      info: {
        id: 850999999,
        operationType: 'account_transaction',
        skbPaymentOperationType: null,
        subType: 'transfer-own',
        hasOfdReceipt: false
      },
      view: {
        operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010367v11.png',
        descriptions: {
          operationDescription: 'Вклады: открытие вклада Исполнение желаний        +',
          productDescription: 'Счет Mastercard Unembossed',
          productType: 'Со счета карты'
        },
        amounts: {
          amount: 10000,
          currency: 'RUB',
          feeAmount: 0,
          feeCurrency: 'RUB',
          bonusAmount: 0,
          bonusCurrency: 'RUB',
          cashBackAmount: 0,
          cashBackCurrency: 'RUB'
        },
        mainRequisite: 'На "Исполнение желаний + (срочный вклад)"',
        actions: ['sendCheck', 'print'],
        category: {
          id: 394010367,
          internalCode: 'transfer',
          name: 'Переводы'
        },
        state: 'processed',
        dateCreated: '2020-08-07T16:16:16+05:00',
        payWallet: null,
        direction: 'internal',
        comment: null,
        productAccount: '40817810700012345678',
        productCardId: null
      },
      details: {
        actions: ['sendCheck', 'print'],
        amount: 10000,
        bankSystemId: '6741190000',
        category: {
          id: 394010367,
          internalCode: 'transfer',
          name: 'Переводы'
        },
        chargeDate: '2020-08-07T16:16:16+05:00',
        comment: 'Перевод между счетами через систему ДБО',
        convAmount: null,
        convCurrency: null,
        currency: 'RUB',
        dateCreated: '2020-08-07T16:16:16+05:00',
        descriptions: {
          operationDescription: 'Вклады: открытие вклада Исполнение желаний        +',
          productDescription: 'Счет Mastercard Unembossed',
          productType: 'Со счета карты'
        },
        direction: 'internal',
        feeAmount: 0,
        feeCurrency: 'RUB',
        firstCurrency: null,
        id: 850999999,
        mainRequisite: 'На "Исполнение желаний + (срочный вклад)"',
        operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010367v11.png',
        orderedRequisites: [],
        payeeAccount: '42305810330000000042',
        payeeBic: '044520000',
        payerAccount: '40817810700012345678',
        payerBic: '044520000',
        productAccount: '40817810700012345678',
        productCardId: null,
        rate: null,
        requisites: {},
        secondCurrency: null,
        state: 'processed',
        transactionType: 'transfer-own'
      }
    })
    expect(transaction).toEqual({
      id: '850999999',
      hold: false,
      date: '2020-08-07T16:16:16+05:00',
      income: 10000,
      incomeAccount: '40817810700012345678',
      outcome: 10000,
      outcomeAccount: '42305810330000000042',
      comment: 'Вклады: открытие вклада Исполнение желаний        +'
    })
  })

  it('should convert SBP transfer', () => {
    expect(convertTransaction({
      info:
        {
          id: 855984970,
          operationType: 'account_transaction',
          skbPaymentOperationType: null,
          subType: 'sbp_in',
          hasOfdReceipt: false
        },
      view:
        {
          operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846257.png',
          descriptions:
            {
              operationDescription: 'Николаев Николай Николаевич',
              productDescription: 'Счет Mastercard Unembossed',
              productType: 'На счет карты'
            },
          amounts:
            {
              amount: 10000,
              currency: 'RUB',
              feeAmount: 0,
              feeCurrency: 'RUB',
              bonusAmount: 0,
              bonusCurrency: 'RUB',
              cashBackAmount: 0,
              cashBackCurrency: 'RUB'
            },
          mainRequisite: 'Из АО "ТИНЬКОФФ БАНК"',
          actions: ['sendCheck', 'print', 'reversePayment'],
          category:
            {
              id: 394010366,
              internalCode: 'replenishment',
              name: 'Пополнения'
            },
          state: 'processed',
          dateCreated: '2020-08-20T11:08:36+05:00',
          payWallet: null,
          direction: 'credit',
          comment: 'Перевод с использованием Системы быстрых платежей',
          productAccount: '40817810100015387612',
          productCardId: null
        }
    })).toEqual({
      comment: 'Николаев Николай Николаевич',
      date: '2020-08-20T11:08:36+05:00',
      hold: false,
      id: '855984970',
      income: 10000,
      incomeAccount: '40817810100015387612',
      outcome: 0,
      outcomeAccount: '40817810100015387612'
    })
  })
})
