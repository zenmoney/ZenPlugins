import { flatten } from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccounts (apiAccounts) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    let account
    switch (apiAccount.structType) {
      case 'checking':
        account = convertCurrentAccount(apiAccount)
        break
      case 'deposit':
      case 'saving':
        account = convertDeposit(apiAccount)
        break
      case 'foreignCurrencyAccount':
        account = convertForeignCurrencyAccount(apiAccount)
        break
      case 'loan':
        account = convertLoan(apiAccount)
        break
      case 'mortgage':
        account = convertMortgage(apiAccount)
        break
      default:
        console.assert(false, 'unknown account type', apiAccount)
    }
    if (account) {
      accounts.push(account)
    }
  }
  return flatten(accounts)
}

function convertMortgage (apiAccount) {
  return apiAccount.subLoanData.map(subLoan => {
    const id = `${apiAccount.mortgageLoanSerialId}-${subLoan.subLoansSerialId}`
    const startDate = parseDateTime(subLoan.formattedStartDate)
    const endDate = parseDateTime(subLoan.formattedEndDate)
    const { interval, count } = getIntervalBetweenDates(startDate, endDate)
    return {
      mainProduct: null,
      account: {
        id,
        type: 'loan',
        title: apiAccount.productLabel || 'משכנתא',
        instrument: 'ILS',
        syncIds: [id],
        balance: -subLoan.revaluedBalance,
        startDate,
        startBalance: subLoan.revaluedBalance,
        capitalization: true,
        percent: subLoan.validityInterestRate,
        endDateOffsetInterval: interval,
        endDateOffset: count,
        payoffInterval: 'month',
        payoffStep: 1
      }
    }
  })
}

function convertLoan (apiAccount) {
  const id = getLoanId(apiAccount)
  const startDate = parseDateTime(apiAccount.details.formattedValueDate)
  const endDate = parseDateTime(apiAccount.details.formattedLoanEndDate)
  const { interval, count } = getIntervalBetweenDates(startDate, endDate)

  return {
    mainProduct: null,
    account: {
      id,
      type: 'loan',
      title: apiAccount.productNickName || 'אַשׁרַאי',
      instrument: 'ILS',
      syncIds: [id],
      balance: -apiAccount.debtAmount,
      startDate,
      startBalance: apiAccount.originalLoanPrincipalAmount,
      capitalization: true,
      percent: apiAccount.interestRate,
      endDateOffsetInterval: interval,
      endDateOffset: count,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function getLoanId (apiAccount) {
  return `${apiAccount.creditSerialNumber}-${apiAccount.unitedCreditTypeCode}`
}

function convertCurrentAccount (apiAccount) {
  const id = `${apiAccount.bankNumber}-${apiAccount.branchNumber}-${apiAccount.accountNumber}`
  return {
    mainProduct: {
      id,
      type: 'account'
    },
    account: {
      id,
      type: 'checking',
      title: `*${apiAccount.accountNumber.toString().slice(-4)} חשבון נוכחי`,
      instrument: 'ILS',
      syncID: [
        id
      ],
      balance: apiAccount.details.currentBalance,
      creditLimit: apiAccount.details.currentAccountCreditFrame
    }
  }
}

function convertDeposit (apiAccount) {
  return {
    mainProduct: null,
    account: {
      id: apiAccount.depositSerialId?.toString() || apiAccount.agreementOpeningDate.toString(),
      type: 'deposit',
      title: apiAccount.shortProductName || apiAccount.shortSavingDepositName,
      instrument: 'ILS',
      syncID: [
        apiAccount.depositSerialId?.toString() || apiAccount.agreementOpeningDate.toString()
      ],
      balance: apiAccount.revaluedTotalAmount || apiAccount.revaluedBalance,
      startBalance: apiAccount.revaluedTotalAmount || apiAccount.revaluedBalance,
      startDate: parseDateTime(apiAccount.formattedAgreementOpeningDate),
      percent: apiAccount.adjustedInterest * 100,
      capitalization: true,
      endDateOffsetInterval: 'year',
      endDateOffset: 1,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function convertForeignCurrencyAccount (apiAccount) {
  const balancesAndLimits = apiAccount.balancesAndLimitsDataList[0]
  const id = apiAccount.mainProductId + balancesAndLimits.detailedAccountTypeCode.toString()
  return {
    mainProduct: {
      id: apiAccount.mainProductId,
      type: 'foreignCurrencyAccount',
      currencyCode: balancesAndLimits.currencyCode,
      detailedAccountTypeCode: balancesAndLimits.detailedAccountTypeCode
    },
    account: {
      id,
      type: 'checking',
      title: balancesAndLimits.currencyLongDescription,
      instrument: balancesAndLimits.currencySwiftCode,
      syncID: [
        id
      ],
      balance: balancesAndLimits.currentBalance
    }
  }
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.eventAmount === 0) {
    return null
  }
  const transaction = {
    hold: false,
    date: parseDateTime(apiTransaction.formattedEventDate || apiTransaction.formattedValueDate),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum: apiTransaction.eventActivityTypeCode !== 1 ? -apiTransaction.eventAmount : apiTransaction.eventAmount,
        fee: 0
      }
    ],
    merchant: {
      country: null,
      city: null,
      title: apiTransaction.activityDescription,
      mcc: null,
      location: null
    },
    comment: null
  }
  return transaction
}

function parseDateTime (input) {
  return new Date(input.replace('Z', '') + '+02:00')
}
