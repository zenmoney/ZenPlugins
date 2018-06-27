import {parseXml} from "../../common/network";
import {
    convertAccount,
    convertApiTransaction,
    convertCards,
    convertDeposit,
    convertLoan,
    convertPfmTransaction,
    convertTarget,
    convertToZenMoneyTransaction,
    parseApiDescription,
    parsePfmDescription,
    parseWebAmount,
} from "./converters";

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
            ids: ["11721741"],
            type: "loan",
            zenAccount: {
                id: "loan:11721741",
                type: "loan",
                title: "Потребительский кредит",
                instrument: "RUB",
                syncID: [
                    "45506810700020054789",
                ],
                balance: -1327156.27,
                startBalance: 1500000,
                capitalization: true,
                percent: 12.50,
                startDate: "2017-12-02",
                endDateOffsetInterval: "year",
                endDateOffset: 3,
                payoffInterval: "month",
                payoffStep: 1,
            },
        });
    });
    
    it("returns valid loan if some fields are missing", () => {
        expect(convertLoan( {
            id: "11934064",
            name: "Потребительский кредит",
            smsName: "9184",
            state: null,
        }, {
            status: { 
                code: "0",
            },
            detail: {
                description: "Потребительский кредит",
                repaymentMethod: "аннуитетный",
                termStart: "04.01.2018T00:00:00",
                termDuration: "4-9-0",
                termEnd: "04.10.2022T00:00:00",
                agreementNumber: "235",
                accountNumber: "45507810013000079184",
                personRole: "заемщик/созаемщик",
                name: "Потребительский кредит",
            },
            extDetail: {
                kind: "АННУИТЕТНЫЙ",
                fullName: "Потребительский кредит",
                type: null,
                termEnd: "04.10.2022T00:00:00",
                origianlAmount: { amount: "700000,00", currency: { code: "RUB", name: "руб." } },
                nextPayment: { infoText: "Ближайший платёж ," },
                currentPayment: null,
                loanInfo: {
                    origianlAmount: { amount: "700000,00", currency: { code: "RUB", name: "руб." } },
                    termStart: "04.01.2018T00:00:00",
                    termEnd: "04.10.2022T00:00:00",
                    agreementNumber: "235",
                    accountNumber: "45507810013000079184",
                    repaymentMethod: "аннуитетный",
                },
            },
        })).toEqual({
            ids: ["11934064"],
            type: "loan",
            zenAccount: {
                id: "loan:11934064",
                type: "loan",
                title: "Потребительский кредит",
                instrument: "RUB",
                syncID: [
                    "45507810013000079184",
                ],
                balance: -700000,
                startBalance: 700000,
                capitalization: true,
                percent: 1,
                startDate: "2018-01-04",
                endDateOffsetInterval: "month",
                endDateOffset: 57,
                payoffInterval: "month",
                payoffStep: 1,
            },
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
            ids: ["12632802"],
            type: "account",
            zenAccount: {
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
            },
        });
    });
});

describe("convertCards", () => {
    const nowDate = new Date("2018-06-02T12:00:00Z");

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
        expect(convertCards(jsonArray, nowDate)).toEqual([
            {
                ids: ["105751881", "105751882"],
                type: "card",
                zenAccount: {
                    id: "card:105751881",
                    type: "ccard",
                    title: "Electron",
                    instrument: "RUB",
                    available: 150,
                    syncID: [
                        "427682******2761",
                        "427682******7622",
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
                    available: 97.61,
                    syncID: [
                        "639002********8802",
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
                    available: 2434.97,
                    syncID: [
                        "427628******6939",
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
        }], nowDate)).toEqual([
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
                        "427901******7314",
                    ],
                },
            },
        ]);
    });

    it("skips expired cards", () => {
        expect(convertCards([{
            account: {
                id: "593949641",
                name: "Visa Classic",
                smsName: "3233",
                description: "Visa Classic",
                number: "427655******3233",
                isMain: "true",
                type: "debit",
                availableLimit: { amount: "0.00", currency: { code: "RUB", name: "руб." } },
                state: "active",
                cardAccount: "40817810423044618561",
                showarrestdetail: "false",
                tokenExists: "false",
                expireDate: "10/2017",
                statusWay4: "+-КАРТОЧКА ОТКРЫТА",
            },
            details: {
                holderName: "МИХАИЛ ИГОРЕВИЧ Л.",
                availableCashLimit: { amount: "0.00", currency: { code: "RUB", name: "руб." } },
                purchaseLimit: { amount: "0.00", currency: { code: "RUB", name: "руб." } },
                officeName: "Доп.офис №9055/0774",
                accountNumber: "40817810423044618561",
                expireDate: "10/2017",
                name: "Visa Classic",
                cardAccount: "40817810455033618561",
                statusWay4: "+-КАРТОЧКА ОТКРЫТА",
            },
        }], nowDate)).toEqual([]);
    });
});

describe("convertAccount", () => {
    it("returns valid account", () => {
        expect(convertAccount({
            id: "567930851",
            name: "Управляй ОнЛ@йн 6м - 1г (руб.)",
            rate: "4.00",
            closeDate: "05.08.2018",
            smsName: "4892",
            number: "42305200715542994892",
            balance: { amount: "90467.72", currency: { code: "RUB", name: "руб." } },
            availcash: { amount: "60467.72", currency: { code: "RUB", name: "руб." } },
            state: "OPENED",
            moneyBoxAvailable: "true",
            arrested: "false",
            showarrestdetail: "false",
        }, {
            description: "Управляй ОнЛ@йн 6м - 1г (руб.)",
            period: "0-0-181",
            open: "05.02.2018T00:00:00",
            close: "05.08.2018T00:00:00",
            interestRate: "4.00",
            maxSumWrite: { amount: "60467.72", currency: { code: "RUB", name: "руб." } },
            passbook: "false",
            crossAgency: "true",
            prolongation: "true",
            irreducibleAmt: { amount: "30000.00", currency: { code: "RUB", name: "руб." } },
            name: "Управляй ОнЛ@йн 6м - 1г (руб.)",
            canChangePercentDestination: "true",
            moneyBoxAvailable: "true",
            maxBalance: "1740000.00",
        })).toEqual({
            ids: ["567930851"],
            type: "account",
            zenAccount: {
                id: "account:567930851",
                type: "checking",
                title: "Управляй ОнЛ@йн 6м - 1г (руб.)",
                instrument: "RUB",
                balance: 90467.72,
                savings: true,
                syncID: [
                    "42305200715542994892",
                ],
            },
        });
    });
});

describe("convertTarget", () => {
    it("returns valid target accounts", () => {
        expect(convertTarget({
            type: "RESERVE",
            id: "500603794",
            name: "Финансовый резерв",
            comment: "Подушка",
            date: "16.04.2018",
            amount: { amount: "500000.00", currency: { code: "RUB", name: "руб." } },
            status: "accountEnabled",
            account: {
                id: "560357253",
                rate: "1.00",
                value: { amount: "700.29", currency: { code: "RUB", name: "руб." } },
                availcash: { amount: "700,29", currency: { code: "RUB", name: "руб." } },
                arrested: "false",
                showarrestdetail: "false",
            },
            statusDescription: "Информация о вкладе недоступна. Возможны две причины: задержка получения данных или вклад Вами был закрыт.",
        }, {
            description: "Сберегательный счет",
            open: "16.04.2017T00:00:00",
            close: "01.01.2099T00:00:00",
            interestRate: "1.00",
            maxSumWrite: { amount: "700,29", currency: { code: "RUB", name: "руб." } },
            passbook: "false",
            crossAgency: "true",
            prolongation: "false",
            irreducibleAmt: { amount: "0,00", currency: { code: "RUB", name: "руб." } },
            name: "Сберегательный счет",
            target: {
                name: "Финансовый резерв",
                comment: "Подушка",
                date: "16.04.2018",
                amount: { amount: "500000.00", currency: { code: "RUB", name: "руб." } },
            },
            canChangePercentDestination: "false",
            moneyBoxAvailable: "true",
            moneyBoxes: { box: { id: "27543068356", sumType: "FIXED_SUMMA", amount: "700,00" } },
        })).toEqual({
            ids:["560357253"],
            type: "account",
            zenAccount: {
                id: "account:560357253",
                type: "checking",
                title: "Подушка",
                instrument: "RUB",
                balance: 700.29,
                savings: true,
                syncID: [
                    "500603794",
                ],
            },
        });
    });
});

describe("parseWebAmount", () => {
    it("returns valid amounts", () => {
        expect(parseWebAmount("+24 539,58 руб.")).toEqual({
            posted: {
                amount: 24539.58,
                instrument: "RUB",
            },
        });
        expect(parseWebAmount("−3 298,64 руб.")).toEqual({
            posted: {
                amount: -3298.64,
                instrument: "RUB",
            },
        });
        expect(parseWebAmount("−5,00 € (373,10 руб.)")).toEqual({
            posted: {
                amount: -373.1,
                instrument: "RUB",
            },
            origin: {
                amount: -5,
                instrument: "EUR",
            },
        });
    });
});

describe("parseApiDescription", () => {
    it("returns valid data", () => {
        expect(parseApiDescription("CH Payment RUS MOSCOW CH Payment RUS MOSCOW SBOL")).toEqual({
            payee: "SBOL",
            description: "CH Payment RUS MOSCOW",
        });
        expect(parseApiDescription("Retail LUX 4029357733 Retail LUX 4029357733 PAYPAL *YOURSERVERS")).toEqual({
            payee: "PAYPAL *YOURSERVERS",
            description: "Retail LUX 4029357733",
        });
        expect(parseApiDescription("BP Billing Transfer RUS  BP Billing Transfer RUS  SBERBANK ONL@IN PLATEZH")).toEqual({
            payee: "SBERBANK ONL@IN PLATEZH",
            description: "BP Billing Transfer RUS",
        });
        expect(parseApiDescription("Payment To 7000 Payment To")).toEqual({
            payee: null,
            description: "Payment To 7000",
        });
        expect(parseApiDescription("Mobile Fee 3200 Mobile Fee")).toEqual({
            payee: null,
            description: "Mobile Fee 3200",
        });
        expect(parseApiDescription("unknown pattern")).toEqual({
            payee: null,
            description: "unknown pattern",
        });
    });
});

describe("parsePfmDescription", () => {
    it("returns valid data", () => {
        expect(parsePfmDescription("MTS AVTO                 MOSCOW       RUS")).toEqual({
            payee: "MTS AVTO",
            description: "MOSCOW RUS",
        });
        expect(parsePfmDescription("GO.SKYPE.COM/BILL        LUXEMBOURG   LUX")).toEqual({
            payee: "GO.SKYPE.COM/BILL",
            description: "LUXEMBOURG LUX",
        });
        expect(parsePfmDescription("SBERBANK ONL@IN PLATEZH   RU")).toEqual({
            payee: "SBERBANK ONL@IN PLATEZH",
            description: "RU",
        });
        expect(parsePfmDescription("IKEA DOM 6 CASH LINE     ST PETERSBUR RU")).toEqual({
            payee: "IKEA DOM 6 CASH LINE",
            description: "ST PETERSBUR RU",
        });
        expect(parsePfmDescription("SBERBANK ONL@IN VKLAD-KAR RUS")).toEqual({
            payee: "SBERBANK ONL@IN VKLAD-KARTA",
            description: "RUS",
        });
        expect(parsePfmDescription("TINKOFF BANK CARD2CARD  Visa Direct  RU")).toEqual({
            payee: "TINKOFF BANK CARD2CARD",
            description: "Visa Direct RU",
        });
        expect(parsePfmDescription("unknown pattern")).toEqual({
            payee: null,
            description: "unknown pattern",
        });
    });
});

describe("convertToZenMoneyTransaction", () => {
    it("converts income part of account -> card transfer", () => {
        const zenAccount = {id: "account", instrument: "RUB"};

        const transaction1 = convertApiTransaction({
            date: "24.06.2018T13:14:38",
            sum: {
                amount: "+3500.00",
                currency: { code: "RUB", name: "руб." },
            },
            description: "BP Acct - Card RUS  BP Acct - Card RUS  SBERBANK ONL@IN VKLAD-KARTA",
        }, zenAccount);
        expect(transaction1).toEqual({
            date: new Date("2018-06-24T13:14:38+03:00"),
            hold: null,
            description: "BP Acct - Card RUS",
            payee: "SBERBANK ONL@IN VKLAD-KARTA",
            posted: {
                amount: 3500,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction1)).toEqual({
            date: new Date("2018-06-24T13:14:38+03:00"),
            hold: null,
            income: 3500,
            incomeAccount: "account",
            outcome: 0,
            outcomeAccount: "account",
            comment: "SBERBANK ONL@IN VKLAD-KARTA",
            _transferType: "outcome",
            _transferId: "2018-06-24_1_RUB_3500",
        });

        const transaction2 = convertPfmTransaction({
            id: 11302220500,
            date: "24.06.2018T13:14:38",
            comment: "SBERBANK ONL@IN VKLAD-KAR RU",
            categoryId: 227,
            categoryName: "Перевод со вклада",
            hidden: false,
            country: "RUS",
            cardNumber: "4222 22** **** 2222",
            cardAmount: { amount: "3500.00", currency: "RUB" },
            nationalAmount: { amount: "3500.00", currency: "RUB" },
            availableCategories: [
                { id: 227, name: "Перевод со вклада" },
                { id: 214, name: "Внесение наличных" },
                { id: 217, name: "Возврат, отмена операций" },
                { id: 215, name: "Зачисления" },
                { id: 1476, name: "Перевод между своими картами" },
                { id: 216, name: "Перевод на карту" },
                { id: 218, name: "Прочие поступления" },
            ],
            merchantInfo: {
                merchant: "Пополнение карты со счета",
                imgUrl: "https://pfm.stat.online.sberbank.ru/PFM/logos/22535.jpg",
            },
            readOnly: false,
            nfc: false,
            isCommentEdited: false,
        }, zenAccount);
        expect(transaction2).toEqual({
            id: "11302220500",
            date: new Date("2018-06-24T13:14:38+03:00"),
            hold: false,
            categoryId: 227,
            location: null,
            merchant: "Пополнение карты со счета",
            description: "RU",
            payee: "SBERBANK ONL@IN VKLAD-KARTA",
            posted: {
                amount: 3500,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction2)).toEqual({
            date: new Date("2018-06-24T13:14:38+03:00"),
            hold: false,
            income: 3500,
            incomeAccount: "account",
            incomeBankID: "11302220500",
            outcome: 0,
            outcomeAccount: "account",
            comment: "SBERBANK ONL@IN VKLAD-KARTA",
            _transferType: "outcome",
            _transferId: "2018-06-24_1_RUB_3500",
        });
    });

    it("converts outcome part of account -> card transfer", () => {
        const zenAccount = {id: "account", instrument: "RUB"};

        const transaction = convertApiTransaction({
            date: "24.06.2018T00:00:00",
            sum: {
                amount: "-3500.00",
                currency: { code: "RUB", name: "руб." },
            },
            description: "Частичная выдача",
            "transaction.operationCode": "3",
        }, zenAccount);
        expect(transaction).toEqual({
            date: new Date("2018-06-24T00:00:00+03:00"),
            hold: null,
            description: "Частичная выдача",
            payee: null,
            posted: {
                amount: -3500,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction)).toEqual({
            date: new Date("2018-06-24T00:00:00+03:00"),
            hold: null,
            income: 0,
            incomeAccount: "account",
            outcome: 3500,
            outcomeAccount: "account",
            _transferType: "income",
            _transferId: "2018-06-24_1_RUB_3500",
        });
    });

    it("converts outсome part of card -> account transfer", () => {
        const zenAccount = {id: "account", instrument: "RUB"};

        const transaction = convertApiTransaction({
            date: "20.06.2018T12:43:32",
            sum: {
                amount: "-4700,00",
                currency: { code: "RUB", name: "руб." },
            },
            description: "BP Card - Acct RUS  BP Card - Acct RUS  SBERBANK ONL@IN KARTA-VKLAD",
        }, zenAccount);
        expect(transaction).toEqual({
            date: new Date("2018-06-20T12:43:32+03:00"),
            hold: null,
            description: "BP Card - Acct RUS",
            payee: "SBERBANK ONL@IN KARTA-VKLAD",
            posted: {
                amount: -4700,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction)).toEqual({
            date: new Date("2018-06-20T12:43:32+03:00"),
            hold: null,
            income: 0,
            incomeAccount: "account",
            outcome: 4700,
            outcomeAccount: "account",
            comment: "SBERBANK ONL@IN KARTA-VKLAD",
            _transferType: "income",
            _transferId: "2018-06-20_2_RUB_4700",
        });
    });

    it("converts inсome part of card -> account transfer", () => {
        const zenAccount = {id: "account", instrument: "RUB"};

        const transaction = convertApiTransaction({
            date: "20.06.2018T00:00:00",
            sum: {
                amount: "+4700,00",
                currency: { code: "RUB", name: "руб." },
            },
            description: "Дополнительный взнос",
            "transaction.operationCode": "2",
        }, zenAccount);
        expect(transaction).toEqual({
            date: new Date("2018-06-20T00:00:00+03:00"),
            hold: null,
            description: "Дополнительный взнос",
            payee: null,
            posted: {
                amount: 4700,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction)).toEqual({
            date: new Date("2018-06-20T00:00:00+03:00"),
            hold: null,
            income: 4700,
            incomeAccount: "account",
            outcome: 0,
            outcomeAccount: "account",
            _transferType: "outcome",
            _transferId: "2018-06-20_2_RUB_4700",
        });
    });

    it("converts income part of card -> card transfer", () => {
        const zenAccount = {id: "account", instrument: "RUB"};

        const transaction1 = convertApiTransaction({
            date: "20.06.2018T13:03:59",
            sum: {
                amount: "+100,00",
                currency: { code: "RUB", name: "руб." },
            },
            description: "CH Payment RUS MOSCOW CH Payment RUS MOSCOW SBOL",
        }, zenAccount);
        expect(transaction1).toEqual({
            date: new Date("2018-06-20T13:03:59+03:00"),
            hold: null,
            description: "CH Payment RUS MOSCOW",
            payee: "SBOL",
            posted: {
                amount: 100,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction1)).toEqual({
            date: new Date("2018-06-20T13:03:59+03:00"),
            hold: null,
            income: 100,
            incomeAccount: "account",
            outcome: 0,
            outcomeAccount: "account",
            comment: "SBOL",
            _transferType: "outcome",
            _transferId: "1529489039000_RUB_100",
        });

        const transaction2 = convertPfmTransaction({
            id: 11352124463,
            date: "20.06.2018T13:03:59",
            comment: "SBOL                    MOSCOW      RU",
            categoryId: 1476,
            categoryName: "Перевод между своими картами",
            hidden: false,
            country: "RUS",
            cardNumber: "4222 22** **** 2222",
            cardAmount: { amount: "100.00", currency: "RUB" },
            nationalAmount: { amount: "100.00", currency: "RUB" },
            availableCategories: [
                { id: 1476, name: "Перевод между своими картами" },
                { id: 214, name: "Внесение наличных" },
                { id: 217, name: "Возврат, отмена операций" },
                { id: 215, name: "Зачисления" },
                { id: 216, name: "Перевод на карту" },
                { id: 227, name: "Перевод со вклада" },
                { id: 218, name: "Прочие поступления" },
            ],
            merchantInfo: {
                merchant: "Сбербанк Онлайн",
                imgUrl: "https://pfm.stat.online.sberbank.ru/PFM/logos/22877.jpg",
            },
            readOnly: false,
            nfc: false,
            isCommentEdited: false,
        }, zenAccount);
        expect(transaction2).toEqual({
            id: "11352124463",
            date: new Date("2018-06-20T13:03:59+03:00"),
            hold: false,
            categoryId: 1476,
            location: null,
            merchant: "Сбербанк Онлайн",
            description: "MOSCOW RU",
            payee: "SBOL",
            posted: {
                amount: 100,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction2)).toEqual({
            date: new Date("2018-06-20T13:03:59+03:00"),
            hold: false,
            income: 100,
            incomeAccount: "account",
            incomeBankID: "11352124463",
            outcome: 0,
            outcomeAccount: "account",
            comment: "SBOL",
            _transferType: "outcome",
            _transferId: "1529489039000_RUB_100",
        });
    });

    it("converts outcome part of card -> card transfer", () => {
        const zenAccount = {id: "account", instrument: "RUB"};

        const transaction1 = convertApiTransaction({
            date: "20.06.2018T13:03:59",
            sum: {
                amount: "-100,00",
                currency: { code: "RUB", name: "руб." },
            },
            description: "CH Debit RUS MOSCOW CH Debit RUS MOSCOW SBOL",
        }, zenAccount);
        expect(transaction1).toEqual({
            date: new Date("2018-06-20T13:03:59+03:00"),
            hold: null,
            description: "CH Debit RUS MOSCOW",
            payee: "SBOL",
            posted: {
                amount: -100,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction1)).toEqual({
            date: new Date("2018-06-20T13:03:59+03:00"),
            hold: null,
            income: 0,
            incomeAccount: "account",
            outcome: 100,
            outcomeAccount: "account",
            comment: "SBOL",
            _transferType: "income",
            _transferId: "1529489039000_RUB_100",
        });

        const transaction2 = convertPfmTransaction({
            id: 11352124431,
            date: "20.06.2018T13:03:59",
            comment: "SBOL                    MOSCOW      RUS",
            categoryId: 1475,
            categoryName: "Перевод между своими картами",
            hidden: false,
            country: "RUS",
            cardNumber: "5222 22** **** 2222",
            cardAmount: { amount: "-100.00", currency: "RUB" },
            nationalAmount: { amount: "-100.00", currency: "RUB" },
            availableCategories: [
                { id: 1475, name: "Перевод между своими картами" },
                { id: 201, name: "Автомобиль" },
                { id: 220, name: "Все для дома" },
                { id: 203, name: "Выдача наличных" },
                { id: 205, name: "Здоровье и красота" },
                { id: 222, name: "Искусство" },
                { id: 212, name: "Комиссия" },
                { id: 204, name: "Коммунальные платежи, связь, интернет" },
                { id: 207, name: "Образование" },
                { id: 206, name: "Одежда и аксессуары" },
                { id: 208, name: "Отдых и развлечения" },
                { id: 8128, name: "Перевод во вне" },
                { id: 228, name: "Перевод на вклад" },
                { id: 202, name: "Перевод с карты" },
                { id: 213, name: "Погашение кредитов" },
                { id: 210, name: "Прочие расходы" },
                { id: 219, name: "Путешествия" },
                { id: 221, name: "Рестораны и кафе" },
                { id: 209, name: "Супермаркеты" },
                { id: 211, name: "Транспорт" },
            ],
            merchantInfo: {
                merchant: "Сбербанк Онлайн",
                imgUrl: "https://pfm.stat.online.sberbank.ru/PFM/logos/22877.jpg",
            },
            readOnly: false,
            nfc: false,
            isCommentEdited: false,
        }, zenAccount);
        expect(transaction2).toEqual({
            id: "11352124431",
            date: new Date("2018-06-20T13:03:59+03:00"),
            hold: false,
            categoryId: 1475,
            location: null,
            merchant: "Сбербанк Онлайн",
            description: "MOSCOW RUS",
            payee: "SBOL",
            posted: {
                amount: -100,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction2)).toEqual({
            date: new Date("2018-06-20T13:03:59+03:00"),
            hold: false,
            income: 0,
            incomeAccount: "account",
            outcome: 100,
            outcomeAccount: "account",
            outcomeBankID: "11352124431",
            comment: "SBOL",
            _transferType: "income",
            _transferId: "1529489039000_RUB_100",
        });
    });

    it("converts outer transfer", () => {
        const zenAccount = {id: "account", instrument: "RUB"};

        const transaction1 = convertApiTransaction({
            date: "20.06.2018T15:32:50",
            sum: {
                amount: "-10000,00",
                currency: { code: "RUB", name: "руб." },
            },
            description: "Retail RUS MOSCOW Retail RUS MOSCOW Tinkoff Bank Card2Card",
        }, zenAccount);
        expect(transaction1).toEqual({
            date: new Date("2018-06-20T15:32:50+03:00"),
            hold: null,
            description: "Retail RUS MOSCOW",
            payee: "Tinkoff Bank Card2Card",
            posted: {
                amount: -10000,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction1)).toEqual({
            date: new Date("2018-06-20T15:32:50+03:00"),
            hold: false,
            income: 0,
            incomeAccount: "account",
            outcome: 10000,
            outcomeAccount: "account",
            comment: "Перевод с карты",
        });

        const transaction2 = convertPfmTransaction({
            id: 692815587,
            date: "20.06.2018T15:32:50",
            comment: "TINKOFF BANK CARD2CARD  MOSCOW      RUS",
            categoryId: 210,
            categoryName: "Прочие расходы",
            hidden: false,
            country: "RUS",
            cardNumber: "5222 22** **** 2222",
            cardAmount: { amount: "-10000.00", currency: "RUB" },
            nationalAmount: { amount: "-10000.00", currency: "RUB" },
            availableCategories: [
                { id: 210, name: "Прочие расходы" },
                { id: 201, name: "Автомобиль" },
                { id: 220, name: "Все для дома" },
                { id: 203, name: "Выдача наличных" },
                { id: 205, name: "Здоровье и красота" },
                { id: 222, name: "Искусство" },
                { id: 212, name: "Комиссия" },
                { id: 204, name: "Коммунальные платежи, связь, интернет" },
                { id: 207, name: "Образование" },
                { id: 206, name: "Одежда и аксессуары" },
                { id: 208, name: "Отдых и развлечения" },
                { id: 8128, name: "Перевод во вне" },
                { id: 1475, name: "Перевод между своими картами" },
                { id: 228, name: "Перевод на вклад" },
                { id: 202, name: "Перевод с карты" },
                { id: 213, name: "Погашение кредитов" },
                { id: 219, name: "Путешествия" },
                { id: 221, name: "Рестораны и кафе" },
                { id: 209, name: "Супермаркеты" },
                { id: 211, name: "Транспорт" },
            ],
            merchantInfo: {
                merchant: "Тинькофф Банк",
                imgUrl: "https://pfm.stat.online.sberbank.ru/PFM/logos/18699.jpg",
            },
            readOnly: false,
            nfc: false,
            isCommentEdited: true,
        }, zenAccount);
        expect(transaction2).toEqual({
            id: "692815587",
            date: new Date("2018-06-20T15:32:50+03:00"),
            hold: false,
            categoryId: 210,
            location: null,
            merchant: "Тинькофф Банк",
            description: "MOSCOW RUS",
            payee: "TINKOFF BANK CARD2CARD",
            posted: {
                amount: -10000,
                instrument: "RUB",
            },
        });
        expect(convertToZenMoneyTransaction(zenAccount, transaction2)).toEqual({
            date: new Date("2018-06-20T15:32:50+03:00"),
            hold: false,
            income: 0,
            incomeAccount: "account",
            outcome: 10000,
            outcomeAccount: "account",
            outcomeBankID: "692815587",
            comment: "Перевод с карты",
        });
    });
});
