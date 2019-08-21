import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
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
        }
      ],
      {
        products: [
          {
            id: '8388244',
            type: 'card'
          }
        ],
        account: {
          id: '40817810380003320020',
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
    ],
    [
      [
        {
          cardId: '8580520',
          maskCardNum: '5586********8933',
          virtualCardNum: '55865877913V8933',
          tariffPlan:
            {
              name: 'Opencard',
              tariffInfoURL: 'https://cdn.open.ru/storage/files/tariff_opencard.pdf'
            },
          name: 'Света',
          bic: '044525297',
          cardType: 'PayPass MasterCard World',
          paySystem: 'Master Card',
          balance: { amount: 4097.06, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '8580520',
          designCode: '*MC World PayPass (Смарт)',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/9e1c15752c0c8ae4712d371f6e17d967.jpg',
          cardExpDate: '2023-07-31T00:00:00.000+0300',
          main: false,
          bankName: 'Openbank',
          bsc: '3C',
          startDate: '2019-07-01T00:00:00.000+0300',
          lastTransactionDate: '2019-08-15T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          prodGroup: '713',
          cardPC: 'WAY4',
          idExt: '3387812',
          holderName: 'NIKOLAIDA NIKOLAEVA',
          applePayAllowed: true,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/9e1c15752c0c8ae4712d371f6e17d967.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/9e1c15752c0c8ae4712d371f6e17d967.png',
          overdue: false,
          loyaltyInfo:
            {
              bonusInfo: { type: 'openCard', compensationBlockedByOverdue: false },
              freeP2PLimit: 20000,
              freeP2PMaxLimit: 20000,
              freeP2PCurrentSum: 0
            },
          accNum: '40817810780003792345',
          accName: 'Николаев Николай Николаевич',
          paySystemPC: 'WAY4',
          resident: true,
          pinChangeAvailable: true,
          reissueInfo:
            {
              available: true,
              free: true,
              term: 'Перевыпуск занимает до 5 рабочих дней',
              days: '5'
            },
          amountVisible: true,
          updateTime: 1565901946186,
          creditLimit: 0,
          preferentialRate: true,
          issueType: 'PERSO',
          accBackSystemClientId: '3387812',
          smsInfoAvailable: true
        },
        {
          cardId: '8387265',
          maskCardNum: '5586********6723',
          virtualCardNum: '55865745970V6723',
          tariffPlan:
            {
              name: 'Opencard',
              tariffInfoURL: 'https://cdn.open.ru/storage/files/tariff_opencard.pdf'
            },
          name: 'Толик',
          bic: '044525297',
          cardType: 'PayPass MasterCard World',
          paySystem: 'Master Card',
          balance: { amount: 4097.06, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '8387265',
          designCode: '*MC World PayPass (Смарт)',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/9e1c15752c0c8ae4712d371f6e17d967.jpg',
          cardExpDate: '2023-06-30T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: '3C',
          startDate: '2019-06-01T00:00:00.000+0300',
          lastTransactionDate: '2019-08-15T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          prodGroup: '713',
          cardPC: 'WAY4',
          idExt: '3387812',
          holderName: 'NIKOLAY NIKOLAEV',
          applePayAllowed: true,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/9e1c15752c0c8ae4712d371f6e17d967.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/9e1c15752c0c8ae4712d371f6e17d967.png',
          overdue: false,
          loyaltyInfo:
            {
              bonusInfo:
                {
                  type: 'openCard',
                  totalValue: 2186.39,
                  compensationBlockedByOverdue: false
                },
              freeP2PLimit: 20000,
              freeP2PMaxLimit: 20000,
              freeP2PCurrentSum: 0
            },
          accNum: '40817810780003792345',
          accName: 'Николаев Николай Николаевич',
          paySystemPC: 'WAY4',
          resident: true,
          pinChangeAvailable: true,
          reissueInfo:
            {
              available: true,
              free: true,
              term: 'Перевыпуск занимает до 5 рабочих дней',
              days: '5'
            },
          amountVisible: true,
          updateTime: 1565901946180,
          creditLimit: 0,
          preferentialRate: true,
          issueType: 'PERSO',
          accBackSystemClientId: '3387812',
          smsInfoAvailable: true
        }
      ],
      {
        products: [
          {
            id: '8580520',
            type: 'card'
          },
          {
            id: '8387265',
            type: 'card'
          }
        ],
        account: {
          id: '40817810780003792345',
          type: 'ccard',
          title: 'Opencard',
          instrument: 'RUR',
          syncID: [
            '5586********8933',
            '5586********6723',
            '40817810780003792345'
          ],
          balance: 4097.06
        }
      }
    ],
    [
      [
        {
          cardId: '8064014',
          maskCardNum: '4058********0954',
          virtualCardNum: '40585489524V0954',
          tariffPlan:
            {
              name: 'Кредитная Opencard',
              tariffInfoURL: 'https://cdn.open.ru/storage/files/tariff_opencard_credit.pdf'
            },
          bic: '044525297',
          cardType: 'Visa Gold Rewards',
          paySystem: 'VISA',
          balance: { amount: 72401.74, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '8064014',
          designCode: '*Visa Rewards EMV PayWave_Smart_white',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/103cee0b58b4352a17080c3640d95332.jpg',
          cardExpDate: '2023-04-30T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: '3C',
          startDate: '2019-04-01T00:00:00.000+0300',
          lastTransactionDate: '2019-08-07T00:00:00.000+0300',
          type: 'credit',
          productType: 'CARD',
          prodGroup: '712',
          cardPC: 'WAY4',
          idExt: '7833816',
          holderName: 'NIKOLAY NIKOLAEV',
          applePayAllowed: true,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/103cee0b58b4352a17080c3640d95332.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/103cee0b58b4352a17080c3640d95332.png',
          overdue: false,
          loyaltyInfo:
            {
              bonusInfo:
                {
                  type: 'openCard',
                  totalValue: 1367.04,
                  compensationBlockedByOverdue: false
                }
            },
          accNum: '40817810580001495803',
          accName: 'Николаев Николай Николаевич',
          paySystemPC: 'WAY4',
          resident: true,
          pinChangeAvailable: true,
          reissueInfo:
            {
              available: true,
              free: true,
              term: 'Перевыпуск занимает до 5 рабочих дней',
              days: '5'
            },
          amountVisible: true,
          updateTime: 1565940899832,
          creditLimit: 100000,
          preferentialRate: true,
          issueType: 'PERSO',
          accBackSystemClientId: '7833816',
          smsInfoAvailable: true
        }
      ],
      {
        products: [
          {
            id: '8064014',
            type: 'card'
          }
        ],
        account: {
          id: '40817810580001495803',
          type: 'ccard',
          title: 'Кредитная Opencard',
          instrument: 'RUR',
          syncID: [
            '4058********0954',
            '40817810580001495803'
          ],
          balance: -27598.26,
          creditLimit: 100000
        }
      }
    ]
  ])('converts card', (apiAccounts, item) => {
    expect(convertAccounts(apiAccounts)).toEqual([item])
  })
})
