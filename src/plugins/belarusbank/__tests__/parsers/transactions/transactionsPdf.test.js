import { parseTransactionsPdf } from "../../../api";

const PDF_TEXT = `
Выписка по карточному счёту
Счёт BY00 XXXX 0000 0000 0000 0000 0000
Валюта счета BYN
Баланс на 01.01.2026 1 000,00 BYN

31.12.2025
10:57:44
05.01.2026 850,00 BYN 850,00 150,00
Оплата товаров и услуг ERIP БЕЛАРУСЬ
MINSK/4900
1234***5678
09.01.2026
10:13:29
09.01.2026 1 000,00 BYN +1 000,00 1 150,00
Зачисление зарплаты и приравненных к ней платежей
Организация-плательщик
15.01.2026
08:30:00
15.01.2026 12,00 BYN 12,00 1 138,00
Снятие наличных банкомат
20.01.2026
14:22:11
20.01.2026 200,00 BYN 200,00 938,00
Единственная строка описания без места

Реквизиты банка: No расчетного счета для разовых перечислений (IBAN) BY00 XXXX 0000 0000 0000 0000 0000 БИК XXXXXX00 УНП 000000000
`;

describe("parseTransactionsPdf", () => {
  it("parses debit with place and card number", () => {
    const result = parseTransactionsPdf(PDF_TEXT, "accountId", "BYN");
    expect(result[0]).toEqual({
      accountID: "accountId",
      status: "operResultOk",
      date: "31.12.2025",
      time: "10:57:44",
      debitFlag: "-",
      operationSum: "850.00",
      operationCurrency: "BYN",
      inAccountSum: "850.00",
      inAccountCurrency: "BYN",
      comment: "Оплата товаров и услуг ERIP БЕЛАРУСЬ",
      place: "MINSK/4900",
      fee: "0.00",
    });
  });

  it("parses transaction with sender as place", () => {
    const result = parseTransactionsPdf(PDF_TEXT, "accountId", "BYN");
    expect(result[1]).toEqual({
      accountID: "accountId",
      status: "operResultOk",
      date: "09.01.2026",
      time: "10:13:29",
      debitFlag: "+",
      operationSum: "1 000.00",
      operationCurrency: "BYN",
      inAccountSum: "1 000.00",
      inAccountCurrency: "BYN",
      comment: "Зачисление зарплаты и приравненных к ней платежей",
      place: "Организация-плательщик",
      fee: "0.00",
    });
  });

  it("parses transaction with single description line (no place)", () => {
    const result = parseTransactionsPdf(PDF_TEXT, "accountId", "BYN");
    expect(result[2]).toEqual({
      accountID: "accountId",
      status: "operResultOk",
      date: "15.01.2026",
      time: "08:30:00",
      debitFlag: "-",
      operationSum: "12.00",
      operationCurrency: "BYN",
      inAccountSum: "12.00",
      inAccountCurrency: "BYN",
      comment: "Снятие наличных банкомат",
      place: undefined,
      fee: "0.00",
    });
  });

  it("uses accCurrency for inAccountCurrency", () => {
    const text = `
01.03.2026
09:00:00
01.03.2026 100,00 USD +100,00 500,00
Пополнение
`;
    const result = parseTransactionsPdf(text, "usdAccount", "USD");
    expect(result[0].inAccountCurrency).toBe("USD");
    expect(result[0].operationCurrency).toBe("USD");
  });
});
