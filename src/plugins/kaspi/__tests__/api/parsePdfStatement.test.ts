import { parseSinglePdfString } from '../../api'
const statements = [
  "\n\nАО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz\nВЫПИСКА\nпо Kaspi Gold за период с 04.10.22 по 04.04.23\nLastnameНомер карты:*0475\nFirstnameНомер счета:KZ111111\nДоступно на 04.04.23:100 995,97 ₸Валюта счета:тенге\nКраткое содержание операций по карте:Лимит на снятие наличности без комиссии:\nДоступно на 04.10.220,00 ₸    Остаток зарплатных денег0,00 ₸  \n  Пополнения+ 834 370,79 ₸    Другие пополнения300 000,00 ₸  \n  Переводы- 135 000,00 ₸  Итого300 000,00 ₸  \n  Покупки- 485 344,31 ₸  \n  Снятия- 113 030,51 ₸  \n  Разное+ 0,00 ₸  \nДоступно на 04.04.23100 995,97 ₸  \nДатаСуммаОперация       Детали\n30.03.23- 4 093,24 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)    \n01.03.23- 4 022,40 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)    \n26.02.23- 1 697,53 ₸   Покупка      Orange Egypt\n(-115 EGP)    \n04.02.23- 1 100,94 ₸   Покупка      Orange Egypt\n(-72 EGP)    \n30.01.23- 4 179,45 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)    \n26.01.23- 1 136,09 ₸   Покупка      Orange Egypt\n(-73 EGP)    \n24.01.23- 50 000,00 ₸   Перевод      Ilsiiar G.\n15.01.23- 4 100,37 ₸   Покупка      MCDONALDSHURGHADA1\n(-258 EGP)    \n15.01.23- 79,58 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-5 EGP)    \n15.01.23- 271,52 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-17 EGP)    \n14.01.23- 1 413,78 ₸   Покупка      Orange Egypt\n(-89 EGP)    \n\nАО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz\n11.01.23- 7 570,93 ₸   Покупка      METRO MARKET\n(-477.6 EGP)    \n11.01.23- 79,50 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-5 EGP)    \n11.01.23- 271,23 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-16 EGP)    \n04.01.23- 5 365,52 ₸   Покупка      CLEOPATRA - ABU ASHARA\n(-282 EGP)    \n04.01.23- 1 501,28 ₸   Покупка      A MART\n(-86.55 EGP)    \n04.01.23- 6 901,20 ₸   Покупка      METRO MARKET\n(-397.37 EGP)    \n03.01.23- 31 787,76 ₸   Покупка      BESTWAY SUPERMA\n(-1667.5 EGP)    \n02.01.23- 3 214,61 ₸   Покупка      GEIDEABready\n(-180 EGP)    \n01.01.23- 25 000,00 ₸   Перевод      Ilsiiar G.\n31.12.22- 4 246,03 ₸   Покупка      PH 14908 SENZO MALL\n(-224 EGP)    \n31.12.22- 12 227,82 ₸   Покупка      SPINNEY'S 9\n(-645.27 EGP)    \n31.12.22- 15 163,05 ₸   Покупка      CARINA DANDY MALL\n(-800 EGP)    \n30.12.22+ 124 400,00 ₸   Пополнение      Со счета другого банка\n(20000 RUB)    \n30.12.22- 4 208,58 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)    \n27.12.22- 50 000,00 ₸   Перевод      Ilsiiar G.\n27.12.22+ 130 600,00 ₸   Пополнение      Со счета другого банка\n(20000 RUB)    \n20.12.22- 36 576,91 ₸   Снятие      Банкомат BEST WAY  HUR\n(-1900 EGP)    \n20.12.22- 8 083,32 ₸   Покупка      ZOO FOOD\n(-420 EGP)    \n20.12.22- 30 955,18 ₸   Покупка      BESTWAY SUPERMA\n(-1608.16 EGP)    \n19.12.22- 16 499,29 ₸   Покупка      TOP UP ETISALAT  EGYPT\n(-857.14 EGP)    \n18.12.22- 43 210,85 ₸   Покупка      GOMLA MARKET\n(-2244.7 EGP)    \n17.12.22- 1 785,81 ₸   Покупка      Orange Egypt\n(-93 EGP)    \n11.12.22- 34 500,25 ₸   Покупка      EGY CRAFT\n(-1785 EGP)    \n11.12.22- 10 932,34 ₸   Покупка      SELECT FOR PAPYRUS\n(-567 EGP)    \n07.12.22- 2 595,40 ₸   Покупка      M E GROUP CIRCLE K\n(-134 EGP)    \n\nАО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz\n06.12.22- 677,67 ₸   Покупка      SPINNEY'S 2\n(-34.95 EGP)    \n04.12.22- 25 074,14 ₸   Покупка      CARREFOUR-HCC\n(-1289.72 EGP)    \n04.12.22- 601,44 ₸   Покупка      EL ZAHRAA BAKERY\n(-31 EGP)    \n04.12.22- 8 171,89 ₸   Покупка      THE MOON RESTAURANT\n(-420.09 EGP)    \n30.11.22- 5 995,46 ₸   Покупка      GRILL HOUSE ELKAWTHER\n(-310 EGP)    \n30.11.22- 4 253,98 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)    \n29.11.22- 25 633,80 ₸   Покупка      ROYAL ZONE\n(-1325 EGP)    \n27.11.22- 5 243,75 ₸   Покупка      COFFE PLUS\n(-271.45 EGP)    \n27.11.22- 44 578,97 ₸   Покупка      CARREFOUR-HCC\n(-2307.53 EGP)    \n27.11.22- 8 678,30 ₸   Покупка      Miniso\n(-449.8 EGP)    \n27.11.22- 40 292,13 ₸   Покупка      ONE LOOK HURGHADA\n(-2088 EGP)    \n27.11.22- 8 033,78 ₸   Покупка      GEIDEAGreen Cafe\n(-416.02 EGP)    \n25.11.22+ 108 213,06 ₸   Пополнение      по номеру счета PAYDALA LLP\n25.11.22+ 108 213,06 ₸   Пополнение      по номеру счета P2P PAYDALA*POPOLNENIE\n22.11.22- 38 247,04 ₸   Снятие      Банкомат NBE ATM945\n(-2000 EGP)    \n20.11.22- 4 311,49 ₸   Покупка      CINNABON HURGHADA\n(-225 EGP)    \n18.11.22- 9 552,81 ₸   Покупка      PAYMOB SAND CITY\n(-500 EGP)    \n18.11.22- 38 206,56 ₸   Снятие      Банкомат THE VIEW HURGHADA\n(-2000 EGP)    \n18.11.22- 3 494,13 ₸   Покупка      GRILL HOUSE ELKAWTHER\n(-183 EGP)    \n17.11.22- 1 093,08 ₸   Покупка      METRO - HURGHADA STORE &D\n(-57.25 EGP)    \n17.11.22- 2 158,14 ₸   Покупка      EL ZAHRAA BAKERY\n(-113 EGP)    \n17.11.22+ 107 893,16 ₸   Пополнение      по номеру счета P2P PAYDALA*POPOLNENIE\n17.11.22+ 107 893,16 ₸   Пополнение      по номеру счета P2P PAYDALA*POPOLNENIE\n16.11.22- 6 641,47 ₸   Покупка      ROYAL ZONE\n(-350 EGP)    \n16.11.22- 1 178,03 ₸   Покупка      M E GROUP CIRCLE K\n(-62 EGP)    \n15.11.22+ 108 042,54 ₸   Пополнение      по номеру счета P2P PAYDALA*POPOLNENIE\n\nАО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz\n03.11.22- 675,00 ₸   Покупка      TOO BIZNES KZ-2020\n03.11.22+ 10 000,00 ₸   Пополнение      Ilsiiar G.\n02.11.22- 4 390,00 ₸   Покупка      TOO BIZNES KZ-2020\n02.11.22- 10 000,00 ₸   Перевод      Ilsiiar G.\n02.11.22- 2 060,00 ₸   Покупка      TOO BIZNES KZ-2020\n01.11.22- 3 795,00 ₸   Покупка      TOO BIZNES KZ-2020\n01.11.22- 5 565,00 ₸   Покупка      TOO BIZNES KZ-2020\n01.11.22+ 7 115,81 ₸   Пополнение      по номеру счета PAYDALA LLP\n01.11.22+ 22 000,00 ₸   Пополнение      В Kaspi Банкомате\n    - Сумма заблокирована. Банк ожидает подтверждения от платежной системы.",
  "\n\nJSC «Kaspi Bank», BIC CASPKZKA, www.kaspi.kz\nKASPI GOLD\nstatement balance for the period from 17.10.22 to 17.04.23\nLastnameCard number:*0475\nFirstnameAccount number:KZ111111\nCard balance 17.04.23:80 995,97 ₸Currency:KZT\nTransaction summary:Cash withdrawal limits with no commission:\nCard balance 17.10.220,00 ₸    Salary0,00 ₸  \n  Replenishment+ 834 370,79 ₸    Other deposits300 000,00 ₸  \n  Transfers- 155 000,00 ₸  Total300 000,00 ₸  \n  Purchases- 485 344,31 ₸  \n  Withdrawals- 113 030,51 ₸  \n  Others+ 0,00 ₸  \nCard balance 17.04.2380 995,97 ₸  \nDateAmountTransaction       Details\n09.04.23- 20 000,00 ₸   Transfers      Ilsiiar G.\n30.03.23- 4 093,24 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)    \n01.03.23- 4 022,40 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)    \n26.02.23- 1 697,53 ₸   Purchases      Orange Egypt\n(-115 EGP)    \n04.02.23- 1 100,94 ₸   Purchases      Orange Egypt\n(-72 EGP)    \n30.01.23- 4 179,45 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)    \n26.01.23- 1 136,09 ₸   Purchases      Orange Egypt\n(-73 EGP)    \n24.01.23- 50 000,00 ₸   Transfers      Ilsiiar G.\n15.01.23- 4 100,37 ₸   Purchases      MCDONALDSHURGHADA1\n(-258 EGP)    \n15.01.23- 79,58 ₸   Purchases      UBER *TRIP HELP.UBER.COM\n(-5 EGP)    \n15.01.23- 271,52 ₸   Purchases      UBER *TRIP HELP.UBER.COM\n(-17 EGP)    \n14.01.23- 1 413,78 ₸   Purchases      Orange Egypt\n(-89 EGP)    \n\nJSC «Kaspi Bank», BIC CASPKZKA, www.kaspi.kz\n11.01.23- 7 570,93 ₸   Purchases      METRO MARKET\n(-477.6 EGP)    \n11.01.23- 79,50 ₸   Purchases      UBER *TRIP HELP.UBER.COM\n(-5 EGP)    \n11.01.23- 271,23 ₸   Purchases      UBER *TRIP HELP.UBER.COM\n(-16 EGP)    \n04.01.23- 5 365,52 ₸   Purchases      CLEOPATRA - ABU ASHARA\n(-282 EGP)    \n04.01.23- 1 501,28 ₸   Purchases      A MART\n(-86.55 EGP)    \n04.01.23- 6 901,20 ₸   Purchases      METRO MARKET\n(-397.37 EGP)    \n03.01.23- 31 787,76 ₸   Purchases      BESTWAY SUPERMA\n(-1667.5 EGP)    \n02.01.23- 3 214,61 ₸   Purchases      GEIDEABready\n(-180 EGP)    \n01.01.23- 25 000,00 ₸   Transfers      Ilsiiar G.\n31.12.22- 4 246,03 ₸   Purchases      PH 14908 SENZO MALL\n(-224 EGP)    \n31.12.22- 12 227,82 ₸   Purchases      SPINNEY'S 9\n(-645.27 EGP)    \n31.12.22- 15 163,05 ₸   Purchases      CARINA DANDY MALL\n(-800 EGP)    \n30.12.22+ 124 400,00 ₸   Replenishment      From an account in another bank\n(20000 RUB)    \n30.12.22- 4 208,58 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)    \n27.12.22- 50 000,00 ₸   Transfers      Ilsiiar G.\n27.12.22+ 130 600,00 ₸   Replenishment      From an account in another bank\n(20000 RUB)    \n20.12.22- 36 576,91 ₸   Withdrawals      ATM BEST WAY  HUR\n(-1900 EGP)    \n20.12.22- 8 083,32 ₸   Purchases      ZOO FOOD\n(-420 EGP)    \n20.12.22- 30 955,18 ₸   Purchases      BESTWAY SUPERMA\n(-1608.16 EGP)    \n19.12.22- 16 499,29 ₸   Purchases      TOP UP ETISALAT  EGYPT\n(-857.14 EGP)    \n18.12.22- 43 210,85 ₸   Purchases      GOMLA MARKET\n(-2244.7 EGP)    \n17.12.22- 1 785,81 ₸   Purchases      Orange Egypt\n(-93 EGP)    \n11.12.22- 34 500,25 ₸   Purchases      EGY CRAFT\n(-1785 EGP)    \n11.12.22- 10 932,34 ₸   Purchases      SELECT FOR PAPYRUS\n(-567 EGP)    \n07.12.22- 2 595,40 ₸   Purchases      M E GROUP CIRCLE K\n(-134 EGP)    \n\nJSC «Kaspi Bank», BIC CASPKZKA, www.kaspi.kz\n06.12.22- 677,67 ₸   Purchases      SPINNEY'S 2\n(-34.95 EGP)    \n04.12.22- 25 074,14 ₸   Purchases      CARREFOUR-HCC\n(-1289.72 EGP)    \n04.12.22- 601,44 ₸   Purchases      EL ZAHRAA BAKERY\n(-31 EGP)    \n04.12.22- 8 171,89 ₸   Purchases      THE MOON RESTAURANT\n(-420.09 EGP)    \n30.11.22- 5 995,46 ₸   Purchases      GRILL HOUSE ELKAWTHER\n(-310 EGP)    \n30.11.22- 4 253,98 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)    \n29.11.22- 25 633,80 ₸   Purchases      ROYAL ZONE\n(-1325 EGP)    \n27.11.22- 5 243,75 ₸   Purchases      COFFE PLUS\n(-271.45 EGP)    \n27.11.22- 44 578,97 ₸   Purchases      CARREFOUR-HCC\n(-2307.53 EGP)    \n27.11.22- 8 678,30 ₸   Purchases      Miniso\n(-449.8 EGP)    \n27.11.22- 40 292,13 ₸   Purchases      ONE LOOK HURGHADA\n(-2088 EGP)    \n27.11.22- 8 033,78 ₸   Purchases      GEIDEAGreen Cafe\n(-416.02 EGP)    \n25.11.22+ 108 213,06 ₸   Replenishment      by account number PAYDALA LLP\n25.11.22+ 108 213,06 ₸   Replenishment      by account number P2P PAYDALA*POPOLNENIE\n22.11.22- 38 247,04 ₸   Withdrawals      ATM NBE ATM945\n(-2000 EGP)    \n20.11.22- 4 311,49 ₸   Purchases      CINNABON HURGHADA\n(-225 EGP)    \n18.11.22- 9 552,81 ₸   Purchases      PAYMOB SAND CITY\n(-500 EGP)    \n18.11.22- 38 206,56 ₸   Withdrawals      ATM THE VIEW HURGHADA\n(-2000 EGP)    \n18.11.22- 3 494,13 ₸   Purchases      GRILL HOUSE ELKAWTHER\n(-183 EGP)    \n17.11.22- 1 093,08 ₸   Purchases      METRO - HURGHADA STORE &D\n(-57.25 EGP)    \n17.11.22- 2 158,14 ₸   Purchases      EL ZAHRAA BAKERY\n(-113 EGP)    \n17.11.22+ 107 893,16 ₸   Replenishment      by account number P2P PAYDALA*POPOLNENIE\n17.11.22+ 107 893,16 ₸   Replenishment      by account number P2P PAYDALA*POPOLNENIE\n16.11.22- 6 641,47 ₸   Purchases      ROYAL ZONE\n(-350 EGP)    \n16.11.22- 1 178,03 ₸   Purchases      M E GROUP CIRCLE K\n(-62 EGP)    \n15.11.22+ 108 042,54 ₸   Replenishment      by account number P2P PAYDALA*POPOLNENIE\n\nJSC «Kaspi Bank», BIC CASPKZKA, www.kaspi.kz\n03.11.22- 675,00 ₸   Purchases      TOO BIZNES KZ-2020\n03.11.22+ 10 000,00 ₸   Replenishment      Ilsiiar G.\n02.11.22- 4 390,00 ₸   Purchases      TOO BIZNES KZ-2020\n02.11.22- 10 000,00 ₸   Transfers      Ilsiiar G.\n02.11.22- 2 060,00 ₸   Purchases      TOO BIZNES KZ-2020\n01.11.22- 3 795,00 ₸   Purchases      TOO BIZNES KZ-2020\n01.11.22- 5 565,00 ₸   Purchases      TOO BIZNES KZ-2020\n01.11.22+ 7 115,81 ₸   Replenishment      by account number PAYDALA LLP\n01.11.22+ 22 000,00 ₸   Replenishment      At Kaspi ATM\n    - The amount is blocked.  The bank expects the confirmation of the payment system.",
  "\n\n«Kaspi Bank» АҚ, БСК CASPKZKA, www.kaspi.kz\nҮЗІНДІ КӨШІРМЕ\n17.10.22ж. бастап 17.04.23ж. дейінгі кезеңге Kaspi Gold бойынша\nLastnameКарта нөмірі:*0475\nFirstnameШот нөмірі:KZ111111\n17.04.23ж. қолжетімді:80 995,97 ₸Шот валютасы:теңге\nКарта бойынша операциялардың қысқаша мазмұны:Комиссиясыз қолма-қол ақша алуға лимит:\n17.10.22ж. қолжетімді:0,00 ₸    Жалақылық ақшаның қалдығы0,00 ₸  \n  Толықтыру+ 834 370,79 ₸    Басқа толықтырулар300 000,00 ₸  \n  Аударым- 155 000,00 ₸  Жиынтығы300 000,00 ₸  \n  Зат сатып алу- 485 344,31 ₸  \n  Ақша алу- 113 030,51 ₸  \n  Əртүрлі+ 0,00 ₸  \n17.04.23ж. қолжетімді:80 995,97 ₸  \nКүніСомасыОперация       Толығырақ\n09.04.23- 20 000,00 ₸   Аударым      Ilsiiar G.\n30.03.23- 4 093,24 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n(-8.99 USD)    \n01.03.23- 4 022,40 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n(-8.99 USD)    \n26.02.23- 1 697,53 ₸   Зат сатып алу      Orange Egypt\n(-115 EGP)    \n04.02.23- 1 100,94 ₸   Зат сатып алу      Orange Egypt\n(-72 EGP)    \n30.01.23- 4 179,45 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n(-8.99 USD)    \n26.01.23- 1 136,09 ₸   Зат сатып алу      Orange Egypt\n(-73 EGP)    \n24.01.23- 50 000,00 ₸   Аударым      Ilsiiar G.\n15.01.23- 4 100,37 ₸   Зат сатып алу      MCDONALDSHURGHADA1\n(-258 EGP)    \n15.01.23- 79,58 ₸   Зат сатып алу      UBER *TRIP HELP.UBER.COM\n(-5 EGP)    \n15.01.23- 271,52 ₸   Зат сатып алу      UBER *TRIP HELP.UBER.COM\n(-17 EGP)    \n\n«Kaspi Bank» АҚ, БСК CASPKZKA, www.kaspi.kz\n14.01.23- 1 413,78 ₸   Зат сатып алу      Orange Egypt\n(-89 EGP)    \n11.01.23- 7 570,93 ₸   Зат сатып алу      METRO MARKET\n(-477.6 EGP)    \n11.01.23- 79,50 ₸   Зат сатып алу      UBER *TRIP HELP.UBER.COM\n(-5 EGP)    \n11.01.23- 271,23 ₸   Зат сатып алу      UBER *TRIP HELP.UBER.COM\n(-16 EGP)    \n04.01.23- 5 365,52 ₸   Зат сатып алу      CLEOPATRA - ABU ASHARA\n(-282 EGP)    \n04.01.23- 1 501,28 ₸   Зат сатып алу      A MART\n(-86.55 EGP)    \n04.01.23- 6 901,20 ₸   Зат сатып алу      METRO MARKET\n(-397.37 EGP)    \n03.01.23- 31 787,76 ₸   Зат сатып алу      BESTWAY SUPERMA\n(-1667.5 EGP)    \n02.01.23- 3 214,61 ₸   Зат сатып алу      GEIDEABready\n(-180 EGP)    \n01.01.23- 25 000,00 ₸   Аударым      Ilsiiar G.\n31.12.22- 4 246,03 ₸   Зат сатып алу      PH 14908 SENZO MALL\n(-224 EGP)    \n31.12.22- 12 227,82 ₸   Зат сатып алу      SPINNEY'S 9\n(-645.27 EGP)    \n31.12.22- 15 163,05 ₸   Зат сатып алу      CARINA DANDY MALL\n(-800 EGP)    \n30.12.22+ 124 400,00 ₸   Толықтыру      Басқа банктің шотынан\n(20000 RUB)    \n30.12.22- 4 208,58 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n(-8.99 USD)    \n27.12.22- 50 000,00 ₸   Аударым      Ilsiiar G.\n27.12.22+ 130 600,00 ₸   Толықтыру      Басқа банктің шотынан\n(20000 RUB)    \n20.12.22- 36 576,91 ₸   Ақша алу      Банкомат BEST WAY  HUR\n(-1900 EGP)    \n20.12.22- 8 083,32 ₸   Зат сатып алу      ZOO FOOD\n(-420 EGP)    \n20.12.22- 30 955,18 ₸   Зат сатып алу      BESTWAY SUPERMA\n(-1608.16 EGP)    \n19.12.22- 16 499,29 ₸   Зат сатып алу      TOP UP ETISALAT  EGYPT\n(-857.14 EGP)    \n18.12.22- 43 210,85 ₸   Зат сатып алу      GOMLA MARKET\n(-2244.7 EGP)    \n17.12.22- 1 785,81 ₸   Зат сатып алу      Orange Egypt\n(-93 EGP)    \n11.12.22- 34 500,25 ₸   Зат сатып алу      EGY CRAFT\n(-1785 EGP)    \n11.12.22- 10 932,34 ₸   Зат сатып алу      SELECT FOR PAPYRUS\n(-567 EGP)    \n\n«Kaspi Bank» АҚ, БСК CASPKZKA, www.kaspi.kz\n07.12.22- 2 595,40 ₸   Зат сатып алу      M E GROUP CIRCLE K\n(-134 EGP)    \n06.12.22- 677,67 ₸   Зат сатып алу      SPINNEY'S 2\n(-34.95 EGP)    \n04.12.22- 25 074,14 ₸   Зат сатып алу      CARREFOUR-HCC\n(-1289.72 EGP)    \n04.12.22- 601,44 ₸   Зат сатып алу      EL ZAHRAA BAKERY\n(-31 EGP)    \n04.12.22- 8 171,89 ₸   Зат сатып алу      THE MOON RESTAURANT\n(-420.09 EGP)    \n30.11.22- 5 995,46 ₸   Зат сатып алу      GRILL HOUSE ELKAWTHER\n(-310 EGP)    \n30.11.22- 4 253,98 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n(-8.99 USD)    \n29.11.22- 25 633,80 ₸   Зат сатып алу      ROYAL ZONE\n(-1325 EGP)    \n27.11.22- 5 243,75 ₸   Зат сатып алу      COFFE PLUS\n(-271.45 EGP)    \n27.11.22- 44 578,97 ₸   Зат сатып алу      CARREFOUR-HCC\n(-2307.53 EGP)    \n27.11.22- 8 678,30 ₸   Зат сатып алу      Miniso\n(-449.8 EGP)    \n27.11.22- 40 292,13 ₸   Зат сатып алу      ONE LOOK HURGHADA\n(-2088 EGP)    \n27.11.22- 8 033,78 ₸   Зат сатып алу      GEIDEAGreen Cafe\n(-416.02 EGP)    \n25.11.22+ 108 213,06 ₸   Толықтыру      шот нөмірі бойынша PAYDALA LLP\n25.11.22+ 108 213,06 ₸   Толықтыру      шот нөмірі бойынша P2P PAYDALA*POPOLNENIE\n22.11.22- 38 247,04 ₸   Ақша алу      Банкомат NBE ATM945\n(-2000 EGP)    \n20.11.22- 4 311,49 ₸   Зат сатып алу      CINNABON HURGHADA\n(-225 EGP)    \n18.11.22- 9 552,81 ₸   Зат сатып алу      PAYMOB SAND CITY\n(-500 EGP)    \n18.11.22- 38 206,56 ₸   Ақша алу      Банкомат THE VIEW HURGHADA\n(-2000 EGP)    \n18.11.22- 3 494,13 ₸   Зат сатып алу      GRILL HOUSE ELKAWTHER\n(-183 EGP)    \n17.11.22- 1 093,08 ₸   Зат сатып алу      METRO - HURGHADA STORE &D\n(-57.25 EGP)    \n17.11.22- 2 158,14 ₸   Зат сатып алу      EL ZAHRAA BAKERY\n(-113 EGP)    \n17.11.22+ 107 893,16 ₸   Толықтыру      шот нөмірі бойынша P2P PAYDALA*POPOLNENIE\n17.11.22+ 107 893,16 ₸   Толықтыру      шот нөмірі бойынша P2P PAYDALA*POPOLNENIE\n16.11.22- 6 641,47 ₸   Зат сатып алу      ROYAL ZONE\n(-350 EGP)    \n16.11.22- 1 178,03 ₸   Зат сатып алу      M E GROUP CIRCLE K\n(-62 EGP)    \n\n«Kaspi Bank» АҚ, БСК CASPKZKA, www.kaspi.kz\n15.11.22+ 108 042,54 ₸   Толықтыру      шот нөмірі бойынша P2P PAYDALA*POPOLNENIE\n03.11.22- 675,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020\n03.11.22+ 10 000,00 ₸   Толықтыру      Ilsiiar G.\n02.11.22- 4 390,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020\n02.11.22- 10 000,00 ₸   Аударым      Ilsiiar G.\n02.11.22- 2 060,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020\n01.11.22- 3 795,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020\n01.11.22- 5 565,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020\n01.11.22+ 7 115,81 ₸   Толықтыру      шот нөмірі бойынша PAYDALA LLP\n01.11.22+ 22 000,00 ₸   Толықтыру      Kaspi банкоматында\n    - Сомаға тосқауыл қойылған. Банк төлем жүйесінің растауын күтуде.",
  '\n\nАО "Kaspi Bank", БИК CASPKZKA www.kaspi.kz\nВЫПИСКА\nПо Депозиту за период с 01.05.23 по 12.05.23\n12 мая 2023\nLastname\nНомер договора: D1111-005\nFirstname\nНомер счета:\n  KZ200001\nНа Депозите 12.05.23:315 286,89 ₸Валюта счета: тенге\nЭффективная ставка\nДата открытия:\n  06.02.2023\nвознаграждения:15%\nДата пролонгации:\n  08.02.2024\n____________________________________________________________________________________________\nКраткое содержание операций по депозиту:\n  На Депозите 01.05.23\n297 652,23 ₸\nПополнения\n+41 876,00 ₸\nВознаграждения\n+1 258,66 ₸\nСнятия\n0,00 ₸\nПереводы\n-25 500,00 ₸\nПлатежи\n0,00 ₸\nРазное\n0,00 ₸\nНа Депозите 12.05.23\n315 286,89 ₸\nДатаСуммаОперацияДеталиНа Депозите\n01.05.23+1 258,66 ₸Вознаграждение298 910,89 ₸\n01.05.23-2 000,00 ₸Перевод296 910,89 ₸\n01.05.23-1 500,00 ₸Перевод295 410,89 ₸\n01.05.23-400,00 ₸Перевод295 010,89 ₸\n02.05.23-2 500,00 ₸Перевод292 510,89 ₸\n02.05.23-6 500,00 ₸Перевод286 010,89 ₸\nПроценты по Kaspi\nДепозиту\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\n\nДатаСуммаОперацияДеталиНа Депозите\n02.05.23+29 276,00 ₸Пополнение315 286,89 ₸\n11.05.23-12 600,00 ₸Перевод302 686,89 ₸\n12.05.23+12 600,00 ₸Пополнение315 286,89 ₸\n\nС Kaspi Gold через\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nС Kaspi Gold через\nkaspi.kz',
  'АО "Kaspi Bank", БИК CASPKZKA www.kaspi.kz\nВЫПИСКА\nПо Депозиту за период с 01.05.23 по 13.05.23\n13 мая 2023\nLastname\nНомер договора: D1111-007\nFirstname\nНомер счета:\nKZ3927\nНа Депозите 13.05.23:$2 250,98Валюта счета: доллары США\nЭффективная ставка\nДата открытия:\n04.04.2021\nвознаграждения:1%\nДата пролонгации:\n09.04.2024\n____________________________________________________________________________________________\nКраткое содержание операций по депозиту:\nНа Депозите 01.05.23\n$2 384,72\nПополнения\n$0,00\nВознаграждения\n+ $1,56\nСнятия\n$0,00\nПереводы\n- $135,30\nПлатежи\n$0,00\nРазное\n$0,00\nНа Депозите 13.05.23\n$2 250,98\nДатаСуммаОперацияДеталиНа Депозите\n01.05.23+ $1,56Вознаграждение$2 386,28\n10.05.23- $22,60ПереводНа Kaspi Gold на kaspi.kz$2 363,68\n10.05.23- $1,13ПереводНа Kaspi Gold на kaspi.kz$2 362,55\n12.05.23- $2,60ПереводНа Kaspi Gold на kaspi.kz$2 359,95\n12.05.23- $2,25ПереводНа Kaspi Gold на kaspi.kz$2 357,70\n12.05.23- $2,25ПереводНа Kaspi Gold на kaspi.kz$2 355,45\nПроценты по Kaspi\nДепозиту\n\nДатаСуммаОперацияДеталиНа Депозите\n12.05.23- $14,60ПереводНа Kaspi Gold на kaspi.kz$2 340,85\n12.05.23- $1,06ПереводНа Kaspi Gold на kaspi.kz$2 339,79\n13.05.23- $8,97Перевод$2 330,82\n13.05.23- $44,85ПереводНа Kaspi Gold на kaspi.kz$2 285,97\n13.05.23- $22,43ПереводНа Kaspi Gold на kaspi.kz$2 263,54\n13.05.23- $12,56ПереводНа Kaspi Gold на kaspi.kz$2 250,98\n\nНа Депозит D1111-009\nчерез kaspi.kz',
  'АО "Kaspi Bank", БИК CASPKZKA www.kaspi.kz\nВЫПИСКА\nПо Депозиту за период с 13.02.23 по 13.05.23\n13 мая 2023\nLastname\nНомер договора: D1234-003\nFirstname\nНомер счета:\nKZ1234567\nНа Депозите 13.05.23:1 170 781,56 ₸Валюта счета: тенге\nЭффективная ставка\nДата открытия:\n10.03.2018\nвознаграждения:15%\nДата пролонгации:\n10.03.2024\n____________________________________________________________________________________________\nКраткое содержание операций по депозиту:\nНа Депозите 13.02.23\n1 204 134,61 ₸\nПополнения\n+47 179,91 ₸\nВознаграждения\n+42 347,04 ₸\nСнятия\n0,00 ₸\nПереводы\n-122 880,00 ₸\nПлатежи\n0,00 ₸\nРазное\n0,00 ₸\nНа Депозите 13.05.23\n1 170 781,56 ₸\nДатаСуммаОперацияДеталиНа Депозите\n01.03.23+14 168,17 ₸Вознаграждение1 218 302,78 ₸\n06.03.23-10 000,00 ₸Перевод1 208 302,78 ₸\n07.03.23-10 000,00 ₸Перевод1 198 302,78 ₸\n09.03.23-10 000,00 ₸Перевод1 188 302,78 ₸\n10.03.23+4 263,18 ₸Вознаграждение1 192 565,96 ₸\n10.03.23РазноеПродление депозита1 192 565,96 ₸\nПроценты по Kaspi\nДепозиту\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПроценты по Kaspi\nДепозиту\n\nДатаСуммаОперацияДеталиНа Депозите\n15.03.23-10 000,00 ₸Перевод1 182 565,96 ₸\n17.03.23+47 179,91 ₸Пополнение1 229 745,87 ₸\n21.03.23-10 000,00 ₸Перевод1 219 745,87 ₸\n22.03.23-10 000,00 ₸Перевод1 209 745,87 ₸\n27.03.23-7 880,00 ₸Перевод1 201 865,87 ₸\n31.03.23-5 000,00 ₸Перевод1 196 865,87 ₸\n01.04.23+9 916,17 ₸Вознаграждение1 206 782,04 ₸\n03.04.23-10 000,00 ₸Перевод1 196 782,04 ₸\n11.04.23-5 000,00 ₸Перевод1 191 782,04 ₸\n18.04.23-5 000,00 ₸Перевод1 186 782,04 ₸\n28.04.23-5 000,00 ₸Перевод1 181 782,04 ₸\n01.05.23+13 999,52 ₸Вознаграждение1 195 781,56 ₸\n01.05.23-5 000,00 ₸Перевод1 190 781,56 ₸\n04.05.23-5 000,00 ₸Перевод1 185 781,56 ₸\n07.05.23-10 000,00 ₸Перевод1 175 781,56 ₸\n09.05.23-5 000,00 ₸Перевод1 170 781,56 ₸\n\nПеревод на карту на\nkaspi.kz\nКомпенсация 10% от\nгосударства\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПроценты по Kaspi\nДепозиту\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПроценты по Kaspi\nДепозиту\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz\nПеревод на карту на\nkaspi.kz',
  'АО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz\nВЫПИСКА\nпо Kaspi Gold за период с 25.04.23 по 25.05.23\nLastnameНомер карты:*8629\nFirstnameНомер счета:KZ3856\nДоступно на 25.05.23:-95 638,89 ₸Валюта счета:тенге\nКраткое содержание операций по карте:Лимит на снятие наличности без комиссии:\nДоступно на 25.04.238 042,07 ₸ Остаток зарплатных денег0,00 ₸\nПополнения+ 359 700,00 ₸ Другие пополнения292 000,00 ₸\nПереводы- 325 119,00 ₸ Итого292 000,00 ₸\nПокупки- 32 410,00 ₸\nСнятия- 10 000,00 ₸\nРазное- 213,07 ₸\nДоступно на 25.05.23-95 638,89 ₸\nДатаСуммаОперация Детали\n19.05.23- 213,07 ₸ Разное Оплата инкассового распоряжения No8333142 от\n18/05/2023, получатель ЖАҚСЫЛЫҚ НҰРДƏУЛЕТ\nМЫРЗАЛЫҰЛЫ\n15.05.23- 410,00 ₸ Перевод Асель К.\n15.05.23- 200,00 ₸ Покупка Activ\n15.05.23- 7 985,00 ₸ Покупка MirasStore\n15.05.23+ 4 500,00 ₸ Пополнение Əсем О.\n15.05.23- 650,00 ₸ Перевод Бахтияр К.\n15.05.23- 1 610,00 ₸ Перевод Думан У.\n15.05.23- 4 239,00 ₸ Перевод Зайниддин Ш.\n15.05.23+ 10 000,00 ₸ Пополнение Айгүл М.\n15.05.23- 1 370,00 ₸ Перевод Самичон Ч.\n15.05.23- 8 000,00 ₸ Снятие Банкомат VN Zhibek Zholy 125 BekMart\n15.05.23+ 8 000,00 ₸ Пополнение Шаттық А.\n15.05.23- 400,00 ₸ Перевод Аманкелди К.\n15.05.23- 200,00 ₸ Покупка Onay\n15.05.23- 1 220,00 ₸ Перевод Болат Е.\n14.05.23- 9 020,00 ₸ Перевод Мадина М.\n14.05.23- 1 820,00 ₸ Покупка MAGKEREMET\n14.05.23- 200,00 ₸ Перевод Елнұр Қ.\n14.05.23- 500,00 ₸ Перевод Марат Ю.\n\nАО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz\n14.05.23- 410,00 ₸ Перевод Асель К.\n14.05.23- 980,00 ₸ Перевод Асель К.\n14.05.23+ 15 000,00 ₸ Пополнение Шаттық А.\n14.05.23- 1 880,00 ₸ Покупка CULZHIAN\n14.05.23+ 800,00 ₸ Пополнение Эльдар З.\n14.05.23+ 3 000,00 ₸ Пополнение Шаттық А.\n13.05.23- 1 010,00 ₸ Покупка CULZHIAN\n12.05.23- 200,00 ₸ Перевод Теміржан Д.\n12.05.23- 1 200,00 ₸ Перевод Фатима Ш.\n12.05.23- 3 800,00 ₸ Перевод Фатима Ш.\n12.05.23- 500,00 ₸ Перевод Жанар П.\n12.05.23+ 6 000,00 ₸ Пополнение Шаттық А.\n12.05.23- 740,00 ₸ Покупка LAVISHALATAU\n12.05.23- 500,00 ₸ Покупка Onay\n12.05.23- 1 430,00 ₸ Перевод Марал Е.\n12.05.23- 1 370,00 ₸ Перевод Жулдыз А.\n12.05.23- 920,00 ₸ Перевод Суннатула У.\n12.05.23- 1 000,00 ₸ Перевод Оразəлі О.\n11.05.23- 2 500,00 ₸ Перевод Оразəлі О.\n11.05.23- 300,00 ₸ Перевод Гульназ О.\n11.05.23- 500,00 ₸ Перевод Гулзипа Б.\n11.05.23- 370,00 ₸ Покупка HELLOPEOPLE\n11.05.23+ 10 000,00 ₸ Пополнение Шаттық А.\n11.05.23- 230,00 ₸ Перевод Асель К.\n11.05.23- 1 460,00 ₸ Перевод Асель К.\n11.05.23+ 2 000,00 ₸ Пополнение Шаттық А.\n10.05.23- 250 000,00 ₸ Перевод Айжан О.\n10.05.23+ 250 000,00 ₸ Пополнение Шаттық А.\n09.05.23- 500,00 ₸ Перевод Оразəлі О.\n09.05.23- 1 200,00 ₸ Перевод Оразəлі О.\n09.05.23- 1 125,00 ₸ Перевод Гульжиян Ж.\n09.05.23- 1 535,00 ₸ Перевод Марал Е.\n08.05.23- 1 125,00 ₸ Покупка CULZHIAN\n08.05.23+ 5 000,00 ₸ Пополнение Шаттық А.\n08.05.23- 150,00 ₸ Перевод Армат У.\n08.05.23- 1 370,00 ₸ Перевод Асель К.\n08.05.23+ 2 000,00 ₸ Пополнение Шаттық А.\n07.05.23- 320,00 ₸ Перевод Марал Е.\n07.05.23+ 200,00 ₸ Пополнение Оразəлі О.\n05.05.23- 930,00 ₸ Покупка CULZHIAN\n05.05.23- 200,00 ₸ Перевод Зухра Г.\n05.05.23+ 1 000,00 ₸ Пополнение Шаттық А.\n05.05.23- 160,00 ₸ Покупка Onay\n05.05.23- 910,00 ₸ Покупка TAMERLAN\n05.05.23- 500,00 ₸ Перевод Максат Е.\n05.05.23- 150,00 ₸ Перевод Абзал М.\n05.05.23+ 500,00 ₸ Пополнение Шаттық А.\n\nАО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz\n04.05.23+ 1 000,00 ₸ Пополнение Айгүл М.\n04.05.23- 450,00 ₸ Перевод Асель К.\n04.05.23- 160,00 ₸ Покупка Onay\n03.05.23- 1 550,00 ₸ Покупка MIRASSTORE\n03.05.23+ 2 200,00 ₸ Пополнение Айгүл М.\n02.05.23- 890,00 ₸ Покупка CULZHIAN\n02.05.23- 150,00 ₸ Перевод Аскарбай Ж.\n02.05.23- 100,00 ₸ Покупка Onay\n02.05.23+ 1 500,00 ₸ Пополнение Шаттық А.\n02.05.23- 900,00 ₸ Перевод Асель К.\n02.05.23- 500,00 ₸ Перевод Нуралы К.\n02.05.23+ 1 000,00 ₸ Пополнение Назира О.\n01.05.23- 200,00 ₸ Покупка Onay\n30.04.23- 1 380,00 ₸ Перевод Марал Е.\n30.04.23+ 2 000,00 ₸ Пополнение Шаттық А.\n29.04.23- 450,00 ₸ Перевод Марал Е.\n29.04.23- 2 000,00 ₸ Снятие Банкомат VN Akbulak 31 Miras Store\n29.04.23- 680,00 ₸ Покупка CULZHIAN\n28.04.23- 850,00 ₸ Перевод Эльмира Д.\n28.04.23- 2 700,00 ₸ Покупка Activ\n28.04.23+ 5 000,00 ₸ Пополнение Мухит И.\n28.04.23- 200,00 ₸ Покупка SOZO\n27.04.23- 500,00 ₸ Перевод Назира О.\n27.04.23+ 2 000,00 ₸ Пополнение Шаттық А.\n27.04.23- 1 360,00 ₸ Перевод Асель К.\n27.04.23- 500,00 ₸ Перевод Абилхайыр Б.\n27.04.23+ 2 000,00 ₸ Пополнение Əсем О.\n27.04.23- 470,00 ₸ Перевод Гульжиян Ж.\n26.04.23- 320,00 ₸ Перевод Гульжиян Ж.\n26.04.23- 470,00 ₸ Перевод Гульжиян Ж.\n26.04.23- 1 200,00 ₸ Перевод Khudoyberdi I.\n26.04.23- 800,00 ₸ Покупка SOZO\n26.04.23- 500,00 ₸ Покупка Onay\n- Сумма заблокирована. Банк ожидает подтверждения от платежной системы.'
]

it.each([
  [
    statements[0],
    {
      account: {
        balance: 100995.97,
        id: 'KZ111111',
        instrument: 'KZT',
        title: 'Kaspi Gold *0475',
        date: '2023-04-04T00:00:00.000',
        capitalization: null,
        endDate: null,
        startBalance: null,
        startDate: null,
        type: 'gold'
      },
      transactions: [
        {
          hold: false,
          date: '2023-03-30T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 093,24 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.03.23- 4 093,24 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-03-01T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 022,40 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.03.23- 4 022,40 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-02-26T00:00:00.000',
          originalAmount: '(-115 EGP)',
          amount: '- 1 697,53 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.02.23- 1 697,53 ₸   Покупка      Orange Egypt\n(-115 EGP)'
        },
        {
          hold: false,
          date: '2023-02-04T00:00:00.000',
          originalAmount: '(-72 EGP)',
          amount: '- 1 100,94 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.02.23- 1 100,94 ₸   Покупка      Orange Egypt\n(-72 EGP)'
        },
        {
          hold: false,
          date: '2023-01-30T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 179,45 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.01.23- 4 179,45 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-01-26T00:00:00.000',
          originalAmount: '(-73 EGP)',
          amount: '- 1 136,09 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.01.23- 1 136,09 ₸   Покупка      Orange Egypt\n(-73 EGP)'
        },
        {
          hold: false,
          date: '2023-01-24T00:00:00.000',
          originalAmount: null,
          amount: '- 50 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '24.01.23- 50 000,00 ₸   Перевод      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '(-258 EGP)',
          amount: '- 4 100,37 ',
          description: 'MCDONALDSHURGHADA1',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 4 100,37 ₸   Покупка      MCDONALDSHURGHADA1\n(-258 EGP)'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '(-5 EGP)',
          amount: '- 79,58 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 79,58 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '(-17 EGP)',
          amount: '- 271,52 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 271,52 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-17 EGP)'
        },
        {
          hold: false,
          date: '2023-01-14T00:00:00.000',
          originalAmount: '(-89 EGP)',
          amount: '- 1 413,78 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.01.23- 1 413,78 ₸   Покупка      Orange Egypt\n(-89 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '(-477.6 EGP)',
          amount: '- 7 570,93 ',
          description: 'METRO MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 7 570,93 ₸   Покупка      METRO MARKET\n(-477.6 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '(-5 EGP)',
          amount: '- 79,50 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 79,50 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '(-16 EGP)',
          amount: '- 271,23 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 271,23 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-16 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '(-282 EGP)',
          amount: '- 5 365,52 ',
          description: 'CLEOPATRA - ABU ASHARA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 5 365,52 ₸   Покупка      CLEOPATRA - ABU ASHARA\n(-282 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '(-86.55 EGP)',
          amount: '- 1 501,28 ',
          description: 'A MART',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 1 501,28 ₸   Покупка      A MART\n(-86.55 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '(-397.37 EGP)',
          amount: '- 6 901,20 ',
          description: 'METRO MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 6 901,20 ₸   Покупка      METRO MARKET\n(-397.37 EGP)'
        },
        {
          hold: false,
          date: '2023-01-03T00:00:00.000',
          originalAmount: '(-1667.5 EGP)',
          amount: '- 31 787,76 ',
          description: 'BESTWAY SUPERMA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.01.23- 31 787,76 ₸   Покупка      BESTWAY SUPERMA\n(-1667.5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-02T00:00:00.000',
          originalAmount: '(-180 EGP)',
          amount: '- 3 214,61 ',
          description: 'GEIDEABready',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.01.23- 3 214,61 ₸   Покупка      GEIDEABready\n(-180 EGP)'
        },
        {
          hold: false,
          date: '2023-01-01T00:00:00.000',
          originalAmount: null,
          amount: '- 25 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.23- 25 000,00 ₸   Перевод      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '(-224 EGP)',
          amount: '- 4 246,03 ',
          description: 'PH 14908 SENZO MALL',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '31.12.22- 4 246,03 ₸   Покупка      PH 14908 SENZO MALL\n(-224 EGP)'
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '(-645.27 EGP)',
          amount: '- 12 227,82 ',
          description: "SPINNEY'S 9",
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: "31.12.22- 12 227,82 ₸   Покупка      SPINNEY'S 9\n(-645.27 EGP)"
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '(-800 EGP)',
          amount: '- 15 163,05 ',
          description: 'CARINA DANDY MALL',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '31.12.22- 15 163,05 ₸   Покупка      CARINA DANDY MALL\n(-800 EGP)'
        },
        {
          hold: false,
          date: '2022-12-30T00:00:00.000',
          originalAmount: '(20000 RUB)',
          amount: '+ 124 400,00 ',
          description: 'Со счета другого банка',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.12.22+ 124 400,00 ₸   Пополнение      Со счета другого банка\n' +
            '(20000 RUB)'
        },
        {
          hold: false,
          date: '2022-12-30T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 208,58 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.12.22- 4 208,58 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2022-12-27T00:00:00.000',
          originalAmount: null,
          amount: '- 50 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.12.22- 50 000,00 ₸   Перевод      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2022-12-27T00:00:00.000',
          originalAmount: '(20000 RUB)',
          amount: '+ 130 600,00 ',
          description: 'Со счета другого банка',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.12.22+ 130 600,00 ₸   Пополнение      Со счета другого банка\n' +
            '(20000 RUB)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '(-1900 EGP)',
          amount: '- 36 576,91 ',
          description: 'Банкомат BEST WAY  HUR',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 36 576,91 ₸   Снятие      Банкомат BEST WAY  HUR\n(-1900 EGP)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '(-420 EGP)',
          amount: '- 8 083,32 ',
          description: 'ZOO FOOD',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 8 083,32 ₸   Покупка      ZOO FOOD\n(-420 EGP)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '(-1608.16 EGP)',
          amount: '- 30 955,18 ',
          description: 'BESTWAY SUPERMA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 30 955,18 ₸   Покупка      BESTWAY SUPERMA\n(-1608.16 EGP)'
        },
        {
          hold: false,
          date: '2022-12-19T00:00:00.000',
          originalAmount: '(-857.14 EGP)',
          amount: '- 16 499,29 ',
          description: 'TOP UP ETISALAT  EGYPT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '19.12.22- 16 499,29 ₸   Покупка      TOP UP ETISALAT  EGYPT\n' +
            '(-857.14 EGP)'
        },
        {
          hold: false,
          date: '2022-12-18T00:00:00.000',
          originalAmount: '(-2244.7 EGP)',
          amount: '- 43 210,85 ',
          description: 'GOMLA MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.12.22- 43 210,85 ₸   Покупка      GOMLA MARKET\n(-2244.7 EGP)'
        },
        {
          hold: false,
          date: '2022-12-17T00:00:00.000',
          originalAmount: '(-93 EGP)',
          amount: '- 1 785,81 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.12.22- 1 785,81 ₸   Покупка      Orange Egypt\n(-93 EGP)'
        },
        {
          hold: false,
          date: '2022-12-11T00:00:00.000',
          originalAmount: '(-1785 EGP)',
          amount: '- 34 500,25 ',
          description: 'EGY CRAFT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.12.22- 34 500,25 ₸   Покупка      EGY CRAFT\n(-1785 EGP)'
        },
        {
          hold: false,
          date: '2022-12-11T00:00:00.000',
          originalAmount: '(-567 EGP)',
          amount: '- 10 932,34 ',
          description: 'SELECT FOR PAPYRUS',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.12.22- 10 932,34 ₸   Покупка      SELECT FOR PAPYRUS\n(-567 EGP)'
        },
        {
          hold: false,
          date: '2022-12-07T00:00:00.000',
          originalAmount: '(-134 EGP)',
          amount: '- 2 595,40 ',
          description: 'M E GROUP CIRCLE K',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '07.12.22- 2 595,40 ₸   Покупка      M E GROUP CIRCLE K\n(-134 EGP)'
        },
        {
          hold: false,
          date: '2022-12-06T00:00:00.000',
          originalAmount: '(-34.95 EGP)',
          amount: '- 677,67 ',
          description: "SPINNEY'S 2",
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: "06.12.22- 677,67 ₸   Покупка      SPINNEY'S 2\n(-34.95 EGP)"
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '(-1289.72 EGP)',
          amount: '- 25 074,14 ',
          description: 'CARREFOUR-HCC',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 25 074,14 ₸   Покупка      CARREFOUR-HCC\n(-1289.72 EGP)'
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '(-31 EGP)',
          amount: '- 601,44 ',
          description: 'EL ZAHRAA BAKERY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 601,44 ₸   Покупка      EL ZAHRAA BAKERY\n(-31 EGP)'
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '(-420.09 EGP)',
          amount: '- 8 171,89 ',
          description: 'THE MOON RESTAURANT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 8 171,89 ₸   Покупка      THE MOON RESTAURANT\n(-420.09 EGP)'
        },
        {
          hold: false,
          date: '2022-11-30T00:00:00.000',
          originalAmount: '(-310 EGP)',
          amount: '- 5 995,46 ',
          description: 'GRILL HOUSE ELKAWTHER',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.11.22- 5 995,46 ₸   Покупка      GRILL HOUSE ELKAWTHER\n(-310 EGP)'
        },
        {
          hold: false,
          date: '2022-11-30T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 253,98 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.11.22- 4 253,98 ₸   Покупка      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2022-11-29T00:00:00.000',
          originalAmount: '(-1325 EGP)',
          amount: '- 25 633,80 ',
          description: 'ROYAL ZONE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '29.11.22- 25 633,80 ₸   Покупка      ROYAL ZONE\n(-1325 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-271.45 EGP)',
          amount: '- 5 243,75 ',
          description: 'COFFE PLUS',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 5 243,75 ₸   Покупка      COFFE PLUS\n(-271.45 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-2307.53 EGP)',
          amount: '- 44 578,97 ',
          description: 'CARREFOUR-HCC',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 44 578,97 ₸   Покупка      CARREFOUR-HCC\n(-2307.53 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-449.8 EGP)',
          amount: '- 8 678,30 ',
          description: 'Miniso',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 8 678,30 ₸   Покупка      Miniso\n(-449.8 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-2088 EGP)',
          amount: '- 40 292,13 ',
          description: 'ONE LOOK HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 40 292,13 ₸   Покупка      ONE LOOK HURGHADA\n(-2088 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-416.02 EGP)',
          amount: '- 8 033,78 ',
          description: 'GEIDEAGreen Cafe',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 8 033,78 ₸   Покупка      GEIDEAGreen Cafe\n(-416.02 EGP)'
        },
        {
          hold: false,
          date: '2022-11-25T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 213,06 ',
          description: 'по номеру счета PAYDALA LLP',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '25.11.22+ 108 213,06 ₸   Пополнение      по номеру счета PAYDALA LLP\n'
        },
        {
          hold: false,
          date: '2022-11-25T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 213,06 ',
          description: 'по номеру счета P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '25.11.22+ 108 213,06 ₸   Пополнение      по номеру счета P2P PAYDALA*POPOLNENIE\n'
        },
        {
          hold: false,
          date: '2022-11-22T00:00:00.000',
          originalAmount: '(-2000 EGP)',
          amount: '- 38 247,04 ',
          description: 'Банкомат NBE ATM945',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '22.11.22- 38 247,04 ₸   Снятие      Банкомат NBE ATM945\n(-2000 EGP)'
        },
        {
          hold: false,
          date: '2022-11-20T00:00:00.000',
          originalAmount: '(-225 EGP)',
          amount: '- 4 311,49 ',
          description: 'CINNABON HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.11.22- 4 311,49 ₸   Покупка      CINNABON HURGHADA\n(-225 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '(-500 EGP)',
          amount: '- 9 552,81 ',
          description: 'PAYMOB SAND CITY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 9 552,81 ₸   Покупка      PAYMOB SAND CITY\n(-500 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '(-2000 EGP)',
          amount: '- 38 206,56 ',
          description: 'Банкомат THE VIEW HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 38 206,56 ₸   Снятие      Банкомат THE VIEW HURGHADA\n' +
            '(-2000 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '(-183 EGP)',
          amount: '- 3 494,13 ',
          description: 'GRILL HOUSE ELKAWTHER',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 3 494,13 ₸   Покупка      GRILL HOUSE ELKAWTHER\n(-183 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: '(-57.25 EGP)',
          amount: '- 1 093,08 ',
          description: 'METRO - HURGHADA STORE &D',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22- 1 093,08 ₸   Покупка      METRO - HURGHADA STORE &D\n' +
            '(-57.25 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: '(-113 EGP)',
          amount: '- 2 158,14 ',
          description: 'EL ZAHRAA BAKERY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22- 2 158,14 ₸   Покупка      EL ZAHRAA BAKERY\n(-113 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: null,
          amount: '+ 107 893,16 ',
          description: 'по номеру счета P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22+ 107 893,16 ₸   Пополнение      по номеру счета P2P PAYDALA*POPOLNENIE\n'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: null,
          amount: '+ 107 893,16 ',
          description: 'по номеру счета P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22+ 107 893,16 ₸   Пополнение      по номеру счета P2P PAYDALA*POPOLNENIE\n'
        },
        {
          hold: false,
          date: '2022-11-16T00:00:00.000',
          originalAmount: '(-350 EGP)',
          amount: '- 6 641,47 ',
          description: 'ROYAL ZONE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '16.11.22- 6 641,47 ₸   Покупка      ROYAL ZONE\n(-350 EGP)'
        },
        {
          hold: false,
          date: '2022-11-16T00:00:00.000',
          originalAmount: '(-62 EGP)',
          amount: '- 1 178,03 ',
          description: 'M E GROUP CIRCLE K',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '16.11.22- 1 178,03 ₸   Покупка      M E GROUP CIRCLE K\n(-62 EGP)'
        },
        {
          hold: false,
          date: '2022-11-15T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 042,54 ',
          description: 'по номеру счета P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.11.22+ 108 042,54 ₸   Пополнение      по номеру счета P2P PAYDALA*POPOLNENIE\n'
        },
        {
          hold: false,
          date: '2022-11-03T00:00:00.000',
          originalAmount: null,
          amount: '- 675,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.11.22- 675,00 ₸   Покупка      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-03T00:00:00.000',
          originalAmount: null,
          amount: '+ 10 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.11.22+ 10 000,00 ₸   Пополнение      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 4 390,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 4 390,00 ₸   Покупка      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 10 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 10 000,00 ₸   Перевод      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 2 060,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 2 060,00 ₸   Покупка      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '- 3 795,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22- 3 795,00 ₸   Покупка      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '- 5 565,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22- 5 565,00 ₸   Покупка      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '+ 7 115,81 ',
          description: 'по номеру счета PAYDALA LLP',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22+ 7 115,81 ₸   Пополнение      по номеру счета PAYDALA LLP\n'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '+ 22 000,00 ',
          description: 'В Kaspi Банкомате',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22+ 22 000,00 ₸   Пополнение      В Kaspi Банкомате\n'
        }
      ]
    }
  ],
  [
    statements[1],
    {
      account: {
        balance: 80995.97,
        id: 'KZ111111',
        instrument: 'KZT',
        title: 'Kaspi Gold *0475',
        date: '2023-04-17T00:00:00.000',
        capitalization: null,
        endDate: null,
        startBalance: null,
        startDate: null,
        type: 'gold'
      },
      transactions: [
        {
          hold: false,
          date: '2023-04-09T00:00:00.000',
          originalAmount: null,
          amount: '- 20 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '09.04.23- 20 000,00 ₸   Transfers      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2023-03-30T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 093,24 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.03.23- 4 093,24 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-03-01T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 022,40 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.03.23- 4 022,40 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-02-26T00:00:00.000',
          originalAmount: '(-115 EGP)',
          amount: '- 1 697,53 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.02.23- 1 697,53 ₸   Purchases      Orange Egypt\n(-115 EGP)'
        },
        {
          hold: false,
          date: '2023-02-04T00:00:00.000',
          originalAmount: '(-72 EGP)',
          amount: '- 1 100,94 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.02.23- 1 100,94 ₸   Purchases      Orange Egypt\n(-72 EGP)'
        },
        {
          hold: false,
          date: '2023-01-30T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 179,45 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.01.23- 4 179,45 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-01-26T00:00:00.000',
          originalAmount: '(-73 EGP)',
          amount: '- 1 136,09 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.01.23- 1 136,09 ₸   Purchases      Orange Egypt\n(-73 EGP)'
        },
        {
          hold: false,
          date: '2023-01-24T00:00:00.000',
          originalAmount: null,
          amount: '- 50 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '24.01.23- 50 000,00 ₸   Transfers      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '(-258 EGP)',
          amount: '- 4 100,37 ',
          description: 'MCDONALDSHURGHADA1',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 4 100,37 ₸   Purchases      MCDONALDSHURGHADA1\n(-258 EGP)'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '(-5 EGP)',
          amount: '- 79,58 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 79,58 ₸   Purchases      UBER *TRIP HELP.UBER.COM\n(-5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '(-17 EGP)',
          amount: '- 271,52 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 271,52 ₸   Purchases      UBER *TRIP HELP.UBER.COM\n(-17 EGP)'
        },
        {
          hold: false,
          date: '2023-01-14T00:00:00.000',
          originalAmount: '(-89 EGP)',
          amount: '- 1 413,78 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.01.23- 1 413,78 ₸   Purchases      Orange Egypt\n(-89 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '(-477.6 EGP)',
          amount: '- 7 570,93 ',
          description: 'METRO MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 7 570,93 ₸   Purchases      METRO MARKET\n(-477.6 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '(-5 EGP)',
          amount: '- 79,50 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 79,50 ₸   Purchases      UBER *TRIP HELP.UBER.COM\n(-5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '(-16 EGP)',
          amount: '- 271,23 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 271,23 ₸   Purchases      UBER *TRIP HELP.UBER.COM\n(-16 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '(-282 EGP)',
          amount: '- 5 365,52 ',
          description: 'CLEOPATRA - ABU ASHARA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 5 365,52 ₸   Purchases      CLEOPATRA - ABU ASHARA\n' +
            '(-282 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '(-86.55 EGP)',
          amount: '- 1 501,28 ',
          description: 'A MART',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 1 501,28 ₸   Purchases      A MART\n(-86.55 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '(-397.37 EGP)',
          amount: '- 6 901,20 ',
          description: 'METRO MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 6 901,20 ₸   Purchases      METRO MARKET\n(-397.37 EGP)'
        },
        {
          hold: false,
          date: '2023-01-03T00:00:00.000',
          originalAmount: '(-1667.5 EGP)',
          amount: '- 31 787,76 ',
          description: 'BESTWAY SUPERMA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.01.23- 31 787,76 ₸   Purchases      BESTWAY SUPERMA\n(-1667.5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-02T00:00:00.000',
          originalAmount: '(-180 EGP)',
          amount: '- 3 214,61 ',
          description: 'GEIDEABready',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.01.23- 3 214,61 ₸   Purchases      GEIDEABready\n(-180 EGP)'
        },
        {
          hold: false,
          date: '2023-01-01T00:00:00.000',
          originalAmount: null,
          amount: '- 25 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.23- 25 000,00 ₸   Transfers      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '(-224 EGP)',
          amount: '- 4 246,03 ',
          description: 'PH 14908 SENZO MALL',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '31.12.22- 4 246,03 ₸   Purchases      PH 14908 SENZO MALL\n(-224 EGP)'
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '(-645.27 EGP)',
          amount: '- 12 227,82 ',
          description: "SPINNEY'S 9",
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: "31.12.22- 12 227,82 ₸   Purchases      SPINNEY'S 9\n(-645.27 EGP)"
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '(-800 EGP)',
          amount: '- 15 163,05 ',
          description: 'CARINA DANDY MALL',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '31.12.22- 15 163,05 ₸   Purchases      CARINA DANDY MALL\n(-800 EGP)'
        },
        {
          hold: false,
          date: '2022-12-30T00:00:00.000',
          originalAmount: '(20000 RUB)',
          amount: '+ 124 400,00 ',
          description: 'From an account in another bank',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.12.22+ 124 400,00 ₸   Replenishment      From an account in another bank\n' +
            '(20000 RUB)'
        },
        {
          hold: false,
          date: '2022-12-30T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 208,58 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.12.22- 4 208,58 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2022-12-27T00:00:00.000',
          originalAmount: null,
          amount: '- 50 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.12.22- 50 000,00 ₸   Transfers      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2022-12-27T00:00:00.000',
          originalAmount: '(20000 RUB)',
          amount: '+ 130 600,00 ',
          description: 'From an account in another bank',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.12.22+ 130 600,00 ₸   Replenishment      From an account in another bank\n' +
            '(20000 RUB)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '(-1900 EGP)',
          amount: '- 36 576,91 ',
          description: 'ATM BEST WAY  HUR',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 36 576,91 ₸   Withdrawals      ATM BEST WAY  HUR\n(-1900 EGP)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '(-420 EGP)',
          amount: '- 8 083,32 ',
          description: 'ZOO FOOD',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 8 083,32 ₸   Purchases      ZOO FOOD\n(-420 EGP)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '(-1608.16 EGP)',
          amount: '- 30 955,18 ',
          description: 'BESTWAY SUPERMA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 30 955,18 ₸   Purchases      BESTWAY SUPERMA\n(-1608.16 EGP)'
        },
        {
          hold: false,
          date: '2022-12-19T00:00:00.000',
          originalAmount: '(-857.14 EGP)',
          amount: '- 16 499,29 ',
          description: 'TOP UP ETISALAT  EGYPT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '19.12.22- 16 499,29 ₸   Purchases      TOP UP ETISALAT  EGYPT\n' +
            '(-857.14 EGP)'
        },
        {
          hold: false,
          date: '2022-12-18T00:00:00.000',
          originalAmount: '(-2244.7 EGP)',
          amount: '- 43 210,85 ',
          description: 'GOMLA MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.12.22- 43 210,85 ₸   Purchases      GOMLA MARKET\n(-2244.7 EGP)'
        },
        {
          hold: false,
          date: '2022-12-17T00:00:00.000',
          originalAmount: '(-93 EGP)',
          amount: '- 1 785,81 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.12.22- 1 785,81 ₸   Purchases      Orange Egypt\n(-93 EGP)'
        },
        {
          hold: false,
          date: '2022-12-11T00:00:00.000',
          originalAmount: '(-1785 EGP)',
          amount: '- 34 500,25 ',
          description: 'EGY CRAFT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.12.22- 34 500,25 ₸   Purchases      EGY CRAFT\n(-1785 EGP)'
        },
        {
          hold: false,
          date: '2022-12-11T00:00:00.000',
          originalAmount: '(-567 EGP)',
          amount: '- 10 932,34 ',
          description: 'SELECT FOR PAPYRUS',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.12.22- 10 932,34 ₸   Purchases      SELECT FOR PAPYRUS\n(-567 EGP)'
        },
        {
          hold: false,
          date: '2022-12-07T00:00:00.000',
          originalAmount: '(-134 EGP)',
          amount: '- 2 595,40 ',
          description: 'M E GROUP CIRCLE K',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '07.12.22- 2 595,40 ₸   Purchases      M E GROUP CIRCLE K\n(-134 EGP)'
        },
        {
          hold: false,
          date: '2022-12-06T00:00:00.000',
          originalAmount: '(-34.95 EGP)',
          amount: '- 677,67 ',
          description: "SPINNEY'S 2",
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: "06.12.22- 677,67 ₸   Purchases      SPINNEY'S 2\n(-34.95 EGP)"
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '(-1289.72 EGP)',
          amount: '- 25 074,14 ',
          description: 'CARREFOUR-HCC',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 25 074,14 ₸   Purchases      CARREFOUR-HCC\n(-1289.72 EGP)'
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '(-31 EGP)',
          amount: '- 601,44 ',
          description: 'EL ZAHRAA BAKERY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 601,44 ₸   Purchases      EL ZAHRAA BAKERY\n(-31 EGP)'
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '(-420.09 EGP)',
          amount: '- 8 171,89 ',
          description: 'THE MOON RESTAURANT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 8 171,89 ₸   Purchases      THE MOON RESTAURANT\n' +
            '(-420.09 EGP)'
        },
        {
          hold: false,
          date: '2022-11-30T00:00:00.000',
          originalAmount: '(-310 EGP)',
          amount: '- 5 995,46 ',
          description: 'GRILL HOUSE ELKAWTHER',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.11.22- 5 995,46 ₸   Purchases      GRILL HOUSE ELKAWTHER\n(-310 EGP)'
        },
        {
          hold: false,
          date: '2022-11-30T00:00:00.000',
          originalAmount: '(-8.99 USD)',
          amount: '- 4 253,98 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.11.22- 4 253,98 ₸   Purchases      ZOOM.US 888-799-9666\n(-8.99 USD)'
        },
        {
          hold: false,
          date: '2022-11-29T00:00:00.000',
          originalAmount: '(-1325 EGP)',
          amount: '- 25 633,80 ',
          description: 'ROYAL ZONE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '29.11.22- 25 633,80 ₸   Purchases      ROYAL ZONE\n(-1325 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-271.45 EGP)',
          amount: '- 5 243,75 ',
          description: 'COFFE PLUS',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 5 243,75 ₸   Purchases      COFFE PLUS\n(-271.45 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-2307.53 EGP)',
          amount: '- 44 578,97 ',
          description: 'CARREFOUR-HCC',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 44 578,97 ₸   Purchases      CARREFOUR-HCC\n(-2307.53 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-449.8 EGP)',
          amount: '- 8 678,30 ',
          description: 'Miniso',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 8 678,30 ₸   Purchases      Miniso\n(-449.8 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-2088 EGP)',
          amount: '- 40 292,13 ',
          description: 'ONE LOOK HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 40 292,13 ₸   Purchases      ONE LOOK HURGHADA\n(-2088 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '(-416.02 EGP)',
          amount: '- 8 033,78 ',
          description: 'GEIDEAGreen Cafe',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 8 033,78 ₸   Purchases      GEIDEAGreen Cafe\n(-416.02 EGP)'
        },
        {
          hold: false,
          date: '2022-11-25T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 213,06 ',
          description: 'by account number PAYDALA LLP',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '25.11.22+ 108 213,06 ₸   Replenishment      by account number PAYDALA LLP\n'
        },
        {
          hold: false,
          date: '2022-11-25T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 213,06 ',
          description: 'by account number P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '25.11.22+ 108 213,06 ₸   Replenishment      by account number P2P PAYDALA*POPOLNENIE\n'
        },
        {
          hold: false,
          date: '2022-11-22T00:00:00.000',
          originalAmount: '(-2000 EGP)',
          amount: '- 38 247,04 ',
          description: 'ATM NBE ATM945',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '22.11.22- 38 247,04 ₸   Withdrawals      ATM NBE ATM945\n(-2000 EGP)'
        },
        {
          hold: false,
          date: '2022-11-20T00:00:00.000',
          originalAmount: '(-225 EGP)',
          amount: '- 4 311,49 ',
          description: 'CINNABON HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.11.22- 4 311,49 ₸   Purchases      CINNABON HURGHADA\n(-225 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '(-500 EGP)',
          amount: '- 9 552,81 ',
          description: 'PAYMOB SAND CITY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 9 552,81 ₸   Purchases      PAYMOB SAND CITY\n(-500 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '(-2000 EGP)',
          amount: '- 38 206,56 ',
          description: 'ATM THE VIEW HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 38 206,56 ₸   Withdrawals      ATM THE VIEW HURGHADA\n' +
            '(-2000 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '(-183 EGP)',
          amount: '- 3 494,13 ',
          description: 'GRILL HOUSE ELKAWTHER',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 3 494,13 ₸   Purchases      GRILL HOUSE ELKAWTHER\n(-183 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: '(-57.25 EGP)',
          amount: '- 1 093,08 ',
          description: 'METRO - HURGHADA STORE &D',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22- 1 093,08 ₸   Purchases      METRO - HURGHADA STORE &D\n' +
            '(-57.25 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: '(-113 EGP)',
          amount: '- 2 158,14 ',
          description: 'EL ZAHRAA BAKERY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22- 2 158,14 ₸   Purchases      EL ZAHRAA BAKERY\n(-113 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: null,
          amount: '+ 107 893,16 ',
          description: 'by account number P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22+ 107 893,16 ₸   Replenishment      by account number P2P PAYDALA*POPOLNENIE\n'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: null,
          amount: '+ 107 893,16 ',
          description: 'by account number P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22+ 107 893,16 ₸   Replenishment      by account number P2P PAYDALA*POPOLNENIE\n'
        },
        {
          hold: false,
          date: '2022-11-16T00:00:00.000',
          originalAmount: '(-350 EGP)',
          amount: '- 6 641,47 ',
          description: 'ROYAL ZONE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '16.11.22- 6 641,47 ₸   Purchases      ROYAL ZONE\n(-350 EGP)'
        },
        {
          hold: false,
          date: '2022-11-16T00:00:00.000',
          originalAmount: '(-62 EGP)',
          amount: '- 1 178,03 ',
          description: 'M E GROUP CIRCLE K',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '16.11.22- 1 178,03 ₸   Purchases      M E GROUP CIRCLE K\n(-62 EGP)'
        },
        {
          hold: false,
          date: '2022-11-15T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 042,54 ',
          description: 'by account number P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.11.22+ 108 042,54 ₸   Replenishment      by account number P2P PAYDALA*POPOLNENIE\n'
        },
        {
          hold: false,
          date: '2022-11-03T00:00:00.000',
          originalAmount: null,
          amount: '- 675,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.11.22- 675,00 ₸   Purchases      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-03T00:00:00.000',
          originalAmount: null,
          amount: '+ 10 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.11.22+ 10 000,00 ₸   Replenishment      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 4 390,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 4 390,00 ₸   Purchases      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 10 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 10 000,00 ₸   Transfers      Ilsiiar G.\n'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 2 060,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 2 060,00 ₸   Purchases      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '- 3 795,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22- 3 795,00 ₸   Purchases      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '- 5 565,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22- 5 565,00 ₸   Purchases      TOO BIZNES KZ-2020\n'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '+ 7 115,81 ',
          description: 'by account number PAYDALA LLP',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22+ 7 115,81 ₸   Replenishment      by account number PAYDALA LLP\n'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '+ 22 000,00 ',
          description: 'At Kaspi ATM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22+ 22 000,00 ₸   Replenishment      At Kaspi ATM\n'
        }
      ]
    }
  ],
  [
    statements[2],
    {
      account: {
        balance: 80995.97,
        id: 'KZ111111',
        instrument: 'KZT',
        title: 'Kaspi Gold *0475',
        date: '2023-04-17T00:00:00.000',
        capitalization: null,
        endDate: null,
        startBalance: null,
        startDate: null,
        type: 'gold'
      },
      transactions: [
        {
          hold: false,
          date: '2023-04-09T00:00:00.000',
          originalAmount: null,
          amount: '- 20 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '09.04.23- 20 000,00 ₸   Аударым      Ilsiiar G.'
        },
        {
          hold: false,
          date: '2023-03-30T00:00:00.000',
          originalAmount: '\n(-8.99 USD)',
          amount: '- 4 093,24 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.03.23- 4 093,24 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n' +
            '(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-03-01T00:00:00.000',
          originalAmount: '\n(-8.99 USD)',
          amount: '- 4 022,40 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.03.23- 4 022,40 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n' +
            '(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-02-26T00:00:00.000',
          originalAmount: '\n(-115 EGP)',
          amount: '- 1 697,53 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.02.23- 1 697,53 ₸   Зат сатып алу      Orange Egypt\n(-115 EGP)'
        },
        {
          hold: false,
          date: '2023-02-04T00:00:00.000',
          originalAmount: '\n(-72 EGP)',
          amount: '- 1 100,94 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.02.23- 1 100,94 ₸   Зат сатып алу      Orange Egypt\n(-72 EGP)'
        },
        {
          hold: false,
          date: '2023-01-30T00:00:00.000',
          originalAmount: '\n(-8.99 USD)',
          amount: '- 4 179,45 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.01.23- 4 179,45 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n' +
            '(-8.99 USD)'
        },
        {
          hold: false,
          date: '2023-01-26T00:00:00.000',
          originalAmount: '\n(-73 EGP)',
          amount: '- 1 136,09 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.01.23- 1 136,09 ₸   Зат сатып алу      Orange Egypt\n(-73 EGP)'
        },
        {
          hold: false,
          date: '2023-01-24T00:00:00.000',
          originalAmount: null,
          amount: '- 50 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '24.01.23- 50 000,00 ₸   Аударым      Ilsiiar G.'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '\n(-258 EGP)',
          amount: '- 4 100,37 ',
          description: 'MCDONALDSHURGHADA1',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 4 100,37 ₸   Зат сатып алу      MCDONALDSHURGHADA1\n' +
            '(-258 EGP)'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '\n(-5 EGP)',
          amount: '- 79,58 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 79,58 ₸   Зат сатып алу      UBER *TRIP HELP.UBER.COM\n' +
            '(-5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-15T00:00:00.000',
          originalAmount: '\n(-17 EGP)',
          amount: '- 271,52 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.01.23- 271,52 ₸   Зат сатып алу      UBER *TRIP HELP.UBER.COM\n' +
            '(-17 EGP)'
        },
        {
          hold: false,
          date: '2023-01-14T00:00:00.000',
          originalAmount: '\n(-89 EGP)',
          amount: '- 1 413,78 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.01.23- 1 413,78 ₸   Зат сатып алу      Orange Egypt\n(-89 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '\n(-477.6 EGP)',
          amount: '- 7 570,93 ',
          description: 'METRO MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 7 570,93 ₸   Зат сатып алу      METRO MARKET\n(-477.6 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '\n(-5 EGP)',
          amount: '- 79,50 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 79,50 ₸   Зат сатып алу      UBER *TRIP HELP.UBER.COM\n' +
            '(-5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-11T00:00:00.000',
          originalAmount: '\n(-16 EGP)',
          amount: '- 271,23 ',
          description: 'UBER *TRIP HELP.UBER.COM',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.01.23- 271,23 ₸   Зат сатып алу      UBER *TRIP HELP.UBER.COM\n' +
            '(-16 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '\n(-282 EGP)',
          amount: '- 5 365,52 ',
          description: 'CLEOPATRA - ABU ASHARA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 5 365,52 ₸   Зат сатып алу      CLEOPATRA - ABU ASHARA\n' +
            '(-282 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '\n(-86.55 EGP)',
          amount: '- 1 501,28 ',
          description: 'A MART',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 1 501,28 ₸   Зат сатып алу      A MART\n(-86.55 EGP)'
        },
        {
          hold: false,
          date: '2023-01-04T00:00:00.000',
          originalAmount: '\n(-397.37 EGP)',
          amount: '- 6 901,20 ',
          description: 'METRO MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.01.23- 6 901,20 ₸   Зат сатып алу      METRO MARKET\n(-397.37 EGP)'
        },
        {
          hold: false,
          date: '2023-01-03T00:00:00.000',
          originalAmount: '\n(-1667.5 EGP)',
          amount: '- 31 787,76 ',
          description: 'BESTWAY SUPERMA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.01.23- 31 787,76 ₸   Зат сатып алу      BESTWAY SUPERMA\n' +
            '(-1667.5 EGP)'
        },
        {
          hold: false,
          date: '2023-01-02T00:00:00.000',
          originalAmount: '\n(-180 EGP)',
          amount: '- 3 214,61 ',
          description: 'GEIDEABready',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.01.23- 3 214,61 ₸   Зат сатып алу      GEIDEABready\n(-180 EGP)'
        },
        {
          hold: false,
          date: '2023-01-01T00:00:00.000',
          originalAmount: null,
          amount: '- 25 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.23- 25 000,00 ₸   Аударым      Ilsiiar G.'
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '\n(-224 EGP)',
          amount: '- 4 246,03 ',
          description: 'PH 14908 SENZO MALL',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '31.12.22- 4 246,03 ₸   Зат сатып алу      PH 14908 SENZO MALL\n' +
            '(-224 EGP)'
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '\n(-645.27 EGP)',
          amount: '- 12 227,82 ',
          description: "SPINNEY'S 9",
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: "31.12.22- 12 227,82 ₸   Зат сатып алу      SPINNEY'S 9\n(-645.27 EGP)"
        },
        {
          hold: false,
          date: '2022-12-31T00:00:00.000',
          originalAmount: '\n(-800 EGP)',
          amount: '- 15 163,05 ',
          description: 'CARINA DANDY MALL',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '31.12.22- 15 163,05 ₸   Зат сатып алу      CARINA DANDY MALL\n' +
            '(-800 EGP)'
        },
        {
          hold: false,
          date: '2022-12-30T00:00:00.000',
          originalAmount: '\n(20000 RUB)',
          amount: '+ 124 400,00 ',
          description: 'Басқа банктің шотынан',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.12.22+ 124 400,00 ₸   Толықтыру      Басқа банктің шотынан\n' +
            '(20000 RUB)'
        },
        {
          hold: false,
          date: '2022-12-30T00:00:00.000',
          originalAmount: '\n(-8.99 USD)',
          amount: '- 4 208,58 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.12.22- 4 208,58 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n' +
            '(-8.99 USD)'
        },
        {
          hold: false,
          date: '2022-12-27T00:00:00.000',
          originalAmount: null,
          amount: '- 50 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.12.22- 50 000,00 ₸   Аударым      Ilsiiar G.'
        },
        {
          hold: false,
          date: '2022-12-27T00:00:00.000',
          originalAmount: '\n(20000 RUB)',
          amount: '+ 130 600,00 ',
          description: 'Басқа банктің шотынан',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.12.22+ 130 600,00 ₸   Толықтыру      Басқа банктің шотынан\n' +
            '(20000 RUB)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '\n(-1900 EGP)',
          amount: '- 36 576,91 ',
          description: 'Банкомат BEST WAY  HUR',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 36 576,91 ₸   Ақша алу      Банкомат BEST WAY  HUR\n' +
            '(-1900 EGP)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '\n(-420 EGP)',
          amount: '- 8 083,32 ',
          description: 'ZOO FOOD',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 8 083,32 ₸   Зат сатып алу      ZOO FOOD\n(-420 EGP)'
        },
        {
          hold: false,
          date: '2022-12-20T00:00:00.000',
          originalAmount: '\n(-1608.16 EGP)',
          amount: '- 30 955,18 ',
          description: 'BESTWAY SUPERMA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.12.22- 30 955,18 ₸   Зат сатып алу      BESTWAY SUPERMA\n' +
            '(-1608.16 EGP)'
        },
        {
          hold: false,
          date: '2022-12-19T00:00:00.000',
          originalAmount: '\n(-857.14 EGP)',
          amount: '- 16 499,29 ',
          description: 'TOP UP ETISALAT  EGYPT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '19.12.22- 16 499,29 ₸   Зат сатып алу      TOP UP ETISALAT  EGYPT\n' +
            '(-857.14 EGP)'
        },
        {
          hold: false,
          date: '2022-12-18T00:00:00.000',
          originalAmount: '\n(-2244.7 EGP)',
          amount: '- 43 210,85 ',
          description: 'GOMLA MARKET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.12.22- 43 210,85 ₸   Зат сатып алу      GOMLA MARKET\n(-2244.7 EGP)'
        },
        {
          hold: false,
          date: '2022-12-17T00:00:00.000',
          originalAmount: '\n(-93 EGP)',
          amount: '- 1 785,81 ',
          description: 'Orange Egypt',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.12.22- 1 785,81 ₸   Зат сатып алу      Orange Egypt\n(-93 EGP)'
        },
        {
          hold: false,
          date: '2022-12-11T00:00:00.000',
          originalAmount: '\n(-1785 EGP)',
          amount: '- 34 500,25 ',
          description: 'EGY CRAFT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.12.22- 34 500,25 ₸   Зат сатып алу      EGY CRAFT\n(-1785 EGP)'
        },
        {
          hold: false,
          date: '2022-12-11T00:00:00.000',
          originalAmount: '\n(-567 EGP)',
          amount: '- 10 932,34 ',
          description: 'SELECT FOR PAPYRUS',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.12.22- 10 932,34 ₸   Зат сатып алу      SELECT FOR PAPYRUS\n' +
            '(-567 EGP)'
        },
        {
          hold: false,
          date: '2022-12-07T00:00:00.000',
          originalAmount: '\n(-134 EGP)',
          amount: '- 2 595,40 ',
          description: 'M E GROUP CIRCLE K',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '07.12.22- 2 595,40 ₸   Зат сатып алу      M E GROUP CIRCLE K\n' +
            '(-134 EGP)'
        },
        {
          hold: false,
          date: '2022-12-06T00:00:00.000',
          originalAmount: '\n(-34.95 EGP)',
          amount: '- 677,67 ',
          description: "SPINNEY'S 2",
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: "06.12.22- 677,67 ₸   Зат сатып алу      SPINNEY'S 2\n(-34.95 EGP)"
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '\n(-1289.72 EGP)',
          amount: '- 25 074,14 ',
          description: 'CARREFOUR-HCC',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 25 074,14 ₸   Зат сатып алу      CARREFOUR-HCC\n' +
            '(-1289.72 EGP)'
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '\n(-31 EGP)',
          amount: '- 601,44 ',
          description: 'EL ZAHRAA BAKERY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 601,44 ₸   Зат сатып алу      EL ZAHRAA BAKERY\n(-31 EGP)'
        },
        {
          hold: false,
          date: '2022-12-04T00:00:00.000',
          originalAmount: '\n(-420.09 EGP)',
          amount: '- 8 171,89 ',
          description: 'THE MOON RESTAURANT',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.12.22- 8 171,89 ₸   Зат сатып алу      THE MOON RESTAURANT\n' +
            '(-420.09 EGP)'
        },
        {
          hold: false,
          date: '2022-11-30T00:00:00.000',
          originalAmount: '\n(-310 EGP)',
          amount: '- 5 995,46 ',
          description: 'GRILL HOUSE ELKAWTHER',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.11.22- 5 995,46 ₸   Зат сатып алу      GRILL HOUSE ELKAWTHER\n' +
            '(-310 EGP)'
        },
        {
          hold: false,
          date: '2022-11-30T00:00:00.000',
          originalAmount: '\n(-8.99 USD)',
          amount: '- 4 253,98 ',
          description: 'ZOOM.US 888-799-9666',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.11.22- 4 253,98 ₸   Зат сатып алу      ZOOM.US 888-799-9666\n' +
            '(-8.99 USD)'
        },
        {
          hold: false,
          date: '2022-11-29T00:00:00.000',
          originalAmount: '\n(-1325 EGP)',
          amount: '- 25 633,80 ',
          description: 'ROYAL ZONE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '29.11.22- 25 633,80 ₸   Зат сатып алу      ROYAL ZONE\n(-1325 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '\n(-271.45 EGP)',
          amount: '- 5 243,75 ',
          description: 'COFFE PLUS',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 5 243,75 ₸   Зат сатып алу      COFFE PLUS\n(-271.45 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '\n(-2307.53 EGP)',
          amount: '- 44 578,97 ',
          description: 'CARREFOUR-HCC',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 44 578,97 ₸   Зат сатып алу      CARREFOUR-HCC\n' +
            '(-2307.53 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '\n(-449.8 EGP)',
          amount: '- 8 678,30 ',
          description: 'Miniso',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 8 678,30 ₸   Зат сатып алу      Miniso\n(-449.8 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '\n(-2088 EGP)',
          amount: '- 40 292,13 ',
          description: 'ONE LOOK HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 40 292,13 ₸   Зат сатып алу      ONE LOOK HURGHADA\n' +
            '(-2088 EGP)'
        },
        {
          hold: false,
          date: '2022-11-27T00:00:00.000',
          originalAmount: '\n(-416.02 EGP)',
          amount: '- 8 033,78 ',
          description: 'GEIDEAGreen Cafe',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.11.22- 8 033,78 ₸   Зат сатып алу      GEIDEAGreen Cafe\n' +
            '(-416.02 EGP)'
        },
        {
          hold: false,
          date: '2022-11-25T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 213,06 ',
          description: 'шот нөмірі бойынша PAYDALA LLP',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '25.11.22+ 108 213,06 ₸   Толықтыру      шот нөмірі бойынша PAYDALA LLP'
        },
        {
          hold: false,
          date: '2022-11-25T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 213,06 ',
          description: 'шот нөмірі бойынша P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '25.11.22+ 108 213,06 ₸   Толықтыру      шот нөмірі бойынша P2P PAYDALA*POPOLNENIE'
        },
        {
          hold: false,
          date: '2022-11-22T00:00:00.000',
          originalAmount: '\n(-2000 EGP)',
          amount: '- 38 247,04 ',
          description: 'Банкомат NBE ATM945',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '22.11.22- 38 247,04 ₸   Ақша алу      Банкомат NBE ATM945\n(-2000 EGP)'
        },
        {
          hold: false,
          date: '2022-11-20T00:00:00.000',
          originalAmount: '\n(-225 EGP)',
          amount: '- 4 311,49 ',
          description: 'CINNABON HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '20.11.22- 4 311,49 ₸   Зат сатып алу      CINNABON HURGHADA\n(-225 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '\n(-500 EGP)',
          amount: '- 9 552,81 ',
          description: 'PAYMOB SAND CITY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 9 552,81 ₸   Зат сатып алу      PAYMOB SAND CITY\n(-500 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '\n(-2000 EGP)',
          amount: '- 38 206,56 ',
          description: 'Банкомат THE VIEW HURGHADA',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 38 206,56 ₸   Ақша алу      Банкомат THE VIEW HURGHADA\n' +
            '(-2000 EGP)'
        },
        {
          hold: false,
          date: '2022-11-18T00:00:00.000',
          originalAmount: '\n(-183 EGP)',
          amount: '- 3 494,13 ',
          description: 'GRILL HOUSE ELKAWTHER',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.11.22- 3 494,13 ₸   Зат сатып алу      GRILL HOUSE ELKAWTHER\n' +
            '(-183 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: '\n(-57.25 EGP)',
          amount: '- 1 093,08 ',
          description: 'METRO - HURGHADA STORE &D',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22- 1 093,08 ₸   Зат сатып алу      METRO - HURGHADA STORE &D\n' +
            '(-57.25 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: '\n(-113 EGP)',
          amount: '- 2 158,14 ',
          description: 'EL ZAHRAA BAKERY',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22- 2 158,14 ₸   Зат сатып алу      EL ZAHRAA BAKERY\n(-113 EGP)'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: null,
          amount: '+ 107 893,16 ',
          description: 'шот нөмірі бойынша P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22+ 107 893,16 ₸   Толықтыру      шот нөмірі бойынша P2P PAYDALA*POPOLNENIE'
        },
        {
          hold: false,
          date: '2022-11-17T00:00:00.000',
          originalAmount: null,
          amount: '+ 107 893,16 ',
          description: 'шот нөмірі бойынша P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.11.22+ 107 893,16 ₸   Толықтыру      шот нөмірі бойынша P2P PAYDALA*POPOLNENIE'
        },
        {
          hold: false,
          date: '2022-11-16T00:00:00.000',
          originalAmount: '\n(-350 EGP)',
          amount: '- 6 641,47 ',
          description: 'ROYAL ZONE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '16.11.22- 6 641,47 ₸   Зат сатып алу      ROYAL ZONE\n(-350 EGP)'
        },
        {
          hold: false,
          date: '2022-11-16T00:00:00.000',
          originalAmount: '\n(-62 EGP)',
          amount: '- 1 178,03 ',
          description: 'M E GROUP CIRCLE K',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '16.11.22- 1 178,03 ₸   Зат сатып алу      M E GROUP CIRCLE K\n(-62 EGP)'
        },
        {
          hold: false,
          date: '2022-11-15T00:00:00.000',
          originalAmount: null,
          amount: '+ 108 042,54 ',
          description: 'шот нөмірі бойынша P2P PAYDALA*POPOLNENIE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.11.22+ 108 042,54 ₸   Толықтыру      шот нөмірі бойынша P2P PAYDALA*POPOLNENIE'
        },
        {
          hold: false,
          date: '2022-11-03T00:00:00.000',
          originalAmount: null,
          amount: '- 675,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.11.22- 675,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020'
        },
        {
          hold: false,
          date: '2022-11-03T00:00:00.000',
          originalAmount: null,
          amount: '+ 10 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.11.22+ 10 000,00 ₸   Толықтыру      Ilsiiar G.'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 4 390,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 4 390,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 10 000,00 ',
          description: 'Ilsiiar G.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 10 000,00 ₸   Аударым      Ilsiiar G.'
        },
        {
          hold: false,
          date: '2022-11-02T00:00:00.000',
          originalAmount: null,
          amount: '- 2 060,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.11.22- 2 060,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '- 3 795,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22- 3 795,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '- 5 565,00 ',
          description: 'TOO BIZNES KZ-2020',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22- 5 565,00 ₸   Зат сатып алу      TOO BIZNES KZ-2020'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '+ 7 115,81 ',
          description: 'шот нөмірі бойынша PAYDALA LLP',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22+ 7 115,81 ₸   Толықтыру      шот нөмірі бойынша PAYDALA LLP'
        },
        {
          hold: false,
          date: '2022-11-01T00:00:00.000',
          originalAmount: null,
          amount: '+ 22 000,00 ',
          description: 'Kaspi банкоматында',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.11.22+ 22 000,00 ₸   Толықтыру      Kaspi банкоматында'
        }
      ]
    }
  ],
  [
    statements[3],
    {
      account: {
        balance: 315286.89,
        id: 'KZ200001',
        instrument: 'KZT',
        title: 'Депозит *0001',
        date: '2023-05-12T00:00:00.000',
        capitalization: '15%',
        endDate: '2024-02-08T00:00:00.000',
        startBalance: 0,
        startDate: '2023-02-06T00:00:00.000',
        type: 'deposit'
      },
      transactions: [
        {
          hold: false,
          date: '2023-05-01T00:00:00.000',
          originalAmount: null,
          amount: '+1 258,66 ',
          description: '₸Вознаграждение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.05.23+1 258,66 ₸Вознаграждение298 910,89 ₸'
        },
        {
          hold: false,
          date: '2023-05-01T00:00:00.000',
          originalAmount: null,
          amount: '-2 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.05.23-2 000,00 ₸Перевод296 910,89 ₸'
        },
        {
          hold: false,
          date: '2023-05-01T00:00:00.000',
          originalAmount: null,
          amount: '-1 500,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.05.23-1 500,00 ₸Перевод295 410,89 ₸'
        },
        {
          hold: false,
          date: '2023-05-01T00:00:00.000',
          originalAmount: null,
          amount: '-400,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.05.23-400,00 ₸Перевод295 010,89 ₸'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '-2 500,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23-2 500,00 ₸Перевод292 510,89 ₸'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '-6 500,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23-6 500,00 ₸Перевод286 010,89 ₸'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '+29 276,00 ',
          description: '₸Пополнение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23+29 276,00 ₸Пополнение315 286,89 ₸'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '-12 600,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23-12 600,00 ₸Перевод302 686,89 ₸'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '+12 600,00 ',
          description: '₸Пополнение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23+12 600,00 ₸Пополнение315 286,89 ₸'
        }
      ]
    }
  ],
  [
    statements[4],
    {
      account: {
        balance: 2250.98,
        id: 'KZ3927',
        instrument: 'USD',
        title: 'Депозит *3927',
        date: '2023-05-13T00:00:00.000',
        capitalization: '1%',
        endDate: '2024-04-09T00:00:00.000',
        startBalance: 0,
        startDate: '2021-04-04T00:00:00.000',
        type: 'deposit'
      },
      transactions: [
        {
          hold: false,
          date: '2023-05-01T00:00:00.000',
          originalAmount: null,
          amount: '+ $1,56',
          description: 'Вознаграждение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.05.23+ $1,56Вознаграждение$2 386,28'
        },
        {
          hold: false,
          date: '2023-05-10T00:00:00.000',
          originalAmount: null,
          amount: '- $22,60',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '10.05.23- $22,60ПереводНа Kaspi Gold на kaspi.kz$2 363,68'
        },
        {
          hold: false,
          date: '2023-05-10T00:00:00.000',
          originalAmount: null,
          amount: '- $1,13',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '10.05.23- $1,13ПереводНа Kaspi Gold на kaspi.kz$2 362,55'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- $2,60',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- $2,60ПереводНа Kaspi Gold на kaspi.kz$2 359,95'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- $2,25',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- $2,25ПереводНа Kaspi Gold на kaspi.kz$2 357,70'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- $2,25',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- $2,25ПереводНа Kaspi Gold на kaspi.kz$2 355,45'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- $14,60',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- $14,60ПереводНа Kaspi Gold на kaspi.kz$2 340,85'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- $1,06',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- $1,06ПереводНа Kaspi Gold на kaspi.kz$2 339,79'
        },
        {
          hold: false,
          date: '2023-05-13T00:00:00.000',
          originalAmount: null,
          amount: '- $8,97',
          description: 'Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '13.05.23- $8,97Перевод$2 330,82'
        },
        {
          hold: false,
          date: '2023-05-13T00:00:00.000',
          originalAmount: null,
          amount: '- $44,85',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '13.05.23- $44,85ПереводНа Kaspi Gold на kaspi.kz$2 285,97'
        },
        {
          hold: false,
          date: '2023-05-13T00:00:00.000',
          originalAmount: null,
          amount: '- $22,43',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '13.05.23- $22,43ПереводНа Kaspi Gold на kaspi.kz$2 263,54'
        },
        {
          hold: false,
          date: '2023-05-13T00:00:00.000',
          originalAmount: null,
          amount: '- $12,56',
          description: 'ПереводНа Kaspi Gold на kaspi.kz',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '13.05.23- $12,56ПереводНа Kaspi Gold на kaspi.kz$2 250,98'
        }
      ]
    }
  ],
  [
    statements[5],
    {
      account: {
        balance: 1170781.56,
        id: 'KZ1234567',
        instrument: 'KZT',
        title: 'Депозит *4567',
        date: '2023-05-13T00:00:00.000',
        capitalization: '15%',
        endDate: '2024-03-10T00:00:00.000',
        startBalance: 0,
        startDate: '2018-03-10T00:00:00.000',
        type: 'deposit'
      },
      transactions: [
        {
          hold: false,
          date: '2023-03-01T00:00:00.000',
          originalAmount: null,
          amount: '+14 168,17 ',
          description: '₸Вознаграждение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.03.23+14 168,17 ₸Вознаграждение1 218 302,78 ₸'
        },
        {
          hold: false,
          date: '2023-03-06T00:00:00.000',
          originalAmount: null,
          amount: '-10 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '06.03.23-10 000,00 ₸Перевод1 208 302,78 ₸'
        },
        {
          hold: false,
          date: '2023-03-07T00:00:00.000',
          originalAmount: null,
          amount: '-10 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '07.03.23-10 000,00 ₸Перевод1 198 302,78 ₸'
        },
        {
          hold: false,
          date: '2023-03-09T00:00:00.000',
          originalAmount: null,
          amount: '-10 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '09.03.23-10 000,00 ₸Перевод1 188 302,78 ₸'
        },
        {
          hold: false,
          date: '2023-03-10T00:00:00.000',
          originalAmount: null,
          amount: '+4 263,18 ',
          description: '₸Вознаграждение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '10.03.23+4 263,18 ₸Вознаграждение1 192 565,96 ₸'
        },
        {
          hold: false,
          date: '2023-03-15T00:00:00.000',
          originalAmount: null,
          amount: '-10 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.03.23-10 000,00 ₸Перевод1 182 565,96 ₸'
        },
        {
          hold: false,
          date: '2023-03-17T00:00:00.000',
          originalAmount: null,
          amount: '+47 179,91 ',
          description: '₸Пополнение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '17.03.23+47 179,91 ₸Пополнение1 229 745,87 ₸'
        },
        {
          hold: false,
          date: '2023-03-21T00:00:00.000',
          originalAmount: null,
          amount: '-10 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '21.03.23-10 000,00 ₸Перевод1 219 745,87 ₸'
        },
        {
          hold: false,
          date: '2023-03-22T00:00:00.000',
          originalAmount: null,
          amount: '-10 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '22.03.23-10 000,00 ₸Перевод1 209 745,87 ₸'
        },
        {
          hold: false,
          date: '2023-03-27T00:00:00.000',
          originalAmount: null,
          amount: '-7 880,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.03.23-7 880,00 ₸Перевод1 201 865,87 ₸'
        },
        {
          hold: false,
          date: '2023-03-31T00:00:00.000',
          originalAmount: null,
          amount: '-5 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '31.03.23-5 000,00 ₸Перевод1 196 865,87 ₸'
        },
        {
          hold: false,
          date: '2023-04-01T00:00:00.000',
          originalAmount: null,
          amount: '+9 916,17 ',
          description: '₸Вознаграждение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.04.23+9 916,17 ₸Вознаграждение1 206 782,04 ₸'
        },
        {
          hold: false,
          date: '2023-04-03T00:00:00.000',
          originalAmount: null,
          amount: '-10 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.04.23-10 000,00 ₸Перевод1 196 782,04 ₸'
        },
        {
          hold: false,
          date: '2023-04-11T00:00:00.000',
          originalAmount: null,
          amount: '-5 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.04.23-5 000,00 ₸Перевод1 191 782,04 ₸'
        },
        {
          hold: false,
          date: '2023-04-18T00:00:00.000',
          originalAmount: null,
          amount: '-5 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '18.04.23-5 000,00 ₸Перевод1 186 782,04 ₸'
        },
        {
          hold: false,
          date: '2023-04-28T00:00:00.000',
          originalAmount: null,
          amount: '-5 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '28.04.23-5 000,00 ₸Перевод1 181 782,04 ₸'
        },
        {
          hold: false,
          date: '2023-05-01T00:00:00.000',
          originalAmount: null,
          amount: '+13 999,52 ',
          description: '₸Вознаграждение',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.05.23+13 999,52 ₸Вознаграждение1 195 781,56 ₸'
        },
        {
          hold: false,
          date: '2023-05-01T00:00:00.000',
          originalAmount: null,
          amount: '-5 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.05.23-5 000,00 ₸Перевод1 190 781,56 ₸'
        },
        {
          hold: false,
          date: '2023-05-04T00:00:00.000',
          originalAmount: null,
          amount: '-5 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.05.23-5 000,00 ₸Перевод1 185 781,56 ₸'
        },
        {
          hold: false,
          date: '2023-05-07T00:00:00.000',
          originalAmount: null,
          amount: '-10 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '07.05.23-10 000,00 ₸Перевод1 175 781,56 ₸'
        },
        {
          hold: false,
          date: '2023-05-09T00:00:00.000',
          originalAmount: null,
          amount: '-5 000,00 ',
          description: '₸Перевод',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '09.05.23-5 000,00 ₸Перевод1 170 781,56 ₸'
        }
      ]
    }
  ],
  [
    statements[6],
    {
      account: {
        balance: -95638.89,
        id: 'KZ3856',
        instrument: 'KZT',
        title: 'Kaspi Gold *8629',
        date: '2023-05-25T00:00:00.000',
        capitalization: null,
        endDate: null,
        startBalance: null,
        startDate: null,
        type: 'gold'
      },
      transactions: [
        {
          hold: false,
          date: '2023-05-19T00:00:00.000',
          originalAmount: null,
          amount: '- 213,07 ',
          description: 'Оплата инкассового распоряжения No8333142 от',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '19.05.23- 213,07 ₸ Разное Оплата инкассового распоряжения No8333142 от\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 410,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 410,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 200,00 ',
          description: 'Activ',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 200,00 ₸ Покупка Activ\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 7 985,00 ',
          description: 'MirasStore',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 7 985,00 ₸ Покупка MirasStore\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '+ 4 500,00 ',
          description: 'Əсем О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23+ 4 500,00 ₸ Пополнение Əсем О.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 650,00 ',
          description: 'Бахтияр К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 650,00 ₸ Перевод Бахтияр К.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 1 610,00 ',
          description: 'Думан У.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 1 610,00 ₸ Перевод Думан У.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 4 239,00 ',
          description: 'Зайниддин Ш.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 4 239,00 ₸ Перевод Зайниддин Ш.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '+ 10 000,00 ',
          description: 'Айгүл М.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23+ 10 000,00 ₸ Пополнение Айгүл М.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 1 370,00 ',
          description: 'Самичон Ч.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 1 370,00 ₸ Перевод Самичон Ч.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 8 000,00 ',
          description: 'Банкомат VN Zhibek Zholy 125 BekMart',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 8 000,00 ₸ Снятие Банкомат VN Zhibek Zholy 125 BekMart\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '+ 8 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23+ 8 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 400,00 ',
          description: 'Аманкелди К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 400,00 ₸ Перевод Аманкелди К.\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 200,00 ',
          description: 'Onay',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 200,00 ₸ Покупка Onay\n'
        },
        {
          hold: false,
          date: '2023-05-15T00:00:00.000',
          originalAmount: null,
          amount: '- 1 220,00 ',
          description: 'Болат Е.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '15.05.23- 1 220,00 ₸ Перевод Болат Е.\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '- 9 020,00 ',
          description: 'Мадина М.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23- 9 020,00 ₸ Перевод Мадина М.\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '- 1 820,00 ',
          description: 'MAGKEREMET',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23- 1 820,00 ₸ Покупка MAGKEREMET\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '- 200,00 ',
          description: 'Елнұр Қ.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23- 200,00 ₸ Перевод Елнұр Қ.\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Марат Ю.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23- 500,00 ₸ Перевод Марат Ю.\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '- 410,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23- 410,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '- 980,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23- 980,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '+ 15 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23+ 15 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '- 1 880,00 ',
          description: 'CULZHIAN',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23- 1 880,00 ₸ Покупка CULZHIAN\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '+ 800,00 ',
          description: 'Эльдар З.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23+ 800,00 ₸ Пополнение Эльдар З.\n'
        },
        {
          hold: false,
          date: '2023-05-14T00:00:00.000',
          originalAmount: null,
          amount: '+ 3 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '14.05.23+ 3 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-13T00:00:00.000',
          originalAmount: null,
          amount: '- 1 010,00 ',
          description: 'CULZHIAN',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '13.05.23- 1 010,00 ₸ Покупка CULZHIAN\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 200,00 ',
          description: 'Теміржан Д.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 200,00 ₸ Перевод Теміржан Д.\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 1 200,00 ',
          description: 'Фатима Ш.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 1 200,00 ₸ Перевод Фатима Ш.\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 3 800,00 ',
          description: 'Фатима Ш.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 3 800,00 ₸ Перевод Фатима Ш.\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Жанар П.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 500,00 ₸ Перевод Жанар П.\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '+ 6 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23+ 6 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 740,00 ',
          description: 'LAVISHALATAU',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 740,00 ₸ Покупка LAVISHALATAU\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Onay',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 500,00 ₸ Покупка Onay\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 1 430,00 ',
          description: 'Марал Е.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 1 430,00 ₸ Перевод Марал Е.\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 1 370,00 ',
          description: 'Жулдыз А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 1 370,00 ₸ Перевод Жулдыз А.\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 920,00 ',
          description: 'Суннатула У.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 920,00 ₸ Перевод Суннатула У.\n'
        },
        {
          hold: false,
          date: '2023-05-12T00:00:00.000',
          originalAmount: null,
          amount: '- 1 000,00 ',
          description: 'Оразəлі О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '12.05.23- 1 000,00 ₸ Перевод Оразəлі О.\n'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '- 2 500,00 ',
          description: 'Оразəлі О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23- 2 500,00 ₸ Перевод Оразəлі О.\n'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '- 300,00 ',
          description: 'Гульназ О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23- 300,00 ₸ Перевод Гульназ О.\n'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Гулзипа Б.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23- 500,00 ₸ Перевод Гулзипа Б.\n'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '- 370,00 ',
          description: 'HELLOPEOPLE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23- 370,00 ₸ Покупка HELLOPEOPLE\n'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '+ 10 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23+ 10 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '- 230,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23- 230,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '- 1 460,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23- 1 460,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-05-11T00:00:00.000',
          originalAmount: null,
          amount: '+ 2 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '11.05.23+ 2 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-10T00:00:00.000',
          originalAmount: null,
          amount: '- 250 000,00 ',
          description: 'Айжан О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '10.05.23- 250 000,00 ₸ Перевод Айжан О.\n'
        },
        {
          hold: false,
          date: '2023-05-10T00:00:00.000',
          originalAmount: null,
          amount: '+ 250 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '10.05.23+ 250 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-09T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Оразəлі О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '09.05.23- 500,00 ₸ Перевод Оразəлі О.\n'
        },
        {
          hold: false,
          date: '2023-05-09T00:00:00.000',
          originalAmount: null,
          amount: '- 1 200,00 ',
          description: 'Оразəлі О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '09.05.23- 1 200,00 ₸ Перевод Оразəлі О.\n'
        },
        {
          hold: false,
          date: '2023-05-09T00:00:00.000',
          originalAmount: null,
          amount: '- 1 125,00 ',
          description: 'Гульжиян Ж.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '09.05.23- 1 125,00 ₸ Перевод Гульжиян Ж.\n'
        },
        {
          hold: false,
          date: '2023-05-09T00:00:00.000',
          originalAmount: null,
          amount: '- 1 535,00 ',
          description: 'Марал Е.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '09.05.23- 1 535,00 ₸ Перевод Марал Е.\n'
        },
        {
          hold: false,
          date: '2023-05-08T00:00:00.000',
          originalAmount: null,
          amount: '- 1 125,00 ',
          description: 'CULZHIAN',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '08.05.23- 1 125,00 ₸ Покупка CULZHIAN\n'
        },
        {
          hold: false,
          date: '2023-05-08T00:00:00.000',
          originalAmount: null,
          amount: '+ 5 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '08.05.23+ 5 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-08T00:00:00.000',
          originalAmount: null,
          amount: '- 150,00 ',
          description: 'Армат У.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '08.05.23- 150,00 ₸ Перевод Армат У.\n'
        },
        {
          hold: false,
          date: '2023-05-08T00:00:00.000',
          originalAmount: null,
          amount: '- 1 370,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '08.05.23- 1 370,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-05-08T00:00:00.000',
          originalAmount: null,
          amount: '+ 2 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '08.05.23+ 2 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-07T00:00:00.000',
          originalAmount: null,
          amount: '- 320,00 ',
          description: 'Марал Е.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '07.05.23- 320,00 ₸ Перевод Марал Е.\n'
        },
        {
          hold: false,
          date: '2023-05-07T00:00:00.000',
          originalAmount: null,
          amount: '+ 200,00 ',
          description: 'Оразəлі О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '07.05.23+ 200,00 ₸ Пополнение Оразəлі О.\n'
        },
        {
          hold: false,
          date: '2023-05-05T00:00:00.000',
          originalAmount: null,
          amount: '- 930,00 ',
          description: 'CULZHIAN',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '05.05.23- 930,00 ₸ Покупка CULZHIAN\n'
        },
        {
          hold: false,
          date: '2023-05-05T00:00:00.000',
          originalAmount: null,
          amount: '- 200,00 ',
          description: 'Зухра Г.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '05.05.23- 200,00 ₸ Перевод Зухра Г.\n'
        },
        {
          hold: false,
          date: '2023-05-05T00:00:00.000',
          originalAmount: null,
          amount: '+ 1 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '05.05.23+ 1 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-05T00:00:00.000',
          originalAmount: null,
          amount: '- 160,00 ',
          description: 'Onay',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '05.05.23- 160,00 ₸ Покупка Onay\n'
        },
        {
          hold: false,
          date: '2023-05-05T00:00:00.000',
          originalAmount: null,
          amount: '- 910,00 ',
          description: 'TAMERLAN',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '05.05.23- 910,00 ₸ Покупка TAMERLAN\n'
        },
        {
          hold: false,
          date: '2023-05-05T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Максат Е.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '05.05.23- 500,00 ₸ Перевод Максат Е.\n'
        },
        {
          hold: false,
          date: '2023-05-05T00:00:00.000',
          originalAmount: null,
          amount: '- 150,00 ',
          description: 'Абзал М.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '05.05.23- 150,00 ₸ Перевод Абзал М.\n'
        },
        {
          hold: false,
          date: '2023-05-05T00:00:00.000',
          originalAmount: null,
          amount: '+ 500,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '05.05.23+ 500,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-04T00:00:00.000',
          originalAmount: null,
          amount: '+ 1 000,00 ',
          description: 'Айгүл М.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.05.23+ 1 000,00 ₸ Пополнение Айгүл М.\n'
        },
        {
          hold: false,
          date: '2023-05-04T00:00:00.000',
          originalAmount: null,
          amount: '- 450,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.05.23- 450,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-05-04T00:00:00.000',
          originalAmount: null,
          amount: '- 160,00 ',
          description: 'Onay',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '04.05.23- 160,00 ₸ Покупка Onay\n'
        },
        {
          hold: false,
          date: '2023-05-03T00:00:00.000',
          originalAmount: null,
          amount: '- 1 550,00 ',
          description: 'MIRASSTORE',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.05.23- 1 550,00 ₸ Покупка MIRASSTORE\n'
        },
        {
          hold: false,
          date: '2023-05-03T00:00:00.000',
          originalAmount: null,
          amount: '+ 2 200,00 ',
          description: 'Айгүл М.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '03.05.23+ 2 200,00 ₸ Пополнение Айгүл М.\n'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '- 890,00 ',
          description: 'CULZHIAN',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23- 890,00 ₸ Покупка CULZHIAN\n'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '- 150,00 ',
          description: 'Аскарбай Ж.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23- 150,00 ₸ Перевод Аскарбай Ж.\n'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '- 100,00 ',
          description: 'Onay',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23- 100,00 ₸ Покупка Onay\n'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '+ 1 500,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23+ 1 500,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '- 900,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23- 900,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Нуралы К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23- 500,00 ₸ Перевод Нуралы К.\n'
        },
        {
          hold: false,
          date: '2023-05-02T00:00:00.000',
          originalAmount: null,
          amount: '+ 1 000,00 ',
          description: 'Назира О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '02.05.23+ 1 000,00 ₸ Пополнение Назира О.\n'
        },
        {
          hold: false,
          date: '2023-05-01T00:00:00.000',
          originalAmount: null,
          amount: '- 200,00 ',
          description: 'Onay',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.05.23- 200,00 ₸ Покупка Onay\n'
        },
        {
          hold: false,
          date: '2023-04-30T00:00:00.000',
          originalAmount: null,
          amount: '- 1 380,00 ',
          description: 'Марал Е.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.04.23- 1 380,00 ₸ Перевод Марал Е.\n'
        },
        {
          hold: false,
          date: '2023-04-30T00:00:00.000',
          originalAmount: null,
          amount: '+ 2 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '30.04.23+ 2 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-04-29T00:00:00.000',
          originalAmount: null,
          amount: '- 450,00 ',
          description: 'Марал Е.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '29.04.23- 450,00 ₸ Перевод Марал Е.\n'
        },
        {
          hold: false,
          date: '2023-04-29T00:00:00.000',
          originalAmount: null,
          amount: '- 2 000,00 ',
          description: 'Банкомат VN Akbulak 31 Miras Store',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '29.04.23- 2 000,00 ₸ Снятие Банкомат VN Akbulak 31 Miras Store\n'
        },
        {
          hold: false,
          date: '2023-04-29T00:00:00.000',
          originalAmount: null,
          amount: '- 680,00 ',
          description: 'CULZHIAN',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '29.04.23- 680,00 ₸ Покупка CULZHIAN\n'
        },
        {
          hold: false,
          date: '2023-04-28T00:00:00.000',
          originalAmount: null,
          amount: '- 850,00 ',
          description: 'Эльмира Д.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '28.04.23- 850,00 ₸ Перевод Эльмира Д.\n'
        },
        {
          hold: false,
          date: '2023-04-28T00:00:00.000',
          originalAmount: null,
          amount: '- 2 700,00 ',
          description: 'Activ',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '28.04.23- 2 700,00 ₸ Покупка Activ\n'
        },
        {
          hold: false,
          date: '2023-04-28T00:00:00.000',
          originalAmount: null,
          amount: '+ 5 000,00 ',
          description: 'Мухит И.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '28.04.23+ 5 000,00 ₸ Пополнение Мухит И.\n'
        },
        {
          hold: false,
          date: '2023-04-28T00:00:00.000',
          originalAmount: null,
          amount: '- 200,00 ',
          description: 'SOZO',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '28.04.23- 200,00 ₸ Покупка SOZO\n'
        },
        {
          hold: false,
          date: '2023-04-27T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Назира О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.04.23- 500,00 ₸ Перевод Назира О.\n'
        },
        {
          hold: false,
          date: '2023-04-27T00:00:00.000',
          originalAmount: null,
          amount: '+ 2 000,00 ',
          description: 'Шаттық А.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.04.23+ 2 000,00 ₸ Пополнение Шаттық А.\n'
        },
        {
          hold: false,
          date: '2023-04-27T00:00:00.000',
          originalAmount: null,
          amount: '- 1 360,00 ',
          description: 'Асель К.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.04.23- 1 360,00 ₸ Перевод Асель К.\n'
        },
        {
          hold: false,
          date: '2023-04-27T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Абилхайыр Б.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.04.23- 500,00 ₸ Перевод Абилхайыр Б.\n'
        },
        {
          hold: false,
          date: '2023-04-27T00:00:00.000',
          originalAmount: null,
          amount: '+ 2 000,00 ',
          description: 'Əсем О.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.04.23+ 2 000,00 ₸ Пополнение Əсем О.\n'
        },
        {
          hold: false,
          date: '2023-04-27T00:00:00.000',
          originalAmount: null,
          amount: '- 470,00 ',
          description: 'Гульжиян Ж.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '27.04.23- 470,00 ₸ Перевод Гульжиян Ж.\n'
        },
        {
          hold: false,
          date: '2023-04-26T00:00:00.000',
          originalAmount: null,
          amount: '- 320,00 ',
          description: 'Гульжиян Ж.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.04.23- 320,00 ₸ Перевод Гульжиян Ж.\n'
        },
        {
          hold: false,
          date: '2023-04-26T00:00:00.000',
          originalAmount: null,
          amount: '- 470,00 ',
          description: 'Гульжиян Ж.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.04.23- 470,00 ₸ Перевод Гульжиян Ж.\n'
        },
        {
          hold: false,
          date: '2023-04-26T00:00:00.000',
          originalAmount: null,
          amount: '- 1 200,00 ',
          description: 'Khudoyberdi I.',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.04.23- 1 200,00 ₸ Перевод Khudoyberdi I.\n'
        },
        {
          hold: false,
          date: '2023-04-26T00:00:00.000',
          originalAmount: null,
          amount: '- 800,00 ',
          description: 'SOZO',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.04.23- 800,00 ₸ Покупка SOZO\n'
        },
        {
          hold: false,
          date: '2023-04-26T00:00:00.000',
          originalAmount: null,
          amount: '- 500,00 ',
          description: 'Onay',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '26.04.23- 500,00 ₸ Покупка Onay\n'
        }
      ]
    }
  ]
])('parse pdfString to raw account with transactions', (pdfString: string, result: unknown) => {
  expect(parseSinglePdfString(pdfString, '03474da2-3644-47b2-895a-2384b6c935ad')).toEqual(result)
})
