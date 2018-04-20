import {parseXml} from "./sberbank";

describe("parseXml", () => {
    it("parses xml plain object", () => {
        expect(parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
        <loginCompleted>false</loginCompleted> 
                    <confirmRegistrationStage> 
                        <mGUID>596822784bbcef111e3e1d2e1e22cb5e</mGUID> 
                    </confirmRegistrationStage> 
                    <confirmInfo> 
                        <type>smsp</type> 
                        <smsp> 
                            <lifeTime>597</lifeTime> 
                            <attemptsRemain>3</attemptsRemain> 
                        </smsp> 
                    </confirmInfo> 
                    <registrationParameters> 
                        <minimumPINLength>5</minimumPINLength> 
                    </registrationParameters> 
</response>`)).toEqual({
           response: {
               status: {
                   code: "0"
               },
               loginCompleted: "false",
               confirmRegistrationStage: {
                   mGUID: "596822784bbcef111e3e1d2e1e22cb5e"
               },
               confirmInfo: {
                   type: "smsp",
                   smsp: {
                       lifeTime: "597",
                       attemptsRemain: "3"
                   }
               },
               registrationParameters: {
                   minimumPINLength: "5"
               }
           }
        });
    });

    it("parses xml object with array", () => {
        expect(parseXml(`<?xml version="1.0" encoding="windows-1251" ?>
<response>
    <status>
        <code>0</code>
    </status>
                <cards>
                    <status>
                                <code>0</code>
                    </status>
?
                        <card>
                            <id>51999999</id>
                            <name>MasterCard Mass</name>
                                    <smsName>2235</smsName>
                                <description>MasterCard Mass</description>
                                <number>5469 55** **** 2235</number>
                            <isMain>true</isMain>
                            <type>debit</type>
    <availableLimit>
                        <amount>1650.30</amount>
    <currency>
        <code>RUB</code>
        <name>\xf0\xf3\xe1.</name>
    </currency>
    </availableLimit>
                            <state>active</state>
                                <cardAccount>40817810855760689742</cardAccount>
                            <showarrestdetail>false</showarrestdetail>
                                    <expireDate>21/2023</expireDate>
                                <statusWay4>+-\xca\xc0\xd0\xd2\xce\xd7\xca\xc0 \xce\xd2\xca\xd0\xdb\xd2\xc0</statusWay4>
                        </card>
?
                        <card>
                            <id>69472288</id>
                            <name>Visa Gold</name>
                                    <smsName>5678</smsName>
                                <description>Visa Gold</description>
                                <number>4279 01** **** 5678</number>
                            <isMain>true</isMain>
                            <type>credit</type>
    <availableLimit>
                        <amount>104599.86</amount>
    <currency>
        <code>RUB</code>
        <name>\xf0\xf3\xe1.</name>
    </currency>
    </availableLimit>
                            <state>active</state>
                            <showarrestdetail>false</showarrestdetail>
                                    <expireDate>05/2019</expireDate>
                                <statusWay4>+-\xca\xc0\xd0\xd2\xce\xd7\xca\xc0 \xce\xd2\xca\xd0\xdb\xd2\xc0</statusWay4>
                        </card>
                </cards>
</response>`)).toEqual({
            response: {
                cards: {
                    card: [
                        {
                            availableLimit: {
                                amount: "1650.30",
                                currency: {
                                    code: "RUB",
                                    name: "ðóá."
                                }
                            },
                            cardAccount: "40817810855760689742",
                            description: "MasterCard Mass",
                            expireDate: "21/2023",
                            id: "51999999",
                            isMain: "true",
                            name: "MasterCard Mass",
                            number: "5469 55** **** 2235",
                            showarrestdetail: "false",
                            smsName: "2235",
                            state: "active",
                            statusWay4: "+-ÊÀÐÒÎ×ÊÀ ÎÒÊÐÛÒÀ",
                            type: "debit"
                        },
                        {
                            availableLimit: {
                                amount: "104599.86",
                                currency: {
                                    code: "RUB",
                                    name: "ðóá."
                                }
                            },
                            description: "Visa Gold",
                            expireDate: "05/2019",
                            id: "69472288",
                            isMain: "true",
                            name: "Visa Gold",
                            number: "4279 01** **** 5678",
                            showarrestdetail: "false",
                            smsName: "5678",
                            state: "active",
                            statusWay4: "+-ÊÀÐÒÎ×ÊÀ ÎÒÊÐÛÒÀ",
                            type: "credit"
                        }
                    ],
                    status: {
                        code: "0"
                    }
                },
                status: {
                    code: "0"
                }
            }
        });
    });

    it("parses CDATA", () => {
        expect(parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>1</code> 
            <errors> 
                <error> 
           <text> 
               <![CDATA[ 
                   Вы ввели неправильный идентификатор или пароль из SMS. Пожалуйста, попробуйте снова. 
               ]]> 
            </text> 
        </error> 
            </errors> 
    </status> 
        <loginCompleted>false</loginCompleted> 
                    <confirmInfo> 
                        <type>smsp</type> 
                        <smsp> 
                            <lifeTime>587</lifeTime> 
                            <attemptsRemain>2</attemptsRemain> 
                        </smsp> 
                    </confirmInfo> 
</response>`)).toEqual({
            response: {
                confirmInfo: {
                    smsp: {
                        attemptsRemain: "2",
                        lifeTime: "587"
                    },
                    type: "smsp"
                },
                loginCompleted: "false",
                status: {
                    code: "1",
                    errors: {
                        error: {
                            text: "Вы ввели неправильный идентификатор или пароль из SMS. Пожалуйста, попробуйте снова."
                        }
                    }
                }
            }
        });
    });
});
