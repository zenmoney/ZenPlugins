import { convertAccount, convertTransaction } from './converters'

describe('convertAccount', () => {
  it('should convert checking account', () => {
    const account = convertAccount({
      accountName: 'Расчётный счёт',
      balance: 100,
      bankBic: '044525092',
      bankCorrespondentAccount: '30101810645250000092',
      bankInn: '2204000595',
      bankKpp: '771543001',
      bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
      beginDate: '2018-08-31T00:00:00',
      category: 'CheckingAccount',
      currency: 'RUR',
      id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      number: '408029745770013057848',
      status: 'New'
    })

    expect(account).toEqual({
      id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      title: 'Расчётный счёт',
      syncID: [
        '7848'
      ],
      type: 'checking',
      instrument: 'RUB',
      balance: 100,
      startBalance: 0,
      creditLimit: 0,
      savings: false
    })
  })

  it('should convert card account', () => {
    const account = convertAccount({
      accountName: 'Карточный счёт',
      balance: 100,
      bankBic: '044525092',
      bankCorrespondentAccount: '30101810645250000092',
      bankInn: '2204000595',
      bankKpp: '771543001',
      bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
      beginDate: '2018-08-31T00:00:00',
      category: 'CardAccount',
      currency: 'EUR',
      id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      number: '408029745770013057348'
    })

    expect(account).toEqual({
      id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      title: 'Карточный счёт',
      syncID: [
        '7348'
      ],
      type: 'ccard',
      instrument: 'EUR',
      balance: 100,
      startBalance: 0,
      creditLimit: 0,
      savings: false

    })
  })
})

describe('convertTransaction', () => {
  it('should convert regular transaction', () => {
    const account = convertAccount({
      accountName: 'Карточный счёт',
      balance: 100,
      bankBic: '044525092',
      bankCorrespondentAccount: '30101810645250000092',
      bankInn: '2204000595',
      bankKpp: '771543001',
      bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
      beginDate: '2018-08-31T00:00:00',
      category: 'CardAccount',
      currency: 'EUR',
      id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      number: '408029745770013357312'
    })

    const transaction = convertTransaction({
      id: '0583f13d-d676-4012-aa8e-75bd31f6ceff',
      companyId: '750f0748-fd02-4b98-ac59-30b87d3f591a',
      status: 'Executed',
      category: 'Credit',
      contragentName: 'Черепанов Сергей Анатольевич',
      contragentInn: '',
      contragentKpp: '',
      contragentBankAccountNumber: '408029745770013057348',
      contragentBankName: 'ТОЧКА ПАО БАНКА "ФК ОТКРЫТИЕ"',
      contragentBankBic: '044525999',
      currency: 'RUR',
      amount: 170000.0,
      bankAccountNumber: '408029745770013357312',
      paymentPurpose: 'Перечисление на собственный счет. Без НДС',
      executed: '2018-01-01T00:00:00',
      created: '2018-01-01T16:49:56.145',
      docNumber: '430612',
      absId: '10368387323',
      kbk: '',
      oktmo: '',
      paymentBasis: '',
      taxCode: '',
      taxDocNum: '',
      taxDocDate: '',
      payerStatus: '',
      uin: '0'
    }, [account])
    expect(transaction).toEqual({
      id: '0583f13d-d676-4012-aa8e-75bd31f6ceff',
      date: new Date('2018-01-01T00:00:00'),
      income: 0,
      incomeAccount: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      outcome: 170000.0,
      opOutcomeInstrument: 'RUB',
      outcomeAccount: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      payee: 'Черепанов Сергей Анатольевич'
    })
  })

  it('should convert regular transaction', () => {
    const account = convertAccount({
      accountName: 'Карточный счёт',
      balance: 100,
      bankBic: '044525092',
      bankCorrespondentAccount: '30101810645250000092',
      bankInn: '2204000595',
      bankKpp: '771543001',
      bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
      beginDate: '2018-08-31T00:00:00',
      category: 'CardAccount',
      currency: 'EUR',
      id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      number: '408029745770013357312'
    })

    const transaction = convertTransaction({
      id: '724fb8c2-2c35-4a82-a983-e48c9847f692',
      companyId: '750f0748-fd02-4b98-ac59-30b87d3f591a',
      status: 'Received',
      category: 'Debet',
      contragentInn: '2204000595',
      contragentKpp: '771543001',
      contragentName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
      contragentBankAccountNumber: '70606810670013121284',
      contragentBankBic: '044525092',
      contragentBankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
      currency: 'USD',
      amount: 9.65,
      bankAccountNumber: '408029745770013357312',
      paymentPurpose: '{VO80150} Уплачены проценты за Июль     2018 г  Индивидуальный предприниматель Черепанов Сергей Анатольевич',
      executed: '2018-07-31T00:00:00',
      created: '2018-01-01T16:49:56.145',
      docNumber: '430612',
      absId: '10368387323',
      kbk: '',
      oktmo: '',
      paymentBasis: '',
      taxCode: '',
      taxDocNum: '',
      taxDocDate: '',
      payerStatus: '',
      uin: '0'
    }, [account])
    expect(transaction).toEqual({
      id: '724fb8c2-2c35-4a82-a983-e48c9847f692',
      date: new Date('2018-07-31T00:00:00'),
      income: 9.65,
      incomeAccount: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      opIncomeInstrument: 'USD',
      outcome: 0,
      outcomeAccount: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
      payee: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"'
    })
  })
})
