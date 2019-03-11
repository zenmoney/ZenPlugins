import { convertAccount, convertTransaction, parseDescription } from './converters'

describe('convertAccount', () => {
  it('converts a credit card', () => {
    expect(convertAccount({
      'account': '40817810550006889810',
      'openDate': '2018-10-03',
      'exp_date': '4012-12-31',
      'name': 'Карта рассрочки "Халва " - Сайт, депозитный',
      'name_sh': '+INSTALLMENT_CRD_2_SI_DEP',
      'sum': 78000,
      'sum_pp': 78000,
      'sum_acc': 3000,
      'accType': 'card',
      'cardCredit': 1,
      'cardCreditContractNumber': '1879272874',
      'installmentType': 'Halva2',
      'creditLimit': 75000,
      'unusedCreditLimit': 75000,
      'isRepayment': 1,
      'cardName': 'MC WORLD ХАЛВА 2.0 СНЯТИЕ',
      'cardBin': '553609',
      'cardEnd': '8723',
      'cardExpDate': '2023-02-15',
      'cardStat': 'ACT',
      'cardType': 1,
      'cardSys': 'International',
      'cardVirt': 0,
      'productId': '1671282625',
      'cardsCount': 1,
      'cardPINchangeCall': 0,
      'bank': {
        'bic': '045004763',
        'corrAccNum': '30101810150040000763',
        'name': 'ФИЛИАЛ "ЦЕНТРАЛЬНЫЙ" ПАО "СОВКОМБАНК"',
        'city': 'БЕРДСК',
        'branchId': '62384355'
      },
      'credit_info': {
        'widgetType': 'product',
        'account': 'produ8101879272874',
        'accNum': '45509810850102522328',
        'sum': 0.1,
        'installmentCard': 1,
        'product': {
          'type': 'potreb',
          'subType': 'card',
          'contNum': '1879272874',
          'contDate': '2015-09-25',
          'contExpiredDate': '2025-09-25',
          'head': 'Карта рассрочки'
        },
        'endPowerdate': '2025-09-25'
      },
      'sum_own': 3000,
      'ownerNameEng': '',
      'ownerName': 'Николаев Николай Николаевич',
      'inn': '',
      'kpp': '',
      'ownerAddress': '111111, НИКОЛАЕВСКАЯ ОБЛ, . НИКОЛАЕВСК, .НИКОЛАЕВА, д.11, кв.11',
      'ownerAddressEng': '. .b.',
      'abs_i': 'Николай',
      'abs_o': 'Николаевич',
      'abs_f': 'Николаев',
      'bank_part_id': '',
      'pay': 1,
      'create': 1,
      'dov_date': 'owner',
      'cType': '',
      'uid': '1780033',
      'isOwner': '1',
      'ownerIcon': '',
      'owner_uid': '1780033'
    })).toEqual({
      id: '40817810550006889810',
      type: 'ccard',
      title: 'Халва',
      instrument: 'RUB',
      balance: 3000,
      creditLimit: 75000,
      syncID: [
        '553609******8723',
        '40817810550006889810'
      ]
    })
  })

  it('converts a savings account', () => {
    expect(convertAccount({
      account: '40817810850115100358',
      openDate: '2018-03-19',
      exp_date: '4012-12-31',
      name: 'СКБ "Накопительный счет"',
      name_sh: '+CFO_SKB_nakopit_schet',
      sum: 0,
      sum_pp: 0,
      sum_acc: 0,
      accType: 'current',
      cardCredit: 0,
      creditLimit: 0,
      unusedCreditLimit: 0,
      bank: {
        bic: '045004763',
        corrAccNum: '30101810150040000763',
        name: 'ФИЛИАЛ "ЦЕНТРАЛЬНЫЙ" ПАО "СОВКОМБАНК"',
        city: 'БЕРДСК',
        branchId: '508605'
      },
      ownerNameEng: '',
      ownerName: 'Николай Николаевич Николаев',
      inn: '',
      kpp: '',
      ownerAddress: '111111, НИКОЛАЕВСКАЯ ОБЛ, . НИКОЛАЕВСК, .НИКОЛАЕВА, д.11, кв.11',
      ownerAddressEng: '. .b.',
      abs_i: 'Николай',
      abs_o: 'Николаевич',
      abs_f: 'Николаев',
      bank_part_id: '',
      pay: 1,
      create: 1,
      dov_date: 'owner',
      cType: '',
      uid: '754416',
      isOwner: '1',
      ownerIcon: '/ib.php?do=getAva&uid=754416&_ts=Lt6ysz_1539084995&_nts=%nts',
      owner_uid: '754416',
      isNaka: 1
    })).toEqual({
      id: '40817810850115100358',
      type: 'checking',
      title: 'СКБ "Накопительный счет"',
      instrument: 'RUB',
      balance: 0,
      savings: true,
      syncID: [
        '40817810850115100358'
      ]
    })
  })

  it('converts a deposit', () => {
    expect(convertAccount({
      account: '42304810650120320399',
      openDate: '2018-05-15',
      exp_date: '2018-11-13',
      name: 'СКБ "Максимальный доход 91 - 180 дней"',
      name_sh: '+CFO_SKB_M_m_doh_180',
      sum: 1000000,
      sum_pp: 1000000,
      sum_acc: 1000000,
      accType: 'vklad',
      cardCredit: 0,
      creditLimit: 0,
      unusedCreditLimit: 0,
      bank: {
        bic: '043469743',
        corrAccNum: '30101810300000000743',
        name: 'ПАО "СОВКОМБАНК"',
        city: 'КОСТРОМА',
        branchId: '44948421'
      },
      shortName: '+CFO_SKB_M_m_doh_180',
      initDelay: 10,
      dashInfoSum: 15956.16,
      dashInfoCur: '810',
      dashInfoAlert: 0,
      dashInfo: 'Выплата % на 13.11.2018 составит %sum',
      ownerNameEng: '',
      ownerName: 'Николай Николаевич Николаев',
      inn: '',
      kpp: '',
      ownerAddress: '111111, НИКОЛАЕВСКАЯ ОБЛ, . НИКОЛАЕВСК, .НИКОЛАЕВА, д.11, кв.11',
      ownerAddressEng: '. .b.',
      abs_i: 'Николай',
      abs_o: 'Николаевич',
      abs_f: 'Николаев',
      bank_part_id: '',
      pay: 1,
      create: 1,
      dov_date: 'owner',
      cType: '',
      uid: '1056999',
      isOwner: '1',
      ownerIcon: '',
      owner_uid: '1056999'
    })).toEqual({
      id: '42304810650120320399',
      type: 'deposit',
      title: 'СКБ "Максимальный доход 91 - 180 дней"',
      instrument: 'RUB',
      balance: 1000000,
      percent: 1,
      capitalization: false,
      startBalance: 1000000,
      startDate: new Date('2018-05-15'),
      endDateOffset: 182,
      endDateOffsetInterval: 'day',
      payoffStep: 0,
      payoffInterval: null,
      syncID: [
        '42304810650120320399'
      ]
    })
  })
})

describe('convertTransaction', () => {
  it('converts an income', () => {
    expect(convertTransaction({
      'abs_tid': 'M15099074452',
      'account': '30233810350110021459',
      'bank': 'ФИЛИАЛ "ЦЕНТРАЛЬНЫЙ" ПАО "СОВКОМБАНК"',
      'bic': '045004763',
      'credit': 3000,
      'debit': 0,
      'desc': 'Платеж. Авторизация №002684493452 Дата 2018.10.04 09:10 Описание: RU,MOSCOW  RUS',
      'desc_sh': 'Платеж. Авторизация №002684493452 Дата 2018.10.04 09:10 Описание: RU,MOSCOW',
      'id': 'b6bdd0dda4ccce6d8c3840c77eaa806c',
      'inn': '4401116480',
      'kpp': '',
      'mcc': '',
      'name': 'ФИЛИАЛ "ЦЕНТРАЛЬНЫЙ" ПАО "СОВКОМБАНК"',
      'num': '0044',
      'oper': '01',
      'sortDate': '2018-10-04 09:30:07',
      'stat': 2,
      'sum': 3000,
      'sum_issue': 0,
      'trnstate': 0
    }, { id: 'account' })).toEqual({
      id: 'b6bdd0dda4ccce6d8c3840c77eaa806c',
      hold: false,
      date: new Date('2018-10-04T09:30:07+03:00'),
      income: 3000,
      incomeAccount: 'account',
      outcome: 0,
      outcomeAccount: 'account'
    })
  })

  it('converts an outcome with a payee', () => {
    expect(convertTransaction({
      num: '',
      sortDate: '2018-10-04 21:30:53',
      sum: 1050,
      sum_issue: 0,
      desc: 'Покупка MD00PYATEROCHKA 6123 CHEBOKSARY RUS',
      account: '',
      bic: '',
      name: '',
      inn: '',
      bank: '',
      mcc: '5411',
      oper: 'A',
      stat: 2,
      trnstate: 0,
      id: '9406fdb20a58e2e3ad7e9eebb47f9723',
      desc_sh: '',
      debit: 1050,
      credit: 0,
      kpp: '',
      hold: 1,
      cardEnd: '4623',
      abs_tid: 'A1349928983#951194201827777453'
    }, { id: 'account' })).toEqual({
      date: new Date('2018-10-04T21:30:53+03:00'),
      hold: true,
      income: 0,
      incomeAccount: 'account',
      outcome: 1050,
      outcomeAccount: 'account',
      payee: 'PYATEROCHKA 6123 CHEBOKSARY RUS',
      mcc: 5411
    })
  })

  it('converts a cash withdrawal', () => {
    expect(convertTransaction({
      num: '',
      sortDate: '2018-10-08 18:36:45',
      sum: 3000,
      sum_issue: 0,
      desc: 'Выдача AVG_ATM MOSCOW RUS',
      account: '',
      bic: '',
      name: '',
      inn: '',
      bank: '',
      mcc: '6011',
      oper: 'A',
      stat: 2,
      trnstate: 0,
      id: 'effdf34c7e573d3b80e7730f9fc9174c',
      desc_sh: '',
      debit: 3000,
      credit: 0,
      kpp: '',
      hold: 1,
      cardEnd: '2128',
      abs_tid: 'A1692268936#969642201828167005'
    }, { id: 'account' })).toEqual({
      date: new Date('2018-10-08T18:36:45+03:00'),
      hold: true,
      income: 3000,
      incomeAccount: 'cash#RUB',
      outcome: 3000,
      outcomeAccount: 'account'
    })

    expect(convertTransaction({
      num: '',
      sortDate: '2018-10-15 12:40:26',
      sum: 4000,
      sum_issue: 0,
      desc: 'Выдача 490000007554 MD00ATM 490726 75 LENI RUS',
      account: '',
      bic: '',
      name: '',
      inn: '',
      bank: '',
      mcc: '6011',
      oper: 'A',
      stat: 2,
      trnstate: 0,
      id: '972478cbee9c8344e3c9cd7e7e7d86f2',
      desc_sh: '',
      debit: 4000,
      credit: 0,
      kpp: '',
      hold: 1,
      cardEnd: '5110',
      abs_tid: 'A1697264830#496717201828845626'
    }, { id: 'account' })).toEqual({
      date: new Date('2018-10-15T12:40:26+03:00'),
      hold: true,
      income: 4000,
      incomeAccount: 'cash#RUB',
      outcome: 4000,
      outcomeAccount: 'account'
    })

    expect(convertTransaction({
      num: '',
      sortDate: '2018-11-02 17:59:59',
      sum: 400,
      sum_issue: 0,
      desc: 'Выдача 980000017796    PERM RUS',
      account: '',
      bic: '',
      name: '',
      inn: '',
      bank: '',
      mcc: '6011',
      oper: 'A',
      stat: 2,
      trnstate: 0,
      id: 'd68d8ea13e1ce6f84ccfc349ac36e1de',
      desc_sh: '',
      debit: 400,
      credit: 0,
      kpp: '',
      hold: 1,
      cardEnd: '5110',
      abs_tid: 'A1697264830#949800201830664799'
    }, { id: 'account' })).toEqual({
      date: new Date('2018-11-02T17:59:59+03:00'),
      hold: true,
      income: 400,
      incomeAccount: 'cash#RUB',
      outcome: 400,
      outcomeAccount: 'account'
    })
  })

  it('converts a transaction with a comment', () => {
    expect(convertTransaction({
      num: '0039',
      sortDate: '2018-10-09 10:09:01',
      sum: 30000,
      sum_issue: 0,
      desc: 'перечисление собственных д/с без НДС  RUS',
      account: '42303810650110191208',
      bic: '045004763',
      name: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
      inn: '0',
      bank: 'ФИЛИАЛ "ЦЕНТРАЛЬНЫЙ" ПАО "СОВКОМБАНК"',
      mcc: '',
      oper: '01',
      stat: 2,
      trnstate: 0,
      id: 'a194f9cae2573bc8ab06d214754b395f',
      desc_sh: 'Перевод средств',
      debit: 0,
      credit: 30000,
      kpp: '',
      abs_tid: 'M15133650113'
    }, { id: 'account' })).toEqual({
      id: 'a194f9cae2573bc8ab06d214754b395f',
      date: new Date('2018-10-09T10:09:01+03:00'),
      hold: false,
      income: 30000,
      incomeAccount: 'account',
      outcome: 0,
      outcomeAccount: 'account',
      comment: 'перечисление собственных д/с без НДС'
    })
  })

  it('converts a transfer from another bank', () => {
    expect(convertTransaction({
      num: '0021',
      sortDate: '2018-11-14 18:36:19',
      sum: 5230.92,
      sum_issue: 0,
      desc: 'Перевод с карты *6377, Оплата по договору 1379444052. НДС не облагается.  RUS',
      account: '30282210400000000019',
      bic: '044525974',
      name: 'АО "ТИНЬКОФФ БАНК" / НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
      inn: '7710140679',
      bank: 'АО "ТИНЬКОФФ БАНК"',
      mcc: '',
      oper: '01',
      stat: 2,
      trnstate: 0,
      id: '355686e100fd71948a3e7d69b368e186',
      desc_sh: 'Пополнение счета',
      debit: 0,
      credit: 5230.92,
      kpp: '',
      abs_tid: 'M15546514102'
    }, { id: 'account' })).toEqual({
      id: '355686e100fd71948a3e7d69b368e186',
      date: new Date('2018-11-14T18:36:19+03:00'),
      hold: false,
      income: 5230.92,
      incomeAccount: 'account',
      outcome: 5230.92,
      outcomeAccount: 'ccard#RUB#6377',
      comment: 'Перевод с карты *6377, Оплата по договору 1379444052. НДС не облагается.'
    })
  })
})

describe('parseDescription', () => {
  it('parses different descriptions', () => {
    expect(parseDescription('Покупка MD00PYATEROCHKA 6123 CHEBOKSARY RUS')).toEqual({
      payee: 'PYATEROCHKA 6123 CHEBOKSARY RUS'
    })
    expect(parseDescription('Покупка YANDEX TAXI MOSCOW RUS')).toEqual({
      payee: 'YANDEX TAXI MOSCOW RUS'
    })
    expect(parseDescription('Покупка Tortik 11 Baikonur CHEBOXARY G RUS')).toEqual({
      payee: 'Tortik 11 Baikonur CHEBOXARY G RUS'
    })
    expect(parseDescription('Платеж. Авторизация №827615579638 Дата 2018.10.03 18:10 Описание: RU,MOSCOW  RUS')).toEqual({})
    expect(parseDescription('Покупка MD00VERNYI UL  DEMJANA SAINT PETERSB RUS')).toEqual({
      payee: 'VERNYI UL DEMJANA SANKT-PETERBURG RUS'
    })
    expect(parseDescription('Возврат покупки Lamoda MOSKVA RUS')).toEqual({
      payee: 'Lamoda MOSKVA RUS'
    })
    expect(parseDescription('Перевод Card2Card MOSKVA G RUS')).toEqual({
      comment: 'Перевод Card2Card'
    })
    expect(parseDescription('перечисление собственных д/с без НДС  RUS', 'Перевод средств')).toEqual({
      comment: 'перечисление собственных д/с без НДС'
    })
    expect(parseDescription('Зачисление процентов за депозит(810/000129536900) для счета 810/000129536429  RUS', 'Зачисление процентов')).toEqual({
      comment: 'Зачисление процентов за депозит(810/000129536900) для счета 810/000129536429'
    })
    expect(parseDescription('Покупка KARUSEL PROSVESHCHENIY SANKT PETERBU RUS')).toEqual({
      payee: 'KARUSEL PROSVESHCHENIY SANKT-PETERBURG RUS'
    })
    expect(parseDescription('Покупка LEROY MERLIN ST  PETER SAINT PETERSB RUS')).toEqual({
      payee: 'LEROY MERLIN SANKT-PETERBURG RUS'
    })
    expect(parseDescription('Начисление бонуса в соответствии с условиями бонусной программы. Без НДС.  RUS', 'Начисление бонуса')).toEqual({
      comment: 'Начисление бонуса в соответствии с условиями бонусной программы. Без НДС.'
    })
    expect(parseDescription('Пополнение CHATBANK MONEY SEND RUS')).toEqual({
      comment: 'Пополнение CHATBANK MONEY'
    })
    expect(parseDescription('Оплата услуг MD00Lenta LLC MOSCOW RUS')).toEqual({
      payee: 'Lenta LLC MOSCOW RUS'
    })
    expect(parseDescription('ПОГАШЕНИЕ КРЕДИТА за период с 06/09/2018 по 05/10/2018.  RUS', 'Погашение долга')).toEqual({
      comment: 'ПОГАШЕНИЕ КРЕДИТА за период с 06/09/2018 по 05/10/2018.'
    })
    expect(parseDescription('Перевод с карты *6377, Оплата по договору 1379444052. НДС не облагается.  RUS', 'Пополнение счета')).toEqual({
      comment: 'Перевод с карты *6377, Оплата по договору 1379444052. НДС не облагается.'
    })
  })
})
