import {convertAccounts, convertTransactions} from "./converters";

describe("convertTransactions", () => {
    it("should convert transaction xml", () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?><response version="1.0"><merchant><id>0</id><signature>0</signature></merchant><data><oper>cmt</oper><info>
        <statements status="excellent" credit="0" debet="0">
            <statement card="5167985500160759" appcode="558011" trandate="2018-03-14" trantime="10:25:00" amount="164.00 UAH" cardamount="-164.00 UAH" rest="350.09 UAH" terminal="" description="Оплата услуг через Приват24. Получатель: Воля, ТОВ(Volia). Код квитанции: 1168-3751-8969-5310"/>
            <statement card="5167985500160759" appcode="162010" trandate="2018-03-08" trantime="09:34:00" amount="126.00 UAH" cardamount="-126.00 UAH" rest="514.09 UAH" terminal="" description="Оплата услуг через Приват24. Получатель: Рівнегаз Збут, ТзОВ. Код квитанции: 1162-3446-5133-0132"/>
            <statement card="5168742331568802" appcode="" trandate="2018-03-01" trantime="00:00:00" amount="3.50 UAH" cardamount="3.50 UAH" rest="660.09 UAH" terminal="" description="Начисление процентов на остаток средств по договору"/>
            <statement card="5168742331568802" appcode="" trandate="2018-03-01" trantime="00:00:00" amount="0.68 UAH" cardamount="-0.68 UAH" rest="656.59 UAH" terminal="" description="Удержание налога с начисленных на остаток собственных средств на карте процентов"/>
        </statements></info></data></response>`;
        const transactions = convertTransactions(xml);
        expect(transactions).toEqual([
            {
                "outcomeBankID": "558011",
                "date": new Date("2018-03-14 10:25:00"),
                "income": 0,
                "incomeAccount": "5167985500160759",
                "outcome": 164,
                "outcomeAccount": "5167985500160759",
                "payee": "Воля, ТОВ(Volia)",
            },
            {
                "outcomeBankID": "162010",
                "date": new Date("2018-03-08 09:34:00"),
                "income": 0,
                "incomeAccount": "5167985500160759",
                "outcome": 126,
                "outcomeAccount": "5167985500160759",
                "payee": "Рівнегаз Збут, ТзОВ",
            },
            {
                "date": new Date("2018-03-01 00:00:00"),
                "income": 3.5,
                "incomeAccount": "5168742331568802",
                "outcome": 0,
                "outcomeAccount": "5168742331568802",
                "comment": "Начисление процентов на остаток средств по договору",
            },
            {
                "date": new Date("2018-03-01 00:00:00"),
                "income": 0,
                "incomeAccount": "5168742331568802",
                "outcome": 0.68,
                "outcomeAccount": "5168742331568802",
                "comment": "Удержание налога с начисленных на остаток собственных средств на карте процентов",
            },
        ]);
    });

    it("should add account id if it is not present in accounts", () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?><response version="1.0"><merchant><id>131968</id><signature>4cc7fc6c241065a3fde3a7f111574a91b59b0ccd</signature></merchant><data><oper>cmt</oper><info>
        <statements status="excellent" credit="7137.0" debet="6048.75">
            <statement card="5363542602444722" appcode="515326" trandate="2018-03-21" trantime="16:35:00" amount="380.00 UAH" cardamount="-380.00 UAH" rest="3490.96 UAH" terminal="" description="Снятие наличных в банкомате: ATM8593 V-INTERN_10A, ENERHODAR"/>
            <statement card="5363542602444722" appcode="952321" trandate="2018-03-19" trantime="01:27:00" amount="38.26 UAH" cardamount="-38.65 UAH" rest="-466.04 UAH" terminal="" description="Продукты: Магазин &amp;quot;Элен&amp;quot;, Енергодар, вул.В-Iнтернац. 10а"/>
            <statement card="5363542602444722" appcode="960318" trandate="2018-03-17" trantime="10:49:00" amount="31.86 UAH" cardamount="-31.86 UAH" rest="122.61 UAH" terminal="" description="Ресторан: Тов КГХ АЭС, Енергодар, Промышленная, 1"/>
        </statements></info></data></response>`;
        const accounts = {
            "1": {id: "1", syncID: []},
        };
        const transactions = convertTransactions(xml, accounts);
        expect(transactions).toEqual([
            {
                "date": new Date("2018-03-21T16:35:00"),
                "income": 380,
                "incomeAccount": "cash#UAH",
                "outcome": 380,
                "outcomeAccount": "5363542602444722",
                "outcomeBankID": "515326",
            },
            {
                "date": new Date("2018-03-19T01:27:00"),
                "income": 0,
                "incomeAccount": "5363542602444722",
                "outcome": 38.65,
                "outcomeAccount": "5363542602444722",
                "outcomeBankID": "952321",
                "payee": "Магазин \"Элен\", Енергодар, вул.В-Iнтернац. 10а",
            },
            {
                "date": new Date("2018-03-17T10:49:00"),
                "income": 0,
                "incomeAccount": "5363542602444722",
                "outcome": 31.86,
                "outcomeAccount": "5363542602444722",
                "outcomeBankID": "960318",
                "payee": "Тов КГХ АЭС, Енергодар, Промышленная, 1",
            },
        ]);
        expect(accounts).toEqual({
            "1": {id: "1", syncID: ["5363542602444722"]},
            "5363542602444722": {id: "1", syncID: ["5363542602444722"]},
        });
    });
});

describe("convertAccounts", () => {
    it("should convert account xml", () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?><response version="1.0"><merchant><id>0</id><signature>0</signature></merchant><data><oper>cmt</oper><info>
        <cardbalance>
            <card>
                <account>5168742331568802980</account>
                <card_number>5167985500160759</card_number>
                <acc_name></acc_name>
                <acc_type></acc_type>
                <currency>UAH</currency>
                <card_type></card_type>
                <main_card_number>5168742331568802980</main_card_number>
                <card_stat></card_stat>
                <src></src>
            </card>
            <av_balance>350.09</av_balance>
            <bal_date>19.03.18 11:15</bal_date>
            <bal_dyn>null</bal_dyn>
            <balance>350.09</balance>
            <fin_limit>0.0</fin_limit>
            <trade_limit>0.0</trade_limit>
        </cardbalance>
        </info></data></response>`;
        const accounts = convertAccounts(xml);
        expect(accounts).toEqual({
            "5167985500160759": {
                "id": "5168742331568802",
                "type": "ccard",
                "title": "*0759",
                "instrument": "UAH",
                "balance": 350.09,
                "creditLimit": 0,
                "syncID": [
                    "5168742331568802",
                    "5167985500160759",
                ],
            },
            "5168742331568802": {
                "id": "5168742331568802",
                "type": "ccard",
                "title": "*0759",
                "instrument": "UAH",
                "balance": 350.09,
                "creditLimit": 0,
                "syncID": [
                    "5168742331568802",
                    "5167985500160759",
                ],
            },
        });
    });
});
