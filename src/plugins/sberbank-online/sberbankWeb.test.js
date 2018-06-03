import {loadHtml, parseTransactions} from "./sberbankWeb";

describe("parseTransactions", () => {
    it("return valid transactions", () => {
        const html = require("./html/transactions.html");
        const $ = loadHtml(html);
        expect(parseTransactions($, new Date("2018-06-02T12:00:00Z"))).toEqual([
            {
                amount: "−50,00 руб.",
                date: "01.06.2018",
                description: "CH Debit RUS MOSCOW CH Debit RUS MOSCOW SBOL",
            },
            {
                amount: "−100,00 руб.",
                date: "01.06.2018",
                description: "CH Debit RUS MOSCOW CH Debit RUS MOSCOW SBOL",
            },
            {
                amount: "−100,00 руб.",
                date: "01.06.2018",
                description: "CH Debit RUS MOSCOW CH Debit RUS MOSCOW SBOL",
            },
            {
                amount: "−5,00 € (372,00 руб.)",
                date: "30.05.2018",
                description: "Retail LUX LUXEMBOURG Retail LUX LUXEMBOURG GO.SKYPE.COM/BILL",
            },
            {
                amount: "−159,00 руб.",
                date: "27.05.2018",
                description: "Retail USA G.CO HELPPAY# Retail USA G.CO HELPPAY# GOOGLE*GOOGLE MUSIC",
            },
            {
                amount: "−50,00 руб.",
                date: "23.05.2018",
                description: "Retail RUS MOSCOW Retail RUS MOSCOW MTS AVTO",
            },
            {
                amount: "−50,00 руб.",
                date: "23.05.2018",
                description: "Retail RUS MOSCOW Retail RUS MOSCOW MTS AVTO",
            },
            {
                amount: "−50,00 руб.",
                date: "23.05.2018",
                description: "Retail RUS MOSCOW Retail RUS MOSCOW MTS AVTO",
            },
            {
                amount: "−50,00 руб.",
                date: "23.05.2018",
                description: "Retail RUS MOSCOW Retail RUS MOSCOW MTS AVTO",
            },
            {
                amount: "−50,00 руб.",
                date: "23.05.2018",
                description: "Retail RUS MOSCOW Retail RUS MOSCOW MTS AVTO",
            },
        ]);
    });
});
