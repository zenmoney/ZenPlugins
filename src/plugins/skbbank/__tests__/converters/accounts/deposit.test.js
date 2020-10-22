import { convertAccounts } from '../../../converters'

describe('convertDeposit', () => {
  it.each([
    [
      {
        accounts: [],
        cards: [],
        loans: [],
        deposits:
          [
            {
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
            }
          ]
      },
      [
        {
          id: '42305810330000000042',
          type: 'deposit',
          title: 'Исполнение желаний + (срочный вклад)',
          instrument: 'RUB',
          balance: 10000,
          capitalization: true,
          percent: 5.2,
          startDate: new Date('2020-08-07T21:00:00.000Z'),
          startBalance: 10000,
          payoffInterval: null,
          payoffStep: 0,
          endDateOffset: 270,
          endDateOffsetInterval: 'day',
          syncIds: ['42305810330000000042']
        }
      ]
    ],
    [
      {
        deposits: [
          {
            id: 251784059,
            bank_system_id: '1925799',
            contract_number: '9132536530',
            contract_date: '24.04.2008',
            close_account: null,
            capitalization: false,
            currency: 'RUB',
            opening_balance: 0,
            min_balance: 0,
            balance: 0,
            percentPaidPeriod: 'Ежеквартально',
            duration: null,
            open_date: '24.04.2008',
            end_date: null,
            early_close: true,
            rate: 0.01,
            ratePeriods: [],
            balanceRub: 0,
            account: '42301810922701195580',
            branch_id: 69508,
            allow_out_payments: true,
            allow_in_payments: true,
            percent_manageable: false,
            capital_manageable: false,
            percent_account: '42301810922701195580',
            auto_prolongation: false,
            state: 'open',
            state_description: 'Действующий',
            customName: false,
            name: 'Вклад до востребования',
            productName: 'Вклад до востребования',
            percent_paid: 0,
            percent_accrued: 0,
            requisites:
              {
                bankName: 'ПАО "СКБ-БАНК"',
                address: 'Россия, 628611, Ханты-Мансийский Автономный округ - Югра АО, Нижневартовск г, Нефтяников ул, д.68',
                bic: '046577756',
                inn: '6608003052',
                kpp: '668501001',
                corrAccount: '30101810800000000756'
              },
            petitionId: null,
            interestType: null,
            charity: 'forbidden'
          }
        ]
      },
      [
        {
          id: '42301810922701195580',
          type: 'deposit',
          title: 'Вклад до востребования',
          instrument: 'RUB',
          balance: 0,
          capitalization: false,
          percent: 0.01,
          startDate: new Date('2008-04-23T21:00:00.000Z'),
          startBalance: 0,
          payoffInterval: 'month',
          payoffStep: 1,
          endDateOffset: 1,
          endDateOffsetInterval: 'year',
          syncIds: ['42301810922701195580']
        }
      ]
    ]
  ])('converts deposit', (rawTransaction, transaction) => {
    expect(convertAccounts(rawTransaction)).toEqual(transaction)
  })
})
