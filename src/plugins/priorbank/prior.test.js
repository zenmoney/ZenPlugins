import {calculatePasswordHash} from "./prior";

describe("calculatePasswordHash", () => {
    it("should trim password to 16 chars due to implicit password size limit", () => {
        expect(calculatePasswordHash({loginSalt: "loginSalt", password: "x".repeat(17)}))
            .toBe(calculatePasswordHash({loginSalt: "loginSalt", password: "x".repeat(16)}));
        expect(calculatePasswordHash({loginSalt: "loginSalt", password: "x".repeat(15)}))
            .not.toBe(calculatePasswordHash({loginSalt: "loginSalt", password: "x".repeat(16)}));
    });

    it("should handle present salt", () => {
        expect(calculatePasswordHash({loginSalt: "loginSalt", password: "password"}))
            .toEqual("f9e40ac381ee672e691f3f8d4749e855ee5aa0048fe3132c0c9946def06e29a7ca84278fea42d5e3b8e16edac3c45f5a68da203ac9cf615a93f90c607b8fa531");
    });

    it("should handle absent salt", () => {
        expect(calculatePasswordHash({loginSalt: "", password: "password"}))
            .toEqual("b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86");
    });
});
