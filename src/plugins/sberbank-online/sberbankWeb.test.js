import {loadHtml, parseTransactions} from "./sberbankWeb";

describe("parseTransactions", () => {
    it("returns valid transactions", () => {
        const html = require("./html/transactions1.html");
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

    it("returns valid transactions", () => {
        const html = require("./html/transactions2.html");
        const $ = loadHtml(html);
        expect(parseTransactions($, new Date("2018-06-02T12:00:00Z"))).toEqual([
            {
                amount: "+100,00 руб.",
                date: "07.06.2018",
                description: "CH Payment RUS MOSCOW CH Payment RUS MOSCOW SBOL",
            }, 
            {
                amount: "−4,00 € (301,96 руб.)",
                date: "07.06.2018",
                description: "Retail LUX 4029357733 Retail LUX 4029357733 PAYPAL *YOURSERVERS",
            }, 
            {
                amount: "+100,00 руб.",
                date: "04.06.2018",
                description: "CH Payment RUS MOSCOW CH Payment RUS MOSCOW SBOL",
            }, 
            {
                amount: "+50,00 руб.",
                date: "01.06.2018",
                description: "CH Payment RUS MOSCOW CH Payment RUS MOSCOW SBOL",
            }, 
            {
                amount: "+100,00 руб.",
                date: "01.06.2018",
                description: "CH Payment RUS MOSCOW CH Payment RUS MOSCOW SBOL",
            }, 
            {
                amount: "+100,00 руб.",
                date: "01.06.2018",
                description: "CH Payment RUS MOSCOW CH Payment RUS MOSCOW SBOL",
            }, 
            {
                amount: "−186,32 руб.",
                date: "23.05.2018",
                description: "BP Billing Transfer RUS BP Billing Transfer RUS SBERBANK ONL@IN PLATEZH",
            }, 
            {
                amount: "−266,16 руб.",
                date: "23.05.2018",
                description: "BP Billing Transfer RUS BP Billing Transfer RUS SBERBANK ONL@IN PLATEZH",
            }, 
            {
                amount: "−2 645,08 руб.",
                date: "23.05.2018",
                description: "BP Billing Transfer RUS BP Billing Transfer RUS SBERBANK ONL@IN PLATEZH",
            }, 
            {
                amount: "+24 539,58 руб.",
                date: "19.05.2018",
                description: "CH Payment RUS MOSCOW CH Payment RUS MOSCOW SBOL",
            },
        ]);
    });
});
