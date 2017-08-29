import {toReadableJson} from "../../common/printing";

export function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(char) {
        const seed = Math.random() * 16 | 0;
        // eslint-disable-next-line no-mixed-operators
        const hexValue = char === "x" ? seed : (seed & 0x3 | 0x8);
        return hexValue.toString(16);
    });
}

export const assertResponseSuccess = function(response, createError) {
    if (response.status !== 200) {
        throw createError(`non-successful response: ${toReadableJson(response)}`);
    }
};
