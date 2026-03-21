import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        eventDate: 20210714,
        formattedEventDate: '2021-07-14T00:00:00.000Z',
        serialNumber: 2,
        activityTypeCode: 172,
        activityDescription: 'ריבית מפקדון',
        activityDescriptionIncludeValueDate: null,
        textCode: 117,
        referenceNumber: 20001,
        referenceCatenatedNumber: 0,
        valueDate: 20210714,
        formattedValueDate: '2021-07-14T00:00:00.000Z',
        eventAmount: 0,
        eventActivityTypeCode: 1,
        currentBalance: 6911.69,
        internalLinkCode: 0,
        originalEventCreateDate: 20210714,
        formattedOriginalEventCreateDate: null,
        transactionType: 'REGULAR',
        dataGroupCode: 4,
        beneficiaryDetailsData: null,
        expandedEventDate: '2021071400002',
        executingBranchNumber: 716,
        eventId: 0,
        details: null,
        pfmDetails: '/ServerServices/pfm/transactions?originalEventCreateDate=20210714&eventSerialNumber=2&dataOrigenCode=1&rejectedDataEventPertainingIndication=N&referenceNumber=20001&referenceCatenatedNumber=0&eventAmount=0.0',
        differentDateIndication: 'N',
        rejectedDataEventPertainingIndication: 'N',
        tableNumber: 5,
        recordNumber: 117,
        contraBankNumber: 912,
        contraBranchNumber: 716,
        contraAccountNumber: 711583,
        contraAccountTypeCode: 95,
        marketingOfferContext: 0,
        commentExistenceSwitch: 0,
        englishActionDesc: 'DEPOSIT INT',
        fieldDescDisplaySwitch: 0,
        offerActivityContext: 'currentAccountTransaction_117_172',
        comment: null,
        displayCreditAccountDetails: 0,
        displayRTGSIncomingTrsDetails: 0
      },
      null
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, {
      id: 'account',
      instrument: 'ILS'
    })).toEqual(transaction)
  })
})
