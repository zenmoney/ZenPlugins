/**
 * Профиль пользователя
 *
 * @typedef {Object} Profile
 * @property {User} user
 */

/**
 * Информация о пользователе из профиля
 *
 * @typedef {Object} User
 * @property {Deposit[]} deposits
 * @property {Card[]} accounts
 * @property {Account[]} safe_accounts
 */

/**
 * Депозит
 *
 * @typedef {Object} Deposit
 * @property {Number} id
 * @property {String} title
 * @property {Number} balance
 * @property {Number} percent
 * @property {Number} start_date
 * @property {{currency: String, rate: Number, period: Number}} rocket_deposit
 */

/**
 * Кредитная карта
 *
 * @typedef {Object} Card
 * @property {String} token
 * @property {String} pan
 * @property {Number} balance
 * @property {String} currency
 * @property {String} title
 */

/**
 * Счет
 *
 * @typedef {Object} Account
 * @property {String} token
 * @property {{account: {String}}} account_details
 * @property {Number} balance
 * @property {String} currency
 * @property {String} title
 */
