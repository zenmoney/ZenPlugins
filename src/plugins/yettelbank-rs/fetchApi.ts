import { fetch, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError, ZPAPIError } from '../../errors'
import { getCookies, checkResponseAndSetCookies, checkResponseSuccess } from './helpers'
import { AccountInfo, Preferences, Product, Session, TransactionInfo } from './models'
import { mockedAccountsResponse, mockedTransactionsResponse } from './mocked_responses'
import cheerio from 'cheerio';

const baseUrl = 'https://online.mobibanka.rs/'
const mockResponses = false 

declare class AccountsInfoNotFound extends ZPAPIError {
  constructor (message?: string)
}

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetch(baseUrl + url, options ?? {})
}

// First GET request to fetch initial cookies & workflow id for actual auth request
async function initAuthorizationWorkflow (url: string): Promise<string> {
  const parseWorkflowId = (body: unknown): string =>
  {
    const $ = cheerio.load(body as string);
    return $('#WorkflowId').val();
  };

  if (mockResponses){
    return "673d394c-a31c-4e59-8b55-11b0b05958f3"
  }

  const response = await fetchApi(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  });

  checkResponseAndSetCookies(response)
  return parseWorkflowId(response.body);
}

function sendAuthRequest(url: string, workflowId: string, username: string, password: string){
  const request_body = `UserName=${username}&Password=${password}&WorkflowId=${workflowId}&X-Requested-With=XMLHttpRequest`
  return fetchApi(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': getCookies()},
    body: request_body,
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
}

// POST request with empty passwords to fetch auth cookies
async function fetchAuth (url: string, workflowId: string, username: string) {
  if (mockResponses){
    return
  }
  const response = await sendAuthRequest(url, workflowId, username, '')

  checkResponseAndSetCookies(response)
}

// Send POST request with login and password
async function fetchLogin (url: string, workflowId: string, username: string, password: string) {
  if (mockResponses){
    return
  }

  const checkErrorInResponse = (body: unknown): string =>
    {
      const $ = cheerio.load(body as string);
      return $('.common-error-msg').val();
    };

  const response = await sendAuthRequest(url, workflowId, username, password)
  
  checkResponseAndSetCookies(response)

  const error = checkErrorInResponse(response.body)
  if (error){
    throw new InvalidLoginOrPasswordError(error)
  }
}

function extractAccountInfo(loaded_cheerio: cheerio.Root, accountId: string): AccountInfo | null{
  const accountElement = loaded_cheerio(`#pie-stats-${accountId}`);
  
  if (accountElement.length === 0) {
      console.debug(`Account ${accountId} not found`);
      return null;
  }

  const currency = accountElement.find('option[selected="selected"]').val();
  const availableBalanceAccount = accountElement.find(`#available-balance-stat-${accountId}-${currency}`)
  const name = availableBalanceAccount.find('.stat-name').text().trim();
  const balanceText = availableBalanceAccount.find('.amount-stats.big-nr p').first().text().trim();
  const balance = parseFloat(balanceText.replace(/,/g, ''));

  return {
      id: accountId,
      name: name,
      currency: currency,
      balance: balance,
  };
}

function parseAccounts(body: unknown): AccountInfo[] {
  const accountIds: string[] = []
  const $ = cheerio.load(body as string)

  $('#AccountPicker option').each((_, element) => {
      const accountNumber = $(element).attr('value');
      if (accountNumber) {
        accountIds.push(accountNumber);
      }
  })

  const accounts = accountIds.map(id => extractAccountInfo($, id)).filter(Boolean)
  if (!accounts){
    throw new AccountsInfoNotFound()
  }
  return accounts as AccountInfo[]
}

async function fetchAccounts(): Promise<AccountInfo[]>{
  if (mockResponses){
    return mockedAccountsResponse
  }
  
  const response = await fetchApi('', {
    method: 'GET',
    headers: {
      'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Cookie': getCookies()
    }})

  checkResponseSuccess(response)
  return parseAccounts(response.body)
}

function parseTransactions(body: unknown, pending: boolean): TransactionInfo[]{
  function parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('.').map(Number);
    return new Date(year, month - 1, day);
  }

  const $ = cheerio.load(body as string);

  const transactions: TransactionInfo[] = [];

  $('.transactions-table').each((_, table) => {
    $(table).find('table').each((_, transactionTable) => {
      const title = $(transactionTable).find('.transaction-title').text().trim()
      const date = $(transactionTable).find('.transaction-date').text().trim()
      const [amount, currency] = $(transactionTable).find('.transaction-amount').text().trim().split(' ')
  
      transactions.push({ 
        isPending: pending, 
        date: parseDate(date),
        title: title, 
        amount: parseFloat(amount.replace(/,/g, '')),
        currency: currency });
    });
  });

  return transactions;
}

async function fetchTransactions(account_id: string, status: string): Promise<TransactionInfo[]>{
  if (mockResponses){
    return mockedTransactionsResponse
  }

  const response = await fetchApi(`CustomerAccount/Accounts/Transactions?accountid=${account_id}&status=${status}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Cookie': getCookies()
    }})

  checkResponseSuccess(response)
  return parseTransactions(response.body, status === "Pending")
}

// ################################################
// #              main functionality              #
// ################################################

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{cookieHeader: string}> {
  const workflowId = await initAuthorizationWorkflow('Identity')

  await fetchAuth('Identity', workflowId, login)
  await fetchLogin('Identity', workflowId, login, password)

  return { cookieHeader: getCookies() }
}

export async function fetchAllAccounts (session: Session): Promise<AccountInfo[]> {
  return await fetchAccounts()
}

export async function fetchProductTransactions (account_id: string, session: Session): Promise<TransactionInfo[]> {
  const executedTransactions = await fetchTransactions(account_id, 'Executed')
  const pendingTransactions = await fetchTransactions(account_id, 'Pending')
  return [...executedTransactions, ...pendingTransactions]
}
