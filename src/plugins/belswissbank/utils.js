export function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(char) {
        const seed = Math.random() * 16 | 0;
        // eslint-disable-next-line no-mixed-operators
        const hexValue = char === "x" ? seed : (seed & 0x3 | 0x8);
        return hexValue.toString(16);
    });
}

export const assertResponseSuccess = function(response) {
    console.assert(response.status === 200, "non-successful response", response);
};
