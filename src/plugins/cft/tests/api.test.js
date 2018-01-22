/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as api from "../api";

describe("setApiUri", () => {
    it("should set correct url", () => {
        api.setApiUri('http://example.com');
        expect(api.apiUri).toBe('http://example.com');
    });
});

describe("generateHash", () => {
    it("should return random generateHash", () => {
        const hash = api.generateHash();
        expect(api.generateHash()).not.toBe(hash);
        expect(api.generateHash()).not.toBe(hash);
    });
});
