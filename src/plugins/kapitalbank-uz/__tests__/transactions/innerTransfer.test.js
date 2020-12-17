import { convertAccountTransaction } from '../../converters'

describe('convertInnerTransaction', () => {
  it.each([
    [
      {
        amount: 10000,
        currency: { name: 'USD', scale: 2 },
        date: 1531249200000,
        docId: '38773',
        docType: '06',
        docNum: '1',
        details: '200010000020Взнос ср-в на СКС ПК VISA CLASSIC NIKOLAEV NIKOLAY NIKOLAEVICH',
        corrId: '25929',
        corrName: 'Кассовая наличность в долларах США 207275139',
        corrMfo: '01158',
        corrInn: '',
        corrAcct: '10101840500001158001',
        corrBank: 'ТОШКЕНТ Ш., "КАПИТАЛБАНК" АТ БАНКИНИНГ "КАПИТАЛ 24" ЧАКАНА БИЗНЕС ФИЛИАЛИ'
      },
      {
        date: new Date('2018-07-10T19:00:00.000Z'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: '38773',
              account: { id: 'account' },
              invoice: null,
              sum: 100,
              fee: 0
            }
          ],
        comment: '200010000020Взнос ср-в на СКС ПК VISA CLASSIC NIKOLAEV NIKOLAY NIKOLAEVICH',
        groupKeys: [
          '2018-07-11_USD_100'
        ]
      }
    ],
    [
      {
        amount: -10000,
        currency: { name: 'USD', scale: 2 },
        date: 1531249200000,
        docId: '38778',
        docType: '06',
        docNum: '1',
        details: '309980000Взнос ср-в на СКС ПК VISA CLASSIC NIKOLAEV NIKOLAY NIKOLAEVICH',
        corrId: '37274',
        corrName: 'Visa Classic (дебетовая)/098/098VC/04.07.2018 000000000',
        corrMfo: '01158',
        corrInn: '',
        corrAcct: '22618840999001379001',
        corrBank: 'ТОШКЕНТ Ш., "КАПИТАЛБАНК" АТ БАНКИНИНГ "КАПИТАЛ 24" ЧАКАНА БИЗНЕС ФИЛИАЛИ'
      },
      {
        date: new Date('2018-07-10T19:00:00.000Z'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: '38778',
              account: { id: 'account' },
              invoice: null,
              sum: -100,
              fee: 0
            }
          ],
        comment: '309980000Взнос ср-в на СКС ПК VISA CLASSIC NIKOLAEV NIKOLAY NIKOLAEVICH',
        groupKeys: [
          '2018-07-11_USD_100'
        ]
      }
    ]
  ])('converts innerTransfer to Account USD', (rawTransaction, transaction) => {
    const account = { id: 'account', instrument: 'USD' }
    expect(convertAccountTransaction(account, rawTransaction)).toEqual(transaction)
  })
})
