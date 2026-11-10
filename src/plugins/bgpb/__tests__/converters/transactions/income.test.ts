import { ExtendedTransaction } from '../../../../../types/zenmoney'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { convertTransaction, transactionsUnique } = require('../../../converters') as {
  convertTransaction: (record: unknown, account: { id: string, instrument: string }) => ExtendedTransaction
  transactionsUnique: (transactions: ExtendedTransaction[]) => ExtendedTransaction[]
}

it('keeps distinct statement credits whose authorization cells contain only a newline', () => {
  // mail_inbound 203468, bgpb build 155, response 5: complete parsed statement records.
  // ID-001: a whitespace-only HTML cell is not a bank identifier. Card suffix anonymized for master.
  const records = [
    {
      cardNum: '1234',
      date: '30.10.2026 00:00',
      description: 'Зачисление безналичных поступлений на счет от ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ФЛЕКСИТЕЧ"',
      type: 'ЗАЧИСЛЕНИЕ',
      amountReal: '2 842,53',
      currencyReal: 'BYN',
      amount: '2 842,53',
      currency: 'BYN',
      place: '',
      authCode: '\n',
      mcc: null
    },
    {
      cardNum: '1234',
      date: '30.10.2026 00:00',
      description: 'Зачисление безналичных поступлений на счет от ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ФЛЕКСИТЕЧ"',
      type: 'ЗАЧИСЛЕНИЕ',
      amountReal: '100,00',
      currencyReal: 'BYN',
      amount: '100,00',
      currency: 'BYN',
      place: '',
      authCode: '\n',
      mcc: null
    }
  ]
  const transactions = records.map(record => convertTransaction(record, { id: 'card-public', instrument: 'BYN' }))
  expect(transactionsUnique(transactions)).toEqual([
    {
      date: new Date('2026-10-29T21:00:00.000Z'),
      movements: [{
        id: 'bgpb:card-public:2026-10-29T21:00:posted:2842.53:Зачисление безналичных поступлений на счет от ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ФЛЕКСИТЕЧ":card',
        account: { id: 'card-public' },
        invoice: null,
        sum: 2842.53,
        fee: 0
      }],
      merchant: null,
      comment: 'Зачисление безналичных поступлений на счет от ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ФЛЕКСИТЕЧ"',
      hold: false
    },
    {
      date: new Date('2026-10-29T21:00:00.000Z'),
      movements: [{
        id: 'bgpb:card-public:2026-10-29T21:00:posted:100:Зачисление безналичных поступлений на счет от ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ФЛЕКСИТЕЧ":card',
        account: { id: 'card-public' },
        invoice: null,
        sum: 100,
        fee: 0
      }],
      merchant: null,
      comment: 'Зачисление безналичных поступлений на счет от ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ФЛЕКСИТЕЧ"',
      hold: false
    }
  ])
})
