```typescript
interface Transaction {
    hold: boolean | null;
    date: Date;
    movements: [Movement] | [Movement, Movement];
    merchant: Merchant | NonParsedMerchant | null;
    comment: string | null;
}

interface Movement {
    id: string | null;
    account: AccountReferenceById | AccountReferenceByData;
    invoice: Amount | null;
    sum: number | null;
    fee: number;
}

interface AccountReferenceById {
    id: string;
}

interface AccountReferenceByData {
    type: AccountType | null;
    instrument: string;
    company: {
        id: string;
    } | null;
    syncIds: Array<String> | null;
}

declare enum AccountType {
    cash = 'cash',
    ccard = 'ccard',
    checking = 'checking',
    deposit = 'deposit',
    loan = 'loan'
}

interface Amount {
    sum: number;
    instrument: string;
}

interface Merchant {
    country: string | null;
    city: string | null;
    title: string;
    mcc: number | null; // https://ru.wikipedia.org/wiki/Merchant_Category_Code
    location: Location | null;
}

interface NonParsedMerchant {
    fullTitle: string;
    mcc: number | null;
    location: Location | null;
}

interface Location {
    latitude: number;
    longitude: number;
}
```

Примеры операций:

- Оплата с рублевой карты (если e2f532d7-13e9-4d16-bfda-614ed290679b - рублевый счёт) в долларах за такси
```js
{
  hold: true, // банк только заблокировал средства на счете, но еще не провел их
  date: new Date('2021-05-30T17:34:00+03:00'),
  movements: [
    {
      id: '6136fae6f' // в банке есть неизменный между синхронизациями id операции,
      account: { id: 'e2f532d7-13e9-4d16-bfda-614ed290679b' },
      invoice: { sum: -5, instrument: 'USD' },
      sum: -400,
      fee: 0
    }
  ],
  merchant: {
    fullTitle: 'NL AMSTERDAM UBER 748264',
    mcc: 4121,
    location: null
  },
  comment: null
}
```

- Покупка с гривневой карты (счёт 5b909992-223f-4d9c-a6b9-ba3f29d68e3e - гривневый) продуктов в магазине
```js
{
  hold: false, // банк уже провел операцию по счету, а не просто заблокировал средства на карте
  date: new Date('2021-06-17T08:39:22+02:00'),
  movements: [
    {
      id: null, // в банке нет постоянных id операций
      account: { id: '5b909992-223f-4d9c-a6b9-ba3f29d68e3e' },
      invoice: null,
      sum: -387.89,
      fee: 0
    }
  ],
  merchant: {
    country: 'UA',
    city: 'KYIV',
    title: 'SILPO',
    mcc: 5411,
    location: null
  },
  comment: null
}
```

- Приход зарплаты на счёт
```js
{
  hold: false,
  date: new Date('2021-06-10T00:00:00+03:00'),
  movements: [
    {
      id: null,
      account: { id: 'e2f532d7-13e9-4d16-bfda-614ed290679b' },
      invoice: null,
      sum: 40000,
      fee: 0
    }
  ],
  merchant: {
    country: 'RUS',
    city: 'MOSCOW',
    title: 'SBERBANK',
    mcc: null,
    location: null
  },
  comment: 'Перечисление заработной платы за май 2021' // комментарий значим для пользователя
}
```

- Перевод денег с одного счёта в синхронизации на другой
```js
{
  hold: false,
  date: new Date('2021-06-30T14:32:32+03:00'),
  movements: [
    {
      id: null,
      account: { id: 'e2f532d7-13e9-4d16-bfda-614ed290679b' },
      invoice: null,
      sum: -10,
      fee: 0
    },
    {
      id: null,
      account: { id: '5b909992-223f-4d9c-a6b9-ba3f29d68e3e' },
      invoice: null,
      sum: 26.7,
      fee: 0
    }
  ],
  merchant: null,
  comment: null
}
```

- Перевод денег на счёт с картой 4019********3284 в другом банке
```js
{
  hold: false,
  date: new Date('2021-06-27T04:44:32+03:00'),
  movements: [
    {
      id: null,
      account: { id: 'e2f532d7-13e9-4d16-bfda-614ed290679b' },
      invoice: null,
      sum: -10,
      fee: 0
    },
    {
      id: null,
      account: {
        type: null,
        instrument: 'RUB',
        company: null,
        syncIds: ['4019********3284']
      },
      invoice: null,
      sum: 10,
      fee: 0
    }
  ],
  merchant: {
    country: null,
    city: null,
    title: 'Николай Николаевич Н',
    mcc: null,
    location: null
  },
  comment: 'Возвращаю долг за спички'
}
```
