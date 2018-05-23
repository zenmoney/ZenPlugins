import {parseXml} from "../../common/network";
import {convertCards, convertDeposit, convertLoan, convertTransaction} from "./converters";

describe("convertLoan", () => {
    it("returns valid loan", () => {
        const json = parseXml(`<loan> 
        <id>11721741</id> 
        <name>Потребительский кредит</name> 
        <smsName>4789</smsName> 
        <amount> 
            <amount>1500000,00</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </amount> 
        <nextPayAmount> 
            <amount>50180,44</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </nextPayAmount> 
        <nextPayDate>04.06.2018T00:00:00</nextPayDate> 
        <state>undefined</state> 
    </loan>`).loan;
        const details = parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
    <detail> 
        <description>Потребительский кредит</description> 
        <repaymentMethod>аннуитетный</repaymentMethod> 
        <termStart>02.12.2017T00:00:00</termStart> 
        <termDuration>3-0-0</termDuration> 
        <termEnd>02.12.2020T00:00:00</termEnd> 
        <borrowerFullName>Николай Николаевич Н.</borrowerFullName> 
        <agreementNumber>92890359</agreementNumber> 
        <accountNumber>45506810700020054789</accountNumber> 
        <personRole>заемщик/созаемщик</personRole> 
        <remainAmount> 
            <amount>1327156,27</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </remainAmount> 
        <nextPayAmount> 
            <amount>50180,44</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </nextPayAmount> 
        <nextPayDate>04.06.2018T00:00:00</nextPayDate> 
        <balanceAmount> 
            <amount>1327156,27</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </balanceAmount> 
        <address>г.Москва, Ленинский проспект, 99</address> 
        <name>Потребительский кредит</name> 
    </detail> 
    <extDetail> 
        <kind> 
                                    АННУИТЕТНЫЙ 
        </kind> 
        <fullName>Потребительский кредит</fullName> 
        <rate>12.50</rate> 
        <type>Потребительский кредит</type> 
        <termEnd>02.12.2020T00:00:00</termEnd> 
        <origianlAmount> 
            <amount>1500000,00</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </origianlAmount> 
        <remainAmount> 
            <amount>1327156,27</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </remainAmount> 
        <nextPayment> 
            <nextPayDate>04.06.2018T00:00:00</nextPayDate> 
            <nextPaymentAmount> 
                <amount>50180,44</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </nextPaymentAmount> 
            <infoText> 
                                        Ближайший платёж 04 июня, 50 180,44 руб.. Не хватает 49 492,41 руб. для оплаты. 
            </infoText> 
        </nextPayment> 
        <currentPayment> 
            <currentPayDate>04.06.2018T00:00:00</currentPayDate> 
            <nextPaymentAmount> 
                <amount>50180,44</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </nextPaymentAmount> 
            <mainDeptAmount> 
                <amount>36134,06</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </mainDeptAmount> 
            <interestsAmount> 
                <amount>14046,38</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </interestsAmount> 
            <repaymentAmount> 
                <amount>688,03</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </repaymentAmount> 
        </currentPayment> 
        <loanInfo> 
            <origianlAmount> 
                <amount>1500000,00</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </origianlAmount> 
            <remainAmount> 
                <amount>1327156,27</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </remainAmount> 
            <mainDeptAmount> 
                <amount>1323078,29</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </mainDeptAmount> 
            <interestPaymentAmount> 
                <amount>4077,98</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </interestPaymentAmount> 
            <creditingRate>12.50</creditingRate> 
            <termStart>02.12.2017T00:00:00</termStart> 
            <termEnd>02.12.2020T00:00:00</termEnd> 
            <agreementNumber>92890359</agreementNumber> 
            <accountNumber>45506810700020054789</accountNumber> 
            <repaymentMethod>аннуитетный</repaymentMethod> 
            <agencyAddress>г.Москва, Ленинский проспект, 99</agencyAddress> 
            <borrower>Николай Николаевич Н.</borrower> 
        </loanInfo> 
    </extDetail> 
</response>`).response;
        expect(convertLoan(json, details)).toEqual({
            id: "loan:11721741",
            type: "loan",
            title: "Потребительский кредит",
            instrument: "RUB",
            syncID: [
                "45506810700020054789",
            ],
            balance: 1327156.27,
            startBalance: 1500000,
            capitalization: true,
            percent: 12.50,
            startDate: "2017-12-02",
            endDateOffsetInterval: "year",
            endDateOffset: 3,
            payoffInterval: "month",
            payoffStep: 1,
        });
    });
});

describe("convertDeposit", () => {
    it("returns valid deposit", () => {
        const json = parseXml(`<account> 
                            <id>12632802</id> 
                            <name>Вклад Счёт (647)</name> 
                                <rate>0.01</rate> 
            <closeDate>15.01.2023</closeDate> 
                                    <smsName>3647</smsName> 
                                <number>42307810275022433647</number> 
    <balance> 
                        <amount>4845.23</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </balance> 
    <availcash> 
                        <amount>4835.23</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </availcash> 
                            <state>OPENED</state> 
                                <moneyBoxAvailable>true</moneyBoxAvailable> 
                            <arrested> 
                                    false 
                            </arrested> 
                            <showarrestdetail>false</showarrestdetail> 
                        </account> `).account;
        const details = parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
            <detail> 
                <description>Универсальный 5 лет</description> 
                    <period>0-0-1826</period> 
            <open>15.01.2013T00:00:00</open> 
            <close>15.01.2023T00:00:00</close> 
                    <interestRate>0.01</interestRate> 
    <maxSumWrite> 
                        <amount>4835.23</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </maxSumWrite> 
                        <passbook>true</passbook> 
                    <crossAgency>true</crossAgency> 
                    <prolongation>true</prolongation> 
    <irreducibleAmt> 
                        <amount>10.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </irreducibleAmt> 
                <name>Вклад Счёт (214)</name> 
                <canChangePercentDestination> 
                    true 
                </canChangePercentDestination> 
                    <moneyBoxAvailable> 
                        true 
                    </moneyBoxAvailable> 
            </detail> 
</response> `).response;
        expect(convertDeposit(json, details)).toEqual({
            id: "account:12632802",
            type: "deposit",
            title: "Вклад Счёт (647)",
            instrument: "RUB",
            syncID: [
                "42307810275022433647",
            ],
            balance: 4845.23,
            startBalance: 0,
            capitalization: true,
            percent: 0.01,
            startDate: "2013-01-15",
            endDateOffsetInterval: "day",
            endDateOffset: 1826,
            payoffInterval: "month",
            payoffStep: 1,
        });
    });
});

describe("convertCards", () => {
    it("converts debit main and additional cards", () => {
        const jsonArray = parseXml(`<response> 
    <status> 
        <code>0</code> 
    </status> 
    <cards> 
        <status> 
            <code>0</code> 
        </status> 
        <card> 
            <id>105751883</id> 
            <name>Maestro</name> 
            <smsName>8802</smsName> 
            <description>Maestro</description> 
            <number>6390 02** **** **88 02</number> 
            <isMain>true</isMain> 
            <type>debit</type> 
            <availableLimit> 
                <amount>97,61</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </availableLimit> 
            <state>active</state> 
            <cardAccount>40817810828150008490</cardAccount> 
            <showarrestdetail>false</showarrestdetail> 
            <expireDate>11/2018</expireDate> 
            <statusWay4>+-КАРТОЧКА ОТКРЫТА</statusWay4> 
        </card> 
        <card> 
            <id>105751885</id> 
            <name>Visa Classic</name> 
            <smsName>6939</smsName> 
            <description>Visa Classic</description> 
            <number>4276 28** **** 6939</number> 
            <isMain>true</isMain> 
            <type>debit</type> 
            <availableLimit> 
                <amount>2434,97</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </availableLimit> 
            <state>active</state> 
            <cardAccount>40817810528150034829</cardAccount> 
            <showarrestdetail>false</showarrestdetail> 
            <expireDate>02/2020</expireDate> 
            <statusWay4>+-КАРТОЧКА ОТКРЫТА</statusWay4> 
        </card> 
        <card> 
            <id>105751881</id> 
            <name>Electron</name> 
            <smsName>7622</smsName> 
            <description>Electron</description> 
            <number>4276 82** **** 7622</number> 
            <isMain>true</isMain> 
            <type>debit</type> 
            <availableLimit> 
                <amount>150,00</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </availableLimit> 
            <state>active</state> 
            <showarrestdetail>false</showarrestdetail> 
            <expireDate>08/2018</expireDate> 
            <statusWay4>K-ДЕЙСТ.ПРИОСТАНОВЛЕНО</statusWay4> 
        </card> 
        <card> 
            <id>105751882</id> 
            <name>Electron</name> 
            <smsName>2761</smsName> 
            <description>Electron</description> 
            <number>4276 82** **** 2761</number> 
            <isMain>false</isMain> 
            <type>debit</type> 
            <availableLimit> 
                <amount>150,00</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </availableLimit> 
            <state>active</state> 
            <additionalCardType>Client2Other</additionalCardType> 
            <mainCardId>105751881</mainCardId> 
            <showarrestdetail>false</showarrestdetail> 
            <expireDate>08/2018</expireDate> 
            <statusWay4>K-ДЕЙСТ.ПРИОСТАНОВЛЕНО</statusWay4> 
        </card> 
    </cards> 
</response>`).response.cards.card.map(json => {
            return {account: json}
        });
        expect(convertCards(jsonArray)).toEqual([
            {
                ids: ["105751881", "105751882"],
                type: "card",
                zenAccount: {
                    id: "card:105751881",
                    type: "ccard",
                    title: "Electron",
                    instrument: "RUB",
                    balance: 150,
                    syncID: [
                        "4276 82** **** 2761",
                        "4276 82** **** 7622",
                    ],
                },
            },
            {
                ids: ["105751883"],
                type: "card",
                zenAccount: {
                    id: "card:105751883",
                    type: "ccard",
                    title: "Maestro",
                    instrument: "RUB",
                    balance: 97.61,
                    syncID: [
                        "6390 02** **** **88 02",
                        "40817810828150008490",
                    ],
                },
            },
            {
                ids: ["105751885"],
                type: "card",
                zenAccount: {
                    id: "card:105751885",
                    type: "ccard",
                    title: "Visa Classic",
                    instrument: "RUB",
                    balance: 2434.97,
                    syncID: [
                        "4276 28** **** 6939",
                        "40817810528150034829",
                    ],
                },
            },
        ]);
    });

    it("converts credit card", () => {
        const account = parseXml(`<card> 
                            <id>69474436</id> 
                            <name>Visa Gold</name> 
                                    <smsName>7314</smsName> 
                                <description>Visa Gold</description> 
                                <number>4279 01** **** 7314</number> 
                            <isMain>true</isMain> 
                            <type>credit</type> 
    <availableLimit> 
                        <amount>125000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </availableLimit> 
                            <state>active</state> 
                                <cardAccount>40817810855501402320</cardAccount> 
                            <showarrestdetail>false</showarrestdetail> 
                                <tokenExists> 
                                    false 
                                </tokenExists> 
                                    <expireDate>08/2018</expireDate> 
                                <statusWay4>+-КАРТОЧКА ОТКРЫТА</statusWay4> 
                        </card>`).card;
        const details = parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
            <detail> 
                    <creditType> 
    <limit> 
                        <amount>125000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </limit> 
    <ownSum> 
                        <amount>0.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </ownSum> 
    <minPayment> 
                        <amount>0.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </minPayment> 
                            <DebtInfoResult> 
                                <StatusCode> 
                                    0 
                                </StatusCode> 
                                    <DebtInfo> 
            <openDate>05.08.2015T00:00:00</openDate> 
    <ovdAmount> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </ovdAmount> 
            <LastBillingDate>04.05.2018T00:00:00</LastBillingDate> 
    <MandPaymOnReport> 
                        <amount>1226.98</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </MandPaymOnReport> 
    <MandatoryPaymentPAN> 
                        <amount>0.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </MandatoryPaymentPAN> 
    <TotalOnReport> 
                        <amount>24539.58</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </TotalOnReport> 
    <Debt> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Debt> 
    <Total_Tomorrow> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Total_Tomorrow> 
    <Total_DayAfterTomorrow> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Total_DayAfterTomorrow> 
    <Blocked_Cache> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Blocked_Cache> 
    <Total_ReportToday> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Total_ReportToday> 
                                    </DebtInfo> 
                            </DebtInfoResult> 
                    </creditType> 
                <holderName>НИКОЛАЙ НИКОЛАЕВИЧ Н.</holderName> 
    <availableCashLimit> 
                        <amount>125000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </availableCashLimit> 
    <purchaseLimit> 
                        <amount>125000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </purchaseLimit> 
                <officeName>Доп.офис №9055/0603</officeName> 
                    <accountNumber>40817810855501402320</accountNumber> 
                        <expireDate>08/2018</expireDate> 
                <name>Visa Gold</name> 
                    <cardAccount>40817810855501402320</cardAccount> 
                    <statusWay4>+-КАРТОЧКА ОТКРЫТА</statusWay4> 
            </detail> 
</response>`).response;
        expect(convertCards([{
            account,
            details,
        }])).toEqual([
            {
                ids: ["69474436"],
                type: "card",
                zenAccount: {
                    id: "card:69474436",
                    type: "ccard",
                    title: "Visa Gold",
                    instrument: "RUB",
                    creditLimit: 125000,
                    balance: 0,
                    syncID: [
                        "4279 01** **** 7314",
                    ],
                },
            },
        ]);
    });
});

describe("convertTransaction", () => {
    it("parses payee", () => {
        expect(convertTransaction({
            date: "16.04.2018T00:00:00",
            description: "Retail RUS MOSCOW        Retail RUS MOSCOW WWW.RZD.RU",
            sum: {
                amount: "-1856.40",
                currency: {code: "RUB", name: "руб."},
            },
        }, {
            id: "account",
            instrument: "RUB",
        })).toEqual({
            isCurrencyTransaction: false,
            zenTransaction: {
                date: "2018-04-16",
                income: 0,
                incomeAccount: "account",
                outcome: 1856.40,
                outcomeAccount: "account",
                payee: "MOSCOW WWW.RZD.RU",
                comment: null,
            },
        });

        expect(convertTransaction({
            date: "05.04.2018T00:00:00",
            description: "Retail RUS ST PETERSBURG Retail RUS ST PETERSBURG IKEA DOM 6 CASH LINE",
            sum: {
                amount: "-19445.00",
                currency: {code: "RUB", name: "руб."},
            },
        }, {
            id: "account",
            instrument: "RUB",
        })).toEqual({
            isCurrencyTransaction: false,
            zenTransaction: {
                date: "2018-04-05",
                income: 0,
                incomeAccount: "account",
                outcome: 19445.00,
                outcomeAccount: "account",
                payee: "ST PETERSBURG IKEA DOM 6 CASH LINE",
                comment: null,
            },
        });
    });

    it("converts cash replenishment", () => {
        expect(convertTransaction({
            date: "17.04.2018T21:24:13",
            description: "Note Acceptance RUS ZLATOUST Note Acceptance RUS ZLATOUST ITT 864001",
            sum: {
                amount: "+3000.00",
                currency: {code: "RUB", name: "руб."},
            },
        }, {
            id: "account",
            instrument: "RUB",
        })).toEqual({
            isCurrencyTransaction: false,
            zenTransaction: {
                date: "2018-04-17",
                income: 3000,
                incomeAccount: "account",
                outcome: 3000,
                outcomeAccount: "cash#RUB",
                comment: null,
            },
        });
    });
});
