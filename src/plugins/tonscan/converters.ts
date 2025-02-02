import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { WalletInfo, JettonInfo, TonTransaction, JettonTransfer } from './api'

const TRUNCATE_THRESHOLD = 0.01

function convertTonFromNano (balance: number): number {
  return keepTwoDigitsAfterPoint(balance / (10 ** 9))
}

function convertJettonBalanceFromDecimals (jettonInfo: JettonInfo): number {
  return keepTwoDigitsAfterPoint(jettonInfo.balance / (10 ** jettonInfo.decimals))
}

function keepTwoDigitsAfterPoint (value: number): number {
  // zenmoney can store only 2 digits after the point
  // truncating number without rounding
  return Math.floor(value * 100) / 100
}

export function convertWalletToAccount (wallet: WalletInfo): AccountOrCard {
  return {
    id: wallet.address,
    type: AccountType.ccard,
    title: wallet.address,
    instrument: 'TON',
    balance: convertTonFromNano(wallet.balance),
    available: convertTonFromNano(wallet.balance),
    creditLimit: 0,
    syncIds: [wallet.address]
  }
}

export function convertJettonToAccount (jettonInfo: JettonInfo): AccountOrCard {
  return {
    id: jettonInfo.address,
    type: AccountType.ccard,
    title: jettonInfo.title,
    instrument: jettonInfo.jettonType,
    balance: convertJettonBalanceFromDecimals(jettonInfo),
    available: convertJettonBalanceFromDecimals(jettonInfo),
    creditLimit: 0,
    syncIds: [jettonInfo.address]
  }
}

export function convertTonTransaction (transaction: TonTransaction, walletInfo: WalletInfo): Transaction | null {
  const operationSign = transaction.fromAddress === walletInfo.address ? -1 : 1
  const sum = operationSign * convertTonFromNano(transaction.quantity)
  const merchantName = transaction.fromAddress === walletInfo.address ? transaction.toAddress : transaction.fromAddress

  // Skip trash transactions
  if (Math.abs(sum) < TRUNCATE_THRESHOLD) {
    return null
  }

  return {
    hold: false,
    date: new Date(transaction.timestamp * 1000),
    movements: [
      {
        id: transaction.transactionId,
        account: { id: walletInfo.address },
        sum,
        fee: 0,
        invoice: null
      }
    ],
    merchant: {
      fullTitle: merchantName,
      mcc: null,
      location: null
    },
    comment: null
  }
}

export function convertJettonTransfer (transfer: JettonTransfer, jettons: JettonInfo[]): Transaction | null {
  for (const jetton of jettons) {
    if (jetton.address !== transfer.jettonAddress) {
      continue
    }

    const operationSign = transfer.fromAddress === jetton.owner ? -1 : 1
    const sum = operationSign * keepTwoDigitsAfterPoint((transfer.quantity) / (10 ** jetton.decimals))
    const merchantName = transfer.fromAddress === jetton.owner ? transfer.toAddress : transfer.fromAddress

    // Skip trash transactions
    if (Math.abs(sum) < TRUNCATE_THRESHOLD) {
      continue
    }

    return (
      {
        hold: false,
        date: new Date(transfer.timestamp * 1000),
        movements: [
          {
            id: transfer.transactionId,
            account: { id: jetton.address },
            sum,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: merchantName,
          mcc: null,
          location: null
        },
        comment: null
      }
    )
  }

  return null
}
