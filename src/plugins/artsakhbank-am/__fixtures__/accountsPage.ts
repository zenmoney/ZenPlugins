// Описание колонок и записи грида со страницы accounts online.artsakhbank.am.
// Номер счёта, карта, номер клиента, UID выгрузки и эквивалент заменены на
// вымышленные, формат сохранён
export const ACCOUNTS_GRID = `columns: [
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
{ recid: 1,c1: '22300100000001',c8: 'USD',c3: '544906xxxx1234MasterCard MC STANDARD',c4: '529.63',c5: '123456',c6: '529.63',c7: '0',c11: '12/08/2026',c13: '9',c10: 'Operation',c9: 'Free',c12: ''}]`
