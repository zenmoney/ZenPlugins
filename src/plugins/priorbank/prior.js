import {SHA512} from "jshashes";
import {fetchJson} from "../../common/network";

function isSuccessfulResponse(response) {
    return response.status === 200 && (!("success" in response.body) || response.body.success === true);
}

function assertResponseSuccess(response) {
    console.assert(isSuccessfulResponse(response), "non-successful response", response);
}

const makeApiUrl = (path) => `https://www.prior.by/api3/api${path}`;

export async function fetchPreAuthHeaders() {
    const response = await fetchJson(makeApiUrl("/Authorization/MobileToken"), {
        sanitizeResponseLog: {body: true},
    });
    assertResponseSuccess(response);

    return {
        "Authorization": `${response.body.token_type} ${response.body.access_token}`,
        "client_id": response.body.client_secret,
        "User-Agent": "PriorMobile3/3.17.03.22 (Android 24; versionCode 37)",
    };
}

export async function fetchLoginSalt({preAuthHeaders, login}) {
    const response = await fetchJson(makeApiUrl("/Authorization/GetSalt"), {
        method: "POST",
        body: {login, lang: "RUS"},
        headers: preAuthHeaders,
        sanitizeRequestLog: {body: {login: true}, headers: true},
        sanitizeResponseLog: {body: {result: true}},
    });
    assertResponseSuccess(response);

    return response.body.result.salt;
}

const sha512 = new SHA512();

export const calculatePasswordHash = ({loginSalt, password}) => {
    const passwordHash = sha512.hex(password.slice(0, 16));
    return loginSalt
        ? sha512.hex(passwordHash + loginSalt)
        : passwordHash;
};

export async function login({preAuthHeaders, loginSalt, login, password}) {
    const response = await fetchJson(makeApiUrl("/Authorization/Login"), {
        method: "POST",
        body: {login, password: calculatePasswordHash({loginSalt, password}), lang: "RUS"},
        headers: preAuthHeaders,
        sanitizeRequestLog: {body: {login: true, password: true}, headers: true},
        sanitizeResponseLog: {body: {result: true}},
    });
    assertResponseSuccess(response);

    return {
        accessToken: response.body.result.access_token,
        userSession: response.body.result.userSession,
    };
}

export const calculatePostAuthHeaders = ({preAuthHeaders, accessToken}) => ({...preAuthHeaders, "Authorization": `bearer ${accessToken}`});

export async function fetchCards({postAuthHeaders, userSession}) {
    const response = await fetchJson(makeApiUrl("/Cards"), {
        method: "POST",
        body: {usersession: userSession},
        headers: postAuthHeaders,
        sanitizeRequestLog: {body: {usersession: true}, headers: true},
        sanitizeResponseLog: {body: {result: {clientObject: {cardRBSNumber: true, contractNum: true, iban: true}}}},
    });
    assertResponseSuccess(response);

    return response.body.result;
}

export async function fetchCardDesc({postAuthHeaders, userSession, fromDate = null, toDate = null}) {
    const body = {
        usersession: userSession,
        ids: [],
        dateFromSpecified: false,
        dateToSpecified: false,
    };
    if (fromDate) {
        body.dateFromSpecified = true;
        body.dateFrom = fromDate;
    }
    if (toDate) {
        body.dateToSpecified = true;
        body.dateTo = toDate;
    }
    const response = await fetchJson(makeApiUrl("/Cards/CardDesc"), {
        method: "POST",
        body,
        headers: postAuthHeaders,
        sanitizeRequestLog: {body: {usersession: true}, headers: true},
        sanitizeResponseLog: {body: {result: {contract: {addrLineA: true, addrLineB: true, addrLineC: true}}}},
    });
    assertResponseSuccess(response);
    return response.body.result;
}
