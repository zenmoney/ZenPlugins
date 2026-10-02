import { convertTransactions } from '../../converters'
import { MempoolTransaction, MempoolVin, MempoolVout, Wallet } from '../../models'

const BLOCK_TIME = 1700000000

function out (address: string | null, value: number): MempoolVout {
  return { scriptpubkey_address: address, value }
}

function inp (address: string | null, value: number): MempoolVin {
  return { prevout: { scriptpubkey_address: address, value } }
}

function tx (overrides: Partial<MempoolTransaction> = {}): MempoolTransaction {
  return { txid: 'tx1', vin: [], vout: [], confirmed: true, block_time: BLOCK_TIME, ...overrides }
}

const ledger1: Wallet = { id: 'a1', title: 'Ledger_1', addresses: ['a1', 'a2'] }
const ledger2: Wallet = { id: 'b1', title: 'Ledger_2', addresses: ['b1'] }

describe('convertTransactions', () => {
  it('поступление извне — один положительный movement с адресом отправителя', () => {
    const [transaction] = convertTransactions([ledger1], [tx({
      vin: [inp('outsider', 60000000)],
      vout: [out('a1', 50000000)]
    })])
    expect(transaction.movements).toEqual([{ id: 'tx1', account: { id: 'a1' }, invoice: null, sum: 500000, fee: 0 }])
    expect(transaction.merchant).toEqual({ fullTitle: 'outsider', mcc: null, location: null })
    expect(transaction.comment).toBe('tx1')
    expect(transaction.date).toEqual(new Date(BLOCK_TIME * 1000))
    expect(transaction.hold).toBeNull()
  })

  it('сдача на собственный адрес не превращается в доход', () => {
    // В биткойне нельзя потратить часть монеты: вход тратится целиком, а остаток кошелёк
    // возвращает тебе же — это и есть сдача. Пользователь её не видит, кошелёк делает это сам.
    // Здесь на адресе a1 лежала монета 0.5 BTC. Другу уходит 0.1, майнеру 0.0001,
    // оставшиеся 0.3999 возвращаются на a1.
    // Именно на этом ошибается btcscan: он берёт первый подходящий выход, видит возврат
    // 0.3999 на свой адрес и пишет доход. На самом деле это расход 0.1001.
    const [transaction] = convertTransactions([ledger1], [tx({
      vin: [inp('a1', 50000000)],
      vout: [out('outsider', 10000000), out('a1', 39990000)]
    })])
    expect(transaction.movements[0].sum).toBe(-100100)
    expect(transaction.merchant).toEqual({ fullTitle: 'outsider', mcc: null, location: null })
  })

  it('одна транзакция платит на два адреса одного кошелька — суммы складываются', () => {
    // Ledger_1 — это два адреса, a1 и a2. Одна входящая транзакция платит на оба сразу:
    // 0.3 на a1 и 0.2 на a2. Адреса принадлежат одному счёту, поэтому в операции должно
    // быть 0.5, а не 0.3 (как вышло бы, если брать первый подходящий выход).
    const [transaction] = convertTransactions([ledger1], [tx({
      vin: [inp('outsider', 100000000)],
      vout: [out('a1', 30000000), out('a2', 20000000)]
    })])
    expect(transaction.movements[0].sum).toBe(500000)
  })

  it('перемещение внутри одного кошелька оставляет только комиссию', () => {
    const [transaction] = convertTransactions([ledger1], [tx({
      vin: [inp('a1', 50000000)],
      vout: [out('a2', 49990000)]
    })])
    expect(transaction.movements).toHaveLength(1)
    expect(transaction.movements[0].sum).toBe(-100)
  })

  it('перевод между двумя своими счетами склеивается в два движения', () => {
    // Оба кошелька — свои: Ledger_1 (a1, a2) и Ledger_2 (b1), оба заведены пользователем
    // в настройках. Деньги не ушли наружу, а переехали между его же счетами, поэтому это
    // одна операция с двумя движениями, а не расход и отдельный доход.
    const transactions = convertTransactions([ledger1, ledger2], [tx({
      vin: [inp('a1', 50000000)],
      vout: [out('b1', 49990000)]
    })])
    expect(transactions).toHaveLength(1)
    // Комиссия вынесена в fee. Движение по счёту считается как sum + fee
    // (src/common/converters.js:250), поэтому со счёта всё равно уходит 500000.
    // Отдельным полем комиссия видна только на ветке transactionDtoV2; на легаси-ветке
    // она складывается обратно в сумму, и результат тот же, что был бы при fee: 0.
    expect(transactions[0].movements).toEqual([
      { id: 'tx1', account: { id: 'a1' }, invoice: null, sum: -499900, fee: -100 },
      { id: 'tx1', account: { id: 'b1' }, invoice: null, sum: 499900, fee: 0 }
    ])
    expect(transactions[0].merchant).toBeNull()
  })

  it('порядок кошельков в настройках не переставляет стороны перевода', () => {
    // Тот же перевод, но получатель идёт в списке первым. Без разворота пары
    // списание и зачисление поменялись бы местами, а тесты выше этого не заметили бы.
    const transactions = convertTransactions([ledger2, ledger1], [tx({
      vin: [inp('a1', 50000000)],
      vout: [out('b1', 49990000)]
    })])
    expect(transactions[0].movements).toEqual([
      { id: 'tx1', account: { id: 'a1' }, invoice: null, sum: -499900, fee: -100 },
      { id: 'tx1', account: { id: 'b1' }, invoice: null, sum: 499900, fee: 0 }
    ])
  })

  it('транзакция, которая заодно платит наружу, переводом не считается', () => {
    // Ledger_1 тратит 1.0: 0.3 уходит на Ledger_2, 0.6999 — постороннему.
    // Склеив это в перевод, мы показали бы «-1.0 → +0.3», и ушедшие наружу 0.6999
    // выглядели бы стоимостью перевода, а не платежом получателю.
    const transactions = convertTransactions([ledger1, ledger2], [tx({
      vin: [inp('a1', 100000000)],
      vout: [out('b1', 30000000), out('outsider', 69990000)]
    })])
    expect(transactions).toHaveLength(2)
    expect(transactions.map(t => t.movements[0].sum)).toEqual([-1000000, 300000])
    expect(transactions[0].merchant).toEqual({ fullTitle: 'outsider', mcc: null, location: null })
  })

  it('чужой вход тоже снимает склейку в перевод', () => {
    // Зеркальный случай к предыдущему: наружу ничего не ушло, но часть денег пришла
    // снаружи. Склеив это, мы получили бы «недостачу» со знаком плюс — Zenmoney назвал
    // бы её кэшбэком, а sum отправителя завысился бы на чужой вклад.
    const transactions = convertTransactions([ledger1, ledger2], [tx({
      vin: [inp('outsider', 10000000), inp('a1', 50000000)],
      vout: [out('b1', 59990000)]
    })])
    expect(transactions).toHaveLength(2)
    expect(transactions.map(t => t.movements[0].sum)).toEqual([-500000, 599900])
    expect(transactions.map(t => t.movements[0].fee)).toEqual([0, 0])
    expect(transactions[1].merchant).toEqual({ fullTitle: 'outsider', mcc: null, location: null })
  })

  it('вход без адреса тоже снимает склейку', () => {
    // P2PK и bare multisig не имеют scriptpubkey_address, так что involvesOutsider их
    // не видит. Но выход в биткойне никогда не больше входа, поэтому у настоящего
    // перевода целиком из наших адресов недостача всегда ≤ 0. Плюс означает, что деньги
    // пришли со стороны, и склеивать нельзя.
    const transactions = convertTransactions([ledger1, ledger2], [tx({
      vin: [inp(null, 10000000), inp('a1', 50000000)],
      vout: [out('b1', 59990000)]
    })])
    expect(transactions).toHaveLength(2)
    expect(transactions.map(t => t.movements[0].sum)).toEqual([-500000, 599900])
  })

  it('выплата сразу на два своих кошелька не склеивается в перевод', () => {
    // Оба движения положительные — это не перемещение между счетами,
    // а одна внешняя выплата, попавшая на два кошелька.
    const transactions = convertTransactions([ledger1, ledger2], [tx({
      vin: [inp('outsider', 100000000)],
      vout: [out('a1', 40000000), out('b1', 50000000)]
    })])
    expect(transactions).toHaveLength(2)
    expect(transactions.map(t => t.movements[0].sum)).toEqual([400000, 500000])
  })

  it('три затронутых кошелька дают три отдельные операции', () => {
    const ledger3: Wallet = { id: 'c1', title: 'Ledger_3', addresses: ['c1'] }
    const transactions = convertTransactions([ledger1, ledger2, ledger3], [tx({
      vin: [inp('a1', 100000000)],
      vout: [out('b1', 50000000), out('c1', 49990000)]
    })])
    expect(transactions).toHaveLength(3)
    expect(transactions.every(t => t.movements.length === 1)).toBe(true)
  })

  it('контрагентом не становится адрес другого своего кошелька', () => {
    // Здесь все стороны — свои счета. Если исключать только адреса текущего кошелька,
    // в приложении получится «расход на bc1q…», где bc1q… — собственный счёт пользователя.
    const ledger3: Wallet = { id: 'c1', title: 'Ledger_3', addresses: ['c1'] }
    const transactions = convertTransactions([ledger1, ledger2, ledger3], [tx({
      vin: [inp('a1', 100000000)],
      vout: [out('b1', 50000000), out('c1', 49990000)]
    })])
    expect(transactions.map(t => t.merchant)).toEqual([null, null, null])
  })

  it('контрагентом становится посторонний адрес, а не соседний свой счёт', () => {
    // Ledger_1 тратит 1.0: 0.4 уходит на Ledger_2 (свой счёт), 0.3 — постороннему,
    // 0.2999 возвращается сдачей на a2. Посторонний выход есть, поэтому переводом это
    // не считается и получаются две отдельные операции.
    // У расхода Ledger_1 контрагент — 'outsider', единственный посторонний в транзакции.
    // Взять b1 нельзя: это собственный счёт пользователя, и вышло бы «расход на свой счёт».
    // У дохода Ledger_2 контрагента нет вовсе — деньги пришли с его же Ledger_1.
    const transactions = convertTransactions([ledger1, ledger2], [tx({
      vin: [inp('a1', 100000000)],
      vout: [out('b1', 40000000), out('outsider', 30000000), out('a2', 29990000)]
    })])
    expect(transactions.map(t => t.merchant)).toEqual([
      { fullTitle: 'outsider', mcc: null, location: null },
      null
    ])
  })

  it('неподтверждённая транзакция пропускается', () => {
    expect(convertTransactions([ledger1], [tx({
      confirmed: false,
      block_time: null,
      vin: [inp('outsider', 10000000)],
      vout: [out('a1', 9990000)]
    })])).toEqual([])
  })

  it('транзакция без наших адресов не порождает операций', () => {
    // Ни один адрес пользователя не участвует ни во входах, ни в выходах: и 'outsider',
    // и 'another' — посторонние. Конвертер чистый и получить может любую транзакцию,
    // поэтому на такой он обязан молча вернуть пустой список.
    expect(convertTransactions([ledger1], [tx({
      vin: [inp('outsider', 10000000)],
      vout: [out('another', 9990000)]
    })])).toEqual([])
  })

  it('выход без адреса не ломает расчёт', () => {
    // У выхода может не быть адреса вообще. Обычный случай — OP_RETURN: в транзакцию
    // вшивают несколько байт данных (метка сервиса, привязка к другой сети), денег на
    // таком выходе обычно 0. В ответе API поле scriptpubkey_address тогда просто
    // отсутствует, и fetchApi подставляет null.
    // Такой выход не засчитывается как ПОСТУПЛЕНИЕ — на наши адреса ничего не пришло.
    // Если на нём всё же лежат деньги и они наши, потеря всё равно не теряется: нетто
    // считается как «пришло нам минус ушло с наших адресов», и ушедшее видно по входу.
    // Отдельный тест на это — ниже.
    // Здесь же денег на безадресном выходе нет, поэтому приход равен 0.0999.
    const [transaction] = convertTransactions([ledger1], [tx({
      vin: [inp('outsider', 10000000)],
      vout: [out(null, 0), out('a1', 9990000)]
    })])
    expect(transaction.movements[0].sum).toBe(99900)
  })

  it('сожжённые в OP_RETURN свои деньги остаются расходом', () => {
    // Тратим 0.1 BTC со своего a1: 0.001 уходит в безадресный выход (сжигается),
    // 0.0989 возвращается сдачей на a1, 0.0001 забирает майнер.
    // Адреса у сожжённого выхода нет, приписать его некому — и приход по нему не
    // засчитывается. Но деньги действительно ушли, и нетто это ловит с другой стороны:
    // 0.0989 пришло минус 0.1 ушло = −0.0011, то есть сожжённое плюс комиссия.
    const [transaction] = convertTransactions([ledger1], [tx({
      vin: [inp('a1', 10000000)],
      vout: [out(null, 100000), out('a1', 9890000)]
    })])
    expect(transaction.movements[0].sum).toBe(-1100)
  })
})
