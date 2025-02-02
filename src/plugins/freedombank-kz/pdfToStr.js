import pdf from 'pdf-extraction/lib/pdf-extraction'

export async function parsePdfFromBlob ({ blob }) {
  const sources = await Promise.all(blob.map(async (dataPart) => {
    const data = await pdf(await dataPart.arrayBuffer())
    const text = data.text

    // Разделение текста на "шапку" и "транзакции"
    const splitPoint = text.search(/\d{2}\.\d{2}\.\d{4}/)
    const header = text.slice(0, splitPoint).trim()
    const transactions = text.slice(splitPoint).trim()

    // Обработка транзакций
    const transactionsText = transactions
      .replace(/(\d{2}\.\d{2}\.\d{4}[^\n]*?)\n([A-Za-zА-Яа-я])/g, '$1 $2') // Объединение строк одной записи
      .replace(/([а-яА-Яa-zA-Z.,])\n([а-яА-Яa-zA-Z])/g, '$1 $2') // Удаление переносов строк внутри деталей
      .replace(/\s{2,}/g, ' ') // Удаление двойных пробелов
      .replace(/\n{2,}/g, '\n') // Удаление двойных переводов строк

    return `${header}\n\n${transactionsText}`
  }))

  return sources
}
