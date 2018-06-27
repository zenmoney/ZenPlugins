import {getErrorMessage} from "./sberbank";

describe("getErrorMessage", () => {
    it("returns error text if found", () => {
        expect(getErrorMessage({
            status: {
                code: "1",
                errors: {
                    error: {
                        text: "Неверный логин или пароль. Следующая неверная попытка заблокирует вход в Сбербанк Онлайн на 1ч 00 мин",
                    },
                },
            },
            loginCompleted: "false",
        }, 2)).toEqual("Неверный логин или пароль. Следующая неверная попытка заблокирует вход в Сбербанк Онлайн на 1ч 00 мин");

        expect(getErrorMessage({
            status: {
                code: "4",
            },
            cards: {
                status: {
                    code: "4",
                    errors: {
                        error: {
                            text: "Информация по картам из АБС временно недоступна. Повторите операцию позже.",
                        },
                    },
                },
            },
            accounts: {
                status: {
                    code: "0",
                },
            },
        }, 3)).toEqual("Информация по картам из АБС временно недоступна. Повторите операцию позже.");
    });

    it("returns null if maxDepth is less than needed", () => {
        expect(getErrorMessage({
            status: {
                code: "1",
                errors: {
                    error: {
                        text: "Неверный логин или пароль. Следующая неверная попытка заблокирует вход в Сбербанк Онлайн на 1ч 00 мин",
                    },
                },
            },
            loginCompleted: "false",
        }, 1)).toBeNull();

        expect(getErrorMessage({
            status: {
                code: "4",
            },
            cards: {
                status: {
                    code: "4",
                    errors: {
                        error: {
                            text: "Информация по картам из АБС временно недоступна. Повторите операцию позже.",
                        },
                    },
                },
            },
            accounts: {
                status: {
                    code: "0",
                },
            },
        }, 2)).toBeNull();
    });
});
