import {adaptAsyncFn, provideScrapeDates} from "./adapters";

describe("adaptAsyncFn", () => {
    it("should call addAccount, addTransaction, setResult", () => {
        const setResultCalled = new Promise((resolve) => {
            global.ZenMoney = {
                addAccount: jest.fn(),
                addTransaction: jest.fn(),
                setResult: resolve,
            };
            const main = adaptAsyncFn(async () => [{account: "account", transactions: [1, 2]}]);
            main();
        });
        return expect(setResultCalled).resolves.toEqual({success: true}).then(x => {
            expect(global.ZenMoney.addAccount).toHaveBeenCalledTimes(1);
            expect(global.ZenMoney.addAccount).toHaveBeenCalledWith("account");
            expect(global.ZenMoney.addTransaction).toHaveBeenCalledTimes(1);
            expect(global.ZenMoney.addTransaction).toHaveBeenCalledWith([1, 2]);
        });
    });

    it("should fallback to setResult(error) when error thrown in async promise context", () => {
        const testError = new Error("test error");
        return expect(new Promise((resolve) => {
            global.ZenMoney = {
                setResult: resolve,
            };
            const main = adaptAsyncFn(async () => {
                throw testError;
            });
            main();
        })).resolves.toBe(testError);
    });

    it("should throw out errors thrown inside sync promise", () => {
        global.ZenMoney = {
            setResult: () => {
                throw new Error("setResult should not be called in sync promise context");
            },
        };
        const error = new Error("test error");
        const main = adaptAsyncFn(() => {
            return {
                then(resolveHandler, rejectionHandler) {
                    console.assert(resolveHandler);
                    console.assert(!rejectionHandler);
                    return {
                        then(resolveHandler, rejectionHandler) {
                            console.assert(resolveHandler);
                            console.assert(rejectionHandler);
                            rejectionHandler(error);
                        },
                    };
                },
            }
        });
        return expect(() => main()).toThrow(error);
    });
});

describe("provideScrapeDates", () => {
    it("should provide scrape dates from startDate pref", () => {
        const startDate = "2010-01-01T01:01:01.000Z";
        global.ZenMoney = {
            getData: jest.fn(),
            setData: jest.fn(),
            saveData: jest.fn(),
            getPreferences: () => ({"startDate": startDate}),
        };

        const scrape = jest.fn().mockReturnValueOnce(Promise.resolve());
        const scrapeWithProvidedDates = provideScrapeDates(scrape);

        scrapeWithProvidedDates();
        expect(scrape).toHaveBeenCalledWith({fromDate: new Date(startDate), toDate: null});
    });

    it("should provide scrape fromDate equal to lastSuccessDate minus 1 week", () => {
        const lastSuccessDate = "2015-06-07T08:09:10.000Z";
        const expectedFromDate = "2015-05-31T08:09:10.000Z";
        const startDate = "2010-01-01T01:01:01.000Z";
        global.ZenMoney = {
            getData: jest.fn().mockReturnValueOnce(lastSuccessDate),
            setData: jest.fn(),
            saveData: jest.fn(),
            getPreferences: () => ({"startDate": startDate}),
        };

        const scrape = jest.fn().mockReturnValueOnce(Promise.resolve());
        const scrapeWithProvidedDates = provideScrapeDates(scrape);
        scrapeWithProvidedDates();
        expect(scrape).toHaveBeenCalledWith({fromDate: new Date(expectedFromDate), toDate: null});
    });

    it("should save last success date on success", () => {
        const startDate = "2010-01-01T01:01:01.000Z";
        global.ZenMoney = {
            getData: jest.fn(),
            setData: jest.fn(),
            saveData: jest.fn(),
            getPreferences: () => ({"startDate": startDate}),
        };

        const scrape = jest.fn().mockReturnValueOnce(Promise.resolve());
        const scrapeWithProvidedDates = provideScrapeDates(scrape);
        return scrapeWithProvidedDates().then(() => {
            expect(global.ZenMoney.setData).toHaveBeenCalledWith("scrape/lastSuccessDate", expect.any(String));
            expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1);
        });
    });

    it("should not save last success date on failure", () => {
        const startDate = "2010-01-01T01:01:01.000Z";
        global.ZenMoney = {
            getData: jest.fn(),
            setData: jest.fn(),
            saveData: jest.fn(),
            getPreferences: () => ({"startDate": startDate}),
        };

        const scrape = jest.fn().mockReturnValueOnce(Promise.reject());
        const scrapeWithProvidedDates = provideScrapeDates(scrape);
        return scrapeWithProvidedDates().catch(() => {
            expect(global.ZenMoney.setData).toHaveBeenCalledTimes(0);
            expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(0);
        });
    });
});

afterEach(() => {
    delete global.ZenMoney;
});

describe("test suite", () => {
    it("can spoil globals", () => {
        global.ZenMoney = {};
    });

    it("should clean up globals", () => {
        expect(global).not.toHaveProperty("ZenMoney");
    });
});
