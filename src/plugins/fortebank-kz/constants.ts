export const KNOWN_OPERATIONS = [
  // English
  'Cash withdrawal',
  'Account replenishment',
  'Debit',
  'Transfer',
  'Refund',
  'Purchase with bonuses',
  'Purchase',
  'Payment',
  'Commission',
  'Fee',
  'Correction',
  'Reversal',
  // Russian
  'Снятие наличных денег', 'Снятие наличных', 'Снятие',
  'Пополнение счета', 'Пополнение',
  'Перевод',
  'Возврат денег', 'Возврат',
  'Покупка с бонусами', 'Покупка',
  'Оплата',
  'Платеж',
  'Списание',
  'Комиссия',
  'Корректировка',
  'Отмена',
  // Kazakh
  'Ақша алу',
  'Шотты толықтыру', 'Толықтыру',
  'Аударым',
  'Қайтару',
  'Сатып алу',
  'Төлем',
  'Түзету',
  'Болдырмау'
].sort((a, b) => b.length - a.length) // Pre-sort by length descending

export const KEYWORDS_TO_REMOVE = [
  // Generic/English
  'Purchase', 'Payment', 'Transfer', 'Withdrawal', 'Commission', 'Fee', 'Correction', 'Reversal',
  'Retail', 'POS', 'ATM', 'Terminal', 'Card', 'Account', 'Retail', 'Shop', 'Store', 'Market',
  'Transaction', 'Date', 'Sum', 'Description', 'Details', 'Operation',
  // Russian
  'Покупка', 'Оплата', 'Перевод', 'Снятие', 'Комиссия', 'Возврат', 'Корректировка', 'Отмена',
  'Розница', 'Банкомат', 'Терминал', 'Карта', 'Счет', 'Пополнение', 'Выплата', 'Магазин',
  'Транзакция', 'Дата', 'Сумма', 'Описание', 'Детализация', 'Операция',
  // Kazakh (approximate, based on common terms)
  'Сатып алу', 'Төлем', 'Аударым', 'Ақша алу', 'Комиссия', 'Қайтару', 'Түзету', 'Болдырмау',
  'Толықтыру', 'Дүкен'
]
