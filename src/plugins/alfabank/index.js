import {toZenmoneyTransaction} from "../../common/converters";
import {generateUUID} from "../../common/utils";
import {assertLoginIsSuccessful, getAccessToken, getAccountsWithAccountDetailsCreditInfo, getAllCommonMovements, isExpiredLogin, login, register} from "./api";
import {convertApiMovementsToReadableTransactions, toZenmoneyAccount} from "./converters";
import {normalizePreferences} from "./preferences";

export async function scrape({preferences, fromDate, toDate}) {
    const sessionId = generateUUID();

    const pluginData = {
        deviceId: ZenMoney.getData("deviceId"),
        registered: ZenMoney.getData("registered", false),
        accessToken: ZenMoney.getData("accessToken", null),
        refreshToken: ZenMoney.getData("refreshToken", null),
    };
    if (!pluginData.deviceId) {
        pluginData.deviceId = generateUUID();
        ZenMoney.setData("deviceId", pluginData.deviceId);
    }
    if (!pluginData.registered) {
        pluginData.registered = true;
        ZenMoney.setData("registered", pluginData.registered);
        const {cardNumber, cardExpirationDate, phoneNumber} = normalizePreferences(preferences);
        const {accessToken, refreshToken} = await register({
            deviceId: pluginData.deviceId,
            cardNumber,
            cardExpirationDate,
            phoneNumber,
        });
        pluginData.accessToken = accessToken;
        ZenMoney.setData("accessToken", pluginData.accessToken);
        pluginData.refreshToken = refreshToken;
        ZenMoney.setData("refreshToken", pluginData.refreshToken);
        ZenMoney.saveData();
    }
    let loginResponse = await login({sessionId, deviceId: pluginData.deviceId, accessToken: pluginData.accessToken});
    if (isExpiredLogin(loginResponse)) {
        const {accessToken, expiresIn, refreshToken} = await getAccessToken({sessionId, deviceId: pluginData.deviceId, refreshToken: pluginData.refreshToken});

        console.log(`got new accessToken, expires in ${((expiresIn - Date.now()) / 86400000).toFixed(2)} day(s)`);
        pluginData.accessToken = accessToken;

        ZenMoney.setData("accessToken", accessToken);
        if (refreshToken !== pluginData.refreshToken) {
            console.log("got new refreshToken");
            pluginData.refreshToken = refreshToken;
            ZenMoney.setData("refreshToken", refreshToken);
        }
        ZenMoney.saveData();

        loginResponse = await login({sessionId, deviceId: pluginData.deviceId, accessToken});
    }
    assertLoginIsSuccessful(loginResponse);

    const [
        apiAccounts,
        apiMovements,
    ] = await Promise.all([
        getAccountsWithAccountDetailsCreditInfo({sessionId, deviceId: pluginData.deviceId}),
        getAllCommonMovements({sessionId, deviceId: pluginData.deviceId, startDate: fromDate, endDate: toDate}),
    ]);
    const readableTransactions = convertApiMovementsToReadableTransactions(apiMovements.reverse(), apiAccounts);
    console.debug({readableTransactions});
    return {
        accounts: apiAccounts.map(toZenmoneyAccount),
        transactions: readableTransactions.map(toZenmoneyTransaction),
    };
}
