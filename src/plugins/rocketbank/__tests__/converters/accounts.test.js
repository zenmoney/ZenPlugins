import { convertAccount } from '../../converters'

const accounts = {
  'safeAccounts': [
    [
      {
        token: 'f46771c2549898b05c79155931d00e11',
        title: 'Евровая карта',
        bank: 'rocket',
        status: 'active',
        balance: 0,
        account_details:
        {
          bank_name: 'Ф Рокетбанк КИВИ Банк (АО)',
          account: '40817978060000065027',
          bic: '044525420',
          inn: '3123011520',
          kpp: '772643002',
          ks: '30101810945250000420',
          goal: 'Own funds transfer FIO. Without VAT',
          owner: '<string[27]>',
          corr: null,
          corr_swift: null,
          benef_bank: null,
          benef_bank_address: null
        },
        currency: 'EUR',
        url: 'https://rocketbank.ru/rocket-tariffs/account-eur?app=1',
        close_text: 'Остаток будет переведён на рублёвую карту, а счёт закрыт в течение 15 минут'
      },
      {
        'balance': 0,
        'id': 'f46771c2549898b05c79155931d00e11',
        'instrument': 'EUR',
        'syncID': ['5027'],
        'title': 'Евровая карта',
        'type': 'checking'
      }
    ]
  ]
}

describe('convertAccount', () => {
  Object.keys(accounts).forEach(type => {
    for (let i = 0; i < accounts[type].length; i++) {
      const num = accounts[type].length > 1 ? '#' + (i + 1) : ''
      it(`should convert '${type}' ${num}`, () => {
        expect(
          convertAccount(accounts[type][i][0])
        ).toEqual(
          accounts[type][i][1]
        )
      })
    }
  })
})
