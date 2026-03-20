import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        eventDate: 20190812,
        formattedEventDate: '2019-08-12T00:00:00.000Z',
        serialNumber: 1,
        activityTypeCode: 515,
        activityDescription: 'כרטיסי אשראי ל',
        activityDescriptionIncludeValueDate: null,
        textCode: 803,
        referenceNumber: 8547994,
        referenceCatenatedNumber: 72745,
        valueDate: 20190812,
        formattedValueDate: '2019-08-12T00:00:00.000Z',
        eventAmount: 6257.9,
        eventActivityTypeCode: 2,
        currentBalance: 96150.14,
        internalLinkCode: 9,
        originalEventCreateDate: 20190812,
        formattedOriginalEventCreateDate: null,
        transactionType: 'REGULAR',
        dataGroupCode: 7,
        beneficiaryDetailsData: null,
        expandedEventDate: '2019081200001',
        executingBranchNumber: 0,
        eventId: 0,
        details: '/ServerServices/current-account/permissions/8547994?referenceCatenatedNumber=72745&eventAmount=6257.9&originalEventDate=20190812',
        pfmDetails: null,
        differentDateIndication: 'N',
        rejectedDataEventPertainingIndication: 'N',
        tableNumber: 5,
        recordNumber: 63,
        contraBankNumber: 0,
        contraBranchNumber: 0,
        contraAccountNumber: 0,
        contraAccountTypeCode: 0,
        marketingOfferContext: 0,
        commentExistenceSwitch: 0,
        englishActionDesc: 'VISA',
        fieldDescDisplaySwitch: 1,
        offerActivityContext: 'currentAccountTransaction_803_515',
        comment: null
      },
      {
        hold: false,
        date: new Date('2019-08-12T00:00:00+02:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -6257.9,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'כרטיסי אשראי ל',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'ILS' })).toEqual(transaction)
  })
})
