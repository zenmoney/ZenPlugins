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
    ]
  ])('converts Deposit', (rawTransaction, transaction) => {
    expect(convertAccounts(rawTransaction)).toEqual(transaction)
  })
})
