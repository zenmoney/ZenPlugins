import { convertTransaction } from '../../converters'

const transactions = {
  'income': [
    [
      {
        'transaction_id': 133176742,
        'transaction_type': 2,
        'title': '01.07.2019  DO AKVAMOLL UL\' YANOVSK ',
        'description': '01.07.2019 DO AKVAMOLL UL \'YANOVSK\nСумма: 18000,00 Р',
        'bank_name': 'Филиал Центральный ПАО Банка «ФК Открытие»',
        'status_string': 'Принято',
        'bic': '044525297',
        'inn': '7706092528',
        'cor_account': '30101810945250000297',
        'is_create_receipt_available': 0,
        'transaction_status': 2,
        'transaction_date': '2019-07-01T19:50:53',
        'short_transaction_date': '2019-07-01T00:00:00',
        'transaction_currency': 'RUR',
        'value_transaction_currency': 18000,
        'is_create_template_available': 0,
        'original_amount': 0
      },
      {
        'comment': '01.07.2019  DO AKVAMOLL UL\' YANOVSK ',
        'date': 1561999853000,
        'hold': true,
        'income': 18000,
        'incomeAccount': 'accountId',
        'incomeBankID': '133176742',
        'outcome': 0,
        'outcomeAccount': 'accountId',
        'payee': '',
        'time': '19:50:53'
      }
    ]
  ]
}

describe('convertTransaction', () => {
  Object.keys(transactions).forEach(type => {
    for (let i = 0; i < transactions[type].length; i++) {
      const num = transactions[type].length > 1 ? '#' + i : ''
      it(`should convert '${type}' ${num}`, () => {
        expect(
          convertTransaction(transactions[type][i][0], 'accountId')
        ).toEqual(
          transactions[type][i][1]
        )
      })
    }
  })
})

xdescribe('convertOneTransaction', () => {
  const type = ' '
  const num = 0
  it(`should convert '${type}' ${num}`, () => {
    expect(
      convertTransaction(transactions[type][num][0])
    ).toEqual(
      transactions[type][num][1]
    )
  })
})
