import { Account as ZenMoneyAccount, AccountType, Transaction as ZenMoneyTransaction, Movement as TransactionMovement } from '../../types/zenmoney'
import { Account, AccountRecord, Record } from './models'

export function convertToZenMoneyAccount (account: Account): ZenMoneyAccount {
  return {
    id: account.id,
    type: AccountType.checking,
    title: `BoG Business ${account.currency}`,
    instrument: account.currency,
    syncIds: [account.id],
    balance: account.balance
  }
}

function createMovement (record: AccountRecord, sum: number, fee = 0): TransactionMovement {
  return {
    id: record.EntryId.toString(),
    account: { id: record.AccountID },
    sum,
    fee,
    invoice: null
  }
}

function createCounterpartyMovement (record: AccountRecord, sum: number, fee = 0, receiving = false): TransactionMovement {
  const counterparty = receiving ? record.SenderDetails : record.BeneficiaryDetails
  return {
    id: null,
    account: {
      type: AccountType.checking,
      instrument: record.DocumentDestinationCurrency,
      company: counterparty.Name === '' ? null : { id: counterparty.Name },
      syncIds: [counterparty.AccountNumber]
    },
    sum,
    fee,
    invoice: null
  }
}

function addMatchingConversion (record: AccountRecord, transaction: ZenMoneyTransaction, allRecords: AccountRecord[]): void {
  const matchingRecord = allRecords.find(r =>
    r.DocumentProductGroup === 'PLC' &&
    r.AccountID !== record.AccountID &&
    r.EntryDate === record.EntryDate &&
    r.DocumentNomination === record.DocumentNomination
  )
  if (matchingRecord != null) {
    transaction.movements.push(createMovement(matchingRecord, matchingRecord.EntryAmount))
  }
}
export function convertToZenMoneyTransaction (record: AccountRecord, allRecords: AccountRecord[]): ZenMoneyTransaction {
  const mccMatch = record.EntryComment.match(/MCC:\s*(\d{4})/)

  let mcc: number | null = null
  if ((mccMatch?.[1]) != null) {
    mcc = parseInt(mccMatch[1])
  }

  const transaction: ZenMoneyTransaction = {
    hold: false,
    date: new Date(record.EntryDate),
    movements: [createMovement(record, record.EntryAmount)],
    merchant: record.BeneficiaryDetails.Name === '' ? null : { city: null, country: null, mcc, title: record.BeneficiaryDetails.Name, location: null },
    comment: record.EntryComment
  }

  switch (record.DocumentProductGroup) {
    case 'PMD': // Transfer of a national currency
    case 'PMI': // Transfer of a foreign currency
      if (record.EntryAmount < 0) {
        // bank transfer outgoing
        transaction.movements.push(
          createCounterpartyMovement(record, record.EntryAmountDebit)
        )
      } else {
        // bank transfer incoming
        const movements = [
          createCounterpartyMovement(record, -record.EntryAmount, 0, true)
        ]
        transaction.movements.push(...movements)
      }
      break

    case 'CCO':
      // currency exchange between accounts
      transaction.movements.push(
        {
          id: null,
          account: {
            type: AccountType.checking,
            instrument: record.DocumentSourceCurrency,
            company: null,
            syncIds: [record.SenderDetails.AccountNumber]
          },
          sum: record.DocumentSourceAmount,
          fee: 0,
          invoice: null
        }
      )
      break

    case 'COM':
    case 'FEE':
    case 'VE': // Verification Entry - bank fee for document/certificate
      // commission or fee
      transaction.movements[0].fee = (transaction.movements[0].sum != null) ? -transaction.movements[0].sum : 0
      transaction.movements[0].sum = 0
      break

    case 'TRN': // card payment
      break

    case 'PLC': // automatic currency conversion
      addMatchingConversion(record, transaction, allRecords)
      break

    default:
      throw new Error(`Unknown DocumentProductGroup: ${record.DocumentProductGroup}`)
  }

  return transaction
}

export function injectAccountInfo (records: Record[], account: Account): AccountRecord[] {
  return records.map(record => ({
    ...record,
    Currency: account.currency,
    AccountID: account.id
  }))
}
