import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        'cardId': '8388244',
        'maskCardNum': '5586********7823',
        'virtualCardNum': '55865769020V7823',
        'tariffPlan': { 'name': 'Opencard', 'tariffInfoURL': 'https://cdn.open.ru/storage/files/tariff_opencard.pdf' },
        'bic': '044525297',
        'cardType': 'PayPass MasterCard World',
        'paySystem': 'Master Card',
        'balance': { 'amount': 21044.33, 'currency': 'RUR' },
        'status': { 'code': 'NORMAL', 'value': 'Активна' },
        'externalId': '8388244',
        'designCode': '*MC World PayPass (Смарт)',
        'designFileName': 'https://ib.open.ru/webbank/image/card-design/wb-small/9e1c15752c0c8ae4712d371f6e17d967.jpg',
        'cardExpDate': '2023-06-30T00:00:00.000+0300',
        'main': true,
        'bankName': 'Openbank',
        'bsc': '3C',
        'startDate': '2019-06-01T00:00:00.000+0300',
        'lastTransactionDate': '2019-08-13T00:00:00.000+0300',
        'type': 'debit',
        'productType': 'CARD',
        'prodGroup': '713',
        'cardPC': 'WAY4',
        'idExt': '8106794',
        'holderName': 'NIKOLAY NIKOLAEV',
        'applePayAllowed': true,
        'mbCardDesignFull': 'https://ib.open.ru/webbank/image/card-design/mb-full/9e1c15752c0c8ae4712d371f6e17d967.png',
        'mbHalfCardDesign': 'https://ib.open.ru/webbank/image/card-design/mb-half/9e1c15752c0c8ae4712d371f6e17d967.png',
        'overdue': false,
        'loyaltyInfo': {
          'bonusInfo': { 'type': 'openCard', 'totalValue': 1084.56, 'compensationBlockedByOverdue': false },
          'freeP2PLimit': 20000.0,
          'freeP2PMaxLimit': 20000.0,
          'freeP2PCurrentSum': 0.0
        },
        'accNum': '40817810380003320020',
        'accName': 'Николаев Николай Николаевич',
        'paySystemPC': 'WAY4',
        'resident': true,
        'pinChangeAvailable': true,
        'reissueInfo': { 'available': true, 'free': true, 'term': 'Перевыпуск занимает до 5 рабочих дней', 'days': '5' },
        'amountVisible': true,
        'updateTime': 1565870749045,
        'creditLimit': 0.0,
        'preferentialRate': true,
        'issueType': 'PERSO',
        'accBackSystemClientId': '8106794',
        'smsInfoAvailable': true
      },
      {
        product: {
          id: '8388244',
          type: 'card'
        },
        account: {
          id: '8388244',
          type: 'ccard',
          title: 'Opencard',
          instrument: 'RUR',
          syncID: [
            '5586********7823',
            '40817810380003320020'
          ],
          balance: 21044.33
        }
      }
    ]
  ])('converts card', (apiAccount, item) => {
    expect(convertAccounts([apiAccount])).toEqual([item])
  })
})
