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

/**
 * Ответы сервера
 *
 * @namespace Response
 */

/**
 * Информация об ошибке
 *
 * @typedef {Object} Response.Response
 * @memberOf Response
 * @property {Number} status
 * @property {String} description
 */

/**
 * Постраничная навигация
 *
 * @typedef {Object} Response.Pagination
 * @memberOf Response
 * @property {Number} current_page
 * @property {Number} total_pages
 * @property {Number} total_count
 * @property {Number} per_page
 */

/**
 * Данные о деньгах
 *
 * @typedef {Object} Response.Money
 * @memberOf Response
 * @property {Number} amount
 * @property {String} currency_code
 */

/**
 * @typedef {Object} Response.Merchant
 * @memberOf Response
 * @property {Number} id
 * @property {String} name
 */

/**
 * Объект с информацией об операциях
 *
 * @typedef {Object} Response.Operation
 * @memberOf Response
 * @property {Number} id
 * @property {String} details
 * @property {String} comment
 * @property {Number} happened_at
 * @property {String} status
 * @property {String} context_type
 * @property {Response.Money} money
 * @property {Response.Merchant} merchant
 */

/**
 * Ответ на регистрацию устройства
 *
 * @typedef {Object} Response.Register
 * @memberOf Response
 * @property {Response.Response} [response]
 * @property {{id: String}} sms_verification
 */

/**
 * Ответ на верификацию устройства
 *
 * @typedef {Object} Response.Verification
 * @memberOf Response
 * @property {Response.Response} [response]
 * @property {{email: String}} user
 */

/**
 * Ответ с данными об аккаунте
 *
 * @typedef {Object} Response.Account
 * @memberOf Response
 * @property {Response.Response} [response]
 * @property {Response.Pagination} pagination
 * @property {["operation", Response.Operation][]} feed
 */
