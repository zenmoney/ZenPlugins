## Transactions examples:

#### Pay from RUB card for taxi with USD
(if e2f532d7-13e9-4d16-bfda-614ed290679b RUB account)
```js
{
  hold: true,
  date: new Date('2021-05-30T17:34:00+03:00'),
  movements: [
    {
      id: '6136fae6f',
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

#### Pay from UAH card for grocery
```js
{
  hold: false,
  date: new Date('2021-06-17T08:39:22+02:00'),
  movements: [
    {
      id: null,
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

#### Salary
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
  comment: 'May 2021 salary' // useful comment
}
```

#### Transfer between two accounts in synchronization
```js
{
  hold: false,
  date: new Date('2021-06-30T14:32:32+03:00'),
  movements: [
    {
      id: null,
      account: { id: 'e2f532d7-13e9-4d16-bfda-614ed290679b' },
      invoice: null,
      sum: -26.7,
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

#### Transfer to account with card 4019********3284
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
    title: 'Nikolai',
    mcc: null,
    location: null
  },
  comment: 'Debt repayment'
}
```
