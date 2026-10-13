import { fetchAddressInfo, fetchAddressTransactionsPage } from './fetchApi'
import { MempoolAddressInfo, MempoolTransaction, PAGE_SIZE, Wallet } from './models'

// Страховка от бесконечного цикла, если API перестанет менять выдачу
// при переданном lastSeenTxId. 200 страниц по 25 — пять тысяч транзакций на адрес.
const MAX_PAGES = 200

function walletAddresses (wallets: Wallet[]): string[] {
  return wallets.flatMap(wallet => wallet.addresses)
}

export async function fetchAddressInfos (wallets: Wallet[]): Promise<Map<string, MempoolAddressInfo>> {
  const infoByAddress = new Map<string, MempoolAddressInfo>()
  // Последовательно, а не Promise.all: лимиты сервиса не опубликованы,
  // а шесть адресов на первом синке дают десятки запросов.
  for (const address of walletAddresses(wallets)) {
    infoByAddress.set(address, await fetchAddressInfo(address))
  }
  return infoByAddress
}

// Курсор /txs/chain/:txid определён только по подтверждённой истории, а первая страница
// /txs отдаёт мемпульные транзакции первыми. Берём самую старую подтверждённую на странице:
// если подтверждённых нет вовсе, листать дальше не по чему.
function oldestConfirmed (page: MempoolTransaction[]): { txid: string, blockTime: number } | null {
  for (let index = page.length - 1; index >= 0; index--) {
    const { txid, block_time: blockTime } = page[index]
    if (blockTime != null) {
      return { txid, blockTime }
    }
  }
  return null
}

async function fetchAddressTransactions (address: string, fromDate: Date): Promise<MempoolTransaction[]> {
  const collected: MempoolTransaction[] = []
  let lastSeenTxId: string | undefined

  let pageIndex = 0
  for (; pageIndex < MAX_PAGES; pageIndex++) {
    const page = await fetchAddressTransactionsPage(address, lastSeenTxId)
    if (page.length === 0) {
      break
    }
    collected.push(...page)

    if (page.length < PAGE_SIZE) {
      break
    }
    const oldest = oldestConfirmed(page)
    if (oldest == null || oldest.blockTime * 1000 <= fromDate.getTime()) {
      break
    }
    lastSeenTxId = oldest.txid
  }

  // Молча оборванная история при отладке выглядит как «часть операций просто не пришла».
  if (pageIndex === MAX_PAGES) {
    console.log(`mempool: обход адреса ${address} остановлен на пределе ${MAX_PAGES} страниц, история могла обрезаться`)
  }

  return collected
}

export async function fetchTransactions (wallets: Wallet[], fromDate: Date): Promise<MempoolTransaction[]> {
  const byTxId = new Map<string, MempoolTransaction>()

  for (const address of walletAddresses(wallets)) {
    for (const transaction of await fetchAddressTransactions(address, fromDate)) {
      // Одна транзакция приходит повторно, если в ней участвуют несколько наших адресов.
      if (transaction.block_time != null && transaction.block_time * 1000 > fromDate.getTime()) {
        byTxId.set(transaction.txid, transaction)
      }
    }
  }

  return [...byTxId.values()]
}
