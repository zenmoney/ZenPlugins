import { Account, AccountType, Movement, Transaction } from '../../types/zenmoney'
import { INSTRUMENT, MempoolAddressInfo, MempoolTransaction, MempoolVout, SATOSHI_IN_UBTC, Wallet } from './models'

// Баланс считается только по chain_stats. mempool_stats сознательно игнорируется: мы
// не показываем и неподтверждённые транзакции, так что иначе баланс разошёлся бы с суммой
// операций. Цена решения — при висящем неподтверждённом расходе баланс будет завышен
// до попадания транзакции в блок. Так же устроен btcscan.
export function convertAccounts (wallets: Wallet[], infoByAddress: Map<string, MempoolAddressInfo>): Account[] {
  return wallets.map(wallet => {
    const balanceSatoshi = wallet.addresses.reduce((sum, address) => {
      const info = infoByAddress.get(address)
      return info == null ? sum : sum + info.funded_txo_sum - info.spent_txo_sum
    }, 0)

    return {
      id: wallet.id,
      type: AccountType.checking,
      title: wallet.title,
      instrument: INSTRUMENT,
      balance: balanceSatoshi / SATOSHI_IN_UBTC,
      syncIds: wallet.addresses
    }
  })
}

function sumOwn (outputs: Array<MempoolVout | null>, addresses: Set<string>): number {
  return outputs.reduce((sum: number, output) => {
    if (output?.scriptpubkey_address == null || !addresses.has(output.scriptpubkey_address)) {
      return sum
    }
    return sum + output.value
  }, 0)
}

// Нетто по кошельку: сколько пришло на его адреса минус сколько с них ушло.
// Именно так сдача на собственный адрес перестаёт выглядеть доходом, а перемещение
// внутри кошелька схлопывается до комиссии.
function walletNetSatoshi (wallet: Wallet, transaction: MempoolTransaction): number {
  const addresses = new Set(wallet.addresses)
  const received = sumOwn(transaction.vout, addresses)
  const spent = sumOwn(transaction.vin.map(vin => vin.prevout), addresses)
  return received - spent
}

// ownAddresses — адреса ВСЕХ кошельков пользователя, а не только того, для которого
// строится движение.
// Пример из жизни: пользователь платит подрядчику 0.7 BTC и в той же транзакции
// перекладывает 0.3 BTC со своего Ledger_1 на свой же Ledger_2. Так делают ради комиссии:
// у транзакции может быть сколько угодно получателей, а майнеру платится один раз, и
// десктопные кошельки (Electrum, Sparrow, Bitcoin Core) дают кнопку «добавить получателя».
// Посторонний получатель снимает склейку в перевод, поэтому выходят две операции.
// Контрагентом расхода Ledger_1 должен стать подрядчик. Исключай мы только собственные
// адреса Ledger_1, первым «чужим» выходом оказался бы адрес Ledger_2 — и в приложении
// получился бы «расход на bc1q…», где этот bc1q… и есть соседний счёт самого пользователя.
function findCounterparty (transaction: MempoolTransaction, ownAddresses: Set<string>, isIncome: boolean): string | null {
  const candidates = isIncome
    ? transaction.vin.map(vin => vin.prevout?.scriptpubkey_address ?? null)
    : transaction.vout.map(output => output.scriptpubkey_address)
  return candidates.find((address): address is string => address != null && !ownAddresses.has(address)) ?? null
}

// Участвует ли в транзакции адрес, не принадлежащий ни одному кошельку пользователя.
// Смотрим обе стороны: чужой выход означает, что часть денег ушла наружу, чужой вход —
// что часть пришла снаружи. И то и другое ломает трактовку «перемещение между своими
// счетами», потому что разница нетто перестаёт быть комиссией майнеру: при чужом выходе
// в неё попадёт платёж постороннему, при чужом входе она вообще станет положительной
// и Zenmoney покажет её кэшбэком.
// Вход или выход без адреса (OP_RETURN, coinbase) не считается: приписать его некому.
function involvesOutsider (transaction: MempoolTransaction, ownAddresses: Set<string>): boolean {
  const participants = [
    ...transaction.vout.map(output => output.scriptpubkey_address),
    ...transaction.vin.map(vin => vin.prevout?.scriptpubkey_address ?? null)
  ]
  return participants.some(address => address != null && !ownAddresses.has(address))
}

function makeMovement (walletId: string, netSatoshi: number, txid: string, feeSatoshi = 0): Movement {
  return {
    id: txid,
    account: { id: walletId },
    invoice: null,
    sum: netSatoshi / SATOSHI_IN_UBTC,
    fee: feeSatoshi / SATOSHI_IN_UBTC
  }
}

export function convertTransactions (wallets: Wallet[], transactions: MempoolTransaction[]): Transaction[] {
  const result: Transaction[] = []
  const ownAddresses = new Set(wallets.flatMap(wallet => wallet.addresses))

  for (const transaction of transactions) {
    if (!transaction.confirmed || transaction.block_time == null) {
      continue
    }

    const date = new Date(transaction.block_time * 1000)
    const parts = wallets
      .map(wallet => ({ wallet, net: walletNetSatoshi(wallet, transaction) }))
      .filter(part => part.net !== 0)

    if (parts.length === 0) {
      continue
    }

    // Склеиваем в перевод, только если выполнено всё сразу:
    //   затронуто ровно два кошелька — на третье движение в Transaction нет места;
    //   знаки противоположны — два плюса это не перевод, а одна выплата на два счёта;
    //   посторонних адресов нет — иначе деньги пришли или ушли на сторону.
    const isTransfer = parts.length === 2 &&
      Math.sign(parts[0].net) !== Math.sign(parts[1].net) &&
      !involvesOutsider(transaction, ownAddresses)

    // Выход в биткойне никогда не больше входа, поэтому у перевода целиком из наших
    // адресов недостача всегда ≤ 0 и равна комиссии майнеру. Плюс означает, что деньги
    // пришли со стороны — например со входа без scriptpubkey_address (P2PK, bare
    // multisig), которого involvesOutsider не видит. Склеивать такое нельзя: комиссия
    // вышла бы положительной, и Zenmoney показал бы её кэшбэком.
    // isTransfer уже гарантирует ровно два кошелька, а && закорачивает, поэтому
    // обращение к parts[1] здесь безопасно.
    if (isTransfer && parts[0].net + parts[1].net <= 0) {
      const [from, to] = parts[0].net < 0 ? parts : [parts[1], parts[0]]
      // Посторонних участников здесь нет, поэтому вся недостача — комиссия майнеру.
      // Разносим её отдельным полем: движение по счёту Zenmoney считает как sum + fee
      // (src/common/converters.js:250), так что со счёта отправителя уходит ровно from.net
      // при любой раскладке. Отдельным полем комиссия доезжает до приложения только на
      // ветке transactionDtoV2 — там движения передаются как есть; на легаси-ветке
      // toZenMoneyTransaction складывает sum + fee обратно, и результат неотличим от fee: 0.
      const feeSatoshi = from.net + to.net
      result.push({
        hold: null,
        date,
        movements: [
          makeMovement(from.wallet.id, from.net - feeSatoshi, transaction.txid, feeSatoshi),
          makeMovement(to.wallet.id, to.net, transaction.txid)
        ],
        merchant: null,
        comment: transaction.txid
      })
      continue
    }

    for (const part of parts) {
      const counterparty = findCounterparty(transaction, ownAddresses, part.net > 0)
      result.push({
        hold: null,
        date,
        movements: [makeMovement(part.wallet.id, part.net, transaction.txid)],
        merchant: counterparty == null ? null : { fullTitle: counterparty, mcc: null, location: null },
        comment: transaction.txid
      })
    }
  }

  return result
}
