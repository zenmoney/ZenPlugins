import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { WalletInfo, JettonInfo, TonTransaction, JettonTransfer } from './api'

function convertTonFromNano (balance: number): number {
  return balance / (10 ** 9)
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
    id: jettonInfo.ownerWithJettonType,
    type: AccountType.ccard,
    title: jettonInfo.ownerWithJettonType,
    instrument: jettonInfo.jettonType,
    balance: jettonInfo.balance / (10 ** jettonInfo.decimals),
    available: jettonInfo.balance / (10 ** jettonInfo.decimals),
    creditLimit: 0,
    syncIds: [jettonInfo.ownerWithJettonType]
  }
}

export function convertTonTransaction (transaction: TonTransaction, walletInfo: WalletInfo): Transaction | null {
  const operationSign = transaction.fromAddress === walletInfo.address ? -1 : 1
  const sum = convertTonFromNano(operationSign * Number(transaction.quantity))
  const merchantName = transaction.fromAddress === walletInfo.address ? transaction.toAddress : transaction.fromAddress

  // Skip trash transactions
  if (Math.abs(sum) < 0.000001) {
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
    const sum = (operationSign * Number(transfer.quantity)) / (10 ** jetton.decimals)
    const merchantName = transfer.fromAddress === jetton.owner ? transfer.toAddress : transfer.fromAddress

    // Skip trash transactions
    if (Math.abs(sum) < 0.00001) {
      continue
    }

    return (
      {
        hold: false,
        date: new Date(transfer.timestamp * 1000),
        movements: [
          {
            id: transfer.transactionId,
            account: { id: jetton.ownerWithJettonType },
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
