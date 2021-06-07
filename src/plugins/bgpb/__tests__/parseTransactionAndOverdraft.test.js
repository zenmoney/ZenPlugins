import { parseTransactionsAndOverdraft } from '../api'

describe('parseTransactionAndOverdraft', () => {
  it.each([
    [
      [
        '<?xml version="1.0" encoding="windows-1251" ?>\n<BS_Response>\n <ServerTime>20210521111344</ServerTime>\n <Session Expired="895"/>\n<MailAttachment>\n<Attachment>\n<Body Mimetype="text/html" xml:space="preserve"><![CDATA[<html xmlns="http://www.w3.org/1999/xhtml" lang="ru" xml:lang="ru">\n<head>\n<META content="text/html; charset=windows-1251" http-equiv="Content-Type"/>\n<title>Выписка по счету BY98OLMP30140900000302197862</title>\n<style type="text/css">\n\t\tbody{\n\t\tpadding:1;\n\t\tmargin:0;\n\t\tfont-family:Arial,sans-serif;\n\t\tfont-size: 10pt;\n\t\twidth:195mm;\n\t\t}\n\t\ttable{\n\t\t font-family:Arial,sans-serif;\n\t\tfont-size: 8pt;\n\t\t}\n\t\t.section_1{\n\t\t width: 18.77cm;\n\t\t margin: 0;\n\t\t padding: 0;\n\t\t font-family:Arial,sans-serif;\n\t\tfont-size: 10pt;\n\t\tline-height: 10pt;\n\t\t}\n\t\t.section_1 tr{\n\t\t margin: 0;\n\t\t padding: 0;\n\t\t}\n\t\t.section_1 td{\n\t\t margin: 0;\n\t\t padding: 0;\n\t\t}\n\t\t.section_1 .s1{\n\t\t text-align: left;\n\t\t width: 11.35cm;\n\t\t}\n\t\t.section_1 .s2{\n\t\twidth: 7.26cm;\n\t\t text-align: right;\n\t\t font-weight: bold;\n\t\t}\n\n\t\t.address {\n\t\t margin-bottom:2.75cm;\n\t margin-top:2.75cm;\n\t\t}\n\n\t.section_2{\n\t width: 19.39cm;\n\t line-height: 8pt;\n\t\t\tborder-collapse:collapse;\n\t\t\tborder: 1px solid #777;\n\t}\n\t.section_2 th{\n\t text-align: left;\n\t border-collapse:collapse;\n\t\t\tborder:1px solid #777;\n\t}\n\t.section_2 .sum{\n\t width: 3.47cm;\n\t text-align: right;\n\t}\n\n\t.col1{\n\t width: 8.52cm;\n\t}\n\t.col2{\n\t width: 4.26cm;\n\t}\n\t.col3{\n\t width: 2.5cm;\n\t text-align: right;\n\t}\n\t.col4{\n\t width: 3.5cm;\n\t text-align: right;\n\t}\n\t.col5{\n\t width: 1.59cm;\n\t text-align: right;\n\t}\n\n\t.col2_1{\n\t width: 4.78cm;\n\t}\n\t.col2_2{\n\t width: 4.54cm;\n\t text-align: left;\n\t}\n\t.col2_3{\n\t width: 2cm;\n\t text-align: right;\n\t}\n\t.col2_4{\n\t width: 2cm;\n\t text-align: right;\n\t}\n\t.col2_5{\n\t width: 2cm;\n\t text-align: right;\n\t}\n\t.col2_6{\n\t width: 2cm;\n\t text-align: right;\n\t}\n\t.col2_7{\n\t width: 2cm;\n\t text-align: right;\n\t}\n\t.col2_8{\n\t width: 1.2cm;\n\t text-align: right;\n\t}\n\n\t.solid {\n\t border:1px solid #777;\n\t}\n\t.right{\n\t text-align: right;\n\t}\n\t\t.section_3 {\n\t\t\twidth:19.39cm;\n\t\t\tborder-collapse:collapse;\n\t\t}\n\t\t.section_3 th{\n\t\t\tborder-collapse:collapse;\n\t\t\tborder:1px solid #777;\n\t\t}\n\t\t.section_3 td{\n\t\t\tborder-collapse:collapse;\n\t\t\tborder:1px solid #777;\n\t\t}\n\n\t\t.col3_1{\n\t width: 1.93cm;\n\t}\n\t.col3_2{\n\t width: 1.93cm;\n\t}\n\t.col3_3{\n\t width: 2.86cm;\n\t}\n\t.col3_4{\n\t width: 2.22cm;\n\t}\n\t.col3_5{\n\t width: 1.9cm;\n\t}\n\t.col3_6{\n\t width: 1.59cm;\n\t}\n\t.col3_7{\n\t width: 1.88cm;\n\t}\n\t.col3_8{\n\t width: 5.08cm;\n\t}\n\t.col3_9{\n\t width: 5.08cm;\n\t}\n .col3_10{\n\t width: 5.08cm;\n\t}.col3_11{\n\t width: 5.08cm;\n\t}\n\n\t.section_4 {\n\t width:19.39cm;\n\t\t\tborder-collapse:collapse;\n\t\t\tborder:1px solid #777;\n\t\t}\n\n\t\t.section_4 th{\n\t vertical-align: top;\n\t border-collapse:collapse;\n\t\t\tborder:1px solid #777;\n\t}\n\n\t\t.col4_1{\n\t width: 3.8cm\n\t}\n\t.col4_2{\n\t width: 3.8cm;\n\t}\n\t.col4_3{\n\t width: 3.8cm;\n\t}\n\t.col4_4{\n\t width: 3.8cm;\n\t}\n\t.col4_5{\n\t width: 3.8cm;\n\t}\n\n\t.section_5 {\n\t width:19.39cm;\n\t border-collapse:collapse;\n\t border:1px solid #777;\n\t\t\t\t }\n\t.section_5 th{\n\t vertical-align: top;\n\t border-collapse:collapse;\n\t border:1px solid #777;\n\t}\n\n\t.col5_1{\n\t width: 4cm;\n\t}\n\t.col5_2{\n\t width: 4cm;\n\t}\n\t.col5_3{\n\t width: 4cm;\n\t}\n\t.col5_4{\n\t width: 4cm;\n\t}\n\t\n\t.section_6 {\n\t width:19.39cm;\n\t border-collapse:collapse;\n\t border:1px solid #777;\n\t\t\t\t }\n\t.section_6 th{\n\t vertical-align: top;\n\t border-collapse:collapse;\n\t border:1px solid #777;\n\t}\n\n\t.col6_1{\n\t width: 1.93cm;\n\t}\n\t.col6_2{\n\t width: 1.93cm;\n\t}\n\t.col6_3{\n\t width: 2.86cm;\n\t}\n\t.col6_4{\n\t width: 2.22cm;\n\t}\n\t.col6_5{\n\t width: 1.9cm;\n\t}\n\t.col6_6{\n\t width: 1.59cm;\n\t}\n\t.col6_7{\n\t width: 1.88cm;\n\t}\n\t.col6_8{\n\t width: 5.08cm;\n\t}\n\t\n\t.section_7 {\n\t width:19.39cm;\n\t border-collapse:collapse;\n\t border:1px solid #777;\n\t\t\t\t }\n\t.section_7 th{\n\t vertical-align: top;\n\t border-collapse:collapse;\n\t border:1px solid #777;\n\t}\n\n\t.col7_1{\n\t width: 1.93cm;\n\t}\n\t.col7_2{\n\t width: 1.93cm;\n\t}\n\t.col7_3{\n\t width: 2.86cm;\n\t}\n\t.col7_4{\n\t width: 2.22cm;\n\t}\n\t.col7_5{\n\t width: 1.9cm;\n\t}\n\t.col7_6{\n\t width: 1.59cm;\n\t}\n\t.col7_7{\n\t width: 1.88cm;\n\t}\n\t.col7_8{\n\t width: 5.08cm;\n\t}\n </style>\n</head>\n<body>БЕЛГАЗПРОМБАНК ОАО<br/>г. Минск, ул. Притыцкого 60/2<br/>\n<br/>\n\t\tВыполнено 2021.05.21/11:13:42/<br/>\n<br/>\n<p style="margin-right:auto; width:20cm; text-align:center;">\n<b>Выписка по счету BY98OLMP30140900000302197862</b>\n</p>\n<p style="margin-right:auto; width:20cm; text-align:center;">\n<b>За период: с 07.05.2021 по 21.05.2021</b>\n</p>\n<table class="section_1">\n<tr>\n<td class="s1">Вариант продукта:</td>\n<td class="s2">Расчетная карточка Visa CashAlot</td>\n</tr>\n<tr>\n<td class="s1">Номер контракта:</td>\n<td class="s2">II/740971</td>\n</tr>\n<tr>\n<td class="s1">Номер карточного счета:</td>\n<td class="s2">BY98OLMP30140900000302197862</td>\n</tr>\n<tr>\n<td class="s1">Валюта карточного счета:</td>\n<td class="s2">BYN</td>\n</tr>\n<tr>\n<td class="s1">Лимит овердрафта:</td>\n<td class="s2">0,00</td>\n</tr>\n<tr>\n<td class="s1">Размер неснижаемого остатка:</td>\n<td class="s2">0,00</td>\n</tr>\n<tr>\n<td class="s1">Владелец карточного счета:</td>\n<td class="s2">ЛАЗЮК ЕВГЕНИЙ СЕРГЕЕВИЧ</td>\n</tr>\n<tr>\n<td class="s1">Адрес владельца:</td>\n<td class="s2">220067, г. МИНСК, тр. ИГУМЕНСКИЙ, д.14, кв.206</td>\n</tr>\n</table>\n<br/>\n<br/>\n<div style="font-weight: bold;font-size: 8pt;text-align:left;">ИНФОРМАЦИЯ ПО КАРТОЧНОМУ СЧЕТУ ЗА ПЕРИОД</div>\n<br/>\n<table style="border:none;" class="section_2">\n<tr>\n<td>Остаток/задолженность на 07.05.2021</td>\n<td class="sum">175,01 BYN</td>\n</tr>\n<tr>\n<td>Остаток/задолженность на 21.05.2021</td>\n<td class="sum">716,58 BYN</td>\n</tr>\n</table>\n<br/>\n<table class="section_2">\n<tr>\n<th class="col1">1. ОПЕРАЦИИ</th>\n<th class="col2">Период</th>\n<th class="col3">Зачислено</th>\n<th class="col4">Списано</th>\n<th class="col5">Валюта</th>\n</tr>\n<tr>\n<td class="col1">Операции без карт</td>\n<td class="col2">07.05.2021 - 21.05.2021</td>\n<td class="col3">0,00</td>\n<td class="col4">0,00</td>\n<td class="col5">BYN</td>\n</tr>\n<tr>\n<td class="col1">Операции с картами</td>\n<td class="col2">07.05.2021 - 21.05.2021</td>\n<td class="col3">770,00</td>\n<td class="col4">229,34</td>\n<td class="col5">BYN</td>\n</tr>\n<tr style="font-weight: bold;">\n<td class="col1">Итого по операциям</td>\n<td class="col2">07.05.2021 - 21.05.2021</td>\n<td class="col3">770,00</td>\n<td class="col4">229,34</td>\n<td class="col5">BYN</td>\n</tr>\n</table>\n<br/>\n<table class="section_2">\n<tr>\n<th class="col2_1">2. ВОЗНАГРАЖДЕНИЯ И ПЕНИ БАНКУ</th>\n<th class="col2_2">Период</th>\n<th class="col2_3">Задолженность на начало периода</th>\n<th class="col2_4">Рассчитано</th>\n<th class="col2_5">Уплачено</th>\n<th class="col2_6">Задолженность на конец периода</th>\n<th class="col2_7">В том числе просроченная задолженность</th>\n<th class="col2_8">Валюта</th>\n</tr>\n<tr>\n<td class="col2_1">Проценты за овердрафт</td>\n<td class="col2_2">07.05.2021 - 21.05.2021</td>\n<td class="col2_3">0,00</td>\n<td class="col2_4">0,00</td>\n<td class="col2_5">0,00</td>\n<td class="col2_6">0,00</td>\n<td class="col2_7">0,00</td>\n<td class="col2_8">BYN</td>\n</tr>\n<tr>\n<td class="col2_1">Комиссии за обслуживание счета</td>\n<td class="col2_2">07.05.2021 - 21.05.2021</td>\n<td class="col2_3">0,00</td>\n<td class="col2_4">0,00</td>\n<td class="col2_5">0,00</td>\n<td class="col2_6">0,00</td>\n<td class="col2_7">0,00</td>\n<td class="col2_8">BYN</td>\n</tr>\n<tr>\n<td class="col2_1">Комиссии по операциям</td>\n<td class="col2_2">07.05.2021 - 21.05.2021</td>\n<td class="col2_3">0,00</td>\n<td class="col2_4">0,00</td>\n<td class="col2_5">0,00</td>\n<td class="col2_6">0,00</td>\n<td class="col2_7">0,00</td>\n<td class="col2_8">BYN</td>\n</tr>\n<tr>\n<td class="col2_1">Пеня за просрочку платежей</td>\n<td class="col2_2">07.05.2021 - 21.05.2021</td>\n<td class="col2_3">0,00</td>\n<td class="col2_4">0,00</td>\n<td class="col2_5">0,00</td>\n<td class="col2_6">0,00</td>\n<td class="col2_7">0,00</td>\n<td class="col2_8">BYN</td>\n</tr>\n<tr style="font-weight: bold;">\n<td class="col2_1">Итого по вознаграждениям банку</td>\n<td class="col2_2">07.05.2021 - 21.05.2021</td>\n<td class="col2_3">0,00</td>\n<td class="col2_4">0,00</td>\n<td class="col2_5">0,00</td>\n<td class="col2_6">0,00</td>\n<td class="col2_7">0,00</td>\n<td class="col2_8">BYN</td>\n</tr>\n<tr>\n<td class="col2_1"/>\n<td class="col2_3"/>\n<td class="col2_4"/>\n<td class="col2_5"/>\n<td class="col2_6"/>\n<td class="col2_7"/>\n<td class="col2_8"/>\n</tr>\n<tr style="font-weight: bold;">\n<td class="col2_1">Задолженность по вознаграждениям банку на 21.05.2021</td>\n<td style="text-align: right;">x</td>\n<td class="col2_3">x</td>\n<td class="col2_4">x</td>\n<td class="col2_5">x</td>\n<td class="col2_6">x</td>\n<td class="col2_7">0,00</td>\n<td class="col2_8">BYN</td>\n</tr>\n<tr style="font-weight: bold;">\n<td class="col2_1">в том числе просроченная задолженность</td>\n<td style="text-align: right;">x</td>\n<td class="col2_3">x</td>\n<td class="col2_4">x</td>\n<td class="col2_5">x</td>\n<td class="col2_6">x</td>\n<td class="col2_7">0,00</td>\n<td class="col2_8">BYN</td>\n</tr>\n</table>\n<br/>\n<table class="section_2">\n<tr>\n<th class="col1">3. ВОЗНАГРАЖДЕНИЯ КЛИЕНТУ</th>\n<th class="col2">Период</th>\n<th class="col3">Рассчитано</th>\n<th class="col4">Уплачено</th>\n<th class="col5">Валюта</th>\n</tr>\n<tr>\n<td class="col1">Проценты за положительный остаток по карточному счету</td>\n<td class="col2">07.05.2021 - 21.05.2021</td>\n<td class="col3">0,00</td>\n<td class="col4">0,00</td>\n<td class="col5">BYN</td>\n</tr>\n<tr>\n<td class="col1">Процентное вознаграждение по операциям</td>\n<td class="col2">07.05.2021 - 21.05.2021</td>\n<td class="col3">0,91</td>\n<td class="col4">0,91</td>\n<td class="col5">BYN</td>\n</tr>\n<tr style="font-weight: bold;">\n<td class="col1">Итого по вознаграждениям клиенту</td>\n<td class="col2">07.05.2021 - 21.05.2021</td>\n<td class="col3">0,91</td>\n<td class="col4">0,91</td>\n<td class="col5">BYN</td>\n</tr>\n</table>\n<br/>\n<div style="font-weight: bold;font-size: 8pt;text-align:left;">ДЕТАЛЬНАЯ ИНФОРМАЦИЯ ЗА ПЕРИОД</div>\n<table class="section_3">\n<tr>\n<th class="col3_1">Дата операции</th>\n<th class="col3_2">Дата отражения</th>\n<th class="col3_3">Операция</th>\n<th class="col3_4">Тип операции</th>\n<th class="col3_5">Сумма в валюте операции</th>\n<th class="col3_6">Валюта операции</th>\n<th class="col3_7">Сумма в валюте счета</th>\n<th>Валюта счета</th>\n<th class="col3_8">Место операции (страна, наименование точки, город)</th>\n<th class="col3_9">Код авторизации</th>\n<th class="col3_10">МСС</th>\n<th class="col3_11">Вознаграждение клиенту по операции в валюте счета</th>\n</tr>\n<tr>\n<td style="border: none;width:17cm;" colspan="8">ОПЕРАЦИИ С КАРТАМИ</td>\n</tr>\n<tr>\n<td style="border: none;width:17cm;" colspan="8"/>\n</tr>\n<tr>\n<td class="right">05.05.2021 10:54</td>\n<td class="right">07.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">0,80</td>\n<td class="right">BYN</td>\n<td class="right">0,80</td>\n<td class="right">BYN</td>\n<td>BY obshchestvennyy tualet, Minsk</td>\n<td>334886</td>\n<td>7299</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">09.05.2021 09:52</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">24,02</td>\n<td class="right">BYN</td>\n<td class="right">24,02</td>\n<td class="right">BYN</td>\n<td>BY GIPPO TRADE CENTRE, MINSK</td>\n<td>831001</td>\n<td>5411</td>\n<td class="right">0,48</td>\n</tr>\n<tr>\n<td class="right">10.05.2021 11:24</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">5,50</td>\n<td class="right">BYN</td>\n<td class="right">5,50</td>\n<td class="right">BYN</td>\n<td>BY PARIK. "GOROD KRASOTY" BA, MINSK</td>\n<td>489373</td>\n<td>7230</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">07.05.2021 09:43</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">13,23</td>\n<td class="right">BYN</td>\n<td class="right">13,23</td>\n<td class="right">BYN</td>\n<td>BY GIPPO TRADE CENTRE, MINSK</td>\n<td>920781</td>\n<td>5411</td>\n<td class="right">0,26</td>\n</tr>\n<tr>\n<td class="right">06.05.2021 13:36</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">0,96</td>\n<td class="right">BYN</td>\n<td class="right">0,96</td>\n<td class="right">BYN</td>\n<td>BY SHOP N1 BAPB, MINSK</td>\n<td>313128</td>\n<td>5411</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">06.05.2021 09:13</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">210,99</td>\n<td class="right">RUB</td>\n<td class="right">7,29</td>\n<td class="right">BYN</td>\n<td>RU PYATEROCHKA 13934, MOSCOW</td>\n<td>035480</td>\n<td>5411</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">10.05.2021 11:36</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">16,54</td>\n<td class="right">BYN</td>\n<td class="right">16,54</td>\n<td class="right">BYN</td>\n<td>BY SHOP "MILA-80", MINSK</td>\n<td>496758</td>\n<td>5999</td>\n<td class="right">0,17</td>\n</tr>\n<tr>\n<td class="right">11.05.2021 09:07</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">11,00</td>\n<td class="right">BYN</td>\n<td class="right">11,00</td>\n<td class="right">BYN</td>\n<td>BY AUTOMATIC PAYMENT, INTERNET</td>\n<td>020105</td>\n<td>6012</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">11.05.2021 09:07</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">15,54</td>\n<td class="right">BYN</td>\n<td class="right">15,54</td>\n<td class="right">BYN</td>\n<td>BY AUTOMATIC PAYMENT, INTERNET</td>\n<td>020097</td>\n<td>6012</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">10.05.2021 13:39</td>\n<td class="right">12.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">3,50</td>\n<td class="right">BYN</td>\n<td class="right">3,50</td>\n<td class="right">BYN</td>\n<td>BY ROZNIHNAYA TORGOVLA, MINSK</td>\n<td>580753</td>\n<td>5411</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">17.05.2021 15:37</td>\n<td class="right">18.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">5,56</td>\n<td class="right">BYN</td>\n<td class="right">5,56</td>\n<td class="right">BYN</td>\n<td>BY MOBILE APP BGPB, MINSK</td>\n<td>595526</td>\n<td>6012</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">17.05.2021 17:31</td>\n<td class="right">18.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">30,00</td>\n<td class="right">BYN</td>\n<td class="right">30,00</td>\n<td class="right">BYN</td>\n<td>BY MOBILE APP BGPB, MINSK</td>\n<td>700957</td>\n<td>6012</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">18.05.2021 14:49</td>\n<td class="right">19.05.2021</td>\n<td class="col3_3">Перевод с карты на карту (списание, Интернет-банк)</td>\n<td>СПИСАНИЕ</td>\n<td class="right">90,00</td>\n<td class="right">BYN</td>\n<td class="right">90,00</td>\n<td class="right">BYN</td>\n<td>BY PEREVOD NA 529922******4968, INTERNET</td>\n<td>474303</td>\n<td>4829</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">17.05.2021 09:39</td>\n<td class="right">19.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">3,70</td>\n<td class="right">BYN</td>\n<td class="right">3,70</td>\n<td class="right">BYN</td>\n<td>BY KIOSK N700096 BAPB, MINSK</td>\n<td>254075</td>\n<td>5993</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">18.05.2021 14:48</td>\n<td class="right">19.05.2021</td>\n<td class="col3_3">Взнос на счет карты</td>\n<td>ЗАЧИСЛЕНИЕ</td>\n<td class="right">500,00</td>\n<td class="right">BYN</td>\n<td class="right">500,00</td>\n<td class="right">BYN</td>\n<td>BY POPOLNENIE KARTY ERIP2, G. MINSK</td>\n<td>473372</td>\n<td/>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">17.05.2021 15:19</td>\n<td class="right">20.05.2021</td>\n<td class="col3_3">Безналичная оплата</td>\n<td>СПИСАНИЕ</td>\n<td class="right">1,70</td>\n<td class="right">BYN</td>\n<td class="right">1,70</td>\n<td class="right">BYN</td>\n<td>BY KAFE "CAFE HOTFIX", MINSK</td>\n<td>578881</td>\n<td>5812</td>\n<td class="right"/>\n</tr>\n<tr>\n<td class="right">19.05.2021 17:42</td>\n<td class="right">20.05.2021</td>\n<td class="col3_3">Взнос на счет карты</td>\n<td>ЗАЧИСЛЕНИЕ</td>\n<td class="right">270,00</td>\n<td class="right">BYN</td>\n<td class="right">270,00</td>\n<td class="right">BYN</td>\n<td>BY POPOLNENIE KARTY ERIP, G. MINSK</td>\n<td>564214</td>\n<td/>\n<td class="right"/>\n</tr>\n<tr>\n<td style="border: none;width:17cm;" colspan="8">Итого по карте N 4641 XXXX XXXX 8723 ЛАЗЮК ЕВГЕНИЙ СЕРГЕЕВИЧ</td>\n</tr>\n<tr>\n<td style="border: none;">зачислено</td>\n<td style="border: none;" class="right">770,00</td>\n<td style="border: none;" class="left">BYN</td>\n<td colspan="6" style="border: none;"/>\n</tr>\n<tr>\n<td style="border: none;">списано</td>\n<td style="border: none;" class="right">229,34</td>\n<td style="border: none;" class="left">BYN</td>\n<td colspan="6" style="border: none;"/>\n</tr>\n</table>\n<br/>\n<br/>\n<div style="text-align:left;width:19cm;font-size:7pt;"/>\n<div style="text-align:left;width:19cm;font-size:9pt;">По любым вопросам, касающимся операций по карточному счету, просим обращаться по тел.(017) 229-16-21 либо по адресу: 220121 г Минск ул. Притыцкого 60/2 </div>\n<div style="text-align:left;width:19cm;font-size:7pt;"/>\n</body>\n</html>\n]]>\n</Body>\n</Attachment>\n</MailAttachment>\n</BS_Response>'
      ],
      {
        overdraft: '0,00',
        transactions: [
          {
            amount: '0,80',
            amountReal: '0,80',
            authCode: '334886',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '05.05.2021 10:54',
            description: 'Безналичная оплата',
            mcc: '7299',
            place: 'BY obshchestvennyy tualet, Minsk',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '24,02',
            amountReal: '24,02',
            authCode: '831001',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '09.05.2021 09:52',
            description: 'Безналичная оплата',
            mcc: '5411',
            place: 'BY GIPPO TRADE CENTRE, MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '5,50',
            amountReal: '5,50',
            authCode: '489373',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '10.05.2021 11:24',
            description: 'Безналичная оплата',
            mcc: '7230',
            place: 'BY PARIK. "GOROD KRASOTY" BA, MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '13,23',
            amountReal: '13,23',
            authCode: '920781',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '07.05.2021 09:43',
            description: 'Безналичная оплата',
            mcc: '5411',
            place: 'BY GIPPO TRADE CENTRE, MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '0,96',
            amountReal: '0,96',
            authCode: '313128',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '06.05.2021 13:36',
            description: 'Безналичная оплата',
            mcc: '5411',
            place: 'BY SHOP N1 BAPB, MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '7,29',
            amountReal: '210,99',
            authCode: '035480',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'RUB',
            date: '06.05.2021 09:13',
            description: 'Безналичная оплата',
            mcc: '5411',
            place: 'RU PYATEROCHKA 13934, MOSCOW',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '16,54',
            amountReal: '16,54',
            authCode: '496758',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '10.05.2021 11:36',
            description: 'Безналичная оплата',
            mcc: '5999',
            place: 'BY SHOP "MILA-80", MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '11,00',
            amountReal: '11,00',
            authCode: '020105',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '11.05.2021 09:07',
            description: 'Безналичная оплата',
            mcc: '6012',
            place: 'BY AUTOMATIC PAYMENT, INTERNET',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '15,54',
            amountReal: '15,54',
            authCode: '020097',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '11.05.2021 09:07',
            description: 'Безналичная оплата',
            mcc: '6012',
            place: 'BY AUTOMATIC PAYMENT, INTERNET',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '3,50',
            amountReal: '3,50',
            authCode: '580753',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '10.05.2021 13:39',
            description: 'Безналичная оплата',
            mcc: '5411',
            place: 'BY ROZNIHNAYA TORGOVLA, MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '5,56',
            amountReal: '5,56',
            authCode: '595526',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '17.05.2021 15:37',
            description: 'Безналичная оплата',
            mcc: '6012',
            place: 'BY MOBILE APP BGPB, MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '30,00',
            amountReal: '30,00',
            authCode: '700957',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '17.05.2021 17:31',
            description: 'Безналичная оплата',
            mcc: '6012',
            place: 'BY MOBILE APP BGPB, MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '90,00',
            amountReal: '90,00',
            authCode: '474303',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '18.05.2021 14:49',
            description: 'Перевод с карты на карту (списание, Интернет-банк)',
            mcc: '4829',
            place: 'BY PEREVOD NA 529922******4968, INTERNET',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '3,70',
            amountReal: '3,70',
            authCode: '254075',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '17.05.2021 09:39',
            description: 'Безналичная оплата',
            mcc: '5993',
            place: 'BY KIOSK N700096 BAPB, MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '500,00',
            amountReal: '500,00',
            authCode: '473372',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '18.05.2021 14:48',
            description: 'Взнос на счет карты',
            mcc: null,
            place: 'BY POPOLNENIE KARTY ERIP2, G. MINSK',
            type: 'ЗАЧИСЛЕНИЕ'
          },
          {
            amount: '1,70',
            amountReal: '1,70',
            authCode: '578881',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '17.05.2021 15:19',
            description: 'Безналичная оплата',
            mcc: '5812',
            place: 'BY KAFE "CAFE HOTFIX", MINSK',
            type: 'СПИСАНИЕ'
          },
          {
            amount: '270,00',
            amountReal: '270,00',
            authCode: '564214',
            cardNum: '8723',
            currency: 'BYN',
            currencyReal: 'BYN',
            date: '19.05.2021 17:42',
            description: 'Взнос на счет карты',
            mcc: null,
            place: 'BY POPOLNENIE KARTY ERIP, G. MINSK',
            type: 'ЗАЧИСЛЕНИЕ'
          }
        ]
      }
    ],
    [
      [
        '<?xml version="1.0" encoding="windows-1251" ?>\n<BS_Response>\n <ServerTime>20210521111345</ServerTime>\n <Session Expired="895"/>\n<MailAttachment>\n<Attachment>\n<Body Mimetype="text/html" xml:space="preserve"><![CDATA[<html xmlns="http://www.w3.org/1999/xhtml" lang="ru" xml:lang="ru">\n<head>\n<META content="text/html; charset=windows-1251" http-equiv="Content-Type"/>\n<title>Выписка о движении средств по карте рассрочки</title>\n<style type="text/css">\n body{\n padding:1;\n margin:0;\n font-family:\'Times New Roman\',sans-serif;\n font-size: 10pt;\n\t\t line-height: 10pt;\n width:255mm;\n }\n table{\n font-family:\'Times New Roman\',sans-serif;\n font-size: 10pt;\n }\n .section_1{\n width: 20.2cm;\n margin: 0;\n padding: 0;\n font-family: \'Times New Roman\',sans-serif;\n font-size: 10pt;\n line-height: 10pt;\n border:1px solid #777;\n border-collapse: collapse;\n }\n .section_1 .col1_0{\n width: 12.2cm;\n text-align: center;\n border:1px solid #777;\n }\n .section_1 .s1{\n text-align: left;\n width: 9.8cm;\n border:1px solid #777;\n }\n .section_1 .s0{\n width: 4cm;\n text-align: right;\n border:1px solid #777;\n }\n .section_1 .s2{\n width: 4.4cm;\n text-align: right;\n border:1px solid #777;\n }\n .section_1 .s3{\n width: 4cm;\n text-align: left;\n border:1px solid #777;\n }\n .section_1 .s15{\n text-align: center;\n width: 7.8cm;\n border:1px solid #777;\n }\n .section_1 .s25{\n width: 4.4cm;\n text-align: center;\n border:1px solid #777;\n }\n .section_1 .s25_1{\n width: 4.4cm;\n text-align: right;\n border:1px solid #777;\n }\n\n .section_2{\n width: 16.6cm;\n line-height: 10pt;\n border-collapse:collapse;\n border: 1px solid #777;\n }\n .section_2 th{\n text-align: center;\n border-collapse:collapse;\n border:1px solid #777;\n }\n .section_2 .col2_0{\n width: 16.6cm;\n text-align: center;\n border:1px solid #777;\n }\n .col1{\n width: 7.8cm;\n text-align: left;\n border: 1px solid #777;\n }\n .col2{\n width: 4.4cm;\n text-align: right;\n border: 1px solid #777;\n }\n .col3{\n width: 4.4cm;\n text-align: right;\n border: 1px solid #777;\n }\n\n .section_3 {\n width: 24.6cm;\n border-collapse:collapse;\n }\n .section_3 th{\n border-collapse:collapse;\n text-align: center;\n border:1px solid #777;\n }\n .section_3 td{\n border-collapse:collapse;\n border:1px solid #777;\n }\n .section_3 .col3_0{\n width: 34.4cm;\n text-align: center;\n border:1px solid #777;\n }\n .col3_1{\n width: 4.2cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_2{\n width: 3.6cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_3{\n width: 4.4cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_3left{\n width: 4.4cm;\n border: 1px solid #777;\n text-align: left;\n }\n .col3_4{\n width: 4.4cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_5{\n width: 5cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_5left{\n width: 5cm;\n border: 1px solid #777;\n text-align: left;\n }\n .col3_11{\n width: 3cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_6{\n width: 3cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_11right{\n width: 3cm;\n border: 1px solid #777;\n text-align: right;\n }\n .col3_6right{\n width: 3cm;\n border: 1px solid #777;\n text-align: right;\n }\n .col3_7{\n width: 2.4cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_9{\n width: 2.4cm;\n border: 1px solid #777;\n text-align: center;\n }\n .col3_10{\n width: 2.4cm;\n border: 1px solid #777;\n text-align: center;\n }\n\t\t\t\t.col3_13right{\n width: 3cm;\n border: 1px solid #777;\n text-align: right;\n }\n\t\t\n .section_6 {\n width:19.39cm;\n border-collapse:collapse;\n border:1px solid #777;\n }\n .section_6 th{\n vertical-align: top;\n border-collapse:collapse;\n border:1px solid #777;\n }\n\n .col6_1{\n \t width: 1.93cm;\n }\n .col6_2{\n \t width: 1.93cm;\n }\n \t.col6_3{\n \t width: 2.86cm;\n }\n \t.col6_4{\n \t width: 2.22cm;\n }\n \t.col6_5{\n \t width: 1.9cm;\n }\n \t.col6_6{\n \t width: 1.59cm;\n }\n \t.col6_7{\n \t width: 1.88cm;\n }\n \t.col6_8{\n \t width: 5.08cm;\n }\n\t\t\n .section_7 {\n width:19.39cm;\n border-collapse:collapse;\n border:1px solid #777;\n }\n .section_7 th{\n vertical-align: top;\n border-collapse:collapse;\n border:1px solid #777;\n }\n\n .col7_1{\n \t width: 1.93cm;\n }\n .col7_2{\n \t width: 1.93cm;\n }\n \t.col7_3{\n \t width: 2.86cm;\n }\n \t.col7_4{\n \t width: 2.22cm;\n }\n \t.col7_5{\n \t width: 1.9cm;\n }\n \t.col7_6{\n \t width: 1.59cm;\n }\n \t.col7_7{\n \t width: 1.88cm;\n }\n \t.col7_8{\n \t width: 5.08cm;\n }\n </style>\n</head>\n<body>БЕЛГАЗПРОМБАНК ОАО<br/>\n Выполнено 2021.05.21/11:13:44/<br/>\n<br/>\n<p style="margin-right:auto; width:23.8cm; text-align:center; font-size: 14pt; line-height: 14pt;">\n<b>Выписка о движении средств по карте рассрочки<br/> за период: с 07.05.2021 по 21.05.2021</b>\n</p>\n<table class="section_1">\n<tr>\n<th bgcolor="#B8CCE4" colspan="2" class="col1_0">ОБЩАЯ ИНФОРМАЦИЯ</th>\n</tr>\n<tr>\n<td class="s1">Владелец счета:</td>\n<td class="s2">ЛАЗЮК ЕВГЕНИЙ СЕРГЕЕВИЧ</td>\n</tr>\n<tr>\n<td class="s1">Номер контракта:</td>\n<td class="s2">II/487996</td>\n</tr>\n<tr>\n<td class="s1">Срок действия кредитной линии:</td>\n<td class="s2">31.07.2025</td>\n</tr>\n<tr>\n<td class="s1">Номер счета:</td>\n<td class="s2">BY45OLMP30140900000401583759</td>\n</tr>\n<tr>\n<td class="s1">Валюта счета:</td>\n<td class="s2">BYN</td>\n</tr>\n<tr>\n<td class="s1">Лимит овердрафта:</td>\n<td class="s2">1 000,00</td>\n</tr>\n<tr style="font-size:12pt">\n<td class="s1">\n<b>Минимальный платеж в текущем месяце:</b>\n</td>\n<td class="s2">\n<b>87,12</b>\n</td>\n</tr>\n</table>\n<br/>\n<table class="section_2">\n<tr>\n<th bgcolor="#B8CCE4" colspan="3" class="col2_0"> ИНФОРМАЦИЯ ПО СЧЕТУ ЗА ПЕРИОД</th>\n</tr>\n<tr>\n<th class="col1"/>\n<th class="col2">на 07.05.2021, BYN</th>\n<th class="col3">на 21.05.2021, BYN</th>\n</tr>\n<tr>\n<td class="col1">Остаток / задолженность по счету, в т.ч.:</td>\n<td class="col2">-162,75</td>\n<td class="col3">-212,33</td>\n</tr>\n<tr>\n<td class="col1">По овердрафту, в т.ч</td>\n<td class="col2">-162,75</td>\n<td class="col3">-212,33</td>\n</tr>\n<tr>\n<td class="col1">текущая задолженность</td>\n<td class="col2">-162,75</td>\n<td class="col3">-212,33</td>\n</tr>\n<tr>\n<td class="col1">просроченная задолженность</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">безнадежная задолженность срочная</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">безнадежная задолженность просроченная</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">технический овердрафт</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">Проценты за пользование кредитом, в т.ч.:</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">начисленные проценты</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">просроченные проценты</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">Комиссия</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">Пеня за просроченную задолженность по овердрафту</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n<tr>\n<td class="col1">Пеня за просроченную задолженность по процентам</td>\n<td class="col2">0,00</td>\n<td class="col3">0,00</td>\n</tr>\n</table>\n<br/>\n<table class="section_1">\n<tr>\n<td class="s1">Зачислено за период (+)</td>\n<td class="s0">07.05.2021 - 21.05.2021</td>\n<td class="s2">90,00</td>\n<td class="s0">BYN</td>\n</tr>\n<tr>\n<td class="s1">Сумма расходных операций за период (-)</td>\n<td class="s0">07.05.2021 - 21.05.2021</td>\n<td class="s2">-139,58</td>\n<td class="s0">BYN</td>\n</tr>\n<tr>\n<td class="s1">Начислено процентов за пользование кредитом (-)</td>\n<td class="s0">07.05.2021 - 21.05.2021</td>\n<td class="s2">0,00</td>\n<td class="s0">BYN</td>\n</tr>\n<tr>\n<td class="s1">Начислено комиссии (-)</td>\n<td class="s0">07.05.2021 - 21.05.2021</td>\n<td class="s2">0,00</td>\n<td class="s0">BYN</td>\n</tr>\n<tr>\n<td class="s1">Начислено вознаграждений по операциям (+)</td>\n<td class="s0">07.05.2021 - 21.05.2021</td>\n<td class="s2">0,00</td>\n<td class="s0">BYN</td>\n</tr>\n<tr>\n<td class="s1">Начислено пени за просрочку платежей (-)</td>\n<td class="s0">07.05.2021 - 21.05.2021</td>\n<td class="s2">0,00</td>\n<td class="s0">BYN</td>\n</tr>\n</table>\n<br/>\n<table class="section_3">\n<tr>\n<th bgcolor="#B8CCE4" colspan="13" class="col3_0">ДЕТАЛЬНАЯ ИНФОРМАЦИЯ ОБ ОПЕРАЦИЯХ ЗА ПЕРИОД</th>\n</tr>\n<tr>\n<th class="col3_1">Дата операции</th>\n<th class="col3_2">Дата отражения операции по счету</th>\n<th class="col3_3">Описание операции</th>\n<th class="col3_4">Тип операции</th>\n<th class="col3_5">Место совершения операции</th>\n<th class="col3_11">Сумма операции в валюте операции</th>\n<th class="col3_10">Валюта операции</th>\n<th class="col3_6">Сумма операции в валюте счета</th>\n<th class="col3_10">Валюта счета</th>\n<th class="col3_7">Количество месяцев для погашения</th>\n<th class="col3_9">Код авторизации</th>\n<th class="col3_10">МСС</th>\n<th class="col3_13">Вознаграждение клиенту по операции в валюте счета</th>\n</tr>\n<tr>\n<td class="col3_1">16.05.2021 19:47:50</td>\n<td class="col3_2">18.05.2021</td>\n<td class="col3_3left">Безналичная оплата</td>\n<td class="col3_4">СПИСАНИЕ</td>\n<td class="col3_5left">BY SUPERMARKET "VITALUR", MINSK</td>\n<td class="col3_11right">27,15</td>\n<td class="col3_10">BYN</td>\n<td class="col3_6right">27,15</td>\n<td class="col3_10">BYN</td>\n<td class="col3_7">2</td>\n<td class="col3_9">964870</td>\n<td class="col3_10">5411</td>\n<td class="col3_13right"/>\n</tr>\n<tr>\n<td class="col3_1">17.05.2021 10:26:09</td>\n<td class="col3_2">19.05.2021</td>\n<td class="col3_3left">Безналичная оплата</td>\n<td class="col3_4">СПИСАНИЕ</td>\n<td class="col3_5left">BY GIPERMARKET "KORONA", MINSK</td>\n<td class="col3_11right">2,43</td>\n<td class="col3_10">BYN</td>\n<td class="col3_6right">2,43</td>\n<td class="col3_10">BYN</td>\n<td class="col3_7">2</td>\n<td class="col3_9">314518</td>\n<td class="col3_10">5411</td>\n<td class="col3_13right"/>\n</tr>\n<tr>\n<td class="col3_1">17.05.2021 19:06:00</td>\n<td class="col3_2">18.05.2021</td>\n<td class="col3_3left">Безналичная оплата</td>\n<td class="col3_4">СПИСАНИЕ</td>\n<td class="col3_5left">BY SIGARETNET.BY, G. MINSK</td>\n<td class="col3_11right">110,00</td>\n<td class="col3_10">BYN</td>\n<td class="col3_6right">110,00</td>\n<td class="col3_10">BYN</td>\n<td class="col3_7">4</td>\n<td class="col3_9">800881</td>\n<td class="col3_10">5999</td>\n<td class="col3_13right"/>\n</tr>\n<tr>\n<td class="col3_1">18.05.2021 14:49:50</td>\n<td class="col3_2">19.05.2021</td>\n<td class="col3_3left">Перевод с карты на карту (зачисление, Интернет-банк)</td>\n<td class="col3_4">ЗАЧИСЛЕНИЕ</td>\n<td class="col3_5left">BY PEREVOD S 464132******8723, INTERNET</td>\n<td class="col3_11right">90,00</td>\n<td class="col3_10">BYN</td>\n<td class="col3_6right">90,00</td>\n<td class="col3_10">BYN</td>\n<td class="col3_7"/>\n<td class="col3_9">474311</td>\n<td class="col3_10"/>\n<td class="col3_13right"/>\n</tr>\n</table>\n<br/>\n<table class="section_1">\n<tr>\n<th bgcolor="#B8CCE4" colspan="2" class="col1_0">ГРАФИК ЕЖЕМЕСЯЧНЫХ ПЛАТЕЖЕЙ ПО ОСНОВНОМУ ДОЛГУ (BYN)</th>\n</tr>\n<tr>\n<th class="s15">Дата платежа, не позднее</th>\n<th class="s25">Сумма платежа</th>\n</tr>\n<tr>\n<td class="s15">21.06.2021</td>\n<td class="s25">101,19</td>\n</tr>\n<tr>\n<td class="s15">20.07.2021</td>\n<td class="s25">56,14</td>\n</tr>\n<tr>\n<td class="s15">20.08.2021</td>\n<td class="s25">27,50</td>\n</tr>\n<tr>\n<td class="s15">20.09.2021</td>\n<td class="s25">27,50</td>\n</tr>\n</table>\n<br/>\n<p style="width:25cm; text-align:left; font-size:10pt; line-height:10pt;">\n<br/>\n</p>\n<div style="text-align:left;width:25cm;font-size:10pt;">По вопросам, касающимся условий предоставления кредита и порядка его погашения, просим обращаться по тел. (017) 229-15-50. Время работы: пн.-сб. 8.00 - 20.00.</div>\n</body>\n</html>\n]]>\n</Body>\n</Attachment>\n</MailAttachment>\n</BS_Response>'
      ],
      {
        overdraft: '1 000,00',
        transactions: []
      }
    ]
  ])('parses transactions and overdraft', (mails, result) => {
    expect(parseTransactionsAndOverdraft(mails)).toEqual(result)
  })
})
