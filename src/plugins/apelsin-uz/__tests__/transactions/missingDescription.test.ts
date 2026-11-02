export {}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { convertAccountTransaction } = require('../../converters') as {
  convertAccountTransaction: (account: { id: string, instrument: string }, operation: unknown) => unknown
}

it('preserves an account debit with a null description', () => {
  // Log 192762, apelsin-uz build 71: complete account-history record.
  // Account identifiers are replaced for the public fixture; field presence is unchanged.
  const operation = {
    amount: -50607396,
    currency: { uzscurrency: true, name: 'UZS', scale: 2 },
    date: 1786906800000,
    docId: '2872939243',
    docType: '06',
    docNum: '78193865',
    details: null,
    corrId: '15422360',
    corrName: 'К зачислениям на карту по депозитным сделкам',
    corrMfo: '01190',
    corrInn: '309016201',
    corrAcct: '23118000900000000001',
    corrBank: 'ТОШКЕНТ Ш., "UZUM BANK" АЖ "UZUM" ФИЛИАЛИ'
  }
  expect(convertAccountTransaction({ id: 'account', instrument: 'UZS' }, operation)).toEqual({
    date: new Date('2026-08-16T19:00:00.000Z'),
    hold: false,
    merchant: null,
    movements: [{
      id: '2872939243',
      account: { id: 'account' },
      invoice: null,
      sum: -506073.96,
      fee: 0
    }],
    comment: null
  })
})
