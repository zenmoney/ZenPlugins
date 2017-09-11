import {calculatePasswordHash} from "./prior";

describe("calculatePasswordHash", () => {
    it("should trim password to 16 chars due to implicit password size limit", () => {
        expect(calculatePasswordHash({loginSalt: "loginSalt", password: "x".repeat(17)}))
            .toBe(calculatePasswordHash({loginSalt: "loginSalt", password: "x".repeat(16)}));
        expect(calculatePasswordHash({loginSalt: "loginSalt", password: "x".repeat(15)}))
            .not.toBe(calculatePasswordHash({loginSalt: "loginSalt", password: "x".repeat(16)}));
    });
});
