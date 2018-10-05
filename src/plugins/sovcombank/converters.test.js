import { convertCard, convertTransaction } from './converters'

describe('convertCard', () => {
  it('converts a credit card', () => {
    expect(convertCard({
      'account': '40817810550006885012',
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
      'cardEnd': '6549',
      'cardExpDate': '2023-03-31',
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
      'ownerName': 'Сычкин Константин Владимирович',
      'inn': '',
      'kpp': '',
      'ownerAddress': '195276, САНКТ-ПЕТЕРБУРГ ОБЛ, . САНКТ-ПЕТЕРБУРГ, .СУЗДАЛЬСКИЙ, д.75, кв.70',
      'ownerAddressEng': '. .b.',
      'abs_i': 'Константин',
      'abs_o': 'Владимирович',
      'abs_f': 'Сычкин',
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
      id: '40817810550006885012',
      type: 'ccard',
      title: 'MC WORLD ХАЛВА 2.0 СНЯТИЕ',
      instrument: 'RUB',
      balance: 3000,
      creditLimit: 75000,
      syncID: [
        '553609******6549',
        '40817810550006885012'
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
      date: new Date('2018-10-04T09:30:07+03:00'),
      income: 3000,
      incomeAccount: 'account',
      outcome: 0,
      outcomeAccount: 'account',
      payee: 'RU,MOSCOW'
    })
  })
})
