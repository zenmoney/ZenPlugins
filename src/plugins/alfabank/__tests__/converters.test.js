import {
  convertApiAccountsToAccountTuples,
  convertApiMovementsToReadableTransactions,
  extractDate,
  getMerchantDataFromDescription,
  normalizeIsoDate,
  parseApiMovementDescription,
  toZenmoneyAccount
} from '../converters'

describe('toZenmoneyAccount', () => {
  it('maps api credit card account', () => {
    expect(toZenmoneyAccount({
      'number': '98765432109876543210',
      'description': 'Счёт кредитной карты',
      'amount': '15 294.21',
      'currencyCode': 'RUR',
      'creditInfo': {
        'description': 'Кредитная карта',
        'amountDebt': '1 705.79',
        'installmentCard': false,
        'nextPaymentAmount': '',
        'nextPaymentDate': ''
      },
      'accountDetailsCreditInfo': {
        'Доступный лимит': '15 294.21 RUR',
        'Установленный лимит': '17 000.00 RUR'
      }
    })).toEqual({
      'type': 'ccard',
      'title': 'Счёт кредитной карты',
      'id': '98765432109876543210',
      'syncID': [
        '98765432109876543210'
      ],
      'instrument': 'RUR',
      'available': 15294.21,
      'creditLimit': 17000
    })
  })

  it('maps api cash credit account', () => {
    expect(toZenmoneyAccount({
      number: '98765432109876543210',
      description: 'Большой кредит',
      amount: '0.00',
      currencyCode: 'RUR',
      creditInfo: {
        description: 'Кредит наличными',
        amountDebt: '489 657.26',
        closeDate: '2023-01-31T00:00:00.000+0300',
        installmentCard: false,
        nextPaymentAmount: '',
        nextPaymentDate: ''
      },
      accountDetailsCreditInfo: {
        'Кредитный продукт и валюта': 'Кредит наличными - RUR'
      }
    })).toEqual({
      'type': 'ccard',
      'title': 'Большой кредит',
      'id': '98765432109876543210',
      'syncID': [
        '98765432109876543210'
      ],
      'instrument': 'RUR',
      'startBalance': 0,
      'balance': 0
    })
  })

  it('maps api debit account', () => {
    expect(toZenmoneyAccount({
      'number': '01234567890123456789',
      'description': 'Текущий счёт',
      'amount': '8 936.66',
      'currencyCode': 'RUR'
    })).toEqual({
      'type': 'ccard',
      'title': 'Текущий счёт',
      'id': '01234567890123456789',
      'syncID': [
        '01234567890123456789'
      ],
      'instrument': 'RUR',
      'balance': 8936.66
    })
  })
})

test('parseApiMovementDescription', () => {
  const descriptions = [
    '123456++++++7890    220674  /RU/Alfa Iss>SANKT-PETE                   01.02.03 01.02.03 12345.00      RUR',
    '123456++++++7890      123456\\789\\SANKT PETERBU\\Alfa Iss               01.02.03 01.02.03      1234.00  RUR MCC6011',
    '123456++++++7890    00123456\\643\\ST PETERSBURG\\st m chkalovs          01.02.03 01.02.03     12345.00  RUR',
    '123456++++++7890        0000\\USA\\4158004028\\REDASH IO                 01.02.03 01.02.03        12.34  USD MCC5734',
    '123456++++++7890        0000\\USA\\8889832664\\HELPSHIFT COM             01.02.03 01.02.03        12.34  USD',
    '123456++++++7890      123456\\RUS\\SANKT PETERBU\\WHSD NORTH             01.02.03 01.02.03        50.00  RUR MCC4784',
    '123456++++++7890    12345678\\RUS\\BORISOVO\\1 KH\\KAFE TRATTORI          01.02.03 01.02.03      1680.00  RUR MCC5812',
    '123456++++++7890    14687856\\FIN\\LAPPEENRANTA\\Dharahara Oy            01.02.03 01.02.03        35.00  EUR',
    '123456++++++7890    28127178\\THA\\SAMUTPRAKAN\\A\\CONVENNIENT G          01.02.03 01.02.03      1234.56  THB MCC7011',
    '123456++++++7890    809216  /RU/CARD2CARD ALFA_MOBILE>MOSCOW          01.02.03 01.02.03 15600.00      RUR MCC6536',
    '123456++++++7890    \\USA\\aws amazon co\\Amazon web se                  01.02.03 01.02.03          .12  USD MCC7399',
    '123456++++++7890    \\USA\\aws amazon co\\Amazon web se                  01.02.03 01.02.03          .12  USD',
    '12345678 JP SINNZIYUKUNEGISIYASUKU> 18.05.11 18.05.11 3500 JPY 123456++++++7890',
    'Комиссия за выпуск/перевыпуск картысогласно тарифам банка 01.01.18   ABCD0I                             ФАМИЛЬЕВ ИМЬ ОТЧЕВИЧ',
    '123456++++++7890    10054005\\643\\KAZAN\\AUCHAN 054 KA                  31.01.19 29.01.19       546.00  RUR (Apple Pay-9710) MCC5411'
  ]
  const results = descriptions.map((input) => ({ input, output: parseApiMovementDescription(input, -1) }))
  expect(results).toMatchSnapshot()
})

describe('getMerchantDataFromDescription', () => {
  const spaced = [
    '20529265 RU KRASNOE&BELOE>Krasnodar 19.02.21 19.02.21 91.00 RUR 123456++++++7890',
    '10070534 RU IP AKOPYAN>KRASNODAR 19.02.21 19.02.21 181.00 RUR 123456++++++7890',
    '20529264 RU KRASNOE&BELOE>Krasnodar 19.02.20 19.02.20 109.89 RUR 123456++++++7890',
    '10199981 RU FIRMA KAV>OMSK 19.02.13 19.02.13 4926.00 RUR 123456++++++7890 (Android Pay-0292)',
    '10812173 RU FRUKTY>OMSK 19.02.12 19.02.12 1071.00 RUR 123456++++++7890 (Android Pay-0292)',
    '20235288 RU PYATEROCHKA 14032>Omsk 19.02.12 19.02.12 621.89 RUR 123456++++++7890 (Android Pay-0292)',
    '20235290 RU PYATEROCHKA 14032>Omsk 19.02.11 19.02.11 889.82 RUR 123456++++++7890 (Android Pay-0292)',
    '11436154 RU YANDEX.TAXI>MOSCOW 19.02.15 19.02.15 87.00 RUR 123456++++++7890',
    '10424777 RU KRASNOE&BELOE>N.NOVGORO 19.02.14 19.02.14 189.99 RUR 123456++++++7890',
    '00961336 RU KRONOS B.POKR. 60>N.NOV 19.02.14 19.02.14 856.00 RUR 123456++++++7890',
    '20212358 RU UBER>MOSCOW 19.02.14 19.02.14 76.00 RUR 123456++++++7890',
    '10209593 RU DOBRYY DOKTOR>N.NOVGORO 19.02.13 19.02.13 104.00 RUR 123456++++++7890',
    '10600885 RU SHTRIKH>N.NOVGOROD 19.02.13 19.02.13 248.00 RUR 123456++++++7890',
    '20089870 RU APTEKA>N.NOVGOROD 19.02.13 19.02.13 364.00 RUR 123456++++++7890',
    '21863431 RU CLINIC SADKO>N.NOVGOROD 19.02.13 19.02.13 2830.00 RUR 123456++++++7890',
    '10620413 RU APTECHNYY PUNKT 1002>N. 19.02.12 19.02.12 636.00 RUR 123456++++++7890',
    '221518 RU Alfa Iss>SANKT-PETERBURG 19.02.20 19.02.20 300.00 RUR 123456++++++7890',
    '10478045 RU APTEKA-12>TYUMEN 19.02.22 19.02.22 1944.00 RUR 123456++++++7890',
    '11425642 RU PEREKRESTOK CHKALOVSKI> 19.02.28 19.02.28 474.08 RUR 123456++++++7890',
    '40000098 RU MTRK EVROPOLIS, - 78-6> 19.03.03 19.03.03 100.00 RUR 123456++++++7890',
    '00000001 US PAYPAL  FISHISFAST>4029 18.12.06 18.12.06 60.00 USD 123456++++++7890',
    'I018203 RU KORONAPAY.COM/ONLINE>- 19.02.28 19.02.28 13511.00 RUR 123456++++++7890',
    '99990607 RU PROMO WI-FI RU>MSK G 19.02.28 19.02.28 450.00 RUR 123456++++++7890',
    '89800480 RU Card2Card>MOSKVA G 19.01.10 19.01.10 17330.85 RUR 123456++++++7890'
  ]

  const slashed = [
    '123456++++++7890    10683624\\RUS\\KRASNODAR\\37 \\MAGNIT MM MON          21.02.19 18.02.19        99.60  RUR MCC5411',
    '123456++++++7890    10070534\\RUS\\KRASNODAR\\2 D\\IP AKOPYAN             20.02.19 18.02.19       136.00  RUR (Android Pay-2074) MCC5814',
    '123456++++++7890    10070534\\RUS\\KRASNODAR\\2 D\\IP AKOPYAN             19.02.19 15.02.19       221.00  RUR MCC5814',
    '123456++++++7890    11436154\\RUS\\MOSCOW\\16 LVA\\YANDEX TAXI            20.02.19 18.02.19       192.00  RUR MCC4121',
    '123456++++++7890    20002538\\RUS\\MOSCOW\\LENING\\MMR DELIVERY           21.02.19 17.02.19       733.00  RUR MCC5814',
    '123456++++++7890    11396932\\RUS\\KRASNODAR\\1 3\\MAGNIT MM ZEN          19.02.19 16.02.19       191.40  RUR (Android Pay-2074) MCC5411',
    '123456++++++7890    70009287\\RUS\\Krasnodar\\Kra\\PIVOVARNYA LA          19.02.19 16.02.19       935.00  RUR (Android Pay-2074) MCC5921',
    '123456++++++7890    20265858\\RUS\\KRASNODAR\\81 \\MAGNIT MK KOL          19.02.19 15.02.19       220.20  RUR (Android Pay-2074) MCC5411',
    '123456++++++7890    20529265\\RUS\\KRASNODAR\\287\\KRASNOE BELOE          19.02.19 15.02.19        94.89  RUR MCC5921',
    '123456++++++7890    11436154\\643\\MOSCOW\\YANDEX TAXI                    10.02.19 08.02.19       190.00  RUR MCC4121',
    '123456++++++7890    10812173\\643\\OMSK\\FRUKTY                           10.02.19 08.02.19       898.00  RUR (Android Pay-0292) MCC5499',
    '123456++++++7890    20235288\\643\\OMSK\\PYATEROCHKA 1                    11.02.19 08.02.19      1123.86  RUR (Android Pay-0292) MCC5411',
    '123456++++++7890      501283\\643\\OMSK\\Alfa Iss                         09.02.19 08.02.19      2500.00  RUR MCC6011',
    '123456++++++7890    10199981\\643\\OMSK\\FIRMA KAV                        09.02.19 07.02.19      8778.00  RUR (Android Pay-0292) MCC8021',
    '123456++++++7890    21863446\\643\\NIZHNIY NOVGO\\SADKO NA RODI           14.02.19 12.02.19      1500.00  RUR MCC8099',
    '123456++++++7890    00961336\\643\\N NOVGOROD\\KRONOS B POKR              13.02.19 11.02.19      2470.00  RUR MCC8043',
    '123456++++++7890    20913073\\643\\N NOVGOROD\\MAXIDOM NNOVG              12.02.19 09.02.19      5857.00  RUR MCC5200',
    '123456++++++7890    10704013\\RUS\\SAINT PETERSB\\AUCHAN GULLIV           16.02.19 14.02.19       203.32  RUR (Android Pay-8897) MCC5411',
    '123456++++++7890    \\372\\ITUNES COM\\ITUNES COM BI                     31.01.19 29.01.19       169.00  RUR MCC5735',
    '123456++++++7890    89800480\\RUS\\MOSKVA G\\http\\Card2Card              02.09.18 31.08.18     50000.00  RUR MCC6538'
  ]

  it('spaced', () => {
    const merchants = spaced.map(getMerchantDataFromDescription)
    const expectation = [
      { 'city': 'Krasnodar', 'country': 'RU', 'title': 'KRASNOE&BELOE' },
      { 'city': 'KRASNODAR', 'country': 'RU', 'title': 'IP AKOPYAN' },
      { 'city': 'Krasnodar', 'country': 'RU', 'title': 'KRASNOE&BELOE' },
      { 'city': 'OMSK', 'country': 'RU', 'title': 'FIRMA KAV' },
      { 'city': 'OMSK', 'country': 'RU', 'title': 'FRUKTY' },
      { 'city': 'Omsk', 'country': 'RU', 'title': 'PYATEROCHKA 14032' },
      { 'city': 'Omsk', 'country': 'RU', 'title': 'PYATEROCHKA 14032' },
      { 'city': 'MOSCOW', 'country': 'RU', 'title': 'YANDEX.TAXI' },
      { 'city': 'N.NOVGORO', 'country': 'RU', 'title': 'KRASNOE&BELOE' },
      { 'city': 'N.NOV', 'country': 'RU', 'title': 'KRONOS B.POKR. 60' },
      { 'city': 'MOSCOW', 'country': 'RU', 'title': 'UBER' },
      { 'city': 'N.NOVGORO', 'country': 'RU', 'title': 'DOBRYY DOKTOR' },
      { 'city': 'N.NOVGOROD', 'country': 'RU', 'title': 'SHTRIKH' },
      { 'city': 'N.NOVGOROD', 'country': 'RU', 'title': 'APTEKA' },
      { 'city': 'N.NOVGOROD', 'country': 'RU', 'title': 'CLINIC SADKO' },
      { 'city': 'N.', 'country': 'RU', 'title': 'APTECHNYY PUNKT 1002' },
      { 'city': 'SANKT-PETERBURG', 'country': 'RU', 'title': 'Alfa Iss' },
      { 'city': 'TYUMEN', 'country': 'RU', 'title': 'APTEKA-12' },
      { 'city': null, 'country': 'RU', 'title': 'PEREKRESTOK CHKALOVSKI' },
      { 'city': null, 'country': 'RU', 'title': 'MTRK EVROPOLIS, - 78-6' },
      { 'city': '4029', 'country': 'US', 'title': 'PAYPAL  FISHISFAST' },
      { 'city': '-', 'country': 'RU', 'title': 'KORONAPAY.COM/ONLINE' },
      { 'city': 'MSK G', 'country': 'RU', 'title': 'PROMO WI-FI RU' },
      { 'city': 'MOSKVA G', 'country': 'RU', 'title': 'Card2Card' }
    ]
    expect(merchants).toEqual(expectation)
  })
  it('slashed', () => {
    const merchants = slashed.map(getMerchantDataFromDescription)

    const expectation = [
      { 'city': 'KRASNODAR', 'country': 'RUS', 'title': 'MAGNIT MM MON' },
      { 'city': 'KRASNODAR', 'country': 'RUS', 'title': 'IP AKOPYAN' },
      { 'city': 'KRASNODAR', 'country': 'RUS', 'title': 'IP AKOPYAN' },
      { 'city': 'MOSCOW', 'country': 'RUS', 'title': 'YANDEX TAXI' },
      { 'city': 'MOSCOW', 'country': 'RUS', 'title': 'MMR DELIVERY' },
      { 'city': 'KRASNODAR', 'country': 'RUS', 'title': 'MAGNIT MM ZEN' },
      { 'city': 'Krasnodar', 'country': 'RUS', 'title': 'PIVOVARNYA LA' },
      { 'city': 'KRASNODAR', 'country': 'RUS', 'title': 'MAGNIT MK KOL' },
      { 'city': 'KRASNODAR', 'country': 'RUS', 'title': 'KRASNOE BELOE' },
      { 'city': 'MOSCOW', 'country': '643', 'title': 'YANDEX TAXI' },
      { 'city': 'OMSK', 'country': '643', 'title': 'FRUKTY' },
      { 'city': 'OMSK', 'country': '643', 'title': 'PYATEROCHKA 1' },
      { 'city': 'OMSK', 'country': '643', 'title': 'Alfa Iss' },
      { 'city': 'OMSK', 'country': '643', 'title': 'FIRMA KAV' },
      { 'city': 'NIZHNIY NOVGO', 'country': '643', 'title': 'SADKO NA RODI' },
      { 'city': 'N NOVGOROD', 'country': '643', 'title': 'KRONOS B POKR' },
      { 'city': 'N NOVGOROD', 'country': '643', 'title': 'MAXIDOM NNOVG' },
      { 'city': 'SAINT PETERSB', 'country': 'RUS', 'title': 'AUCHAN GULLIV' },
      { 'city': 'ITUNES COM', 'country': '372', 'title': 'ITUNES COM BI' },
      { 'city': 'MOSKVA G', 'country': 'RUS', 'title': 'Card2Card' }
    ]
    expect(merchants).toEqual(expectation)
  })
})

test('normalizeIsoDate normalizes isoDate for JavaScriptCore new Date(isoDate)', () => {
  expect(normalizeIsoDate('2017-12-01T12:00:00.000+0300')).toEqual('2017-12-01T12:00:00.000+03:00')
  expect(normalizeIsoDate('2017-12-01T12:00:00.000Z')).toEqual('2017-12-01T12:00:00.000Z')
  expect(normalizeIsoDate('2017-12-01T12:00:00.000-0550')).toEqual('2017-12-01T12:00:00.000-05:50')
})

test("extractDate uses executeTimeStamp (if it's present and <= 36 hours less than createDate) to ensure the same date is passed in hold/non-hold", () => {
  expect(extractDate({ createDate: '2018-06-18T12:00:00.000+0300' }))
    .toEqual(new Date('2018-06-18T12:00:00.000+0300'))
  expect(extractDate({ createDate: '2018-06-18T12:00:00.000+0300', executeTimeStamp: '2018-06-19T00:42:47.402+0300' }))
    .toEqual(new Date('2018-06-18T12:00:00.000+0300'))
  expect(extractDate({ createDate: '2018-06-20T12:00:00.000+0300', executeTimeStamp: '2018-06-19T00:42:47.402+0300' }))
    .toEqual(new Date('2018-06-19T00:42:47.402+0300'))
  expect(extractDate({ createDate: '2018-06-20T12:00:00.000+0300', executeTimeStamp: '2018-06-18T00:42:47.402+0300' }))
    .toEqual(new Date('2018-06-20T12:00:00.000+0300'))
})

describe('convertApiMovementsToReadableTransactions', () => {
  const description = 'Внутрибанковский перевод между счетами, Анонимский И. О.'
  it('completes missing transfer data', () => {
    const transferReference = 'test(transferReference)'
    const shortDescription = 'От Анонимский Имь Отьевич'
    const apiMovements = [
      {
        id: '1',
        createDate: '2018-05-22T12:00:00.000+0300',
        amount: '+1 000.00',
        currency: 'RUR',
        status: 'P',
        statusDescription: 'Выполнен',
        description: description,
        hold: false,
        key: '1',
        reference: transferReference,
        userComment: '',
        shortDescription: shortDescription,
        descriptionForRepeat: 'Между своими счетами',
        senderInfo: { senderCardNumber: '', senderBicBank: '', senderNameBank: '', senderAccountNumberDescription: 'Текущий сч.. ··0987' }
      },
      {
        id: '2',
        createDate: '2018-05-22T12:00:00.000+0300',
        amount: '-1 000.00',
        currency: 'RUR',
        status: 'P',
        statusDescription: 'Выполнен',
        description: description,
        hold: false,
        key: '2',
        reference: transferReference,
        userComment: '',
        shortDescription: 'Перевод между счетами',
        descriptionForRepeat: 'Между своими счетами',
        senderInfo: { senderAccountNumberDescription: 'Текущий сч.. ··0987' },
        recipientInfo: {
          recipientName: 'Между своими счетами',
          recipientValue: '123456**********7890',
          recipientCardNumber: '',
          recipientBicBank: '',
          recipientNameBank: ''
        }
      }
    ]
    expect(convertApiMovementsToReadableTransactions(apiMovements, convertApiAccountsToAccountTuples([
      { number: 'x7890', amount: '1 008.40' },
      { number: 'x0987', amount: '2 016.80' }
    ]))).toMatchSnapshot()
  })

  it('guesses missing sender account info with single non-own shared account', () => {
    const apiMovements = [
      {
        id: '0',
        createDate: '2018-05-22T12:00:00.000+0300',
        amount: '-1 000.00',
        currency: 'RUR',
        status: 'P',
        statusDescription: 'Выполнен',
        description: description,
        hold: false,
        key: '0',
        reference: 'test(reference)',
        userComment: '',
        shortDescription: 'Перевод между счетами',
        descriptionForRepeat: 'Между своими счетами',
        senderInfo: { senderEmail: 'test(senderEmail)', senderPhoneNumber: 'test(senderPhoneNumber)', senderFIO: 'test(senderFIO)' },
        recipientInfo: {
          recipientName: 'test(recipientName)',
          recipientValue: '123456**********5566',
          recipientCardNumber: '',
          recipientBicBank: 'test(recipientBicBank)',
          recipientNameBank: 'АО "АЛЬФА-БАНК"',
          recipientEmail: 'test(recipientEmail)',
          recipientPhoneNumber: 'test(recipientPhoneNumber)',
          recipientMaskedName: 'test(recipientMaskedName)',
          recipientFIO: 'test(recipientFIO)'
        },
        anotherClientInfo: { clientName: 'test(anotherClientInfo.clientName)', clientPhone: 'test(anotherClientInfo.clientPhone)' }
      }
    ]
    expect(convertApiMovementsToReadableTransactions(apiMovements, convertApiAccountsToAccountTuples([
      { number: 'x4444', amount: '1 024.00', sharedAccountInfo: { isOwn: false } }
    ]))).toMatchSnapshot()
    expect(convertApiMovementsToReadableTransactions(apiMovements, [])).toEqual([])
  })

  it('converts card2card transfers', () => {
    const apiMovements = [
      {
        amount: '5 500.00',
        createDate: '2019-02-24T12:00:00.000+0300',
        currency: 'RUR',
        description: '123456++++++7890    809216  /RU/CARD2CARD ALFA_MOBILE>MOSCOW          24.02.19 24.02.19 5500.00       RUR MCC6536',
        descriptionForRepeat: '',
        hold: false,
        id: '0',
        key: '1190224MOCOTPIIC02196',
        recipientInfo: { 'recipientAccountNumberDescription': 'Текущий сч.. ··9012' },
        reference: 'CRD_17Y4XR',
        senderInfo: { 'senderAccountNumber': '12345678900000001234', 'senderBicBank': '', 'senderCardNumber': '', 'senderNameBank': '' },
        shortDescription: 'CARD2CARD ALFA_MOBILE>MOSCOW          24.02.19 24.02.19 5500.00       RUR MCC6536',
        status: '',
        statusDescription: '',
        userComment: ''
      }
    ]

    const transactions = [
      {
        comment: null,
        date: new Date('2019-02-24T09:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '40811234005670089012' },
            fee: 0,
            id: '1190224MOCOTPIIC02196',
            invoice: null,
            sum: 5500
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUR',
              company: null,
              syncIds: ['12345678900000001234']
            },
            invoice: null,
            sum: -5500,
            fee: 0
          }
        ]
      }
    ]

    const apiAccounts = [
      {
        number: '40811234005670089012',
        description: 'Текущий счёт',
        amount: '10 213.03',
        currencyCode: 'RUR',
        actions: {
          isAvailableForRename: true,
          isAvailableForWithdrowal: true,
          isMoneyBoxEdit: false
        },
        filters: [
          {
            operation: 'accounts',
            title: 'Счета',
            color: '#F03226',
            filterList: [
              {
                name: 'Текущий сч.. RUR ··9012',
                value: '40811234005670089012'
              }
            ]
          }
        ]
      }
    ]

    const accountTuples = convertApiAccountsToAccountTuples(apiAccounts)

    expect(convertApiMovementsToReadableTransactions(apiMovements, accountTuples)).toEqual(transactions)
  })

  it('converts outer transfers', () => {
    const apiMovements = [
      {
        amount: '-13 000.00',
        createDate: '2019-02-18T12:00:00.000+0300',
        currency: 'RUR',
        description: 'test(Назначение платежа)',
        descriptionForRepeat: 'На счёт в другой банк',
        hold: false,
        id: '4',
        key: '1190218MOCO#DSV015163',
        recipientInfo: {
          recipientBicBank: '044525593',
          recipientCardNumber: '',
          recipientName: 'На счёт в другой банк',
          recipientNameBank: 'АО "АЛЬФА-БАНК"',
          recipientValue: '98765432109876543210'
        },
        reference: 'C021802190004587',
        senderInfo: {
          senderAccountNumberDescription: 'Текущий сч.. ··0987'
        },
        shortDescription: 'test(Назначение платежа)',
        status: 'P',
        statusDescription: 'Выполнен',
        userComment: ''
      },
      { id: '5',
        createDate: '2018-02-07T12:00:00.000+0300',
        amount: '-757.26',
        currency: 'RUR',
        status: 'P',
        statusDescription: 'Выполнен',
        description: 'test(Назначение платежа)',
        hold: false,
        key: '1180207MOCO#DS5023005',
        reference: 'C030702180001416',
        userComment: '',
        descriptionForRepeat: 'Оплата неналоговых платежей (штрафы, пошлины)',
        senderInfo: { senderAccountNumberDescription: 'Текущий сч.. ··0987' },
        recipientInfo:
          { recipientName: 'Оплата неналоговых платежей (штрафы, пошлины)',
            recipientValue: '40601810200003000000',
            recipientCardNumber: '',
            recipientBicBank: '044030001',
            recipientNameBank: 'СЕВЕРО-ЗАПАДНОЕ ГУ БАНКА РОССИИ' },
        category:
          { id: '23',
            bankCategoryId: '00024',
            bankCategoryName: 'Штрафы, налоги, комиссии',
            color: '#FF2E63' },
        actions:
          { isAvailableForMarking: true,
            isAvailableForRepeat: false,
            isAvailableForCreateTemplate: false,
            isAvailableForPDF: true,
            isAvailableForCreateToDo: false }
      }
    ]

    const transactions = [
      {
        comment: 'test(Назначение платежа)',
        date: new Date('2019-02-18T09:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: 'x0987'
            },
            fee: 0,
            id: '1190218MOCO#DSV015163',
            invoice: null,
            sum: -13000
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUR',
              company: null,
              syncIds: ['98765432109876543210']
            },
            invoice: null,
            sum: 13000,
            fee: 0
          }
        ]
      },
      {
        comment: 'test(Назначение платежа)',
        date: new Date('2018-02-07T09:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: 'x0987'
            },
            fee: 0,
            id: '1180207MOCO#DS5023005',
            invoice: null,
            sum: -757.26
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUR',
              company: null,
              syncIds: ['40601810200003000000']
            },
            invoice: null,
            sum: 757.26,
            fee: 0
          }
        ]
      }
    ]

    const apiAccounts = [
      { number: 'x0987', amount: '10 213.03' }
    ]

    const accountTuples = convertApiAccountsToAccountTuples(apiAccounts)

    expect(convertApiMovementsToReadableTransactions(apiMovements, accountTuples)).toEqual(transactions)
  })

  it('converts inner transfers', () => {
    const apiMovements = [
      { id: '1',
        createDate: '2018-11-22T12:00:00.000+0300',
        amount: '+2 300.00',
        currency: 'RUR',
        status: 'P',
        statusDescription: 'Выполнен',
        description: 'test(Назначение платежа - вх)',
        hold: false,
        key: '1181122MOCO#DS4627192',
        reference: 'C072211180041674',
        userComment: '',
        shortDescription: 'От Фамилиев Имь Отчевич',
        descriptionForRepeat: 'На счёт другому клиенту',
        senderInfo:
          { senderCardNumber: '',
            senderAccountNumber: '98765432100000001234',
            senderBicBank: '044525593',
            senderNameBank: 'АО "АЛЬФА-БАНК"',
            senderEmail: 'from(sender.e@mail)',
            senderPhoneNumber: '79000112233',
            senderMaskedName: 'Фам····в И.О.',
            senderFIO: 'from(Фамилиев Имь Отчевич)' },
        recipientInfo:
          { recipientAccountNumberDescription: 'Текущий сч.. ··0987',
            recipientEmail: 'to(recipient.e@mail)',
            recipientPhoneNumber: '79001233344',
            recipientFIO: 'to(Фамилиаров Имь Отчевич)' },
        actions:
          { isAvailableForMarking: false,
            isAvailableForRepeat: false,
            isAvailableForCreateTemplate: false,
            isAvailableForPDF: true,
            isAvailableForCreateToDo: false } },

      { id: '2',
        createDate: '2018-10-05T12:00:00.000+0300',
        amount: '-900.00',
        currency: 'RUR',
        status: 'P',
        statusDescription: 'Выполнен',
        description: 'test(Назначение платежа - исх)',
        hold: false,
        key: '1181005MOCO#DS4759631',
        reference: 'C070510180062152',
        userComment: '',
        shortDescription: 'За Дружбу',
        descriptionForRepeat: 'На счёт другому клиенту',
        senderInfo:
          { senderAccountNumberDescription: 'Текущий сч.. ··0987',
            senderEmail: 'from(sender.e@mail)',
            senderPhoneNumber: '79001233344',
            senderFIO: 'from(Фамилиаров Имь Отчевич)' },
        recipientInfo:
          { recipientName: 'Фам···в И.О.',
            recipientValue: '900***2233',
            recipientCardNumber: '',
            recipientBicBank: '044525593',
            recipientNameBank: 'АО "АЛЬФА-БАНК"',
            recipientEmail: 'to(recipient.e@mail)',
            recipientPhoneNumber: '79000112233',
            recipientMaskedName: 'Фам····в И.О.',
            recipientFIO: 'to(Фамилиев Имь Отчевич)' },
        actions:
          { isAvailableForMarking: true,
            isAvailableForRepeat: true,
            isAvailableForCreateTemplate: true,
            isAvailableForPDF: true,
            isAvailableForCreateToDo: true } }
    ]

    const transactions = [
      {
        comment: 'test(Назначение платежа - вх)',
        date: new Date('2018-11-22T09:00:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Фам····в И.О.'
        },
        movements: [
          {
            account: {
              id: 'x0987'
            },
            fee: 0,
            id: '1181122MOCO#DS4627192',
            invoice: null,
            sum: 2300
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUR',
              company: null,
              syncIds: ['98765432100000001234']
            },
            invoice: null,
            sum: -2300,
            fee: 0
          }
        ]
      },
      {
        comment: 'test(Назначение платежа - исх)',
        date: new Date('2018-10-05T09:00:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Фам····в И.О.'
        },
        movements: [
          {
            account: {
              id: 'x0987'
            },
            fee: 0,
            id: '1181005MOCO#DS4759631',
            invoice: null,
            sum: -900
          }
        ]
      }
    ]

    const apiAccounts = [
      { number: 'x0987', amount: '10 213.03' }
    ]

    const accountTuples = convertApiAccountsToAccountTuples(apiAccounts)

    expect(convertApiMovementsToReadableTransactions(apiMovements, accountTuples)).toEqual(transactions)
  })

  it('converts mobile and internet payments', () => {
    const apiMovements = [
      {
        'amount': '-675.00',
        'category': { 'bankCategoryId': '00012', 'bankCategoryName': 'Мобильная связь, интернет, ТВ, телефон', 'color': '#2C98CE', 'id': '11' },
        'createDate': '2018-12-30T12:00:00.000+0300',
        'currency': 'RUR',
        'description': 'Платеж A023012180000476 в пользу Городские кабельные сети,30.12.2018,02-20-48',
        'descriptionForRepeat': 'Интернет',
        'hold': false,
        'id': '3',
        'key': '1181230MOCOIBS0024221',
        'recipientInfo': {
          'recipientBicBank': '',
          'recipientCardNumber': '',
          'recipientName': 'Городские кабельные сети (ООО Городские кабельные сети,',
          'recipientNameBank': '',
          'recipientValue': '75891'
        },
        'reference': 'A023012180000476',
        'senderInfo': { 'senderAccountNumberDescription': 'Текущий сч.. ··0987' },
        'shortDescription': 'Городские кабельные сети',
        'status': 'P',
        'statusDescription': 'Выполнен',
        'userComment': ''
      },
      {
        'amount': '-180.00',
        'category': {
          'bankCategoryId': '00012',
          'bankCategoryName': 'Мобильная связь, интернет, ТВ, телефон',
          'color': '#2C98CE',
          'id': '11'
        },
        'createDate': '2019-02-10T12:00:00.000+0300',
        'currency': 'RUR',
        'description': 'Платеж A011002190024677 в пользу Билайн, +7900+++1234,10.02.2019,09-06-41.',
        'descriptionForRepeat': 'Мобильная связь',
        'hold': false,
        'id': '4',
        'key': '1190210MOCOIBS0111347',
        'recipientInfo': {
          'recipientBicBank': '',
          'recipientCardNumber': '',
          'recipientName': 'Билайн (ПАО Вымпел-Коммуникации, ИНН 7713076301)',
          'recipientNameBank': '',
          'recipientValue': '9007891234'
        },
        'reference': 'A011002190024677',
        'senderInfo': {
          'senderAccountNumberDescription': 'Текущий сч.. ··0987'
        },
        'shortDescription': 'Билайн',
        'status': 'P',
        'statusDescription': 'Выполнен',
        'userComment': ''
      }
    ]

    const transactions = [
      {
        comment: null,
        date: new Date('2018-12-30T09:00:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Городские кабельные сети'
        },
        movements: [
          {
            account: { id: 'x0987' },
            fee: 0,
            id: '1181230MOCOIBS0024221',
            invoice: null,
            sum: -675
          }
        ]
      },
      {
        comment: null,
        date: new Date('2019-02-10T09:00:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Билайн'
        },
        movements: [
          {
            account: { id: 'x0987' },
            fee: 0,
            id: '1190210MOCOIBS0111347',
            invoice: null,
            sum: -180
          }
        ]
      }
    ]

    const apiAccounts = [
      { number: 'x0987', amount: '10 213.03' }
    ]

    const accountTuples = convertApiAccountsToAccountTuples(apiAccounts)

    expect(convertApiMovementsToReadableTransactions(apiMovements, accountTuples)).toEqual(transactions)
  })

  it('converts moneybox transfers', () => {
    const apiMovements = [
      {
        id: '7',
        createDate: '2019-01-31T12:00:00.000+0300',
        amount: '-1 921.50',
        currency: 'RUR',
        status: '',
        statusDescription: '',
        description: 'Перевод 5% в рамках услуги Копилка для зарплаты со счета 12340000000000000987 на счет 98760000000000001234 (ООО "РАБОТА"',
        hold: false,
        key: '1190131MOCOOP1E 14747',
        reference: 'OP1ED191V0013CAH',
        userComment: '',
        descriptionForRepeat: '',
        senderInfo: { senderAccountNumberDescription: 'Текущий ··0987' },
        recipientInfo: {
          recipientName: '',
          recipientValue: '',
          recipientCardNumber: '',
          recipientBicBank: '044525593',
          recipientNameBank: 'АО "АЛЬФА-БАНК"',
          recipientAccountNumberDescription: 'Накопительный ··1234'
        }
      },
      {
        id: '8',
        createDate: '2019-01-31T12:00:00.000+0300',
        amount: '+1 921.50',
        currency: 'RUR',
        status: '',
        statusDescription: '',
        description: 'Перевод 5% в рамках услуги Копилка для зарплаты со счета 12340000000000000987 на счет 98760000000000001234 (ООО "РАБОТА"',
        hold: false,
        key: '1190131MOCOOP1E 14748',
        reference: 'OP1ED191V0013CAH',
        userComment: '',
        descriptionForRepeat: '',
        senderInfo: {
          senderCardNumber: '',
          senderBicBank: '044525593',
          senderNameBank: 'АО "АЛЬФА-БАНК"',
          senderAccountNumberDescription: 'Текущий ··0987'
        },
        recipientInfo: { recipientAccountNumberDescription: 'Накопительный ··1234' }
      },
      { id: '9',
        createDate: '2018-02-15T12:00:00.000+0300',
        amount: '+18 912.01',
        currency: 'RUR',
        status: '',
        statusDescription: '',
        description: 'Перевод 30% в рамках услуги Копилка для зарплаты со счета 12340000000000000987 на счет 98760000000000001234 (ООО "РАБОТА"',
        hold: false,
        key: '1180215MOCOOP1E 09210',
        reference: 'OP1ED02482966251',
        userComment: '',
        descriptionForRepeat: '',
        senderInfo:
          { senderCardNumber: '',
            senderBicBank: '',
            senderNameBank: '',
            senderAccountNumberDescription: 'Текущий ··0987' },
        recipientInfo: { recipientAccountNumberDescription: 'Накопительный ··1234' },
        actions:
          { isAvailableForMarking: false,
            isAvailableForRepeat: false,
            isAvailableForCreateTemplate: false,
            isAvailableForPDF: false,
            isAvailableForCreateToDo: false } },
      { id: '10',
        createDate: '2018-02-15T12:00:00.000+0300',
        amount: '-18 912.01',
        currency: 'RUR',
        status: '',
        statusDescription: '',
        description: 'Перевод 30% в рамках услуги Копилка для зарплаты со счета 12340000000000000987 на счет 98760000000000001234 (ООО "РАБОТА"',
        hold: false,
        key: '1180215MOCOOP1E 09209',
        reference: 'OP1ED02482966251',
        userComment: '',
        descriptionForRepeat: '',
        senderInfo: { senderAccountNumberDescription: 'Текущий ··0987' },
        recipientInfo:
          { recipientName: '',
            recipientValue: '',
            recipientCardNumber: '',
            recipientBicBank: '',
            recipientNameBank: '',
            recipientAccountNumberDescription: 'Накопительный ··1234' },
        category:
          { id: '12',
            bankCategoryId: '00013',
            bankCategoryName: 'Финансовые операции',
            color: '#23CBFF' },
        actions:
          { isAvailableForMarking: true,
            isAvailableForRepeat: false,
            isAvailableForCreateTemplate: false,
            isAvailableForPDF: false,
            isAvailableForCreateToDo: false } }
    ]

    const transactions = [
      {
        comment: null,
        date: new Date('2019-01-31T09:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '12340000000000000987'
            },
            fee: 0,
            id: '1190131MOCOOP1E 14747',
            invoice: null,
            sum: -1921.5
          },
          {
            account: {
              id: '98760000000000001234'
            },
            fee: 0,
            id: '1190131MOCOOP1E 14748',
            invoice: null,
            sum: 1921.5
          }
        ]
      },
      {
        comment: null,
        date: new Date('2018-02-15T09:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '12340000000000000987'
            },
            fee: 0,
            id: '1180215MOCOOP1E 09209',
            invoice: null,
            sum: -18912.01
          },
          {
            account: {
              id: '98760000000000001234'
            },
            fee: 0,
            id: '1180215MOCOOP1E 09210',
            invoice: null,
            sum: 18912.01
          }
        ]
      }
    ]

    const apiAccounts = [
      { number: '12340000000000000987', amount: '10 213.03', description: 'Текущий' },
      { number: '98760000000000001234', amount: '1 200.00', description: 'Накопительный' }
    ]

    const accountTuples = convertApiAccountsToAccountTuples(apiAccounts)

    expect(convertApiMovementsToReadableTransactions(apiMovements, accountTuples)).toEqual(transactions)
  })

  it('converts expenses as expenses, not as transfers', () => {
    const apiMovements = [
      {
        id: '26',
        createDate: '2019-02-22T12:00:00.000+0300',
        amount: '-153.00',
        currency: 'RUR',
        status: '',
        statusDescription: '',
        description: '123456++++++7890 20456312\\643\\MOSCOW\\CITYMOBIL 25.02.19 22.02.19 153.00 RUR MCC4121',
        hold: false,
        key: '1190225MOCO@SVXB56337',
        reference: 'CRD_7C07NE',
        userComment: '',
        shortDescription: 'CITYMOBIL',
        descriptionForRepeat: '',
        senderInfo: { senderAccountNumberDescription: 'Текущий сч.. ··1234' },
        recipientInfo:
          {
            recipientName: '',
            recipientValue: '',
            recipientCardNumber: '',
            recipientBicBank: '',
            recipientNameBank: ''
          },
        category:
          {
            id: '24',
            bankCategoryId: '00015',
            bankCategoryName: 'Общественный транспорт',
            color: '#CCCE00'
          },
        actions:
          {
            isAvailableForMarking: true,
            isAvailableForRepeat: false,
            isAvailableForCreateTemplate: false,
            isAvailableForPDF: false,
            isAvailableForCreateToDo: false
          }
      }
    ]

    const transactions = [
      {
        comment: null,
        date: new Date('2019-02-22T09:00:00.000Z'),
        hold: false,
        merchant: {
          city: 'MOSCOW',
          country: '643',
          location: null,
          mcc: 4121,
          title: 'CITYMOBIL'
        },
        movements: [
          {
            id: '1190225MOCO@SVXB56337',
            account: { id: 'x1234' },
            invoice: null,
            sum: -153,
            fee: 0
          }
        ]
      }
    ]

    const apiAccounts = [
      { number: 'x1234', amount: '10 213.03', description: 'Текущий' }
    ]

    const accountTuples = convertApiAccountsToAccountTuples(apiAccounts)

    expect(convertApiMovementsToReadableTransactions(apiMovements, accountTuples)).toEqual(transactions)
  })
})
