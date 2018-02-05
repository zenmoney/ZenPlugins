import {retry} from "./retry";

describe("retry", () => {
    it("should resolve when working with sync getter", async () => {
        await expect(retry({
            getter: () => 1,
            predicate: (x) => x === 1,
        })).resolves.toEqual(1);
        let result = 0;
        await expect(retry({
            getter: () => result += 10,
            predicate: (x) => x === 50,
            maxAttempts: 5,
        })).resolves.toEqual(50);
    });

    it("should resolve when working with async getter", async () => {
        await expect(retry({
            getter: () => Promise.resolve(1),
            predicate: (value) => value === 1,
        })).resolves.toEqual(1);
        let seed = 0;
        await expect(retry({
            getter: () => Promise.resolve(seed += 10),
            predicate: (x) => x === 50,
            maxAttempts: 5,
        })).resolves.toEqual(50);
    });

    it("should reject when working with sync getter", async () => {
        await expect(retry({
            getter: () => 1,
            predicate: (x) => false,
        })).rejects.toEqual(new Error("could not satisfy predicate in 1 attempt(s)"));
        await expect(retry({
            maxAttempts: 0,
        })).rejects.toEqual(new Error("could not satisfy predicate in 0 attempt(s)"));
    });

    it("should reject when working with async getter", async () => {
        await expect(retry({
            getter: () => Promise.resolve(1),
            predicate: (value) => false,
        })).rejects.toEqual(new Error("could not satisfy predicate in 1 attempt(s)"));
        let seed = 0;
        await expect(retry({
            getter: () => Promise.reject(seed += 10),
            predicate: (value) => false,
        })).rejects.toEqual(10);
        await expect(retry({
            maxAttempts: 0,
        })).rejects.toEqual(new Error("could not satisfy predicate in 0 attempt(s)"));
    });
});
