import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        eventDate: 20190819,
        formattedEventDate: '2019-08-19T00:00:00.000Z',
        serialNumber: 1,
        activityTypeCode: 485,
        activityDescription: 'העברה-נתב קולי',
        activityDescriptionIncludeValueDate: null,
        textCode: 719,
        referenceNumber: 33921,
        referenceCatenatedNumber: 12427,
        valueDate: 20190819,
        formattedValueDate: '2019-08-19T00:00:00.000Z',
        eventAmount: 50000.0,
        eventActivityTypeCode: 2,
        currentBalance: 46190.14,
        internalLinkCode: 0,
        originalEventCreateDate: 20190819,
        formattedOriginalEventCreateDate: null,
        transactionType: 'REGULAR',
        dataGroupCode: 9,
        beneficiaryDetailsData: null,
        expandedEventDate: '2019081900001',
        executingBranchNumber: 427,
        eventId: 0,
        details: null,
        pfmDetails: null,
        differentDateIndication: 'N',
        rejectedDataEventPertainingIndication: 'N',
        tableNumber: 5,
        recordNumber: 61,
        contraBankNumber: 912,
        contraBranchNumber: 702,
        contraAccountNumber: 659339,
        contraAccountTypeCode: 5,
        marketingOfferContext: 0,
        commentExistenceSwitch: 0,
        englishActionDesc: 'TRANSFER-IVR',
        fieldDescDisplaySwitch: 0,
        offerActivityContext: 'currentAccountTransaction_719_485',
        comment: null
      },
      {
        hold: false,
        date: new Date('2019-08-19T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -50000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'העברה-נתב קולי',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        eventDate: 20190805,
        formattedEventDate: '2019-08-05T00:00:00.000Z',
        serialNumber: 1,
        activityTypeCode: 515,
        activityDescription: 'מכבי',
        activityDescriptionIncludeValueDate: null,
        textCode: 803,
        referenceNumber: 25300732,
        referenceCatenatedNumber: 69486,
        valueDate: 20190805,
        formattedValueDate: '2019-08-05T00:00:00.000Z',
        eventAmount: 81.51,
        eventActivityTypeCode: 2,
        currentBalance: 102408.04,
        internalLinkCode: 9,
        originalEventCreateDate: 20190805,
        formattedOriginalEventCreateDate: null,
        transactionType: 'REGULAR',
        dataGroupCode: 7,
        beneficiaryDetailsData: null,
        expandedEventDate: '2019080500001',
        executingBranchNumber: 0,
        eventId: 0,
        details: '/ServerServices/current-account/permissions/25300732?referenceCatenatedNumber=69486&eventAmount=81.51&originalEventDate=20190805',
        pfmDetails: null,
        differentDateIndication: 'N',
        rejectedDataEventPertainingIndication: 'N',
        tableNumber: 5,
        recordNumber: 64,
        contraBankNumber: 0,
        contraBranchNumber: 0,
        contraAccountNumber: 0,
        contraAccountTypeCode: 0,
        marketingOfferContext: 0,
        commentExistenceSwitch: 0,
        englishActionDesc: 'MACABI FUND',
        fieldDescDisplaySwitch: 1,
        offerActivityContext: 'currentAccountTransaction_803_515',
        comment: null
      },
      {
        hold: false,
        date: new Date('2019-08-05T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -81.51,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'מכבי',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        eventDate: 20190804,
        formattedEventDate: '2019-08-04T00:00:00.000Z',
        serialNumber: 2,
        activityTypeCode: 473,
        activityDescription: 'ע.מפעולות-ישיר',
        activityDescriptionIncludeValueDate: null,
        textCode: 716,
        referenceNumber: 4,
        referenceCatenatedNumber: 300,
        valueDate: 20190804,
        formattedValueDate: '2019-08-04T00:00:00.000Z',
        eventAmount: 5.4,
        eventActivityTypeCode: 2,
        currentBalance: 102489.55,
        internalLinkCode: 0,
        originalEventCreateDate: 20190804,
        formattedOriginalEventCreateDate: null,
        transactionType: 'REGULAR',
        dataGroupCode: 14,
        beneficiaryDetailsData: null,
        expandedEventDate: '2019080400002',
        executingBranchNumber: 702,
        eventId: 0,
        details: null,
        pfmDetails: null,
        differentDateIndication: 'N',
        rejectedDataEventPertainingIndication: 'N',
        tableNumber: 5,
        recordNumber: 65,
        contraBankNumber: 912,
        contraBranchNumber: 702,
        contraAccountNumber: 777641,
        contraAccountTypeCode: 95,
        marketingOfferContext: 0,
        commentExistenceSwitch: 0,
        englishActionDesc: 'DIRECT CH-FEE',
        fieldDescDisplaySwitch: 0,
        offerActivityContext: 'currentAccountTransaction_716_473',
        comment: null
      },
      {
        hold: false,
        date: new Date('2019-08-04T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -5.4,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'ע.מפעולות-ישיר',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        eventDate: 20190804,
        formattedEventDate: '2019-08-04T00:00:00.000Z',
        serialNumber: 1,
        activityTypeCode: 473,
        activityDescription: 'השלמה למינ ד"נ',
        activityDescriptionIncludeValueDate: null,
        textCode: 603,
        referenceNumber: 998,
        referenceCatenatedNumber: 0,
        valueDate: 20190804,
        formattedValueDate: '2019-08-04T00:00:00.000Z',
        eventAmount: 1.1,
        eventActivityTypeCode: 2,
        currentBalance: 102494.95,
        internalLinkCode: 0,
        originalEventCreateDate: 20190804,
        formattedOriginalEventCreateDate: null,
        transactionType: 'REGULAR',
        dataGroupCode: 14,
        beneficiaryDetailsData: null,
        expandedEventDate: '2019080400001',
        executingBranchNumber: 702,
        eventId: 0,
        details: null,
        pfmDetails: null,
        differentDateIndication: 'N',
        rejectedDataEventPertainingIndication: 'N',
        tableNumber: 5,
        recordNumber: 66,
        contraBankNumber: 912,
        contraBranchNumber: 702,
        contraAccountNumber: 776645,
        contraAccountTypeCode: 95,
        marketingOfferContext: 0,
        commentExistenceSwitch: 0,
        englishActionDesc: 'MIN.MNGMNT.FEE',
        fieldDescDisplaySwitch: 0,
        offerActivityContext: 'currentAccountTransaction_603_473',
        comment: null
      },
      {
        hold: false,
        date: new Date('2019-08-04T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -1.1,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'השלמה למינ ד"נ',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        eventDate: 20190613,
        formattedEventDate: '2019-06-13T00:00:00.000Z',
        serialNumber: 1,
        activityTypeCode: 493,
        activityDescription: 'שיק',
        activityDescriptionIncludeValueDate: null,
        textCode: 2,
        referenceNumber: 10126,
        referenceCatenatedNumber: 12799,
        valueDate: 20190613,
        formattedValueDate: '2019-06-13T00:00:00.000Z',
        eventAmount: 12840.0,
        eventActivityTypeCode: 2,
        currentBalance: 83806.62,
        internalLinkCode: 1,
        originalEventCreateDate: 20190613,
        formattedOriginalEventCreateDate: null,
        transactionType: 'REGULAR',
        dataGroupCode: 8,
        beneficiaryDetailsData: null,
        expandedEventDate: '2019061300001',
        executingBranchNumber: 799,
        eventId: 0,
        details: '/ServerServices/current-account/cheques/10126?view=paying&originalEventDate=20190613&chequeAmount=12840.0',
        pfmDetails: null,
        differentDateIndication: 'N',
        rejectedDataEventPertainingIndication: 'N',
        tableNumber: 5,
        recordNumber: 76,
        contraBankNumber: 912,
        contraBranchNumber: 799,
        contraAccountNumber: 808571,
        contraAccountTypeCode: 95,
        marketingOfferContext: 0,
        commentExistenceSwitch: 0,
        englishActionDesc: 'CHECK',
        fieldDescDisplaySwitch: 0,
        offerActivityContext: 'currentAccountTransaction_2_493',
        comment: null
      },
      {
        hold: false,
        date: new Date('2019-06-13T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -12840.0,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'שיק',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'ILS' })).toEqual(transaction)
  })
})
