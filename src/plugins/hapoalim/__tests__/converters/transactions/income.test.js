import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        activityDescription: 'חברת חשמל-צפון',
        activityDescriptionIncludeValueDate: null,
        activityTypeCode: 159,
        beneficiaryDetailsData: null,
        comment: null,
        commentExistenceSwitch: 0,
        contraAccountNumber: 0,
        contraAccountTypeCode: 0,
        contraBankNumber: 0,
        contraBranchNumber: 0,
        currentBalance: 51918.59,
        dataGroupCode: 2,
        details: null,
        differentDateIndication: 'N',
        englishActionDesc: 'ELECTRIC.C-SAL',
        eventActivityTypeCode: 1,
        eventAmount: 11833.76,
        eventDate: 20200520,
        eventId: 0,
        executingBranchNumber: 0,
        expandedEventDate: '2020052000001',
        fieldDescDisplaySwitch: 1,
        formattedEventDate: '2020-05-20T00:00:00.000Z',
        formattedOriginalEventCreateDate: null,
        formattedValueDate: '2020-05-20T00:00:00.000Z',
        internalLinkCode: 0,
        marketingOfferContext: 0,
        offerActivityContext: 'currentAccountTransaction_801_159',
        originalEventCreateDate: 20200520,
        pfmDetails: null,
        recordNumber: 1,
        referenceCatenatedNumber: 99001,
        referenceNumber: 3550027,
        rejectedDataEventPertainingIndication: 'N',
        serialNumber: 1,
        tableNumber: 5,
        textCode: 801,
        transactionType: 'REGULAR',
        valueDate: 20200520
      },
      {
        hold: false,
        date: new Date('2020-05-20T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 11833.76,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'חברת חשמל-צפון',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        eventDate: 20190814,
        formattedEventDate: '2019-08-14T00:00:00.000Z',
        serialNumber: 1,
        activityTypeCode: 175,
        activityDescription: 'חברת החשמל ליש',
        activityDescriptionIncludeValueDate: null,
        textCode: 802,
        referenceNumber: 19200203,
        referenceCatenatedNumber: 99020,
        valueDate: 20190814,
        formattedValueDate: '2019-08-14T00:00:00.000Z',
        eventAmount: 40.0,
        eventActivityTypeCode: 1,
        currentBalance: 96190.14,
        internalLinkCode: 0,
        originalEventCreateDate: 20190814,
        formattedOriginalEventCreateDate: null,
        transactionType: 'REGULAR',
        dataGroupCode: 9,
        beneficiaryDetailsData: null,
        expandedEventDate: '2019081400001',
        executingBranchNumber: 0,
        eventId: 0,
        details: null,
        pfmDetails: null,
        differentDateIndication: 'N',
        rejectedDataEventPertainingIndication: 'N',
        tableNumber: 5,
        recordNumber: 62,
        contraBankNumber: 0,
        contraBranchNumber: 0,
        contraAccountNumber: 0,
        contraAccountTypeCode: 0,
        marketingOfferContext: 0,
        commentExistenceSwitch: 0,
        englishActionDesc: 'ELECTRIC CORP.',
        fieldDescDisplaySwitch: 1,
        offerActivityContext: 'currentAccountTransaction_802_175',
        comment: null
      },
      {
        hold: false,
        date: new Date('2019-08-14T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 40,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'חברת החשמל ליש',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        metadata: {
          attributes: {
            originalEventKey: {
              hidden: 'true'
            },
            contraBranchNumber: {
              disabled: 'true'
            },
            contraAccountNumber: {
              disabled: 'true'
            },
            contraBankNumber: {
              disabled: 'true'
            },
            contraAccountFieldNameLable: {
              disabled: 'true'
            },
            dataGroupCode: {
              hidden: 'true'
            },
            currencyRate: {
              hidden: 'true'
            },
            contraCurrencyCode: {
              hidden: 'true'
            },
            rateFixingCode: {
              hidden: 'true'
            }
          },
          links: {}
        },
        executingDate: 20200305,
        formattedExecutingDate: '2020-03-05T00:00:00.000Z',
        valueDate: 20200305,
        formattedValueDate: '2020-03-05T00:00:00.000Z',
        originalSystemId: 325,
        activityDescription: 'עסקת מט"ח',
        eventAmount: 0.01,
        currentBalance: 0.01,
        referenceCatenatedNumber: 340,
        referenceNumber: 3400257,
        currencyRate: 0.0,
        eventDetails: '00000000000000',
        rateFixingCode: 0,
        rateFixingDescription: '',
        contraCurrencyCode: 0,
        eventActivityTypeCode: 1,
        transactionType: 'REGULAR',
        rateFixingShortDescription: 'ללא שער',
        currencyLongDescription: 'שקל חדש',
        activityTypeCode: 675,
        eventNumber: 35590,
        validityDate: 20200305,
        comments: null,
        commentExistenceSwitch: 0,
        accountName: 'דמידוב קיריל ו/או גורבצביץ יבגניה',
        contraBankNumber: 12,
        contraBranchNumber: 469,
        contraAccountNumber: 219033,
        originalEventKey: 0,
        contraAccountFieldNameLable: 'CREDIT_COMMENT',
        dataGroupCode: 0,
        recordSerialNumber: 35590,
        expendedExecutingDate: '2020030535590',
        currencySwiftCode: 'ILS',
        urlAddress: null
      },
      {
        hold: false,
        date: new Date('2020-03-05T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 0.01,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'עסקת מט"ח',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'ILS' })).toEqual(transaction)
  })
})
