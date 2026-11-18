import { AccountType } from '../../../../types/zenmoney'
import { TemporaryError } from '../../../../errors'
import { convertAccounts, parseDecimal, parseGridRecords } from '../../converters'
import { ACCOUNTS_GRID } from '../../__fixtures__/accountsPage'
import { CARDS_GRID } from '../../__fixtures__/cardsPage'

describe('счета', () => {
  it('читает счёт с картой из настоящего грида банка', () => {
    expect(convertAccounts(ACCOUNTS_GRID)).toEqual([{
      accountNumber: '22300100000001',
      account: {
        id: '22300100000001',
        type: AccountType.ccard,
        title: 'MasterCard MC STANDARD',
        instrument: 'USD',
        balance: 529.63,
        syncIds: ['22300100000001', '544906****1234']
      }
    }])
  })

  // Колонки безымянные, и перепутать местами баланс с эквивалентом в драмах
  // означало бы показать в приложении неверные деньги
  it('берёт баланс, а не эквивалент в драмах', () => {
    expect(convertAccounts(ACCOUNTS_GRID)[0].account.balance).toBe(529.63)
  })

  // Остаток счёта — единственное число, которое сходится с суммой операций из
  // выписки. Поставь сюда карточный, и ZenMoney спишет разницу корректировкой:
  // банк держит неснижаемый остаток и авторизации, а в выписке их нет
  it('в остатке даёт счёт, а в доступных средствах — карту', () => {
    const [{ account }] = convertAccounts(ACCOUNTS_GRID, CARDS_GRID)
    expect(account.balance).toBe(529.63)
    expect(account.available).toBe(430.19)
  })

  // Закрытая или перевыпущенная карта приходит в гриде с пустым остатком
  it('не роняет синхронизацию из-за карты без остатка', () => {
    const blankCard = CARDS_GRID.replace("c6: '430.19'", "c6: ''")
    expect(blankCard).not.toBe(CARDS_GRID)
    const [{ account }] = convertAccounts(ACCOUNTS_GRID, blankCard)
    expect(account.balance).toBe(529.63)
    expect(account.available).toBeUndefined()
  })

  it('обходится без доступных средств, когда страница карт не пришла', () => {
    const [{ account }] = convertAccounts(ACCOUNTS_GRID)
    expect(account.balance).toBe(529.63)
    expect(account.available).toBeUndefined()
  })

  it('считает счёт без карты обычным, а не карточным', () => {
    const html = "records: [{ recid: 1,c1: '22300100000002',c8: 'AMD',c3: '',c4: '100',c6: '100'}]"
    const [{ account }] = convertAccounts(html)
    expect(account.type).toBe(AccountType.checking)
    expect(account.title).toBe('22300100000002 AMD')
    expect(account.syncIds).toEqual(['22300100000002'])
  })

  it('пропускает пустую строку грида', () => {
    expect(convertAccounts("records: [{ recid: 1,c1: '',c8: ''}]")).toEqual([])
  })

  it('возвращает пусто, когда грида на странице нет', () => {
    expect(parseGridRecords('<html><body>no grid</body></html>')).toEqual([])
  })

  // Валюту счёта банк пишет теми же нестандартными кодами, что и в выписке.
  // Без нормализации счёт уехал бы в несуществующую валюту RUR, а операция
  // того же счёта — в RUB, и каждая покупка получила бы лишний курс
  it('нормализует валюту счёта так же, как в выписке', () => {
    const [{ account }] = convertAccounts("records: [{ recid: 1,c1: '22300100000003',c8: 'RUR',c4: '10'}]")
    expect(account.instrument).toBe('RUB')
  })

  // Observed w2ui grid config from online.artsakhbank.am accounts and cards pages (outer page HTML
  // wrapper is not retained in the local capture — evidence gap for full HTML document; complete w2ui
  // columns, toolbar, and records for odd row recid: 1 and even row recid: 2 with nested w2ui style
  // are preserved whole). Account/card identifiers, client IDs, and balances are sanitized.
  it('parses even grid rows with nested w2ui style in accounts and cards', () => {
    const html = `columns: [
\t{ field: 'c1', text: 'Account number', caption: 'Account number', size: '110px', sortable: true , attr: 'align=center', info: true, render: function (record) {
                return '<a href="#">' + record.c1 + '</a>';
            }},
\t{ field: 'c8', text: 'Currency', caption: 'Currency', size: '50px', sortable: true },
\t{ field: 'c3', text: 'Card', caption: 'Card', size: '100px', sortable: true },
\t{ field: 'c4', text: 'Balance', caption: 'Balance', size: '110px', sortable: true , attr: 'align=right', render: 'float:2'},
\t{ field: 'c5', text: 'Equivalent', caption: 'Equivalent', size: '110px', sortable: true , attr: 'align=right', render: 'float:2'},
\t{ field: 'c6', text: 'Available balance', caption: 'Available balance', size: '110px', sortable: true , attr: 'align=right', render: 'float:2'},
\t{ field: 'c7', text: 'Blocked', caption: 'Blocked', size: '110px', sortable: true , attr: 'align=right', render: 'float:2'},
\t{ field: 'c11', text: 'Opening date', caption: 'Opening date', size: '70px', sortable: true },
\t{ field: 'c13', text: 'Number', caption: 'Number', size: '65px', sortable: true ,  render: 'int', editable: { type: 'int', min: 0, max: 999 }},
\t{ field: 'c10', text: 'Available', caption: 'Available', size: '80px', sortable: true },
\t{ field: 'c9', text: 'State', caption: 'State', size: '120px', sortable: true },
\t{ field: 'c12', text: 'Closed', caption: 'Closed', size: '70px', sortable: true , hidden: true}
      ]
      ,toolbar: {
            items: [
                { id: 'lnkopen', type: 'button', text: 'View', img: 'icon-view' },
                { id: 'reps', type: 'menu', text: 'Reports', img: 'icon-reports',
              items: [
                  { id: 'inquiry', type: 'button', text: 'Statement on account movement', img: 'icon-statdays' },
                  { id: 'inquiry2', type: 'button', text: 'Inquiry by day', img: 'icon-statdays' },
                  { id: 'extract', type: 'button', text: 'Statement', img: 'icon-reports' },
                  { id: 'acnthist', type: 'button', text: 'Accounts history', img: 'icon-history' },
                  { id: 'history', type: 'button', text: 'History', img: 'icon-history' },
                  { id: 'curswif', type: 'button', text: 'SWIFT', img: 'icon-history' }
                ] },
              { id: 'docs', type: 'menu', text: 'Document', img: 'icon-docs',
              items: [ { id: 'trans', type: 'button', text: 'Payment order', img: 'icon-transfer' },{ id: 'trans_bdg', type: 'button', text: 'Payment order 108', img: 'icon-tobudget' },{ id: 'communal', type: 'button', text: 'Communal payments', img: 'icon-comunal' },{ id: 'depositadd', type: 'button', text: 'Deposit increasement', img: 'icon-add-dep' }     ] },
                { id: 'lnkstatem', type: 'button', text: 'Statement', img: 'icon-xls' },
                { id: 'lnkxlsx', type: 'button', text: 'Export', img: 'icon-xls' },
                { id: 'lnkpdf', type: 'button', text: 'Export', img: 'icon-pdf' },
                { id: 'lnkedit', type: 'button', text: 'Save template', img: 'icon-savey' }
            ],
            onClick: function (event) {
                var lnk = "<PARAM></PARAM>";
                var btn = event.target;

                if (btn == 'lnkopen' || btn == 'lnkstatem')
                {
                   var sel = w2ui.grid.getSelection();
                   if (sel.length > 0 && btn == 'lnkopen')
                   {
                      var record = w2ui.grid.get(sel[0].recid);
                      lnk = "<PARAM>" + record.c1 + ";02/09/2026;2;</PARAM>";
                      javascript:PopupPage("ACNTINFO",4242, lnk);
                   }
                   if (sel.length > 0 && btn == 'lnkstatem')
                   {
                      var record = w2ui.grid.get(sel[0].recid);
                      lnk = "<PARAM>2;100500;0;0;" + record.c1 + ";02/09/2026;02/09/2026;</PARAM>";
                      javascript:PopupXML("STATEM_XLS",4242, lnk);
                   }
                }
                if (btn == 'lnkxlsx') {
                   lnk = "<PARAM>2;100500;0;02/09/2026;</PARAM>";
                   javascript:PopupXML("ACNT_XLS",4242, lnk);
                }
                if (btn == 'lnkpdf') {
                   lnk = "<PARAM>2;100500;0;02/09/2026;</PARAM>";
                   javascript:PopupXML("ACNT_PDF",4242, lnk);
                }
                if (btn.substr(0, 5) == 'reps:' || btn.substr(0, 5) == 'docs:') {
                   var sel = w2ui.grid.getSelection();
                   if (sel.length > 0)
                   {
                      var record = w2ui.grid.get(sel[0].recid);
                      var opnform = btn.substr(5);
                      var trn = "flip-left";
                      var pg = opnform + ".0";
                      document.Pages.isdoc.value = 0;

                      if (btn.substr(0, 5) == 'docs:'){
                         var pg = opnform + ".1";
                         document.Pages.isdoc.value = 1;
                      }
                      parent.actpage = pg.split(".");
                      parent.mainpage(trn, '&ACNTS=' +record.c1);
                   }
                }
                if (btn == 'lnkedit') {
                   w2ui.grid.selectAll();
                   var sel = w2ui.grid.getSelection();
                   if (sel.length == 0) return;

                   w2ui.grid.save();
                   var dellist = "";
                   for (i = 0; i < sel.length; ++i) {
                      var row = w2ui.grid.get(sel[i].recid);
                      if( dellist.indexOf(row.c1 + ":") == -1 )
                          dellist = dellist + row.c1 +":"+ row.c13+"*";
                   }
                   //w2alert(dellist);  return;
                   document.Pages.DELTEMPL.value = dellist;
                   SetAct("ACSAVE");
                }
            }
        },
      records: [
{ recid: 1,c1: '22300100000001',c8: 'USD',c3: '544906xxxx1234MasterCard MC STANDARD',c4: '529.63',c5: '123456',c6: '529.63',c7: '0',c11: '12/08/2026',c13: '9',c10: 'Operation',c9: 'Free',c12: ''},
{ recid: 2,c1: '22300100000002',c8: 'EUR',c3: '544906xxxx5678MasterCard MCS VIRTUAL',c4: '10.50',c5: '4300.00',c6: '10.50',c7: '0',c11: '13/05/2026',c13: '2',c10: 'Operation',c9: 'Free',c12: '',w2ui: { "style": "background-color: #e9f8fd" }}]`
    const cards = `columns: [{ field: 'c2', caption: 'Card number'}, { field: 'c4', caption: 'Account number'}, { field: 'c6', caption: 'Balance'}]
records: [
{ recid: 1,c1: 'MasterCard MC STANDARD',c2: '5449060000001234',c21: 'CARDHOLDER NAME',c3: 'USD',c4: '22300100000001',c5: '10',c6: '430.19',c10: 'Active'},
{ recid: 2,c1: 'MasterCard MCS VIRTUAL',c2: '5449060000005678',c21: 'CARDHOLDER NAME',c3: 'EUR',c4: '22300100000002',c5: '0',c6: '8.25',c10: 'Active',w2ui: { "style": "background-color: #e9f8fd" }}]`

    expect(convertAccounts(html, cards)).toEqual([
      {
        accountNumber: '22300100000001',
        account: {
          id: '22300100000001',
          type: AccountType.ccard,
          title: 'MasterCard MC STANDARD',
          instrument: 'USD',
          balance: 529.63,
          available: 430.19,
          syncIds: ['22300100000001', '544906****1234']
        }
      },
      {
        accountNumber: '22300100000002',
        account: {
          id: '22300100000002',
          type: AccountType.ccard,
          title: 'MasterCard MCS VIRTUAL',
          instrument: 'EUR',
          balance: 10.5,
          available: 8.25,
          syncIds: ['22300100000002', '544906****5678']
        }
      }
    ])
  })
})

describe('числа', () => {
  it('читает дробные и разделители тысяч', () => {
    expect(parseDecimal('529.63')).toBe(529.63)
    expect(parseDecimal('1,234.50')).toBe(1234.5)
    expect(parseDecimal('0')).toBe(0)
  })

  // Молчаливый ноль ZenMoney примет за правду и подгонит счёт корректировкой,
  // а голое 'Assertion failed' пользователю ничего не объясняет
  it('на испорченном числе банка бросает понятную ошибку, а не утверждение', () => {
    expect(() => parseDecimal('—')).toThrow(TemporaryError)
    expect(() => parseDecimal('')).toThrow(TemporaryError)
    expect(() => parseDecimal(undefined)).toThrow(TemporaryError)
  })

  // Общий код репозитория узнаёт маску карты только по звёздочке: по ней
  // sanitizeSyncId и trimSyncId сопоставляют счета между синхронизациями
  it('приводит маску карты к звёздочкам', () => {
    const [{ account }] = convertAccounts(ACCOUNTS_GRID)
    expect(account.syncIds.some(id => id.includes('x'))).toBe(false)
    expect(account.syncIds).toContain('544906****1234')
  })
})
