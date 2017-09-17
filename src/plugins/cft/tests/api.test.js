/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as api from "../api";

describe("setApiUri", () => {
    it("should set correct url", () => {
        api.setApiUri('http://example.com/');
        expect(api.apiUri).toBe('http://example.com/');

        api.setApiUri('http://example.com');
        expect(api.apiUri).toBe('http://example.com/');
    });
});

describe("makeApiUrl", () => {
    it("should return url", () => {
        api.setApiUri('http://example.com/');

        let uri = api.makeApiUrl('aaa');
        expect(uri.substring(0, uri.length - 13)).toBe('http://example.com/aaa?rid=');

        uri = api.makeApiUrl('aaa/bbb/');
        expect(uri.substring(0, uri.length - 13)).toBe('http://example.com/aaa/bbb/?rid=');

        uri = api.makeApiUrl('aaa', {
            'limit':   5,
            'offset':  '5',
            'array[]': 'абв',
        });
        expect(uri.substring(0, uri.length - 13))
            .toBe('http://example.com/aaa?limit=5&offset=5&array%5B%5D=%D0%B0%D0%B1%D0%B2&rid=');
    });
});

describe("generateHash", () => {
    it("should return random generateHash", () => {
        const hash = api.generateHash();
        expect(api.generateHash()).not.toBe(hash);
        expect(api.generateHash()).not.toBe(hash);
    });
});
