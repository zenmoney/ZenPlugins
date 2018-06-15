import _ from "lodash";

const cardExpirationDateRegExp = /^(\d{2})\/?(\d{2})$/;

export function normalizeCardExpirationDate(cardExpirationDate) {
    const match = cardExpirationDate.match(cardExpirationDateRegExp);
    if (!match) {
        // FIXME must use InvalidPreferencesError here, but InvalidPreferencesError android handler is buggy
        throw new TemporaryError(`cardExpirationDate ${cardExpirationDate} is invalid: use MM/YY format, e.g. 01/21`);
    }
    const [, mm, yy] = match;
    return `${mm}/${yy}`;
}

export function normalizePhoneNumber(phoneNumber) {
    return phoneNumber.replace(/^(\+7|8)/, "7");
}

export function normalizePreferences(preferences) {
    const {cardNumber, cardExpirationDate, phoneNumber} = preferences;
    // FIXME must be checked in a wrapper
    _.toPairs({cardNumber, cardExpirationDate, phoneNumber}).forEach(([key, value]) => {
        if (!value) {
            // FIXME must use InvalidPreferencesError here, but InvalidPreferencesError android handler is buggy
            throw new TemporaryError(`preference key ${key} must be set`);
        }
    });
    return {
        cardNumber,
        cardExpirationDate: normalizeCardExpirationDate(cardExpirationDate),
        phoneNumber: normalizePhoneNumber(phoneNumber),
    };
}
