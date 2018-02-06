import {parseDeposit} from '../index';

describe("deposit parser", () => {
    it("should return valid account when it's a deposit with monthly capitalization", () => {
        const deposit = parseDeposit({
            alien: false,
            account: {
                id: 10206507,
                cba: '40817810501002512442',
                currency: {
                    id: 'RUR',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '810',
                    shortName: 'RUB',
                    sort: 2
                }
            },
            procurationCredentials: { debit: true, credit: true, createProcuration: true },
            id: 5655,
            date: '2017-12-29T00:00',
            number: '00/814294/5655',
            rollover: false,
            capital: true,
            product: {
                id: 43,
                new: false,
                img: 'http://www.raiffeisen.ru/common/img/uploaded/banners/zarplatnyi_tiz_vklad_300x260.jpg',
                name: { name: 'Зарплатный' },
                shortDesc: { name: 'Вклад с пополнением и снятием для зарплатных клиентов.' },
                fullDesc: { name: 'Повышенная ставка и возможность снимать средства без потери процентов для клиентов, получающих заработную плату в Райффайзенбанке и индивидуальных зарплатных клиентов.' },
                capitalisable: 1,
                prolongable: 0
            },
            frequency: { id: 'M', name: 'Раз в месяц' },
            deals: [ {
                id: 1025641,
                cba: '40817810501002512442',
                accountId: 10206507,
                open: '2017-12-29T00:00',
                close: '2018-03-30T00:00',
                rate: 5,
                currencyId: 'RUR',
                currency: {
                    id: 'RUR',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '810',
                    shortName: 'RUB',
                    sort: 2 },
                currentAmount: 200849.32,
                startAmount: 200000,
                totalInterest: 1654.32,
                duration: 91,
                minBalance: 30000,
                maxAmount: 1000000,
                maxIncrease: 800000,
                paidInterest: 849.32
            } ],
            replenish: true,
            withdraw: true
        });

        expect(deposit).toEqual({'DEPOSIT_1025641': {
            id: 'DEPOSIT_1025641',
            title: 'Зарплатный',
            type: 'deposit',
            instrument: 'RUB',
            balance: 200849.32,
            syncID: ['5641'],
            percent: 5,
            startDate: '2017-12-29',
            endDateOffsetInterval: 'day',
            endDateOffset: 91,
            payoffInterval: 'month',
            payoffStep: 1,
            capitalization: true
        }});
    });

    it("should return valid account when it's a deposit without capitalization", () => {
        const deposit = parseDeposit({
            alien: false,
            account: {
                id: 10206507,
                cba: '40817810501002512442',
                currency: {
                    id: 'RUR',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '810',
                    shortName: 'RUB',
                    sort: 2
                }
            },
            procurationCredentials: { debit: true, credit: true, createProcuration: true },
            id: 5657,
            date: '2017-12-29T00:00',
            number: '00/814294/5657',
            rollover: false,
            capital: false,
            product: {
                id: 28,
                new: true,
                img: 'https://www.raiffeisen.ru/common/img/uploaded/dict/prib260x220.jpg',
                name: { name: 'Прибыльный Сезон' },
                shortDesc: { name: 'Максимальные ставки в рублях! Доход до 6.0% в год.' },
                fullDesc: { name: 'Специальное предложение для выгодного размещения средств в рублях. Возможность открытия вклада до 12 января 2018 года включительно.' },
                capitalisable: 0,
                prolongable: 0
            },
            deals: [ {
                id: 1025643,
                cba: '40817810501002512442',
                accountId: 10206507,
                open: '2017-12-29T00:00',
                close: '2018-03-30T00:00',
                rate: 5.2,
                currencyId: 'RUR',
                currency: {
                    id: 'RUR',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '810',
                    shortName: 'RUB',
                    sort: 2
                },
                currentAmount: 200000,
                startAmount: 200000,
                totalInterest: 2592.88,
                duration: 91,
                minBalance: 100000,
                paidInterest: 0
            } ],
            replenish: false,
            withdraw: false });

        expect(deposit).toEqual({'DEPOSIT_1025643': {
            id: 'DEPOSIT_1025643',
            title: 'Прибыльный Сезон',
            type: 'deposit',
            instrument: 'RUB',
            balance: 200000,
            syncID: ['5643'],
            percent: 5.2,
            startDate: '2017-12-29',
            endDateOffsetInterval: 'day',
            endDateOffset: 91,
            payoffInterval: null,
            payoffStep: 0,
            capitalization: false
        }});
    });
});
