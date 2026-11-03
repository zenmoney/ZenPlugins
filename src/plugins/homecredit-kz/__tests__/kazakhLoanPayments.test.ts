import { parseStatementText } from '../parser'
import { convertPdfStatementTransaction } from '../converters/transactions'
import { AccountType } from '../../../types/zenmoney'
import { ConvertedAccount } from '../models'

it('parses all 219 operations in the Kazakh statement containing three loan payments', () => {
  // mail_inbound 193847, homecredit-kz build 21: complete extracted PDF text.
  // Personal names, contract, IBAN and card identifiers are anonymized for master.
  // Keep every printed operation, including the previously unsupported loan payment type.
  const text = `


Келісімшарт нөмірі:  4100000001
IBAN:  KZ00886D224300000001
Карточка нөмірі:  400000******1234
Клиенттің аты-жөні:  ИВАН ИВАНОВИЧ
ИВАНОВ
Клиенттің ЖСН нөмірі:  900101300001
Үзінді көшірме күні:  02.11.2026
Үзінді көшірме
дебет картасы бойынша 01.08.2026 - 01.11.2026 аралығындағы кезең үшін
Үзінді көшірме берілген күн (02.11.2026) бойынша қолжетімді қалдық — 75,00 ₸
Үзінді
көшірме
Операция туралы мәліметтер Сома Бонустар MCC
сатушы санатының
коды
01.11.2026
14:00
DINA #104 SUPERMARKET
Сатып алулар мен шығындар
- 7 214,00 ₸ + 361,00 Б
5411
Grocery Stores,
01.11.2026
12:31
IP IVANOVA MARINA IVN
Сатып алулар мен шығындар
- 350,00 ₸ + 18,00 Б
5411
Grocery Stores,
31.10.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 461,00 ₸
31.10.2026
19:28
MAGAZIN IVAN
Сатып алулар мен шығындар
- 650,00 ₸ + 33,00 Б
5411
Grocery Stores,
31.10.2026
16:39
IP PETROVA ANNA IVANOVNA
Сатып алулар мен шығындар
- 1 750,00 ₸ + 88,00 Б
5411
Grocery Stores,
31.10.2026
16:33
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
31.10.2026
12:23
Мой Kaspi Bank
Шығыс аударымдар
- 1 000,00 ₸
31.10.2026
12:19
DINA #104 SUPERMARKET
Сатып алулар мен шығындар
- 1 090,00 ₸ + 55,00 Б
5411
Grocery Stores,
30.10.2026
08:45
Мой Kaspi Bank
Шығыс аударымдар
- 1 000,00 ₸
29.10.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 1 142,00 ₸
29.10.2026
21:41
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 9 218,00 ₸ + 461,00 Б
5411
Grocery Stores,
29.10.2026
21:34
С карты другого банка
Толықтыру
+ 5 890,00 ₸
6012
Merchandise and
28.10.2026
10:45
FIX PRICE
Сатып алулар мен шығындар
- 999,00 ₸ + 50,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


27.10.2026
22:01
MAGAZIN IVAN
Сатып алулар мен шығындар
- 250,00 ₸ + 13,00 Б
5411
Grocery Stores,
27.10.2026
21:59
MAGAZIN IVAN
Сатып алулар мен шығындар
- 470,00 ₸ + 24,00 Б
5411
Grocery Stores,
27.10.2026
21:48
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 488,00 ₸ + 24,00 Б
5411
Grocery Stores,
27.10.2026
18:37
AKSERI
Сатып алулар мен шығындар
- 296,00 ₸ + 3,00 Б
5399
Miscellaneous General
26.10.2026
21:21
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 8 784,00 ₸ + 439,00 Б
5411
Grocery Stores,
26.10.2026
21:20
С карты другого банка
Толықтыру
+ 15 000,00 ₸
6012
Merchandise and
26.10.2026
13:05
SIDOROVA PAVILON
Сатып алулар мен шығындар
- 902,00 ₸ + 45,00 Б
5411
Grocery Stores,
25.10.2026
20:33
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 6 321,00 ₸ + 316,00 Б
5411
Grocery Stores,
25.10.2026
18:30
BIOSFERA PHARMA
Сатып алулар мен шығындар
- 325,00 ₸ + 3,00 Б
5912
Drug Stores, Pharmacies
25.10.2026
18:06
BIOSFERA DRUG STORE
Сатып алулар мен шығындар
- 849,00 ₸ + 8,00 Б
5912
Drug Stores, Pharmacies
24.10.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 8 343,00 ₸
24.10.2026
19:36
DINA MINIMARKET 1403
Сатып алулар мен шығындар
- 457,00 ₸ + 23,00 Б
5411
Grocery Stores,
24.10.2026
19:35
DINA MINIMARKET 1403
Сатып алулар мен шығындар
- 3 883,00 ₸ + 194,00 Б
5411
Grocery Stores,
24.10.2026
14:38
Мой Jusan Bank
Шығыс аударымдар
- 52 500,00 ₸
24.10.2026
14:37
С карты другого банка
Толықтыру
+ 20 000,00 ₸
6012
Merchandise and
24.10.2026
13:15
MAGAZIN IVAN
Сатып алулар мен шығындар
- 720,00 ₸ + 36,00 Б
5411
Grocery Stores,
22.10.2026
21:25
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 3 816,00 ₸ + 191,00 Б
5411
Grocery Stores,
22.10.2026
10:14
MAGAZIN IVAN
Сатып алулар мен шығындар
- 200,00 ₸ + 10,00 Б
5411
Grocery Stores,
21.10.2026
21:46
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 6 943,00 ₸ + 347,00 Б
5411
Grocery Stores,
21.10.2026
17:38
MAGAZIN IVAN
Сатып алулар мен шығындар
- 650,00 ₸ + 33,00 Б
5411
Grocery Stores,
21.10.2026
17:30
IP SMIRNOV
Сатып алулар мен шығындар
- 2 520,00 ₸ + 25,00 Б
5199
Nondurable Goods (not
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


21.10.2026
16:17
ALAU APTEKA
Сатып алулар мен шығындар
- 615,00 ₸ + 6,00 Б
5912
Drug Stores, Pharmacies
19.10.2026
21:48
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 2 966,00 ₸ + 148,00 Б
5411
Grocery Stores,
18.10.2026
23:59
Ішкі аударым
Шығыс аударымдар
+ 130 000,00 ₸
18.10.2026
19:38
BIOSFERA DRUG STORE
Сатып алулар мен шығындар
- 5 620,00 ₸ + 56,00 Б
5912
Drug Stores, Pharmacies
18.10.2026
19:34
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 6 233,00 ₸ + 312,00 Б
5411
Grocery Stores,
18.10.2026
15:37
Перевод на "Ақшалай кредит"
Кредит бойынша төлемдер
- 67 133,00 ₸
18.10.2026
13:57
BIOSFERA DRUG STORE
Сатып алулар мен шығындар
- 3 180,00 ₸ + 32,00 Б
5912
Drug Stores, Pharmacies
18.10.2026
13:50
ALKOBRIG&CAKE SHOP
Сатып алулар мен шығындар
- 574,00 ₸ + 29,00 Б
5411
Grocery Stores,
18.10.2026
13:45
IP IVANOV
Сатып алулар мен шығындар
- 1 280,00 ₸ + 64,00 Б
5411
Grocery Stores,
18.10.2026
13:44
IP IVANOV
Сатып алулар мен шығындар
- 1 582,00 ₸ + 79,00 Б
5411
Grocery Stores,
18.10.2026
13:40
IP IVANOV
Сатып алулар мен шығындар
- 4 745,00 ₸ + 237,00 Б
5411
Grocery Stores,
17.10.2026
19:31
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 4 720,00 ₸ + 236,00 Б
5411
Grocery Stores,
17.10.2026
19:31
С карты другого банка
Толықтыру
+ 20 000,00 ₸
6012
Merchandise and
17.10.2026
13:52
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 253,00 ₸ + 13,00 Б
5411
Grocery Stores,
16.10.2026
21:20
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 9 236,00 ₸ + 462,00 Б
5411
Grocery Stores,
16.10.2026
21:19
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
15.10.2026
22:20
DINA SUPERMARKET 105
Сатып алулар мен шығындар
- 9 373,00 ₸ + 469,00 Б
5411
Grocery Stores,
15.10.2026
22:20
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
15.10.2026
12:00
OVOSHCHI-FRUKTY SHOP
Сатып алулар мен шығындар
- 1 425,00 ₸ + 71,00 Б
5411
Grocery Stores,
14.10.2026
10:23
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 1 857,00 ₸ + 93,00 Б
5411
Grocery Stores,
14.10.2026
10:18
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 481,00 ₸ + 24,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


11.10.2026
13:41
DINA #104 SUPERMARKET
Сатып алулар мен шығындар
- 5 381,00 ₸ + 269,00 Б
5411
Grocery Stores,
11.10.2026
13:40
С карты другого банка
Толықтыру
+ 5 000,00 ₸
6012
Merchandise and
11.10.2026
13:26
MAGAZIN FERMER
Сатып алулар мен шығындар
- 8 305,00 ₸ + 415,00 Б
5411
Grocery Stores,
11.10.2026
13:24
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
10.10.2026
13:13
SIDOROVA PAVILON
Сатып алулар мен шығындар
- 2 170,00 ₸ + 109,00 Б
5411
Grocery Stores,
10.10.2026
13:11
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 12 156,00 ₸ + 608,00 Б
5411
Grocery Stores,
10.10.2026
13:10
С карты другого банка
Толықтыру
+ 15 000,00 ₸
6012
Merchandise and
09.10.2026
10:30
FIX PRICE
Сатып алулар мен шығындар
- 2 746,00 ₸ + 137,00 Б
5411
Grocery Stores,
06.10.2026
12:30
MAGAZIN IVAN
Сатып алулар мен шығындар
- 950,00 ₸ + 48,00 Б
5411
Grocery Stores,
05.10.2026
21:02
MAGAZIN IVAN
Сатып алулар мен шығындар
- 1 550,00 ₸ + 78,00 Б
5411
Grocery Stores,
05.10.2026
16:55
IP MARINA
Сатып алулар мен шығындар
- 750,00 ₸ + 8,00 Б
7538
Automotive Service Shops
05.10.2026
12:57
IP PETROV
Сатып алулар мен шығындар
- 1 550,00 ₸ + 16,00 Б
5200
Home Supply Warehouse
05.10.2026
12:37
С карты другого банка
Толықтыру
+ 5 000,00 ₸
6012
Merchandise and
05.10.2026
12:18
MAGAZIN FERMER
Сатып алулар мен шығындар
- 4 480,00 ₸ + 224,00 Б
5411
Grocery Stores,
05.10.2026
12:17
С карты другого банка
Толықтыру
+ 5 000,00 ₸
6012
Merchandise and
04.10.2026
17:44
DINA #111 GIPERMARKET
Сатып алулар мен шығындар
- 9 477,00 ₸ + 474,00 Б
5411
Grocery Stores,
04.10.2026
17:44
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
04.10.2026
13:19
IP SMIRNOV
Сатып алулар мен шығындар
- 4 700,00 ₸ + 47,00 Б
5199
Nondurable Goods (not
04.10.2026
13:18
SIDOROVA PAVILON
Сатып алулар мен шығындар
- 4 060,00 ₸ + 203,00 Б
5411
Grocery Stores,
04.10.2026
13:18
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
04.10.2026
13:14
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 3 366,00 ₸ + 168,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


03.10.2026
15:06
TOO "BEST PRAYS KAZAHSTAN
Сатып алулар мен шығындар
- 2 481,00 ₸ + 124,00 Б
5411
Grocery Stores,
03.10.2026
14:52
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 13 073,00 ₸ + 654,00 Б
5411
Grocery Stores,
03.10.2026
14:47
С карты другого банка
Толықтыру
+ 20 000,00 ₸
6012
Merchandise and
01.10.2026
20:33
IP PETROVA ANNA IVANOVNA
Сатып алулар мен шығындар
- 2 530,00 ₸ + 127,00 Б
5411
Grocery Stores,
01.10.2026
20:31
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 6 242,00 ₸ + 312,00 Б
5411
Grocery Stores,
30.09.2026
20:30
YANDEX.GO
Сатып алулар мен шығындар
- 520,00 ₸ + 5,00 Б
4121
Limousines and Taxicabs
29.09.2026
20:56
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 7 789,00 ₸ + 389,00 Б
5411
Grocery Stores,
29.09.2026
20:56
С карты другого банка
Толықтыру
+ 15 000,00 ₸
6012
Merchandise and
27.09.2026
19:46
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 3 257,00 ₸ + 163,00 Б
5411
Grocery Stores,
27.09.2026
13:42
YANDEX.GO
Сатып алулар мен шығындар
- 990,00 ₸ + 10,00 Б
4121
Limousines and Taxicabs
27.09.2026
11:39
YANDEX.GO
Сатып алулар мен шығындар
- 1 120,00 ₸ + 11,00 Б
4121
Limousines and Taxicabs
26.09.2026
20:23
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 5 171,00 ₸ + 259,00 Б
5411
Grocery Stores,
26.09.2026
20:23
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
25.09.2026
14:33
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 1 876,00 ₸ + 94,00 Б
5411
Grocery Stores,
24.09.2026
20:27
IVAN
Сатып алулар мен шығындар
- 1 000,00 ₸ + 50,00 Б
5411
Grocery Stores,
24.09.2026
20:06
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 4 666,00 ₸ + 233,00 Б
5411
Grocery Stores,
24.09.2026
20:06
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
24.09.2026
16:37
EDELVEIS
Сатып алулар мен шығындар
- 290,00 ₸ + 15,00 Б
5411
Grocery Stores,
23.09.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 1 835,00 ₸
23.09.2026
20:03
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 2 402,00 ₸ + 120,00 Б
5411
Grocery Stores,
22.09.2026
20:34
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 5 240,00 ₸ + 262,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


21.09.2026
13:24
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 2 354,00 ₸ + 118,00 Б
5411
Grocery Stores,
21.09.2026
08:36
YANDEX.GO
Сатып алулар мен шығындар
- 970,00 ₸ + 10,00 Б
4121
Limousines and Taxicabs
20.09.2026
19:58
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 3 106,00 ₸ + 155,00 Б
5411
Grocery Stores,
20.09.2026
14:54
TOO "BEST PRAYS KAZAHSTAN
Сатып алулар мен шығындар
- 1 899,00 ₸ + 95,00 Б
5411
Grocery Stores,
20.09.2026
14:51
IP SMIRNOV
Сатып алулар мен шығындар
- 2 350,00 ₸ + 24,00 Б
5199
Nondurable Goods (not
20.09.2026
14:44
С карты другого банка
Толықтыру
+ 15 000,00 ₸
6012
Merchandise and
20.09.2026
11:44
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 253,00 ₸ + 13,00 Б
5411
Grocery Stores,
19.09.2026
20:29
IP PETROVA ANNA IVANOVNA
Сатып алулар мен шығындар
- 3 292,00 ₸ + 165,00 Б
5411
Grocery Stores,
19.09.2026
20:23
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 14 624,00 ₸ + 731,00 Б
5411
Grocery Stores,
19.09.2026
20:22
С карты другого банка
Толықтыру
+ 20 000,00 ₸
6012
Merchandise and
18.09.2026
13:46
MAGAZIN IVAN
Сатып алулар мен шығындар
- 520,00 ₸ + 26,00 Б
5411
Grocery Stores,
18.09.2026
13:22
IP SMIRNOV
Сатып алулар мен шығындар
- 2 565,00 ₸ + 26,00 Б
5199
Nondurable Goods (not
17.09.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 6 207,00 ₸
17.09.2026
21:01
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 4 209,00 ₸ + 210,00 Б
5411
Grocery Stores,
16.09.2026
21:53
DINA SUPERMARKET 105
Сатып алулар мен шығындар
- 6 247,00 ₸ + 312,00 Б
5411
Grocery Stores,
16.09.2026
20:48
MAGAZIN IVAN
Сатып алулар мен шығындар
- 650,00 ₸ + 33,00 Б
5411
Grocery Stores,
15.09.2026
22:19
Мой Kaspi Bank
Шығыс аударымдар
- 1 000,00 ₸
15.09.2026
22:06
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 10 349,00 ₸ + 517,00 Б
5411
Grocery Stores,
15.09.2026
21:24
TOO ZERDE FARMA
Сатып алулар мен шығындар
- 3 810,00 ₸ + 38,00 Б
5912
Drug Stores, Pharmacies
14.09.2026
11:42
IP PETROV
Сатып алулар мен шығындар
- 900,00 ₸ + 9,00 Б
5200
Home Supply Warehouse
14.09.2026
11:15
MAGAZIN FERMER
Сатып алулар мен шығындар
- 3 940,00 ₸ + 197,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


13.09.2026
20:18
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 11 190,00 ₸ + 560,00 Б
5411
Grocery Stores,
13.09.2026
18:43
YANDEX.GO
Сатып алулар мен шығындар
- 1 970,00 ₸ + 20,00 Б
4121
Limousines and Taxicabs
13.09.2026
14:46
IP GORODSKAYA PEKARNYA BA
Сатып алулар мен шығындар
- 1 400,00 ₸ + 14,00 Б
8299
Schools and Educational
13.09.2026
09:06
BODRUM KOFEYNYA
Сатып алулар мен шығындар
- 3 230,00 ₸ + 32,00 Б
5812
Eating Places, Restaurants
13.09.2026
09:03
YANDEX.GO
Сатып алулар мен шығындар
- 750,00 ₸ + 8,00 Б
4121
Limousines and Taxicabs
13.09.2026
08:54
MAGAZIN IVAN
Сатып алулар мен шығындар
- 550,00 ₸ + 28,00 Б
5411
Grocery Stores,
12.09.2026
14:30
BODRUM KOFEINYA
Сатып алулар мен шығындар
- 250,00 ₸ + 3,00 Б
5812
Eating Places, Restaurants
12.09.2026
14:03
APORT STOLOVAYA
Сатып алулар мен шығындар
- 2 630,00 ₸ + 26,00 Б
5812
Eating Places, Restaurants
12.09.2026
11:07
Мой Kaspi Bank
Шығыс аударымдар
- 10 000,00 ₸
12.09.2026
10:20
YANDEX.GO
Сатып алулар мен шығындар
- 1 110,00 ₸ + 11,00 Б
4121
Limousines and Taxicabs
12.09.2026
10:16
GORODSKAYA PEKARNYA BAGE
Сатып алулар мен шығындар
- 1 000,00 ₸ + 50,00 Б
5462
Bakeries
12.09.2026
09:12
YANDEX.GO
Сатып алулар мен шығындар
- 630,00 ₸ + 6,00 Б
4121
Limousines and Taxicabs
11.09.2026
18:56
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 4 309,00 ₸ + 215,00 Б
5411
Grocery Stores,
11.09.2026
17:45
BODRUM KOFEYNYA
Сатып алулар мен шығындар
- 3 480,00 ₸ + 35,00 Б
5812
Eating Places, Restaurants
11.09.2026
15:48
AMAN-SAULYK MED.TSENTR
Сатып алулар мен шығындар
- 7 000,00 ₸ + 70,00 Б
8062
Hospitals
11.09.2026
15:10
IP SMIRNOV
Сатып алулар мен шығындар
- 2 450,00 ₸ + 25,00 Б
5199
Nondurable Goods (not
11.09.2026
14:55
IP SMIRNOVA
Сатып алулар мен шығындар
- 3 000,00 ₸ + 30,00 Б
7299
Other Services (not
10.09.2026
16:17
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 3 625,00 ₸ + 181,00 Б
5411
Grocery Stores,
10.09.2026
12:45
Мой Kaspi Bank
Шығыс аударымдар
- 4 000,00 ₸
10.09.2026
11:09
MY KIDS AKTOBE PARK
Сатып алулар мен шығындар
- 4 300,00 ₸ + 43,00 Б
7996
Amusement Parks,
09.09.2026
20:43
ALKOBRIG&CAKE SHOP
Сатып алулар мен шығындар
- 814,00 ₸ + 41,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


09.09.2026
20:36
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 5 093,00 ₸ + 255,00 Б
5411
Grocery Stores,
09.09.2026
20:15
BIOSFERA PHARMA
Сатып алулар мен шығындар
- 350,00 ₸ + 4,00 Б
5912
Drug Stores, Pharmacies
09.09.2026
19:36
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 253,00 ₸ + 13,00 Б
5411
Grocery Stores,
09.09.2026
18:55
KFC 12747
Сатып алулар мен шығындар
- 2 700,00 ₸ + 27,00 Б
5814
Fast Food Restaurants
09.09.2026
17:05
IP MARINA
Сатып алулар мен шығындар
- 1 000,00 ₸ + 10,00 Б
7538
Automotive Service Shops
08.09.2026
23:46
Мой Jusan Bank
Шығыс аударымдар
- 4 000,00 ₸
08.09.2026
23:46
Halyk Bank *5678
Шығыс аударымдар
- 4 000,00 ₸
08.09.2026
18:09
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 8 467,00 ₸ + 423,00 Б
5411
Grocery Stores,
08.09.2026
15:38
TOO "BEST PRAYS KAZAHSTAN
Сатып алулар мен шығындар
- 1 599,00 ₸ + 80,00 Б
5411
Grocery Stores,
08.09.2026
15:24
TOO "BEST PRAYS KAZAHSTAN
Сатып алулар мен шығындар
- 2 604,00 ₸ + 130,00 Б
5411
Grocery Stores,
08.09.2026
12:10
SHOP  ANDREY
Сатып алулар мен шығындар
- 1 840,00 ₸ + 92,00 Б
5411
Grocery Stores,
07.09.2026
20:36
BIOSFERA DRUG STORE
Сатып алулар мен шығындар
- 5 674,00 ₸ + 57,00 Б
5912
Drug Stores, Pharmacies
07.09.2026
20:15
Мой Kaspi Bank
Шығыс аударымдар
- 5 000,00 ₸
07.09.2026
20:14
Мой Kaspi Bank
Шығыс аударымдар
- 15 000,00 ₸
07.09.2026
12:01
MAYAK SHOP
Сатып алулар мен шығындар
- 6 394,00 ₸ + 320,00 Б
5411
Grocery Stores,
07.09.2026
11:14
IP MARINA
Сатып алулар мен шығындар
- 1 500,00 ₸ + 15,00 Б
7538
Automotive Service Shops
07.09.2026
10:56
TOO KLINIKA AJGERIM
Сатып алулар мен шығындар
- 2 310,00 ₸ + 23,00 Б
8099
Health Practitioners,
06.09.2026
17:03
DASTAR.HAN SUPERMARKET
Сатып алулар мен шығындар
- 4 643,00 ₸ + 232,00 Б
5411
Grocery Stores,
06.09.2026
12:03
SHOP  ANDREY
Сатып алулар мен шығындар
- 1 550,00 ₸ + 78,00 Б
5411
Grocery Stores,
06.09.2026
12:01
IP SMIRNOV
Сатып алулар мен шығындар
- 1 490,00 ₸ + 15,00 Б
5199
Nondurable Goods (not
06.09.2026
11:56
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 2 415,00 ₸ + 121,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


06.09.2026
10:24
Перевод на "Ақшалай кредит"
Кредит бойынша төлемдер
- 67 133,00 ₸
06.09.2026
00:47
Мой Jusan Bank
Шығыс аударымдар
- 7 000,00 ₸
05.09.2026
23:59
Ішкі аударым
Шығыс аударымдар
+ 370 500,00 ₸
05.09.2026
20:59
Мой Kaspi Bank
Шығыс аударымдар
- 100 000,00 ₸
05.09.2026
20:26
TOO "FORMAT.KZ"
Сатып алулар мен шығындар
- 2 506,00 ₸ + 25,00 Б
5912
Drug Stores, Pharmacies
05.09.2026
20:22
105 SUPER MARKET
Сатып алулар мен шығындар
- 17 373,00 ₸ + 869,00 Б
5411
Grocery Stores,
05.09.2026
18:13
IP PETROV
Сатып алулар мен шығындар
- 1 900,00 ₸ + 19,00 Б
5200
Home Supply Warehouse
01.09.2026
21:25
DINA SUPERMARKET 105
Сатып алулар мен шығындар
- 3 787,00 ₸ + 189,00 Б
5411
Grocery Stores,
29.08.2026
20:39
IP PETROVA ANNA IVANOVNA
Сатып алулар мен шығындар
- 962,00 ₸ + 48,00 Б
5411
Grocery Stores,
29.08.2026
20:36
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 5 922,00 ₸ + 296,00 Б
5411
Grocery Stores,
28.08.2026
23:59
Ішкі аударым
Шығыс аударымдар
+ 69 000,00 ₸
28.08.2026
21:44
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 1 691,00 ₸ + 85,00 Б
5411
Grocery Stores,
28.08.2026
16:39
Перевод на "Ақшалай кредит"
Кредит бойынша төлемдер
- 67 133,00 ₸
28.08.2026
13:24
TOO "BEST PRAYS KAZAHSTAN
Сатып алулар мен шығындар
- 1 899,00 ₸ + 95,00 Б
5411
Grocery Stores,
28.08.2026
13:20
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 1 411,00 ₸ + 71,00 Б
5411
Grocery Stores,
28.08.2026
08:50
IP PETROVA ANNA IVANOVNA
Сатып алулар мен шығындар
- 310,00 ₸ + 16,00 Б
5411
Grocery Stores,
28.08.2026
08:48
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 930,00 ₸ + 47,00 Б
5411
Grocery Stores,
28.08.2026
08:47
С карты другого банка
Толықтыру
+ 15 000,00 ₸
6012
Merchandise and
24.08.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 740,00 ₸
24.08.2026
22:59
ANOMALY
Сатып алулар мен шығындар
- 4 756,85 ₸ + 48,00 Б
5734
Computer Software Stores
22.08.2026
12:48
SHOP  ANDREY
Сатып алулар мен шығындар
- 550,00 ₸ + 28,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


22.08.2026
12:44
IP PETROVA ANNA IVANOVNA
Сатып алулар мен шығындар
- 1 200,00 ₸ + 60,00 Б
5411
Grocery Stores,
22.08.2026
12:41
SIDOROVA PAVILON
Сатып алулар мен шығындар
- 2 104,00 ₸ + 105,00 Б
5411
Grocery Stores,
22.08.2026
12:37
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 9 789,00 ₸ + 489,00 Б
5411
Grocery Stores,
22.08.2026
12:37
С карты другого банка
Толықтыру
+ 15 000,00 ₸
6012
Merchandise and
20.08.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 974,00 ₸
20.08.2026
14:31
SIDOROVA PAVILON
Сатып алулар мен шығындар
- 1 166,00 ₸ + 58,00 Б
5411
Grocery Stores,
19.08.2026
22:12
DINA SUPERMARKET 105
Сатып алулар мен шығындар
- 5 856,00 ₸ + 293,00 Б
5411
Grocery Stores,
19.08.2026
22:12
С карты другого банка
Толықтыру
+ 6 000,00 ₸
6012
Merchandise and
19.08.2026
19:31
TOO "BEST PRAYS KAZAHSTAN
Сатып алулар мен шығындар
- 274,00 ₸ + 14,00 Б
5411
Grocery Stores,
19.08.2026
16:13
SIDOROVA PAVILON
Сатып алулар мен шығындар
- 1 210,00 ₸ + 61,00 Б
5411
Grocery Stores,
19.08.2026
16:10
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 3 448,00 ₸ + 172,00 Б
5411
Grocery Stores,
18.08.2026
08:47
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 1 980,00 ₸ + 99,00 Б
5411
Grocery Stores,
18.08.2026
08:47
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
14.08.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 1 313,00 ₸
14.08.2026
21:34
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 6 693,00 ₸ + 335,00 Б
5411
Grocery Stores,
13.08.2026
22:06
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 610,00 ₸ + 31,00 Б
5411
Grocery Stores,
13.08.2026
21:47
GIREX
Сатып алулар мен шығындар
- 3 380,00 ₸ + 34,00 Б
5814
Fast Food Restaurants
12.08.2026
21:32
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 6 282,00 ₸ + 314,00 Б
5411
Grocery Stores,
12.08.2026
21:32
С карты другого банка
Толықтыру
+ 15 000,00 ₸
6012
Merchandise and
12.08.2026
13:29
MAGAZIN IVAN
Сатып алулар мен шығындар
- 950,00 ₸ + 48,00 Б
5411
Grocery Stores,
11.08.2026
11:58
TOO "BEST PRAYS KAZAHSTAN
Сатып алулар мен шығындар
- 6 917,00 ₸ + 346,00 Б
5411
Grocery Stores,
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


10.08.2026
22:05
EUROPHARMA 136-PT DRUG S
Сатып алулар мен шығындар
- 765,00 ₸ + 8,00 Б
5912
Drug Stores, Pharmacies
10.08.2026
21:05
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 8 693,00 ₸ + 435,00 Б
5411
Grocery Stores,
10.08.2026
21:04
С карты другого банка
Толықтыру
+ 18 000,00 ₸
6012
Merchandise and
07.08.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 233,00 ₸
07.08.2026
21:30
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 1 938,00 ₸ + 97,00 Б
5411
Grocery Stores,
06.08.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 1 692,00 ₸
06.08.2026
11:44
FERMER SHOP
Сатып алулар мен шығындар
- 950,00 ₸ + 48,00 Б
5411
Grocery Stores,
06.08.2026
11:40
MAGAZIN FERMER
Сатып алулар мен шығындар
- 3 700,00 ₸ + 185,00 Б
5411
Grocery Stores,
05.08.2026
21:27
DINA #105 SUPERMARKET
Сатып алулар мен шығындар
- 17 123,00 ₸ + 856,00 Б
5411
Grocery Stores,
05.08.2026
21:26
С карты другого банка
Толықтыру
+ 10 000,00 ₸
6012
Merchandise and
05.08.2026
18:45
IP MARINA
Сатып алулар мен шығындар
- 1 100,00 ₸ + 11,00 Б
7538
Automotive Service Shops
04.08.2026
22:32
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 7 163,00 ₸ + 358,00 Б
5411
Grocery Stores,
04.08.2026
22:13
С карты другого банка
Толықтыру
+ 20 000,00 ₸
6012
Merchandise and
02.08.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 114,00 ₸
02.08.2026
13:30
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 1 936,00 ₸ + 97,00 Б
5411
Grocery Stores,
02.08.2026
13:20
ANVAR SUPERMARKET
Сатып алулар мен шығындар
- 7 408,00 ₸ + 370,00 Б
5411
Grocery Stores,
02.08.2026
13:08
С карты другого банка
Толықтыру
+ 7 000,00 ₸
6012
Merchandise and
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA
`
  expect(parseStatementText(text, 'statement')).toEqual({
    header: { iban: 'KZ00886D224300000001', cardLast4: '1234', statementDateIso: '2026-11-02T00:00:00.000', balance: 75, locale: 'kz', statementKind: 'card' },
    transactions: [
      { hold: false, date: '2026-11-01T00:00:00.000', originalAmount: null, amount: '- 7 214,00 ₸', description: 'DINA #104 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-11-01T00:00:00.000\nDINA #104 SUPERMARKET\nСатып алулар мен шығындар\n- 7 214,00 ₸ + 361,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-11-01T00:00:00.000', originalAmount: null, amount: '- 350,00 ₸', description: 'IP IVANOVA MARINA IVN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-11-01T00:00:00.000\nIP IVANOVA MARINA IVN\nСатып алулар мен шығындар\n- 350,00 ₸ + 18,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-31T00:00:00.000', originalAmount: null, amount: '+ 461,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-10-31T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 461,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-10-31T00:00:00.000', originalAmount: null, amount: '- 650,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-31T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 650,00 ₸ + 33,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-31T00:00:00.000', originalAmount: null, amount: '- 1 750,00 ₸', description: 'IP PETROVA ANNA IVANOVNA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-31T00:00:00.000\nIP PETROVA ANNA IVANOVNA\nСатып алулар мен шығындар\n- 1 750,00 ₸ + 88,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-31T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-31T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-31T00:00:00.000', originalAmount: null, amount: '- 1 000,00 ₸', description: 'Мой Kaspi Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-10-31T00:00:00.000\nМой Kaspi Bank\nШығыс аударымдар\n- 1 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-10-31T00:00:00.000', originalAmount: null, amount: '- 1 090,00 ₸', description: 'DINA #104 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-31T00:00:00.000\nDINA #104 SUPERMARKET\nСатып алулар мен шығындар\n- 1 090,00 ₸ + 55,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-30T00:00:00.000', originalAmount: null, amount: '- 1 000,00 ₸', description: 'Мой Kaspi Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-10-30T00:00:00.000\nМой Kaspi Bank\nШығыс аударымдар\n- 1 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-10-29T00:00:00.000', originalAmount: null, amount: '+ 1 142,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-10-29T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 1 142,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-10-29T00:00:00.000', originalAmount: null, amount: '- 9 218,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-29T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 9 218,00 ₸ + 461,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-29T00:00:00.000', originalAmount: null, amount: '+ 5 890,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-29T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 5 890,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-28T00:00:00.000', originalAmount: null, amount: '- 999,00 ₸', description: 'FIX PRICE — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-28T00:00:00.000\nFIX PRICE\nСатып алулар мен шығындар\n- 999,00 ₸ + 50,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-27T00:00:00.000', originalAmount: null, amount: '- 250,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-27T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 250,00 ₸ + 13,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-27T00:00:00.000', originalAmount: null, amount: '- 470,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-27T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 470,00 ₸ + 24,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-27T00:00:00.000', originalAmount: null, amount: '- 488,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-27T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 488,00 ₸ + 24,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-27T00:00:00.000', originalAmount: null, amount: '- 296,00 ₸', description: 'AKSERI — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-27T00:00:00.000\nAKSERI\nСатып алулар мен шығындар\n- 296,00 ₸ + 3,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-26T00:00:00.000', originalAmount: null, amount: '- 8 784,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-26T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 8 784,00 ₸ + 439,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-26T00:00:00.000', originalAmount: null, amount: '+ 15 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-26T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 15 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-26T00:00:00.000', originalAmount: null, amount: '- 902,00 ₸', description: 'SIDOROVA PAVILON — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-26T00:00:00.000\nSIDOROVA PAVILON\nСатып алулар мен шығындар\n- 902,00 ₸ + 45,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-25T00:00:00.000', originalAmount: null, amount: '- 6 321,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-25T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 6 321,00 ₸ + 316,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-25T00:00:00.000', originalAmount: null, amount: '- 325,00 ₸', description: 'BIOSFERA PHARMA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-25T00:00:00.000\nBIOSFERA PHARMA\nСатып алулар мен шығындар\n- 325,00 ₸ + 3,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-25T00:00:00.000', originalAmount: null, amount: '- 849,00 ₸', description: 'BIOSFERA DRUG STORE — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-25T00:00:00.000\nBIOSFERA DRUG STORE\nСатып алулар мен шығындар\n- 849,00 ₸ + 8,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-24T00:00:00.000', originalAmount: null, amount: '+ 8 343,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-10-24T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 8 343,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-10-24T00:00:00.000', originalAmount: null, amount: '- 457,00 ₸', description: 'DINA MINIMARKET 1403 — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-24T00:00:00.000\nDINA MINIMARKET 1403\nСатып алулар мен шығындар\n- 457,00 ₸ + 23,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-24T00:00:00.000', originalAmount: null, amount: '- 3 883,00 ₸', description: 'DINA MINIMARKET 1403 — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-24T00:00:00.000\nDINA MINIMARKET 1403\nСатып алулар мен шығындар\n- 3 883,00 ₸ + 194,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-24T00:00:00.000', originalAmount: null, amount: '- 52 500,00 ₸', description: 'Мой Jusan Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-10-24T00:00:00.000\nМой Jusan Bank\nШығыс аударымдар\n- 52 500,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-10-24T00:00:00.000', originalAmount: null, amount: '+ 20 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-24T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 20 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-24T00:00:00.000', originalAmount: null, amount: '- 720,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-24T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 720,00 ₸ + 36,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-22T00:00:00.000', originalAmount: null, amount: '- 3 816,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-22T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 3 816,00 ₸ + 191,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-22T00:00:00.000', originalAmount: null, amount: '- 200,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-22T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 200,00 ₸ + 10,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-21T00:00:00.000', originalAmount: null, amount: '- 6 943,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-21T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 6 943,00 ₸ + 347,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-21T00:00:00.000', originalAmount: null, amount: '- 650,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-21T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 650,00 ₸ + 33,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-21T00:00:00.000', originalAmount: null, amount: '- 2 520,00 ₸', description: 'IP SMIRNOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-21T00:00:00.000\nIP SMIRNOV\nСатып алулар мен шығындар\n- 2 520,00 ₸ + 25,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-21T00:00:00.000', originalAmount: null, amount: '- 615,00 ₸', description: 'ALAU APTEKA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-21T00:00:00.000\nALAU APTEKA\nСатып алулар мен шығындар\n- 615,00 ₸ + 6,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-19T00:00:00.000', originalAmount: null, amount: '- 2 966,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-19T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 2 966,00 ₸ + 148,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '+ 130 000,00 ₸', description: 'Ішкі аударым — Шығыс аударымдар', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nІшкі аударым\nШығыс аударымдар\n+ 130 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '- 5 620,00 ₸', description: 'BIOSFERA DRUG STORE — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nBIOSFERA DRUG STORE\nСатып алулар мен шығындар\n- 5 620,00 ₸ + 56,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '- 6 233,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 6 233,00 ₸ + 312,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '- 67 133,00 ₸', description: 'Перевод на "Ақшалай кредит" — Кредит бойынша төлемдер', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nПеревод на "Ақшалай кредит"\nКредит бойынша төлемдер\n- 67 133,00 ₸', operation: 'Кредит бойынша төлемдер' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '- 3 180,00 ₸', description: 'BIOSFERA DRUG STORE — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nBIOSFERA DRUG STORE\nСатып алулар мен шығындар\n- 3 180,00 ₸ + 32,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '- 574,00 ₸', description: 'ALKOBRIG&CAKE SHOP — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nALKOBRIG&CAKE SHOP\nСатып алулар мен шығындар\n- 574,00 ₸ + 29,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '- 1 280,00 ₸', description: 'IP IVANOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nIP IVANOV\nСатып алулар мен шығындар\n- 1 280,00 ₸ + 64,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '- 1 582,00 ₸', description: 'IP IVANOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nIP IVANOV\nСатып алулар мен шығындар\n- 1 582,00 ₸ + 79,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-18T00:00:00.000', originalAmount: null, amount: '- 4 745,00 ₸', description: 'IP IVANOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-18T00:00:00.000\nIP IVANOV\nСатып алулар мен шығындар\n- 4 745,00 ₸ + 237,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-17T00:00:00.000', originalAmount: null, amount: '- 4 720,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-17T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 4 720,00 ₸ + 236,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-17T00:00:00.000', originalAmount: null, amount: '+ 20 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-17T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 20 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-17T00:00:00.000', originalAmount: null, amount: '- 253,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-17T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 253,00 ₸ + 13,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-16T00:00:00.000', originalAmount: null, amount: '- 9 236,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-16T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 9 236,00 ₸ + 462,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-16T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-16T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-15T00:00:00.000', originalAmount: null, amount: '- 9 373,00 ₸', description: 'DINA SUPERMARKET 105 — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-15T00:00:00.000\nDINA SUPERMARKET 105\nСатып алулар мен шығындар\n- 9 373,00 ₸ + 469,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-15T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-15T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-15T00:00:00.000', originalAmount: null, amount: '- 1 425,00 ₸', description: 'OVOSHCHI-FRUKTY SHOP — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-15T00:00:00.000\nOVOSHCHI-FRUKTY SHOP\nСатып алулар мен шығындар\n- 1 425,00 ₸ + 71,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-14T00:00:00.000', originalAmount: null, amount: '- 1 857,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-14T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 1 857,00 ₸ + 93,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-14T00:00:00.000', originalAmount: null, amount: '- 481,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-14T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 481,00 ₸ + 24,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-11T00:00:00.000', originalAmount: null, amount: '- 5 381,00 ₸', description: 'DINA #104 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-11T00:00:00.000\nDINA #104 SUPERMARKET\nСатып алулар мен шығындар\n- 5 381,00 ₸ + 269,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-11T00:00:00.000', originalAmount: null, amount: '+ 5 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-11T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 5 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-11T00:00:00.000', originalAmount: null, amount: '- 8 305,00 ₸', description: 'MAGAZIN FERMER — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-11T00:00:00.000\nMAGAZIN FERMER\nСатып алулар мен шығындар\n- 8 305,00 ₸ + 415,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-11T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-11T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-10T00:00:00.000', originalAmount: null, amount: '- 2 170,00 ₸', description: 'SIDOROVA PAVILON — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-10T00:00:00.000\nSIDOROVA PAVILON\nСатып алулар мен шығындар\n- 2 170,00 ₸ + 109,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-10T00:00:00.000', originalAmount: null, amount: '- 12 156,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-10T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 12 156,00 ₸ + 608,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-10T00:00:00.000', originalAmount: null, amount: '+ 15 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-10T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 15 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-09T00:00:00.000', originalAmount: null, amount: '- 2 746,00 ₸', description: 'FIX PRICE — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-09T00:00:00.000\nFIX PRICE\nСатып алулар мен шығындар\n- 2 746,00 ₸ + 137,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-06T00:00:00.000', originalAmount: null, amount: '- 950,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-06T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 950,00 ₸ + 48,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-05T00:00:00.000', originalAmount: null, amount: '- 1 550,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-05T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 1 550,00 ₸ + 78,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-05T00:00:00.000', originalAmount: null, amount: '- 750,00 ₸', description: 'IP MARINA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-05T00:00:00.000\nIP MARINA\nСатып алулар мен шығындар\n- 750,00 ₸ + 8,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-05T00:00:00.000', originalAmount: null, amount: '- 1 550,00 ₸', description: 'IP PETROV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-05T00:00:00.000\nIP PETROV\nСатып алулар мен шығындар\n- 1 550,00 ₸ + 16,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-05T00:00:00.000', originalAmount: null, amount: '+ 5 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-05T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 5 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-05T00:00:00.000', originalAmount: null, amount: '- 4 480,00 ₸', description: 'MAGAZIN FERMER — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-05T00:00:00.000\nMAGAZIN FERMER\nСатып алулар мен шығындар\n- 4 480,00 ₸ + 224,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-05T00:00:00.000', originalAmount: null, amount: '+ 5 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-05T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 5 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-04T00:00:00.000', originalAmount: null, amount: '- 9 477,00 ₸', description: 'DINA #111 GIPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-04T00:00:00.000\nDINA #111 GIPERMARKET\nСатып алулар мен шығындар\n- 9 477,00 ₸ + 474,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-04T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-04T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-04T00:00:00.000', originalAmount: null, amount: '- 4 700,00 ₸', description: 'IP SMIRNOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-04T00:00:00.000\nIP SMIRNOV\nСатып алулар мен шығындар\n- 4 700,00 ₸ + 47,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-04T00:00:00.000', originalAmount: null, amount: '- 4 060,00 ₸', description: 'SIDOROVA PAVILON — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-04T00:00:00.000\nSIDOROVA PAVILON\nСатып алулар мен шығындар\n- 4 060,00 ₸ + 203,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-04T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-04T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-04T00:00:00.000', originalAmount: null, amount: '- 3 366,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-04T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 3 366,00 ₸ + 168,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-03T00:00:00.000', originalAmount: null, amount: '- 2 481,00 ₸', description: 'TOO "BEST PRAYS KAZAHSTAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-03T00:00:00.000\nTOO "BEST PRAYS KAZAHSTAN\nСатып алулар мен шығындар\n- 2 481,00 ₸ + 124,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-03T00:00:00.000', originalAmount: null, amount: '- 13 073,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-03T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 13 073,00 ₸ + 654,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-03T00:00:00.000', originalAmount: null, amount: '+ 20 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-10-03T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 20 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-10-01T00:00:00.000', originalAmount: null, amount: '- 2 530,00 ₸', description: 'IP PETROVA ANNA IVANOVNA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-01T00:00:00.000\nIP PETROVA ANNA IVANOVNA\nСатып алулар мен шығындар\n- 2 530,00 ₸ + 127,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-10-01T00:00:00.000', originalAmount: null, amount: '- 6 242,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-10-01T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 6 242,00 ₸ + 312,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-30T00:00:00.000', originalAmount: null, amount: '- 520,00 ₸', description: 'YANDEX.GO — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-30T00:00:00.000\nYANDEX.GO\nСатып алулар мен шығындар\n- 520,00 ₸ + 5,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-29T00:00:00.000', originalAmount: null, amount: '- 7 789,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-29T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 7 789,00 ₸ + 389,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-29T00:00:00.000', originalAmount: null, amount: '+ 15 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-09-29T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 15 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-09-27T00:00:00.000', originalAmount: null, amount: '- 3 257,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-27T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 3 257,00 ₸ + 163,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-27T00:00:00.000', originalAmount: null, amount: '- 990,00 ₸', description: 'YANDEX.GO — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-27T00:00:00.000\nYANDEX.GO\nСатып алулар мен шығындар\n- 990,00 ₸ + 10,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-27T00:00:00.000', originalAmount: null, amount: '- 1 120,00 ₸', description: 'YANDEX.GO — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-27T00:00:00.000\nYANDEX.GO\nСатып алулар мен шығындар\n- 1 120,00 ₸ + 11,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-26T00:00:00.000', originalAmount: null, amount: '- 5 171,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-26T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 5 171,00 ₸ + 259,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-26T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-09-26T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-09-25T00:00:00.000', originalAmount: null, amount: '- 1 876,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-25T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 1 876,00 ₸ + 94,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-24T00:00:00.000', originalAmount: null, amount: '- 1 000,00 ₸', description: 'IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-24T00:00:00.000\nIVAN\nСатып алулар мен шығындар\n- 1 000,00 ₸ + 50,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-24T00:00:00.000', originalAmount: null, amount: '- 4 666,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-24T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 4 666,00 ₸ + 233,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-24T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-09-24T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-09-24T00:00:00.000', originalAmount: null, amount: '- 290,00 ₸', description: 'EDELVEIS — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-24T00:00:00.000\nEDELVEIS\nСатып алулар мен шығындар\n- 290,00 ₸ + 15,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-23T00:00:00.000', originalAmount: null, amount: '+ 1 835,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-09-23T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 1 835,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-09-23T00:00:00.000', originalAmount: null, amount: '- 2 402,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-23T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 2 402,00 ₸ + 120,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-22T00:00:00.000', originalAmount: null, amount: '- 5 240,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-22T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 5 240,00 ₸ + 262,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-21T00:00:00.000', originalAmount: null, amount: '- 2 354,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-21T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 2 354,00 ₸ + 118,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-21T00:00:00.000', originalAmount: null, amount: '- 970,00 ₸', description: 'YANDEX.GO — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-21T00:00:00.000\nYANDEX.GO\nСатып алулар мен шығындар\n- 970,00 ₸ + 10,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-20T00:00:00.000', originalAmount: null, amount: '- 3 106,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-20T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 3 106,00 ₸ + 155,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-20T00:00:00.000', originalAmount: null, amount: '- 1 899,00 ₸', description: 'TOO "BEST PRAYS KAZAHSTAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-20T00:00:00.000\nTOO "BEST PRAYS KAZAHSTAN\nСатып алулар мен шығындар\n- 1 899,00 ₸ + 95,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-20T00:00:00.000', originalAmount: null, amount: '- 2 350,00 ₸', description: 'IP SMIRNOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-20T00:00:00.000\nIP SMIRNOV\nСатып алулар мен шығындар\n- 2 350,00 ₸ + 24,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-20T00:00:00.000', originalAmount: null, amount: '+ 15 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-09-20T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 15 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-09-20T00:00:00.000', originalAmount: null, amount: '- 253,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-20T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 253,00 ₸ + 13,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-19T00:00:00.000', originalAmount: null, amount: '- 3 292,00 ₸', description: 'IP PETROVA ANNA IVANOVNA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-19T00:00:00.000\nIP PETROVA ANNA IVANOVNA\nСатып алулар мен шығындар\n- 3 292,00 ₸ + 165,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-19T00:00:00.000', originalAmount: null, amount: '- 14 624,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-19T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 14 624,00 ₸ + 731,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-19T00:00:00.000', originalAmount: null, amount: '+ 20 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-09-19T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 20 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-09-18T00:00:00.000', originalAmount: null, amount: '- 520,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-18T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 520,00 ₸ + 26,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-18T00:00:00.000', originalAmount: null, amount: '- 2 565,00 ₸', description: 'IP SMIRNOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-18T00:00:00.000\nIP SMIRNOV\nСатып алулар мен шығындар\n- 2 565,00 ₸ + 26,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-17T00:00:00.000', originalAmount: null, amount: '+ 6 207,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-09-17T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 6 207,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-09-17T00:00:00.000', originalAmount: null, amount: '- 4 209,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-17T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 4 209,00 ₸ + 210,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-16T00:00:00.000', originalAmount: null, amount: '- 6 247,00 ₸', description: 'DINA SUPERMARKET 105 — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-16T00:00:00.000\nDINA SUPERMARKET 105\nСатып алулар мен шығындар\n- 6 247,00 ₸ + 312,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-16T00:00:00.000', originalAmount: null, amount: '- 650,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-16T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 650,00 ₸ + 33,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-15T00:00:00.000', originalAmount: null, amount: '- 1 000,00 ₸', description: 'Мой Kaspi Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-15T00:00:00.000\nМой Kaspi Bank\nШығыс аударымдар\n- 1 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-15T00:00:00.000', originalAmount: null, amount: '- 10 349,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-15T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 10 349,00 ₸ + 517,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-15T00:00:00.000', originalAmount: null, amount: '- 3 810,00 ₸', description: 'TOO ZERDE FARMA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-15T00:00:00.000\nTOO ZERDE FARMA\nСатып алулар мен шығындар\n- 3 810,00 ₸ + 38,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-14T00:00:00.000', originalAmount: null, amount: '- 900,00 ₸', description: 'IP PETROV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-14T00:00:00.000\nIP PETROV\nСатып алулар мен шығындар\n- 900,00 ₸ + 9,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-14T00:00:00.000', originalAmount: null, amount: '- 3 940,00 ₸', description: 'MAGAZIN FERMER — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-14T00:00:00.000\nMAGAZIN FERMER\nСатып алулар мен шығындар\n- 3 940,00 ₸ + 197,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-13T00:00:00.000', originalAmount: null, amount: '- 11 190,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-13T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 11 190,00 ₸ + 560,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-13T00:00:00.000', originalAmount: null, amount: '- 1 970,00 ₸', description: 'YANDEX.GO — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-13T00:00:00.000\nYANDEX.GO\nСатып алулар мен шығындар\n- 1 970,00 ₸ + 20,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-13T00:00:00.000', originalAmount: null, amount: '- 1 400,00 ₸', description: 'IP GORODSKAYA PEKARNYA BA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-13T00:00:00.000\nIP GORODSKAYA PEKARNYA BA\nСатып алулар мен шығындар\n- 1 400,00 ₸ + 14,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-13T00:00:00.000', originalAmount: null, amount: '- 3 230,00 ₸', description: 'BODRUM KOFEYNYA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-13T00:00:00.000\nBODRUM KOFEYNYA\nСатып алулар мен шығындар\n- 3 230,00 ₸ + 32,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-13T00:00:00.000', originalAmount: null, amount: '- 750,00 ₸', description: 'YANDEX.GO — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-13T00:00:00.000\nYANDEX.GO\nСатып алулар мен шығындар\n- 750,00 ₸ + 8,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-13T00:00:00.000', originalAmount: null, amount: '- 550,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-13T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 550,00 ₸ + 28,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-12T00:00:00.000', originalAmount: null, amount: '- 250,00 ₸', description: 'BODRUM KOFEINYA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-12T00:00:00.000\nBODRUM KOFEINYA\nСатып алулар мен шығындар\n- 250,00 ₸ + 3,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-12T00:00:00.000', originalAmount: null, amount: '- 2 630,00 ₸', description: 'APORT STOLOVAYA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-12T00:00:00.000\nAPORT STOLOVAYA\nСатып алулар мен шығындар\n- 2 630,00 ₸ + 26,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-12T00:00:00.000', originalAmount: null, amount: '- 10 000,00 ₸', description: 'Мой Kaspi Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-12T00:00:00.000\nМой Kaspi Bank\nШығыс аударымдар\n- 10 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-12T00:00:00.000', originalAmount: null, amount: '- 1 110,00 ₸', description: 'YANDEX.GO — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-12T00:00:00.000\nYANDEX.GO\nСатып алулар мен шығындар\n- 1 110,00 ₸ + 11,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-12T00:00:00.000', originalAmount: null, amount: '- 1 000,00 ₸', description: 'GORODSKAYA PEKARNYA BAGE — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-12T00:00:00.000\nGORODSKAYA PEKARNYA BAGE\nСатып алулар мен шығындар\n- 1 000,00 ₸ + 50,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-12T00:00:00.000', originalAmount: null, amount: '- 630,00 ₸', description: 'YANDEX.GO — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-12T00:00:00.000\nYANDEX.GO\nСатып алулар мен шығындар\n- 630,00 ₸ + 6,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-11T00:00:00.000', originalAmount: null, amount: '- 4 309,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-11T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 4 309,00 ₸ + 215,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-11T00:00:00.000', originalAmount: null, amount: '- 3 480,00 ₸', description: 'BODRUM KOFEYNYA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-11T00:00:00.000\nBODRUM KOFEYNYA\nСатып алулар мен шығындар\n- 3 480,00 ₸ + 35,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-11T00:00:00.000', originalAmount: null, amount: '- 7 000,00 ₸', description: 'AMAN-SAULYK MED.TSENTR — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-11T00:00:00.000\nAMAN-SAULYK MED.TSENTR\nСатып алулар мен шығындар\n- 7 000,00 ₸ + 70,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-11T00:00:00.000', originalAmount: null, amount: '- 2 450,00 ₸', description: 'IP SMIRNOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-11T00:00:00.000\nIP SMIRNOV\nСатып алулар мен шығындар\n- 2 450,00 ₸ + 25,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-11T00:00:00.000', originalAmount: null, amount: '- 3 000,00 ₸', description: 'IP SMIRNOVA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-11T00:00:00.000\nIP SMIRNOVA\nСатып алулар мен шығындар\n- 3 000,00 ₸ + 30,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-10T00:00:00.000', originalAmount: null, amount: '- 3 625,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-10T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 3 625,00 ₸ + 181,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-10T00:00:00.000', originalAmount: null, amount: '- 4 000,00 ₸', description: 'Мой Kaspi Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-10T00:00:00.000\nМой Kaspi Bank\nШығыс аударымдар\n- 4 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-10T00:00:00.000', originalAmount: null, amount: '- 4 300,00 ₸', description: 'MY KIDS AKTOBE PARK — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-10T00:00:00.000\nMY KIDS AKTOBE PARK\nСатып алулар мен шығындар\n- 4 300,00 ₸ + 43,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-09T00:00:00.000', originalAmount: null, amount: '- 814,00 ₸', description: 'ALKOBRIG&CAKE SHOP — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-09T00:00:00.000\nALKOBRIG&CAKE SHOP\nСатып алулар мен шығындар\n- 814,00 ₸ + 41,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-09T00:00:00.000', originalAmount: null, amount: '- 5 093,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-09T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 5 093,00 ₸ + 255,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-09T00:00:00.000', originalAmount: null, amount: '- 350,00 ₸', description: 'BIOSFERA PHARMA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-09T00:00:00.000\nBIOSFERA PHARMA\nСатып алулар мен шығындар\n- 350,00 ₸ + 4,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-09T00:00:00.000', originalAmount: null, amount: '- 253,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-09T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 253,00 ₸ + 13,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-09T00:00:00.000', originalAmount: null, amount: '- 2 700,00 ₸', description: 'KFC 12747 — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-09T00:00:00.000\nKFC 12747\nСатып алулар мен шығындар\n- 2 700,00 ₸ + 27,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-09T00:00:00.000', originalAmount: null, amount: '- 1 000,00 ₸', description: 'IP MARINA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-09T00:00:00.000\nIP MARINA\nСатып алулар мен шығындар\n- 1 000,00 ₸ + 10,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-08T00:00:00.000', originalAmount: null, amount: '- 4 000,00 ₸', description: 'Мой Jusan Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-08T00:00:00.000\nМой Jusan Bank\nШығыс аударымдар\n- 4 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-08T00:00:00.000', originalAmount: null, amount: '- 4 000,00 ₸', description: 'Halyk Bank *5678 — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-08T00:00:00.000\nHalyk Bank *5678\nШығыс аударымдар\n- 4 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-08T00:00:00.000', originalAmount: null, amount: '- 8 467,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-08T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 8 467,00 ₸ + 423,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-08T00:00:00.000', originalAmount: null, amount: '- 1 599,00 ₸', description: 'TOO "BEST PRAYS KAZAHSTAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-08T00:00:00.000\nTOO "BEST PRAYS KAZAHSTAN\nСатып алулар мен шығындар\n- 1 599,00 ₸ + 80,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-08T00:00:00.000', originalAmount: null, amount: '- 2 604,00 ₸', description: 'TOO "BEST PRAYS KAZAHSTAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-08T00:00:00.000\nTOO "BEST PRAYS KAZAHSTAN\nСатып алулар мен шығындар\n- 2 604,00 ₸ + 130,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-08T00:00:00.000', originalAmount: null, amount: '- 1 840,00 ₸', description: 'SHOP  ANDREY — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-08T00:00:00.000\nSHOP  ANDREY\nСатып алулар мен шығындар\n- 1 840,00 ₸ + 92,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-07T00:00:00.000', originalAmount: null, amount: '- 5 674,00 ₸', description: 'BIOSFERA DRUG STORE — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-07T00:00:00.000\nBIOSFERA DRUG STORE\nСатып алулар мен шығындар\n- 5 674,00 ₸ + 57,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-07T00:00:00.000', originalAmount: null, amount: '- 5 000,00 ₸', description: 'Мой Kaspi Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-07T00:00:00.000\nМой Kaspi Bank\nШығыс аударымдар\n- 5 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-07T00:00:00.000', originalAmount: null, amount: '- 15 000,00 ₸', description: 'Мой Kaspi Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-07T00:00:00.000\nМой Kaspi Bank\nШығыс аударымдар\n- 15 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-07T00:00:00.000', originalAmount: null, amount: '- 6 394,00 ₸', description: 'MAYAK SHOP — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-07T00:00:00.000\nMAYAK SHOP\nСатып алулар мен шығындар\n- 6 394,00 ₸ + 320,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-07T00:00:00.000', originalAmount: null, amount: '- 1 500,00 ₸', description: 'IP MARINA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-07T00:00:00.000\nIP MARINA\nСатып алулар мен шығындар\n- 1 500,00 ₸ + 15,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-07T00:00:00.000', originalAmount: null, amount: '- 2 310,00 ₸', description: 'TOO KLINIKA AJGERIM — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-07T00:00:00.000\nTOO KLINIKA AJGERIM\nСатып алулар мен шығындар\n- 2 310,00 ₸ + 23,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-06T00:00:00.000', originalAmount: null, amount: '- 4 643,00 ₸', description: 'DASTAR.HAN SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-06T00:00:00.000\nDASTAR.HAN SUPERMARKET\nСатып алулар мен шығындар\n- 4 643,00 ₸ + 232,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-06T00:00:00.000', originalAmount: null, amount: '- 1 550,00 ₸', description: 'SHOP  ANDREY — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-06T00:00:00.000\nSHOP  ANDREY\nСатып алулар мен шығындар\n- 1 550,00 ₸ + 78,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-06T00:00:00.000', originalAmount: null, amount: '- 1 490,00 ₸', description: 'IP SMIRNOV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-06T00:00:00.000\nIP SMIRNOV\nСатып алулар мен шығындар\n- 1 490,00 ₸ + 15,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-06T00:00:00.000', originalAmount: null, amount: '- 2 415,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-06T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 2 415,00 ₸ + 121,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-06T00:00:00.000', originalAmount: null, amount: '- 67 133,00 ₸', description: 'Перевод на "Ақшалай кредит" — Кредит бойынша төлемдер', statementUid: 'statement', originString: '2026-09-06T00:00:00.000\nПеревод на "Ақшалай кредит"\nКредит бойынша төлемдер\n- 67 133,00 ₸', operation: 'Кредит бойынша төлемдер' },
      { hold: false, date: '2026-09-06T00:00:00.000', originalAmount: null, amount: '- 7 000,00 ₸', description: 'Мой Jusan Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-06T00:00:00.000\nМой Jusan Bank\nШығыс аударымдар\n- 7 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-05T00:00:00.000', originalAmount: null, amount: '+ 370 500,00 ₸', description: 'Ішкі аударым — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-05T00:00:00.000\nІшкі аударым\nШығыс аударымдар\n+ 370 500,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-05T00:00:00.000', originalAmount: null, amount: '- 100 000,00 ₸', description: 'Мой Kaspi Bank — Шығыс аударымдар', statementUid: 'statement', originString: '2026-09-05T00:00:00.000\nМой Kaspi Bank\nШығыс аударымдар\n- 100 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-09-05T00:00:00.000', originalAmount: null, amount: '- 2 506,00 ₸', description: 'TOO "FORMAT.KZ" — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-05T00:00:00.000\nTOO "FORMAT.KZ"\nСатып алулар мен шығындар\n- 2 506,00 ₸ + 25,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-05T00:00:00.000', originalAmount: null, amount: '- 17 373,00 ₸', description: '105 SUPER MARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-05T00:00:00.000\n105 SUPER MARKET\nСатып алулар мен шығындар\n- 17 373,00 ₸ + 869,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-05T00:00:00.000', originalAmount: null, amount: '- 1 900,00 ₸', description: 'IP PETROV — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-05T00:00:00.000\nIP PETROV\nСатып алулар мен шығындар\n- 1 900,00 ₸ + 19,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-09-01T00:00:00.000', originalAmount: null, amount: '- 3 787,00 ₸', description: 'DINA SUPERMARKET 105 — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-09-01T00:00:00.000\nDINA SUPERMARKET 105\nСатып алулар мен шығындар\n- 3 787,00 ₸ + 189,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-29T00:00:00.000', originalAmount: null, amount: '- 962,00 ₸', description: 'IP PETROVA ANNA IVANOVNA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-29T00:00:00.000\nIP PETROVA ANNA IVANOVNA\nСатып алулар мен шығындар\n- 962,00 ₸ + 48,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-29T00:00:00.000', originalAmount: null, amount: '- 5 922,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-29T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 5 922,00 ₸ + 296,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-28T00:00:00.000', originalAmount: null, amount: '+ 69 000,00 ₸', description: 'Ішкі аударым — Шығыс аударымдар', statementUid: 'statement', originString: '2026-08-28T00:00:00.000\nІшкі аударым\nШығыс аударымдар\n+ 69 000,00 ₸', operation: 'Шығыс аударымдар' },
      { hold: false, date: '2026-08-28T00:00:00.000', originalAmount: null, amount: '- 1 691,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-28T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 1 691,00 ₸ + 85,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-28T00:00:00.000', originalAmount: null, amount: '- 67 133,00 ₸', description: 'Перевод на "Ақшалай кредит" — Кредит бойынша төлемдер', statementUid: 'statement', originString: '2026-08-28T00:00:00.000\nПеревод на "Ақшалай кредит"\nКредит бойынша төлемдер\n- 67 133,00 ₸', operation: 'Кредит бойынша төлемдер' },
      { hold: false, date: '2026-08-28T00:00:00.000', originalAmount: null, amount: '- 1 899,00 ₸', description: 'TOO "BEST PRAYS KAZAHSTAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-28T00:00:00.000\nTOO "BEST PRAYS KAZAHSTAN\nСатып алулар мен шығындар\n- 1 899,00 ₸ + 95,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-28T00:00:00.000', originalAmount: null, amount: '- 1 411,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-28T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 1 411,00 ₸ + 71,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-28T00:00:00.000', originalAmount: null, amount: '- 310,00 ₸', description: 'IP PETROVA ANNA IVANOVNA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-28T00:00:00.000\nIP PETROVA ANNA IVANOVNA\nСатып алулар мен шығындар\n- 310,00 ₸ + 16,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-28T00:00:00.000', originalAmount: null, amount: '- 930,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-28T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 930,00 ₸ + 47,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-28T00:00:00.000', originalAmount: null, amount: '+ 15 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-28T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 15 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-08-24T00:00:00.000', originalAmount: null, amount: '+ 740,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-08-24T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 740,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-08-24T00:00:00.000', originalAmount: null, amount: '- 4 756,85 ₸', description: 'ANOMALY — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-24T00:00:00.000\nANOMALY\nСатып алулар мен шығындар\n- 4 756,85 ₸ + 48,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-22T00:00:00.000', originalAmount: null, amount: '- 550,00 ₸', description: 'SHOP  ANDREY — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-22T00:00:00.000\nSHOP  ANDREY\nСатып алулар мен шығындар\n- 550,00 ₸ + 28,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-22T00:00:00.000', originalAmount: null, amount: '- 1 200,00 ₸', description: 'IP PETROVA ANNA IVANOVNA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-22T00:00:00.000\nIP PETROVA ANNA IVANOVNA\nСатып алулар мен шығындар\n- 1 200,00 ₸ + 60,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-22T00:00:00.000', originalAmount: null, amount: '- 2 104,00 ₸', description: 'SIDOROVA PAVILON — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-22T00:00:00.000\nSIDOROVA PAVILON\nСатып алулар мен шығындар\n- 2 104,00 ₸ + 105,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-22T00:00:00.000', originalAmount: null, amount: '- 9 789,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-22T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 9 789,00 ₸ + 489,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-22T00:00:00.000', originalAmount: null, amount: '+ 15 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-22T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 15 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-08-20T00:00:00.000', originalAmount: null, amount: '+ 974,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-08-20T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 974,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-08-20T00:00:00.000', originalAmount: null, amount: '- 1 166,00 ₸', description: 'SIDOROVA PAVILON — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-20T00:00:00.000\nSIDOROVA PAVILON\nСатып алулар мен шығындар\n- 1 166,00 ₸ + 58,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-19T00:00:00.000', originalAmount: null, amount: '- 5 856,00 ₸', description: 'DINA SUPERMARKET 105 — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-19T00:00:00.000\nDINA SUPERMARKET 105\nСатып алулар мен шығындар\n- 5 856,00 ₸ + 293,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-19T00:00:00.000', originalAmount: null, amount: '+ 6 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-19T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 6 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-08-19T00:00:00.000', originalAmount: null, amount: '- 274,00 ₸', description: 'TOO "BEST PRAYS KAZAHSTAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-19T00:00:00.000\nTOO "BEST PRAYS KAZAHSTAN\nСатып алулар мен шығындар\n- 274,00 ₸ + 14,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-19T00:00:00.000', originalAmount: null, amount: '- 1 210,00 ₸', description: 'SIDOROVA PAVILON — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-19T00:00:00.000\nSIDOROVA PAVILON\nСатып алулар мен шығындар\n- 1 210,00 ₸ + 61,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-19T00:00:00.000', originalAmount: null, amount: '- 3 448,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-19T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 3 448,00 ₸ + 172,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-18T00:00:00.000', originalAmount: null, amount: '- 1 980,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-18T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 1 980,00 ₸ + 99,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-18T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-18T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-08-14T00:00:00.000', originalAmount: null, amount: '+ 1 313,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-08-14T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 1 313,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-08-14T00:00:00.000', originalAmount: null, amount: '- 6 693,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-14T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 6 693,00 ₸ + 335,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-13T00:00:00.000', originalAmount: null, amount: '- 610,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-13T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 610,00 ₸ + 31,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-13T00:00:00.000', originalAmount: null, amount: '- 3 380,00 ₸', description: 'GIREX — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-13T00:00:00.000\nGIREX\nСатып алулар мен шығындар\n- 3 380,00 ₸ + 34,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-12T00:00:00.000', originalAmount: null, amount: '- 6 282,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-12T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 6 282,00 ₸ + 314,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-12T00:00:00.000', originalAmount: null, amount: '+ 15 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-12T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 15 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-08-12T00:00:00.000', originalAmount: null, amount: '- 950,00 ₸', description: 'MAGAZIN IVAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-12T00:00:00.000\nMAGAZIN IVAN\nСатып алулар мен шығындар\n- 950,00 ₸ + 48,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-11T00:00:00.000', originalAmount: null, amount: '- 6 917,00 ₸', description: 'TOO "BEST PRAYS KAZAHSTAN — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-11T00:00:00.000\nTOO "BEST PRAYS KAZAHSTAN\nСатып алулар мен шығындар\n- 6 917,00 ₸ + 346,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-10T00:00:00.000', originalAmount: null, amount: '- 765,00 ₸', description: 'EUROPHARMA 136-PT DRUG S — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-10T00:00:00.000\nEUROPHARMA 136-PT DRUG S\nСатып алулар мен шығындар\n- 765,00 ₸ + 8,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-10T00:00:00.000', originalAmount: null, amount: '- 8 693,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-10T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 8 693,00 ₸ + 435,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-10T00:00:00.000', originalAmount: null, amount: '+ 18 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-10T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 18 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-08-07T00:00:00.000', originalAmount: null, amount: '+ 233,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-08-07T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 233,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-08-07T00:00:00.000', originalAmount: null, amount: '- 1 938,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-07T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 1 938,00 ₸ + 97,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-06T00:00:00.000', originalAmount: null, amount: '+ 1 692,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-08-06T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 1 692,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-08-06T00:00:00.000', originalAmount: null, amount: '- 950,00 ₸', description: 'FERMER SHOP — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-06T00:00:00.000\nFERMER SHOP\nСатып алулар мен шығындар\n- 950,00 ₸ + 48,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-06T00:00:00.000', originalAmount: null, amount: '- 3 700,00 ₸', description: 'MAGAZIN FERMER — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-06T00:00:00.000\nMAGAZIN FERMER\nСатып алулар мен шығындар\n- 3 700,00 ₸ + 185,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-05T00:00:00.000', originalAmount: null, amount: '- 17 123,00 ₸', description: 'DINA #105 SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-05T00:00:00.000\nDINA #105 SUPERMARKET\nСатып алулар мен шығындар\n- 17 123,00 ₸ + 856,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-05T00:00:00.000', originalAmount: null, amount: '+ 10 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-05T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 10 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-08-05T00:00:00.000', originalAmount: null, amount: '- 1 100,00 ₸', description: 'IP MARINA — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-05T00:00:00.000\nIP MARINA\nСатып алулар мен шығындар\n- 1 100,00 ₸ + 11,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-04T00:00:00.000', originalAmount: null, amount: '- 7 163,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-04T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 7 163,00 ₸ + 358,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-04T00:00:00.000', originalAmount: null, amount: '+ 20 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-04T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 20 000,00 ₸', operation: 'Толықтыру' },
      { hold: false, date: '2026-08-02T00:00:00.000', originalAmount: null, amount: '+ 114,00 ₸', description: 'Бонустар Кэшбек/Манибек — Теңгеге аударылған бонустар', statementUid: 'statement', originString: '2026-08-02T00:00:00.000\nБонустар Кэшбек/Манибек\nТеңгеге аударылған бонустар\n+ 114,00 ₸', operation: 'Теңгеге аударылған бонустар' },
      { hold: false, date: '2026-08-02T00:00:00.000', originalAmount: null, amount: '- 1 936,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-02T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 1 936,00 ₸ + 97,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-02T00:00:00.000', originalAmount: null, amount: '- 7 408,00 ₸', description: 'ANVAR SUPERMARKET — Сатып алулар мен шығындар', statementUid: 'statement', originString: '2026-08-02T00:00:00.000\nANVAR SUPERMARKET\nСатып алулар мен шығындар\n- 7 408,00 ₸ + 370,00 Б', operation: 'Сатып алулар мен шығындар' },
      { hold: false, date: '2026-08-02T00:00:00.000', originalAmount: null, amount: '+ 7 000,00 ₸', description: 'С карты другого банка — Толықтыру', statementUid: 'statement', originString: '2026-08-02T00:00:00.000\nС карты другого банка\nТолықтыру\n+ 7 000,00 ₸', operation: 'Толықтыру' }
    ]
  })
})

it('preserves the Kazakh loan payment purpose without inventing a recipient movement', () => {
  // Complete parsed debit from mail_inbound 193847, 18 October; the statement has no loan-side credit.
  // TRANSFER-001, COMMENT-001: the loan label is a purpose, not an external merchant.
  const transaction = {
    hold: false,
    date: '2026-10-18T00:00:00.000',
    originalAmount: null,
    amount: '- 67 133,00 ₸',
    description: 'Перевод на "Ақшалай кредит" — Кредит бойынша төлемдер',
    statementUid: 'statement',
    originString: '2026-10-18T00:00:00.000\nПеревод на "Ақшалай кредит"\nКредит бойынша төлемдер\n- 67 133,00 ₸',
    operation: 'Кредит бойынша төлемдер'
  }
  const account: ConvertedAccount = {
    account: {
      id: 'KZ00886D224300000001',
      instrument: 'KZT',
      title: 'Home Credit *1234',
      type: AccountType.ccard,
      syncIds: ['KZ00886D224300000001'],
      balance: 75
    },
    date: new Date('2026-11-02T00:00:00.000')
  }
  expect(convertPdfStatementTransaction(transaction, account)).toEqual({
    statementUid: 'statement',
    transaction: {
      date: new Date('2026-10-18T00:00:00.000'),
      hold: false,
      merchant: null,
      comment: 'Перевод на "Ақшалай кредит"',
      movements: [{ id: null, account: { id: 'KZ00886D224300000001' }, sum: -67133, invoice: null, fee: 0 }]
    }
  })
})
