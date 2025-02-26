import { parseSinglePdfString } from '../api'
const statements = [
`

 
EVGENII TIKHONOV
Account No: 00158007318398268 26.02.2025 07:35
***Dekont yerine  kullanılamaz.   Uyuşmazlık  halinde Banka  kayıtları  esas  alınacaktır  
www.vakifbank.com.tr | 444 0 724
Türkiye Vakiflar  Bankası  T.A.O Büyük Mükellefler V.D. 9220034970 Sicil  Numarası:  776444
Finanskent Mahallesi Finans Caddesi No:40/1 34760   Ümraniye/İSTANBUL                      
Sf. 1 / 8
Account Transactions
VB Cust. No. : 445014111936 Balance : 1.200,80 TL
Identification / 
Tax Number
:
Overdraft 
Account
: 0,00 TL
IBAN : TR57 0001 5001 5800 7318 3982 68 Date Range : 26.01.2025 - 26.02.2025
Branch : S00599  ŞİRİNYALI/ANTALYA Joint Account : No
Account Type : VADESİZ  TL Nickname :
DATE HOUR TRANSACTION ID AMOUNT BALANCE TRANSACTION NAME
27.01.2025 12:30 2025001311308659 -296,50 1.933,08 Diğer  Banka  POS-Alışveriş
Referans :20012502712234768 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :12:30:11 Provizyon Kodu : 
452856 - 0012 - D -  Mcc: 5411
27.01.2025 14:44 2025001318540797 -1.287,04 646,04 Diğer  Banka  POS-Alışveriş
Referans :20067502714917457 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :14:44:47 Provizyon 
Kodu : 744442 - 0067 - D -  Mcc: 5411
28.01.2025 11:34 2025001364952100 71.400,00 72.046,04 FAST Instant Payment
(28.01.2025 tarihli 355771507 sorgu no'lu QNB Bank  A.Ş.  Rauf  Khamıdov   hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)
29.01.2025 10:06 2025001413409095 -30.407,00 41.639,04 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date Timofey Tikhonov (29/01/2025 and query number 1556714054 to the account Türkiye 
Cumhuriyeti Ziraat  Bankası   A.Ş.  vd koleji Özel  eğitim  yaysan ve  ticaş)
29.01.2025 10:06 2025001413409095 -12,80 41.626,24 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
29.01.2025 10:07 2025001412485167 -7.700,00 33.926,24 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date Timofey Tikhonov (29/01/2025 and query number 1556698712 to the account Türkiye 
İş   Bankası   A.Ş.   Yağmur   Aydın)
29.01.2025 10:07 2025001412485167 -12,80 33.913,44 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
30.01.2025 13:16 2025001475173333 -315,00 33.598,44 Diğer  Banka  POS-Alışveriş
Referans :20209503013270535 Term Id :00607725- ISLEM NO :    -DRUJBA EGITIM TICARET    ANTALYA      TR**** SAAT :13:16:13 Provizyon Kodu : 
537084 - 0209 - D -  Mcc: 5812
30.01.2025 13:28 2025001475695481 -1.050,00 32.548,44 Diğer  Banka  POS-Alışveriş
Referans :20064503004173132 Term Id :S1859U01- ISLEM NO :    -DOYDOY KASAP             ANTALYA      TR**** SAAT :13:28:29 Provizyon Kodu : 
562791 - 0064 - D -  Mcc: 5422
30.01.2025 13:45 2025001476287748 -1.139,72 31.408,72 Diğer  Banka  POS-Alışveriş
Referans :20067503013864283 Term Id :00343745- ISLEM NO :    -9936-8043-A101 DOSTLUK PAANTALYA      TR**** SAAT :13:45:19 Provizyon Kodu : 
596311 - 0067 - D -  Mcc: 5411
30.01.2025 13:52 2025001476895594 -653,99 30.754,73 Diğer  Banka  POS-Alışveriş
Referans :20067503013972502 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :13:52:22 Provizyon 
Kodu : 610400 - 0067 - D -  Mcc: 5411
30.01.2025 20:07 2025001496522850 -603,90 30.150,83 Diğer  Banka  POS-Alışveriş
Referans :20067503020701389 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :20:07:37 Provizyon 
Kodu : 517978 - 0067 - D -  Mcc: 5411
01.02.2025 12:31 2025001580305397 -911,50 29.239,33 Overseas 3D Secure Spending
Referans :20743020171737446 Term Id :7N3QWJUF- ISLEM NO :    -OPENAI *CHATGPT SUBSCR   +14158799686 US**** SAAT :12:31:58 Provizyon 
Kodu : 428471 - 030743 - D -  Mcc: 5734 Kur ..:37,052730
01.02.2025 12:31 2025001580305397 -1,82 29.237,51 KMV
KAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ
02.02.2025 10:23 2025001618487977 -2.472,51 26.765,00 Diğer  Banka  POS-Alışveriş
Referans :20067503310201165 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :10:23:34 Provizyon 
Kodu : 186412 - 0067 - D -  Mcc: 5411

 
EVGENII TIKHONOV
Account No: 00158007318398268 26.02.2025 07:35
***Dekont yerine  kullanılamaz.   Uyuşmazlık  halinde Banka  kayıtları  esas  alınacaktır  
www.vakifbank.com.tr | 444 0 724
Türkiye Vakiflar  Bankası  T.A.O Büyük Mükellefler V.D. 9220034970 Sicil  Numarası:  776444
Finanskent Mahallesi Finans Caddesi No:40/1 34760   Ümraniye/İSTANBUL                      
Sf. 2 / 8
Account Transactions
DATE HOUR TRANSACTION ID AMOUNT BALANCE TRANSACTION NAME
02.02.2025 16:28 2025001631923697 -1.428,00 25.337,00 3D Secure Spending
Referans :02503316106889134 Term Id :VB772289- ISLEM NO :    -PEGASUS HAVA  TAŞIMAC     İstanbul      TRTR**** SAAT :16:28:48 Provizyon Kodu : 
879159 - 535576 - D -  Mcc: 4511
02.02.2025 17:03 2025001633202001 -3.800,00 21.537,00 Diğer  Banka  POS-Alışveriş
Referans :20067503317947434 Term Id :008729FF- ISLEM NO :    -WORLD ATHLETIC CLUB      ANTALYA      TR**** SAAT :17:03:45 Provizyon Kodu : 
974788 - 0067 - D -  Mcc: 7997
02.02.2025 19:38 2025001639187426 -922,74 20.614,26 Diğer  Banka  POS-Alışveriş
Referans :20046503319269955 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:38:27 Provizyon Kodu : 
359102 - 0046 - D -  Mcc: 5411
02.02.2025 22:18 2025001644964302 -1.147,50 19.466,76 Diğer  Banka  POS-Alışveriş
Referans :20062503388045070 Term Id :00796841- ISLEM NO :    -URART GUMRUKSUZ MAGAZA-2 ANTALYA      TR**** SAAT :22:18:29 Provizyon 
Kodu : 569375 - 0062 - D -  Mcc: 5311
03.02.2025 10:43 2025001664172612 -6.208,23 13.258,53 Diğer  Banka  POS-Alışveriş
Referans :20062503440364809 Term Id :01981938- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :10:43:28 Provizyon 
Kodu : 293128 - 0062 - D -  Mcc: 5411
03.02.2025 10:48 2025001664249417 -280,00 12.978,53 Diğer  Banka  POS-Alışveriş
Referans :20067503410244938 Term Id :009923FF- ISLEM NO :    -SPRING COFEE             ANTALYA      TR**** SAAT :10:48:18 Provizyon Kodu : 
299510 - 0067 - D -  Mcc: 5814
03.02.2025 10:54 2025001664376652 -360,00 12.618,53 VakıfBank   POS-Alışveriş
Referans :02503410039083160 Term Id :PS451685- ISLEM NO :0002-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :10:54:34 Provizyon Kodu 
: 307806 - 535576 - D -  Mcc: 5943
03.02.2025 11:29 2025001666165941 -3.000,00 9.618,53 Diğer  Banka  POS-Alışveriş
Referans :20046503411514270 Term Id :02820671- ISLEM NO :    -YAMAN ET MELIH FIDANCI   ANTALYA      TR**** SAAT :11:29:29 Provizyon Kodu : 
355272 - 0046 - D -  Mcc: 5411
03.02.2025 11:31 2025001666264819 -257,00 9.361,53 Diğer  Banka  POS-Alışveriş
Referans :20062503440744871 Term Id :04013117- ISLEM NO :    -KISMET                   ANTALYA      TR**** SAAT :11:31:52 Provizyon Kodu : 358726 - 
0062 - D -  Mcc: 5499
04.02.2025 09:19 2025001714437735 -240,00 9.121,53 Diğer  Banka  POS-Alışveriş
Referans :20205503509359699 Term Id :PS394512- ISLEM NO :    -SPORTALYA SPOR MALZEMELERANTALYA      TR**** SAAT :09:19:03 Provizyon 
Kodu : 182737 - 0205 - D -  Mcc: 5812
04.02.2025 13:18 2025001726366836 -1.240,00 7.881,53 Diğer  Banka  POS-Alışveriş
Referans :20067503513648788 Term Id :0048573F- ISLEM NO :    -KONYAALTI RUZGAR ECZANESIANTALYA      TR**** SAAT :13:18:30 Provizyon 
Kodu : 561128 - 0067 - D -  Mcc: 5912
04.02.2025 13:24 2025001726487478 -830,00 7.051,53 Diğer  Banka  POS-Alışveriş
Referans :20067503513734727 Term Id :0063269C- ISLEM NO :    -ANTALYA PET              ANTALYA      TR**** SAAT :13:24:07 Provizyon Kodu : 
573170 - 0067 - D -  Mcc: 5995
04.02.2025 13:27 2025001726914120 -360,00 6.691,53 Diğer  Banka  POS-Alışveriş
Referans :20010503513233967 Term Id :PS822480- ISLEM NO :    -SOK-ANTALYA LIMAN 2.     ANTALYA      TR**** SAAT :13:27:48 Provizyon Kodu : 
581018 - 0010 - D -  Mcc: 5411
04.02.2025 13:28 2025001726918288 -360,00 6.331,53 Diğer  Banka  POS-Alışveriş
Referans :20010503513241628 Term Id :PS822480- ISLEM NO :    -SOK-ANTALYA LIMAN 2.     ANTALYA      TR**** SAAT :13:28:25 Provizyon Kodu : 
582254 - 0010 - D -  Mcc: 5411
04.02.2025 14:47 2025001730812630 -134,99 6.196,54 Overseas 3D Secure Spending
Referans :22637503511106474 Term Id :        - ISLEM NO :    -Google ExpressVPN        London       GB**** SAAT :14:47:17 Provizyon Kodu : 737798 - 
032637 - D -  Mcc: 5734 Kur ..:36,44450
04.02.2025 17:23 2025001739293202 -468,00 5.728,54 Diğer  Banka  POS-Alışveriş
Referans :20032503517386459 Term Id :PS903478- ISLEM NO :    -ECZANE ANTALYA MODERN    ANTALYA      TR**** SAAT :17:23:03 Provizyon 
Kodu : 101927 - 0032 - D -  Mcc: 5912
04.02.2025 22:43 2025001753234362 -320,00 5.408,54 VakıfBank   POS-Alışveriş
Referans :02503522039301221 Term Id :01048406- ISLEM NO :0002-MADO DONDURMA          Antalya      TRTR**** SAAT :22:43:06 Provizyon Kodu : 
671996 - 535576 - D -  Mcc: 5812

 
EVGENII TIKHONOV
Account No: 00158007318398268 26.02.2025 07:35
***Dekont yerine  kullanılamaz.   Uyuşmazlık  halinde Banka  kayıtları  esas  alınacaktır  
www.vakifbank.com.tr | 444 0 724
Türkiye Vakiflar  Bankası  T.A.O Büyük Mükellefler V.D. 9220034970 Sicil  Numarası:  776444
Finanskent Mahallesi Finans Caddesi No:40/1 34760   Ümraniye/İSTANBUL                      
Sf. 3 / 8
Account Transactions
DATE HOUR TRANSACTION ID AMOUNT BALANCE TRANSACTION NAME
05.02.2025 11:46 2025001774953795 -2.500,00 2.908,54 ATM Withdrawal
S00313  şubesine   bağlı  003134 no lu KONYAALTI  LİMAN  MAH. ATM 'sinde 05/02/2025 11:46 tarihinde 445014111936 nolu  müşteri   00158007318398268 
no lu  hesabından  TL para çekti.
05.02.2025 14:56 2025001784845623 -87,50 2.821,04 Diğer  Banka  POS-Alışveriş
Referans :20067503614800776 Term Id :005159A0- ISLEM NO :    -SOK-10601 ANTALYA KONYAALANTALYA      TR**** SAAT :14:56:31 Provizyon 
Kodu : 761465 - 0067 - D -  Mcc: 5411
06.02.2025 12:45 2025001831795567 35.910,00 38.731,04 FAST Instant Payment
(06.02.2025 tarihli 384904196 sorgu no'lu QNB Bank  A.Ş.   Khayrattın  Hamid  hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)
06.02.2025 12:46 2025001831803751 -8.360,00 30.371,04 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date utility (06/02/2025 and query number 1572106688 to the account Türkiye  İş   Bankası  
A.Ş.  mehmet  iğne)
06.02.2025 12:46 2025001831803751 -12,80 30.358,24 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
06.02.2025 12:53 2025001832295322 -2.000,00 28.358,24 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date  (06/02/2025 and query number 1572118757 to the account Türk Ekonomi  Bankası  
A.Ş.  Sema sengül)
06.02.2025 12:53 2025001832295322 -6,39 28.351,85 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
07.02.2025 15:09 2025001892123090 -1.302,80 27.049,05 Diğer  Banka  POS-Alışveriş
Referans :20046503815154403 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :15:09:22 Provizyon Kodu : 
797703 - 0046 - D -  Mcc: 5411
07.02.2025 15:13 2025001892320946 -220,00 26.829,05 VakıfBank   POS-Alışveriş
Referans :02503815039206694 Term Id :PS451685- ISLEM NO :0007-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :15:13:47 Provizyon Kodu 
: 807664 - 535576 - D -  Mcc: 5943
07.02.2025 18:50 2025001903222219 -199,50 26.629,55 Diğer  Banka  POS-Alışveriş
Referans :20067503818049398 Term Id :005159A0- ISLEM NO :    -SOK-10601 ANTALYA KONYAALANTALYA      TR**** SAAT :18:50:57 Provizyon 
Kodu : 381440 - 0067 - D -  Mcc: 5411
07.02.2025 18:58 2025001903589086 -113,95 26.515,60 VakıfBank   POS-Alışveriş
Referans :02503818039338215 Term Id :01328557- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :18:58:23 Provizyon Kodu 
: 399584 - 535576 - D -  Mcc: 4121
07.02.2025 21:29 2025001909805942 -113,95 26.401,65 VakıfBank   POS-Alışveriş
Referans :02503821039412733 Term Id :01327859- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :21:29:47 Provizyon Kodu 
: 664179 - 535576 - D -  Mcc: 4121
08.02.2025 14:44 2025001939670663 2.000,00 28.401,65 FAST Instant Payment
(08.02.2025 tarihli 138608 sorgu no'lu Akbank  T.A.Ş.  MURAT  ŞENGÜL   hesabından   Evgenıı   Tıkhonov   hesabına  gelen FAST ödemesi)
08.02.2025 15:24 2025001941182144 -100,00 28.301,65 Diğer  Banka  POS-Alışveriş
Referans :20012503915274785 Term Id :02091201- ISLEM NO :    -ASLAN TAKSI              ANTALYA      TR**** SAAT :15:24:34 Provizyon Kodu : 800091 
- 0012 - D -  Mcc: 4789
08.02.2025 16:01 2025001942591638 -950,00 27.351,65 Diğer  Banka  POS-Alışveriş
Referans :20067503916614999 Term Id :0087300A- ISLEM NO :    -WORLD ATHLETIC CLUB      ANTALYA      TR**** SAAT :16:01:21 Provizyon Kodu : 
898641 - 0067 - D -  Mcc: 7997
08.02.2025 18:56 2025001949524812 -113,95 27.237,70 VakıfBank   POS-Alışveriş
Referans :02503918039396813 Term Id :01327981- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :18:56:11 Provizyon Kodu 
: 379388 - 535576 - D -  Mcc: 4121
08.02.2025 19:01 2025001949716294 -451,90 26.785,80 Diğer  Banka  POS-Alışveriş
Referans :20012503919955763 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :19:01:52 Provizyon Kodu : 
392865 - 0012 - D -  Mcc: 5411
09.02.2025 10:38 2025001972142922 -639,28 26.146,52 Diğer  Banka  POS-Alışveriş
Referans :20046504010022681 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :10:38:25 Provizyon Kodu : 
193667 - 0046 - D -  Mcc: 5411

 
EVGENII TIKHONOV
Account No: 00158007318398268 26.02.2025 07:35
***Dekont yerine  kullanılamaz.   Uyuşmazlık  halinde Banka  kayıtları  esas  alınacaktır  
www.vakifbank.com.tr | 444 0 724
Türkiye Vakiflar  Bankası  T.A.O Büyük Mükellefler V.D. 9220034970 Sicil  Numarası:  776444
Finanskent Mahallesi Finans Caddesi No:40/1 34760   Ümraniye/İSTANBUL                      
Sf. 4 / 8
Account Transactions
DATE HOUR TRANSACTION ID AMOUNT BALANCE TRANSACTION NAME
09.02.2025 17:29 2025001987249824 -113,95 26.032,57 VakıfBank   POS-Alışveriş
Referans :02504017039110690 Term Id :01328557- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :17:29:24 Provizyon Kodu 
: 004534 - 535576 - D -  Mcc: 4121
09.02.2025 19:46 2025001992106015 -113,95 25.918,62 VakıfBank   POS-Alışveriş
Referans :02504019039250598 Term Id :01327985- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :19:46:47 Provizyon Kodu 
: 309558 - 535576 - D -  Mcc: 4121
09.02.2025 19:51 2025001992125564 -122,65 25.795,97 Diğer  Banka  POS-Alışveriş
Referans :20046504019539863 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:51:48 Provizyon Kodu : 
318040 - 0046 - D -  Mcc: 5411
09.02.2025 23:39 2025001999586818 -1.199,99 24.595,98 Overseas 3D Secure Spending
Referans :21599504054584207 Term Id :00188836- ISLEM NO :    -GOOGLE *Duolingo         650-253-0000 GB**** SAAT :23:39:55 Provizyon Kodu : 
547396 - 031599 - D -  Mcc: 7372 Kur ..:37,16120
10.02.2025 13:25 2025002025312602 -390,75 24.205,23 Diğer  Banka  POS-Alışveriş
Referans :20046504113717043 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :13:25:23 Provizyon Kodu : 
586030 - 0046 - D -  Mcc: 5411
10.02.2025 14:12 2025002027929877 -915,00 23.290,23 CLK Akdeniz Electricity Collection
Hesap  Numarası:2757785313,  Ad Soyad:EVGENII TIKHONOV, Tahakkuk  Numarası:  275989684850, Son Ödeme Tarihi:20.02.2025, Ck Akdeniz Elektrik 
Tahsilatı
10.02.2025 14:12 2025002027929887 -1.338,87 21.951,36 CLK Akdeniz Electricity Collection
Hesap  Numarası:2757785313,  Ad Soyad:EVGENII TIKHONOV, Tahakkuk  Numarası:  275337611013, Son Ödeme Tarihi:30.01.2025, Ck Akdeniz Elektrik 
Tahsilatı
10.02.2025 14:13 2025002027941754 -193,48 21.757,88 ASAT Antalya Su Collection
Abone  Numarası:  0000493041, Ad Soyad/Unvan: EVGENII TIKHONOV,Fatura  Numarası:  233538287,Tahakkuk Tipi:Su,Fatura  Tutarı:193,48TL,Borç  
Gecikme  Zammı:  0,00TL,Son Ödeme Tarihi: 11.02.2025  ASAT Antalya Su  Tahsilatı
10.02.2025 14:42 2025002029500644 -323,75 21.434,13 Diğer  Banka  POS-Alışveriş
Referans :20012504114079433 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :14:42:51 Provizyon Kodu : 
741763 - 0012 - D -  Mcc: 5411
11.02.2025 20:05 2025002102537565 -219,40 21.214,73 Diğer  Banka  POS-Alışveriş
Referans :20012504220190964 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :20:05:34 Provizyon Kodu : 
504490 - 0012 - D -  Mcc: 5411
12.02.2025 10:28 2025002128394678 -2.300,00 18.914,73 ATM Withdrawal
S00313  şubesine   bağlı  003134 no lu KONYAALTI  LİMAN  MAH. ATM 'sinde 12/02/2025 10:28 tarihinde 445014111936 nolu  müşteri   00158007318398268 
no lu  hesabından  TL para çekti.
12.02.2025 10:36 2025002129239027 -20,00 18.894,73 VakıfBank   POS-Alışveriş
Referans :02504310039439935 Term Id :PS451685- ISLEM NO :0001-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :10:36:59 Provizyon Kodu 
: 270341 - 535576 - D -  Mcc: 5943
12.02.2025 20:49 2025002158927867 -376,90 18.517,83 Diğer  Banka  POS-Alışveriş
Referans :20046504320691286 Term Id :02034782- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :20:49:54 Provizyon Kodu : 
555957 - 0046 - D -  Mcc: 5411
13.02.2025 07:00 2025002171940960 -430,00 18.087,83 Diğer  Banka  POS-Alışveriş
Referans :20032504407193391 Term Id :PS833524- ISLEM NO :    -HMSHOST YIYECEK VE ICECEKISTANBUL     TR**** SAAT :07:00:00 Provizyon 
Kodu : 066294 - 0032 - D -  Mcc: 5812
13.02.2025 11:10 2025002184838460 -6.899,70 11.188,13 Diğer  Banka  POS-Alışveriş
Referans :20010504411674305 Term Id :01646275- ISLEM NO :    -NIKE SPORTINN            ANTALYA      TR**** SAAT :11:10:49 Provizyon Kodu : 
303867 - 0010 - D -  Mcc: 5661
13.02.2025 11:24 2025002185949310 -1.090,00 10.098,13 Diğer  Banka  POS-Alışveriş
Referans :20046504411425527 Term Id :03392037- ISLEM NO :    -ITX TURKEY OYSHO MIGROS  ANTALYA      TR**** SAAT :11:24:13 Provizyon Kodu 
: 320913 - 0046 - D -  Mcc: 5691
13.02.2025 11:53 2025002187314399 -2.559,91 7.538,22 VakıfBank   POS-Alışveriş
Referans :02504411039680911 Term Id :01551636- ISLEM NO :0003-Suwen Tekstil San.      İSTANBUL      TRTR**** SAAT :11:53:33 Provizyon Kodu : 
362407 - 535576 - D -  Mcc: 5631

 
EVGENII TIKHONOV
Account No: 00158007318398268 26.02.2025 07:35
***Dekont yerine  kullanılamaz.   Uyuşmazlık  halinde Banka  kayıtları  esas  alınacaktır  
www.vakifbank.com.tr | 444 0 724
Türkiye Vakiflar  Bankası  T.A.O Büyük Mükellefler V.D. 9220034970 Sicil  Numarası:  776444
Finanskent Mahallesi Finans Caddesi No:40/1 34760   Ümraniye/İSTANBUL                      
Sf. 5 / 8
Account Transactions
DATE HOUR TRANSACTION ID AMOUNT BALANCE TRANSACTION NAME
13.02.2025 18:22 2025002204971006 -232,46 7.305,76 Diğer  Banka  POS-Alışveriş
Referans :20067504418050088 Term Id :0051270D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :18:22:33 Provizyon 
Kodu : 279677 - 0067 - D -  Mcc: 5411
14.02.2025 14:01 2025002243571263 -2.000,00 5.305,76 Diğer  Banka  POS-Alışveriş
Referans :20067504514912544 Term Id :00B6844D- ISLEM NO :    -KONYAALTI VETERINER KLINIANTALYA      TR**** SAAT :14:01:27 Provizyon Kodu 
: 666514 - 0067 - D -  Mcc: 8011
14.02.2025 14:25 2025002244583893 -795,67 4.510,09 Diğer  Banka  POS-Alışveriş
Referans :20067504514367922 Term Id :0041223B- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :14:25:48 Provizyon 
Kodu : 728958 - 0067 - D -  Mcc: 5411
15.02.2025 14:30 2025002303758317 -1.500,00 3.010,09 Diğer  Banka  POS-Alışveriş
Referans :20067504614272540 Term Id :00B7196E- ISLEM NO :    -AYHAN AYDOST             ANTALYA      TR**** SAAT :14:30:07 Provizyon Kodu : 
854322 - 0067 - D -  Mcc: 8021
15.02.2025 14:52 2025002304765592 -2.138,00 872,09 VakıfBank   POS-Alışveriş
Referans :02504614039396476 Term Id :PS451685- ISLEM NO :0004-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :14:52:31 Provizyon Kodu 
: 923454 - 535576 - D -  Mcc: 5943
15.02.2025 16:09 2025002308255303 -78,00 794,09 Diğer  Banka  POS-Alışveriş
Referans :20067504616302596 Term Id :0051270E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :16:09:12 Provizyon 
Kodu : 177333 - 0067 - D -  Mcc: 5411
16.02.2025 10:32 2025002339205881 36.130,00 36.924,09 FAST Instant Payment
(16.02.2025 tarihli 2678000059 sorgu no'lu Türkiye Garanti  Bankası   A.Ş.  MUZAFFER SÖNMEZ  hesabından  evgenii tikhonov  hesabına  gelen FAST 
ödemesi)
16.02.2025 11:22 2025002341122886 -37,00 36.887,09 Diğer  Banka  POS-Alışveriş
Referans :20067504711435826 Term Id :0098659A- ISLEM NO :    -BEACH PARK BK            ANTALYA      TR**** SAAT :11:22:39 Provizyon Kodu : 
291789 - 0067 - D -  Mcc: 5814
16.02.2025 11:46 2025002342307633 -60,00 36.827,09 VakıfBank   POS-Alışveriş
Referans :02504711039408623 Term Id :01176201- ISLEM NO :0006-ANET ANTALYA  İNŞAAT     ANTALYA      TRTR**** SAAT :11:46:05 Provizyon 
Kodu : 327904 - 535576 - D -  Mcc: 5812
16.02.2025 12:06 2025002343006348 -2.450,00 34.377,09 Diğer  Banka  POS-Alışveriş
Referans :20032504712779578 Term Id :PS237765- ISLEM NO :    -TURKSPORT SPOR URUNLERI SANTALYA      TR**** SAAT :12:06:34 Provizyon 
Kodu : 361703 - 0032 - D -  Mcc: 5941
16.02.2025 12:25 2025002343824052 -1.229,95 33.147,14 Diğer  Banka  POS-Alışveriş
Referans :20111504712345509 Term Id :P1926885- ISLEM NO :    -LCW ANT ERASTA           ANTALYA      TR**** SAAT :12:25:05 Provizyon Kodu : 
394746 - 0111 - D -  Mcc: 5699
16.02.2025 13:42 2025002347264074 -6.847,04 26.300,10 Diğer  Banka  POS-Alışveriş
Referans :20062504755362805 Term Id :01981943- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :13:42:50 Provizyon 
Kodu : 554755 - 0062 - D -  Mcc: 5411
17.02.2025 11:38 2025002392727115 -860,00 25.440,10 Diğer  Banka  POS-Alışveriş
Referans :20010504811106167 Term Id :01408738- ISLEM NO :    -AYDIN BEACH              ANTALYA      TR**** SAAT :11:38:24 Provizyon Kodu : 418804 
- 0010 - D -  Mcc: 5499
17.02.2025 14:33 2025002404035092 -1.673,20 23.766,90 Diğer  Banka  POS-Alışveriş
Referans :20046504814014108 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :14:33:29 Provizyon Kodu : 
826587 - 0046 - D -  Mcc: 5411
17.02.2025 14:37 2025002404274710 -120,00 23.646,90 VakıfBank   POS-Alışveriş
Referans :02504814039120397 Term Id :PS451685- ISLEM NO :0008-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :14:37:25 Provizyon Kodu 
: 835575 - 535576 - D -  Mcc: 5943
17.02.2025 16:29 2025002412094286 -77,50 23.569,40 Diğer  Banka  POS-Alışveriş
Referans :20067504816512042 Term Id :004944B4- ISLEM NO :    -A101-9936-E460 MODA PARK ANTALYA      TR**** SAAT :16:29:21 Provizyon Kodu : 
112576 - 0067 - D -  Mcc: 5411
17.02.2025 16:47 2025002413329954 -1.200,00 22.369,40 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date  (17/02/2025 and query number 1595434248 to the account Türkiye Cumhuriyeti Ziraat 
Bankası   A.Ş.  Feride Özçelik)

 
EVGENII TIKHONOV
Account No: 00158007318398268 26.02.2025 07:35
***Dekont yerine  kullanılamaz.   Uyuşmazlık  halinde Banka  kayıtları  esas  alınacaktır  
www.vakifbank.com.tr | 444 0 724
Türkiye Vakiflar  Bankası  T.A.O Büyük Mükellefler V.D. 9220034970 Sicil  Numarası:  776444
Finanskent Mahallesi Finans Caddesi No:40/1 34760   Ümraniye/İSTANBUL                      
Sf. 6 / 8
Account Transactions
DATE HOUR TRANSACTION ID AMOUNT BALANCE TRANSACTION NAME
17.02.2025 16:47 2025002413329954 -6,39 22.363,01 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
17.02.2025 17:48 2025002417078232 -4,77 22.358,24 Overseas 3D Secure Spending
Referans :22153021788703198 Term Id :AAIZQCVQ- ISLEM NO :    -GITHUB, INC.             +18774484820 US**** SAAT :17:48:23 Provizyon Kodu : 
358629 - 032153 - D -  Mcc: 7372 Kur ..:36,654280
17.02.2025 17:48 2025002417078232 -0,01 22.358,23 KMV
KAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ
18.02.2025 12:41 2025002456607296 -1.110,00 21.248,23 Diğer  Banka  POS-Alışveriş
Referans :20064504925758085 Term Id :S0L93J02- ISLEM NO :    -DUYGU TARHAN-ALPSOY ECZ  ANTALYA      TR**** SAAT :12:41:23 Provizyon 
Kodu : 526679 - 0064 - D -  Mcc: 5912
18.02.2025 12:59 2025002457478697 -580,00 20.668,23 Diğer  Banka  POS-Alışveriş
Referans :20134504912950127 Term Id :01331504- ISLEM NO :    -GALIP YAYLACI            Antalya      TR**** SAAT :12:59:40 Provizyon Kodu : 575454 - 
0134 - D -  Mcc: 5451
18.02.2025 13:10 2025002458007373 -600,00 20.068,23 Diğer  Banka  POS-Alışveriş
Referans :20067504913398672 Term Id :008827F4- ISLEM NO :    -MURAT DAG                ANTALYA      TR**** SAAT :13:10:35 Provizyon Kodu : 602920 
- 0067 - D -  Mcc: 5499
18.02.2025 13:21 2025002458658197 -298,03 19.770,20 Diğer  Banka  POS-Alışveriş
Referans :20067504913580753 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :13:21:49 Provizyon 
Kodu : 629709 - 0067 - D -  Mcc: 5411
18.02.2025 14:46 2025002462942693 -97,99 19.672,21 Overseas 3D Secure Spending
Referans :21599504971493201 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :14:46:32 Provizyon Kodu : 
817340 - 031599 - D -  Mcc: 5816 Kur ..:36,693510
18.02.2025 15:06 2025002463990408 -97,99 19.574,22 Overseas 3D Secure Spending
Referans :21599504971694690 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :15:06:57 Provizyon Kodu : 
864877 - 031599 - D -  Mcc: 5734 Kur ..:36,692190
18.02.2025 15:50 2025002466792875 -800,00 18.774,22 Diğer  Banka  POS-Alışveriş
Referans :20067504915056629 Term Id :0050619B- ISLEM NO :    -SHISHACO NARGILE         ANTALYA      TR**** SAAT :15:50:28 Provizyon Kodu : 
970711 - 0067 - D -  Mcc: 5812
18.02.2025 16:56 2025002470463682 -189,99 18.584,23 Overseas 3D Secure Spending
Referans :21599504954333042 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :16:56:19 Provizyon Kodu : 
142740 - 031599 - D -  Mcc: 5816 Kur ..:36,692170
18.02.2025 20:55 2025002482478647 -524,51 18.059,72 Overseas 3D Secure Spending
Referans :22153021875762412 Term Id :AAIZQCVQ- ISLEM NO :    -GITHUB, INC.             +18774484820 US**** SAAT :20:55:09 Provizyon Kodu : 
754130 - 032153 - D -  Mcc: 7372 Kur ..:37,464370
18.02.2025 20:55 2025002482478647 -1,05 18.058,67 KMV
KAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ
19.02.2025 16:00 2025002520137296 -264,00 17.794,67 VakıfBank   POS-Alışveriş
Referans :02505016039367035 Term Id :PS451685- ISLEM NO :0003-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :16:00:57 Provizyon Kodu 
: 001306 - 535576 - D -  Mcc: 5943
19.02.2025 16:02 2025002520150048 -159,90 17.634,77 Diğer  Banka  POS-Alışveriş
Referans :20046505016092075 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :16:02:35 Provizyon Kodu : 
005437 - 0046 - D -  Mcc: 5411
19.02.2025 17:56 2025002526443384 -548,50 17.086,27 Diğer  Banka  POS-Alışveriş
Referans :20067505017167928 Term Id :0051270D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :17:56:21 Provizyon 
Kodu : 333390 - 0067 - D -  Mcc: 5411
20.02.2025 11:43 2025002560385351 -725,10 16.361,17 Diğer  Banka  POS-Alışveriş
Referans :20067505111319436 Term Id :004944B3- ISLEM NO :    -A101-9936-E460 MODA PARK ANTALYA      TR**** SAAT :11:43:05 Provizyon Kodu : 
366445 - 0067 - D -  Mcc: 5411
20.02.2025 11:46 2025002560611420 -1.200,00 15.161,17 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date  (20/02/2025 and query number 1600896140 to the account Türkiye Cumhuriyeti Ziraat 
Bankası   A.Ş.  Feride Özçelik)

 
EVGENII TIKHONOV
Account No: 00158007318398268 26.02.2025 07:35
***Dekont yerine  kullanılamaz.   Uyuşmazlık  halinde Banka  kayıtları  esas  alınacaktır  
www.vakifbank.com.tr | 444 0 724
Türkiye Vakiflar  Bankası  T.A.O Büyük Mükellefler V.D. 9220034970 Sicil  Numarası:  776444
Finanskent Mahallesi Finans Caddesi No:40/1 34760   Ümraniye/İSTANBUL                      
Sf. 7 / 8
Account Transactions
DATE HOUR TRANSACTION ID AMOUNT BALANCE TRANSACTION NAME
20.02.2025 11:46 2025002560611420 -6,39 15.154,78 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
20.02.2025 12:07 2025002561396303 -1.173,55 13.981,23 Diğer  Banka  POS-Alışveriş
Referans :20067505112677002 Term Id :0041431E- ISLEM NO :    -KONYAALTI MACROCENTER    ANTALYA      TR**** SAAT :12:07:36 Provizyon 
Kodu : 411127 - 0067 - D -  Mcc: 5411
20.02.2025 16:07 2025002573784162 -355,00 13.626,23 3D Secure Spending
Referans :02505116106710555 Term Id :VP288149- ISLEM NO :    -PARAM/TRENDYOL         ANKARA       TRTR**** SAAT :16:07:09 Provizyon Kodu : 
950061 - 535576 - D -  Mcc: 5999
20.02.2025 21:08 2025002589010786 -97,99 13.528,24 Overseas 3D Secure Spending
Referans :21599505171532676 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :21:08:04 Provizyon Kodu : 
673278 - 031599 - D -  Mcc: 5818 Kur ..:37,499180
21.02.2025 13:54 2025002619723586 -1.500,00 12.028,24 Diğer  Banka  POS-Alışveriş
Referans :20067505213140715 Term Id :00B6844D- ISLEM NO :    -KONYAALTI VETERINER KLINIANTALYA      TR**** SAAT :13:54:47 Provizyon Kodu 
: 650328 - 0067 - D -  Mcc: 8011
21.02.2025 14:07 2025002620353251 -620,00 11.408,24 Diğer  Banka  POS-Alışveriş
Referans :20062505250408929 Term Id :02174488- ISLEM NO :    -VODAFONE  MOY ILETISIM-V ANTALYA      TR**** SAAT :14:07:52 Provizyon Kodu : 
684844 - 0062 - D -  Mcc: 4812
21.02.2025 14:12 2025002620795361 -635,00 10.773,24 Diğer  Banka  POS-Alışveriş
Referans :20064505203310291 Term Id :G7041203- ISLEM NO :    -GUNEY ECZANESI           ANTALYA      TR**** SAAT :14:12:44 Provizyon Kodu : 
697967 - 0064 - D -  Mcc: 5912
21.02.2025 23:04 2025002647016564 -97,99 10.675,25 Overseas 3D Secure Spending
Referans :21599505254106439 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :23:04:54 Provizyon Kodu : 
817170 - 031599 - D -  Mcc: 5817 Kur ..:37,599440
22.02.2025 12:06 2025002665799558 -40,00 10.635,25 Diğer  Banka  POS-Alışveriş
Referans :20012505312681533 Term Id :01261966- ISLEM NO :    -ISPARTA DAVRAZ TURIZ     ISPARTA      TR**** SAAT :12:06:41 Provizyon Kodu : 
355073 - 0012 - D -  Mcc: 7011
22.02.2025 12:31 2025002665940940 -5.000,00 5.635,25 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date  (22/02/2025 and query number 1604742652 to the account Türkiye  İş   Bankası   A.Ş.  
hasan  güneş)
22.02.2025 12:31 2025002665940940 -6,39 5.628,86 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
22.02.2025 12:44 2025002666080092 -4.000,00 1.628,86 Diğer  Banka  POS-Alışveriş
Referans :20010505312446045 Term Id :01741600- ISLEM NO :    -DAVRAZ KAYAK MER GUN     ISPARTA      TR**** SAAT :12:44:27 Provizyon Kodu : 
425367 - 0010 - D -  Mcc: 4722
22.02.2025 14:11 2025002668914395 -300,00 1.328,86 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date  (22/02/2025 and query number 1604920453 to the account Türkiye Cumhuriyeti Ziraat 
Bankası   A.Ş.  Hasan Hüseyin  Yılmaz)
22.02.2025 14:11 2025002668914395 -6,39 1.322,47 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
22.02.2025 16:50 2025002675620463 36.210,00 37.532,47 FAST Instant Payment
(22.02.2025 tarihli 436714977 sorgu no'lu QNB Bank  A.Ş.   Khayrattın  Hamid  hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)
22.02.2025 17:28 2025002677355297 -150,00 37.382,47 Diğer  Banka  POS-Alışveriş
Referans :20010505317935251 Term Id :02307548- ISLEM NO :    -TANTUNI HKA              ISPARTA      TR**** SAAT :17:28:57 Provizyon Kodu : 151945 
- 0010 - D -  Mcc: 5812
22.02.2025 17:35 2025002677520087 -1.900,75 35.481,72 Diğer  Banka  POS-Alışveriş
Referans :20046505317064029 Term Id :00452671- ISLEM NO :    -PO DOST PETROL LTD.STI.  ISPARTA      TR**** SAAT :17:35:55 Provizyon Kodu : 
171321 - 0046 - D -  Mcc: 5541
22.02.2025 17:36 2025002677521510 -90,00 35.391,72 Diğer  Banka  POS-Alışveriş
Referans :20210505317776061 Term Id :00681586- ISLEM NO :    -DOSTPET NAKLIYAT VE TI   ISPARTA      TR**** SAAT :17:36:08 Provizyon Kodu : 
171948 - 0210 - D -  Mcc: 5411

 
EVGENII TIKHONOV
Account No: 00158007318398268 26.02.2025 07:35
***Dekont yerine  kullanılamaz.   Uyuşmazlık  halinde Banka  kayıtları  esas  alınacaktır  
www.vakifbank.com.tr | 444 0 724
Türkiye Vakiflar  Bankası  T.A.O Büyük Mükellefler V.D. 9220034970 Sicil  Numarası:  776444
Finanskent Mahallesi Finans Caddesi No:40/1 34760   Ümraniye/İSTANBUL                      
Sf. 8 / 8
Account Transactions
DATE HOUR TRANSACTION ID AMOUNT BALANCE TRANSACTION NAME
22.02.2025 18:21 2025002679361264 -144,00 35.247,72 Diğer  Banka  POS-Alışveriş
Referans :20064505315357651 Term Id :S0SX9602- ISLEM NO :    -BIM A.S. / O003 AGLASUN  BURDUR       TR**** SAAT :18:21:13 Provizyon Kodu : 
294986 - 0064 - D -  Mcc: 5411
22.02.2025 19:38 2025002682495722 -1.379,85 33.867,87 Diğer  Banka  POS-Alışveriş
Referans :20046505319613283 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:38:09 Provizyon Kodu : 
476533 - 0046 - D -  Mcc: 5411
23.02.2025 11:03 2025002702450079 -142,90 33.724,97 Diğer  Banka  POS-Alışveriş
Referans :20067505411772915 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :11:03:08 Provizyon 
Kodu : 224739 - 0067 - D -  Mcc: 5411
23.02.2025 19:29 2025002721255735 -159,99 33.564,98 Overseas 3D Secure Spending
Referans :21599505451276984 Term Id :00188836- ISLEM NO :    -GOOGLE *YouTube          650-253-0000 GB**** SAAT :19:29:21 Provizyon Kodu : 
319801 - 031599 - D -  Mcc: 5818 Kur ..:37,599440
23.02.2025 20:43 2025002723597865 -39,00 33.525,98 3D Secure Spending
Referans :02505420100731528 Term Id :VP297901- ISLEM NO :    -IYZICO/AmazonPrimeTR    İSTANBUL      TRTR**** SAAT :20:43:57 Provizyon Kodu : 
447864 - 535576 - D -  Mcc: 7999
24.02.2025 11:11 2025002749179592 -4.300,00 29.225,98 VakıfBank   POS-Alışveriş
Referans :02505511039392145 Term Id :01464380- ISLEM NO :0002-CROWN BEAUTY SALON     Antalya      TRTR**** SAAT :11:11:15 Provizyon Kodu 
: 331644 - 535576 - D -  Mcc: 7230
24.02.2025 11:58 2025002751757222 -3.365,99 25.859,99 Diğer  Banka  POS-Alışveriş
Referans :20062505541159762 Term Id :01981937- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :11:58:34 Provizyon 
Kodu : 406508 - 0062 - D -  Mcc: 5411
24.02.2025 12:02 2025002752067247 -160,00 25.699,99 Diğer  Banka  POS-Alışveriş
Referans :20067505512302748 Term Id :009923FF- ISLEM NO :    -SPRING COFEE             ANTALYA      TR**** SAAT :12:02:31 Provizyon Kodu : 
414373 - 0067 - D -  Mcc: 5814
24.02.2025 12:16 2025002752898684 -1.390,00 24.309,99 Diğer  Banka  POS-Alışveriş
Referans :20064505529074463 Term Id :S1859U01- ISLEM NO :    -DOYDOY KASAP             ANTALYA      TR**** SAAT :12:16:44 Provizyon Kodu : 
446049 - 0064 - D -  Mcc: 5422
24.02.2025 12:20 2025002752924619 -960,00 23.349,99 Diğer  Banka  POS-Alışveriş
Referans :20209505512411279 Term Id :00607725- ISLEM NO :    -DRUJBA EGITIM TICARET    ANTALYA      TR**** SAAT :12:20:00 Provizyon Kodu : 
453705 - 0209 - D -  Mcc: 5812
25.02.2025 11:31 2025002803456966 -10.000,00 13.349,99 ATM Withdrawal
S00710  şubesine   bağlı  007101 no lu KONYAALTI/ANTALYA  ŞUBESİ  ATM 'sinde 25/02/2025 11:31 tarihinde 445014111936 nolu  müşteri   
00158007318398268 no lu  hesabından  TL para çekti.
25.02.2025 12:11 2025002805420958 -1.200,00 12.149,99 Diğer  Banka  POS-Alışveriş
Referans :20067505612961061 Term Id :00B50262- ISLEM NO :    -MEHMET GOKHAN GOK        ANTALYA      TR**** SAAT :12:11:53 Provizyon Kodu : 
436679 - 0067 - D -  Mcc: 5999
25.02.2025 12:39 2025002806636381 -10.500,00 1.649,99 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date  (25/02/2025 and query number 1609657292 to the account Türkiye Cumhuriyeti Ziraat 
Bankası   A.Ş.  Hasan Oraner)
25.02.2025 12:39 2025002806636381 -12,80 1.637,19 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ
25.02.2025 16:59 2025002820155834 -430,00 1.207,19 FAST Instant Payment
Fast Payment from the EVGENII TIKHONOV account with the date  (25/02/2025 and query number 1610277184 to the account Türkiye Cumhuriyeti Ziraat 
Bankası   A.Ş.  Hasan Oraner)
25.02.2025 16:59 2025002820155834 -6,39 1.200,80 Fee Collection
FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ`
]

it.each([
  [
    statements[0],

    {
      account: {
        balance: 1200.8,
        id: '00158007318398268',
        instrument: 'TL',
        title: 'Vakifbank *8268',
        date: '2025-02-26T00:00:00.000'
      },
      transactions: [
        {
          date: '2025-01-27T12:30:00.500',
          amount: '-296,50',
          balance: '1.933,08',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20012502712234768 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :12:30:11 Provizyon Kodu :  452856 - 0012 - D -  Mcc: 5411',
          statementUid: '2025001311308659',
          originString: '27.01.2025 12:30 2025001311308659 -296,50 1.933,08 Diğer  Banka  POS-Alışveriş\nReferans :20012502712234768 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :12:30:11 Provizyon Kodu : \n452856 - 0012 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-01-27T14:44:00.500',
          amount: '-1.287,04',
          balance: '646,04',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067502714917457 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :14:44:47 Provizyon  Kodu : 744442 - 0067 - D -  Mcc: 5411',
          statementUid: '2025001318540797',
          originString: '27.01.2025 14:44 2025001318540797 -1.287,04 646,04 Diğer  Banka  POS-Alışveriş\nReferans :20067502714917457 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :14:44:47 Provizyon \nKodu : 744442 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-01-28T11:34:00.500',
          amount: '71.400,00',
          balance: '72.046,04',
          description1: 'FAST Instant Payment',
          description2: "(28.01.2025 tarihli 355771507 sorgu no'lu QNB Bank  A.Ş.  Rauf  Khamıdov   hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)",
          statementUid: '2025001364952100',
          originString: "28.01.2025 11:34 2025001364952100 71.400,00 72.046,04 FAST Instant Payment\n(28.01.2025 tarihli 355771507 sorgu no'lu QNB Bank  A.Ş.  Rauf  Khamıdov   hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)\n"
        },
        {
          date: '2025-01-29T10:06:00.500',
          amount: '-30.407,00',
          balance: '41.639,04',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date Timofey Tikhonov (29/01/2025 and query number 1556714054 to the account Türkiye  Cumhuriyeti Ziraat  Bankası   A.Ş.  vd koleji Özel  eğitim  yaysan ve  ticaş)',
          statementUid: '2025001413409095',
          originString: '29.01.2025 10:06 2025001413409095 -30.407,00 41.639,04 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date Timofey Tikhonov (29/01/2025 and query number 1556714054 to the account Türkiye \nCumhuriyeti Ziraat  Bankası   A.Ş.  vd koleji Özel  eğitim  yaysan ve  ticaş)\n'
        },
        {
          date: '2025-01-29T10:06:00.500',
          amount: '-12,80',
          balance: '41.626,24',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025001413409095',
          originString: '29.01.2025 10:06 2025001413409095 -12,80 41.626,24 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-01-29T10:07:00.500',
          amount: '-7.700,00',
          balance: '33.926,24',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date Timofey Tikhonov (29/01/2025 and query number 1556698712 to the account Türkiye  İş   Bankası   A.Ş.   Yağmur   Aydın)',
          statementUid: '2025001412485167',
          originString: '29.01.2025 10:07 2025001412485167 -7.700,00 33.926,24 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date Timofey Tikhonov (29/01/2025 and query number 1556698712 to the account Türkiye \nİş   Bankası   A.Ş.   Yağmur   Aydın)\n'
        },
        {
          date: '2025-01-29T10:07:00.500',
          amount: '-12,80',
          balance: '33.913,44',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025001412485167',
          originString: '29.01.2025 10:07 2025001412485167 -12,80 33.913,44 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-01-30T13:16:00.500',
          amount: '-315,00',
          balance: '33.598,44',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20209503013270535 Term Id :00607725- ISLEM NO :    -DRUJBA EGITIM TICARET    ANTALYA      TR**** SAAT :13:16:13 Provizyon Kodu :  537084 - 0209 - D -  Mcc: 5812',
          statementUid: '2025001475173333',
          originString: '30.01.2025 13:16 2025001475173333 -315,00 33.598,44 Diğer  Banka  POS-Alışveriş\nReferans :20209503013270535 Term Id :00607725- ISLEM NO :    -DRUJBA EGITIM TICARET    ANTALYA      TR**** SAAT :13:16:13 Provizyon Kodu : \n537084 - 0209 - D -  Mcc: 5812\n'
        },
        {
          date: '2025-01-30T13:28:00.500',
          amount: '-1.050,00',
          balance: '32.548,44',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20064503004173132 Term Id :S1859U01- ISLEM NO :    -DOYDOY KASAP             ANTALYA      TR**** SAAT :13:28:29 Provizyon Kodu :  562791 - 0064 - D -  Mcc: 5422',
          statementUid: '2025001475695481',
          originString: '30.01.2025 13:28 2025001475695481 -1.050,00 32.548,44 Diğer  Banka  POS-Alışveriş\nReferans :20064503004173132 Term Id :S1859U01- ISLEM NO :    -DOYDOY KASAP             ANTALYA      TR**** SAAT :13:28:29 Provizyon Kodu : \n562791 - 0064 - D -  Mcc: 5422\n'
        },
        {
          date: '2025-01-30T13:45:00.500',
          amount: '-1.139,72',
          balance: '31.408,72',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503013864283 Term Id :00343745- ISLEM NO :    -9936-8043-A101 DOSTLUK PAANTALYA      TR**** SAAT :13:45:19 Provizyon Kodu :  596311 - 0067 - D -  Mcc: 5411',
          statementUid: '2025001476287748',
          originString: '30.01.2025 13:45 2025001476287748 -1.139,72 31.408,72 Diğer  Banka  POS-Alışveriş\nReferans :20067503013864283 Term Id :00343745- ISLEM NO :    -9936-8043-A101 DOSTLUK PAANTALYA      TR**** SAAT :13:45:19 Provizyon Kodu : \n596311 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-01-30T13:52:00.500',
          amount: '-653,99',
          balance: '30.754,73',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503013972502 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :13:52:22 Provizyon  Kodu : 610400 - 0067 - D -  Mcc: 5411',
          statementUid: '2025001476895594',
          originString: '30.01.2025 13:52 2025001476895594 -653,99 30.754,73 Diğer  Banka  POS-Alışveriş\nReferans :20067503013972502 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :13:52:22 Provizyon \nKodu : 610400 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-01-30T20:07:00.500',
          amount: '-603,90',
          balance: '30.150,83',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503020701389 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :20:07:37 Provizyon  Kodu : 517978 - 0067 - D -  Mcc: 5411',
          statementUid: '2025001496522850',
          originString: '30.01.2025 20:07 2025001496522850 -603,90 30.150,83 Diğer  Banka  POS-Alışveriş\nReferans :20067503020701389 Term Id :0041223E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :20:07:37 Provizyon \nKodu : 517978 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-01T12:31:00.500',
          amount: '-911,50',
          balance: '29.239,33',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :20743020171737446 Term Id :7N3QWJUF- ISLEM NO :    -OPENAI *CHATGPT SUBSCR   +14158799686 US**** SAAT :12:31:58 Provizyon  Kodu : 428471 - 030743 - D -  Mcc: 5734 Kur ..:37,052730',
          statementUid: '2025001580305397',
          originString: '01.02.2025 12:31 2025001580305397 -911,50 29.239,33 Overseas 3D Secure Spending\nReferans :20743020171737446 Term Id :7N3QWJUF- ISLEM NO :    -OPENAI *CHATGPT SUBSCR   +14158799686 US**** SAAT :12:31:58 Provizyon \nKodu : 428471 - 030743 - D -  Mcc: 5734 Kur ..:37,052730\n'
        },
        {
          date: '2025-02-01T12:31:00.500',
          amount: '-1,82',
          balance: '29.237,51',
          description1: 'KMV',
          description2: "KAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ",
          statementUid: '2025001580305397',
          originString: "01.02.2025 12:31 2025001580305397 -1,82 29.237,51 KMV\nKAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ\n"
        },
        {
          date: '2025-02-02T10:23:00.500',
          amount: '-2.472,51',
          balance: '26.765,00',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503310201165 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :10:23:34 Provizyon  Kodu : 186412 - 0067 - D -  Mcc: 5411',
          statementUid: '2025001618487977',
          originString: '02.02.2025 10:23 2025001618487977 -2.472,51 26.765,00 Diğer  Banka  POS-Alışveriş\nReferans :20067503310201165 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :10:23:34 Provizyon \nKodu : 186412 - 0067 - D -  Mcc: 5411\n\n'
        },
        {
          date: '2025-02-02T16:28:00.500',
          amount: '-1.428,00',
          balance: '25.337,00',
          description1: '3D Secure Spending',
          description2: 'Referans :02503316106889134 Term Id :VB772289- ISLEM NO :    -PEGASUS HAVA  TAŞIMAC     İstanbul      TRTR**** SAAT :16:28:48 Provizyon Kodu :  879159 - 535576 - D -  Mcc: 4511',
          statementUid: '2025001631923697',
          originString: '02.02.2025 16:28 2025001631923697 -1.428,00 25.337,00 3D Secure Spending\nReferans :02503316106889134 Term Id :VB772289- ISLEM NO :    -PEGASUS HAVA  TAŞIMAC     İstanbul      TRTR**** SAAT :16:28:48 Provizyon Kodu : \n879159 - 535576 - D -  Mcc: 4511\n'
        },
        {
          date: '2025-02-02T17:03:00.500',
          amount: '-3.800,00',
          balance: '21.537,00',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503317947434 Term Id :008729FF- ISLEM NO :    -WORLD ATHLETIC CLUB      ANTALYA      TR**** SAAT :17:03:45 Provizyon Kodu :  974788 - 0067 - D -  Mcc: 7997',
          statementUid: '2025001633202001',
          originString: '02.02.2025 17:03 2025001633202001 -3.800,00 21.537,00 Diğer  Banka  POS-Alışveriş\nReferans :20067503317947434 Term Id :008729FF- ISLEM NO :    -WORLD ATHLETIC CLUB      ANTALYA      TR**** SAAT :17:03:45 Provizyon Kodu : \n974788 - 0067 - D -  Mcc: 7997\n'
        },
        {
          date: '2025-02-02T19:38:00.500',
          amount: '-922,74',
          balance: '20.614,26',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046503319269955 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:38:27 Provizyon Kodu :  359102 - 0046 - D -  Mcc: 5411',
          statementUid: '2025001639187426',
          originString: '02.02.2025 19:38 2025001639187426 -922,74 20.614,26 Diğer  Banka  POS-Alışveriş\nReferans :20046503319269955 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:38:27 Provizyon Kodu : \n359102 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-02T22:18:00.500',
          amount: '-1.147,50',
          balance: '19.466,76',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20062503388045070 Term Id :00796841- ISLEM NO :    -URART GUMRUKSUZ MAGAZA-2 ANTALYA      TR**** SAAT :22:18:29 Provizyon  Kodu : 569375 - 0062 - D -  Mcc: 5311',
          statementUid: '2025001644964302',
          originString: '02.02.2025 22:18 2025001644964302 -1.147,50 19.466,76 Diğer  Banka  POS-Alışveriş\nReferans :20062503388045070 Term Id :00796841- ISLEM NO :    -URART GUMRUKSUZ MAGAZA-2 ANTALYA      TR**** SAAT :22:18:29 Provizyon \nKodu : 569375 - 0062 - D -  Mcc: 5311\n'
        },
        {
          date: '2025-02-03T10:43:00.500',
          amount: '-6.208,23',
          balance: '13.258,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20062503440364809 Term Id :01981938- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :10:43:28 Provizyon  Kodu : 293128 - 0062 - D -  Mcc: 5411',
          statementUid: '2025001664172612',
          originString: '03.02.2025 10:43 2025001664172612 -6.208,23 13.258,53 Diğer  Banka  POS-Alışveriş\nReferans :20062503440364809 Term Id :01981938- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :10:43:28 Provizyon \nKodu : 293128 - 0062 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-03T10:48:00.500',
          amount: '-280,00',
          balance: '12.978,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503410244938 Term Id :009923FF- ISLEM NO :    -SPRING COFEE             ANTALYA      TR**** SAAT :10:48:18 Provizyon Kodu :  299510 - 0067 - D -  Mcc: 5814',
          statementUid: '2025001664249417',
          originString: '03.02.2025 10:48 2025001664249417 -280,00 12.978,53 Diğer  Banka  POS-Alışveriş\nReferans :20067503410244938 Term Id :009923FF- ISLEM NO :    -SPRING COFEE             ANTALYA      TR**** SAAT :10:48:18 Provizyon Kodu : \n299510 - 0067 - D -  Mcc: 5814\n'
        },
        {
          date: '2025-02-03T10:54:00.500',
          amount: '-360,00',
          balance: '12.618,53',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02503410039083160 Term Id :PS451685- ISLEM NO :0002-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :10:54:34 Provizyon Kodu  : 307806 - 535576 - D -  Mcc: 5943',
          statementUid: '2025001664376652',
          originString: '03.02.2025 10:54 2025001664376652 -360,00 12.618,53 VakıfBank   POS-Alışveriş\nReferans :02503410039083160 Term Id :PS451685- ISLEM NO :0002-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :10:54:34 Provizyon Kodu \n: 307806 - 535576 - D -  Mcc: 5943\n'
        },
        {
          date: '2025-02-03T11:29:00.500',
          amount: '-3.000,00',
          balance: '9.618,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046503411514270 Term Id :02820671- ISLEM NO :    -YAMAN ET MELIH FIDANCI   ANTALYA      TR**** SAAT :11:29:29 Provizyon Kodu :  355272 - 0046 - D -  Mcc: 5411',
          statementUid: '2025001666165941',
          originString: '03.02.2025 11:29 2025001666165941 -3.000,00 9.618,53 Diğer  Banka  POS-Alışveriş\nReferans :20046503411514270 Term Id :02820671- ISLEM NO :    -YAMAN ET MELIH FIDANCI   ANTALYA      TR**** SAAT :11:29:29 Provizyon Kodu : \n355272 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-03T11:31:00.500',
          amount: '-257,00',
          balance: '9.361,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20062503440744871 Term Id :04013117- ISLEM NO :    -KISMET                   ANTALYA      TR**** SAAT :11:31:52 Provizyon Kodu : 358726 -  0062 - D -  Mcc: 5499',
          statementUid: '2025001666264819',
          originString: '03.02.2025 11:31 2025001666264819 -257,00 9.361,53 Diğer  Banka  POS-Alışveriş\nReferans :20062503440744871 Term Id :04013117- ISLEM NO :    -KISMET                   ANTALYA      TR**** SAAT :11:31:52 Provizyon Kodu : 358726 - \n0062 - D -  Mcc: 5499\n'
        },
        {
          date: '2025-02-04T09:19:00.500',
          amount: '-240,00',
          balance: '9.121,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20205503509359699 Term Id :PS394512- ISLEM NO :    -SPORTALYA SPOR MALZEMELERANTALYA      TR**** SAAT :09:19:03 Provizyon  Kodu : 182737 - 0205 - D -  Mcc: 5812',
          statementUid: '2025001714437735',
          originString: '04.02.2025 09:19 2025001714437735 -240,00 9.121,53 Diğer  Banka  POS-Alışveriş\nReferans :20205503509359699 Term Id :PS394512- ISLEM NO :    -SPORTALYA SPOR MALZEMELERANTALYA      TR**** SAAT :09:19:03 Provizyon \nKodu : 182737 - 0205 - D -  Mcc: 5812\n'
        },
        {
          date: '2025-02-04T13:18:00.500',
          amount: '-1.240,00',
          balance: '7.881,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503513648788 Term Id :0048573F- ISLEM NO :    -KONYAALTI RUZGAR ECZANESIANTALYA      TR**** SAAT :13:18:30 Provizyon  Kodu : 561128 - 0067 - D -  Mcc: 5912',
          statementUid: '2025001726366836',
          originString: '04.02.2025 13:18 2025001726366836 -1.240,00 7.881,53 Diğer  Banka  POS-Alışveriş\nReferans :20067503513648788 Term Id :0048573F- ISLEM NO :    -KONYAALTI RUZGAR ECZANESIANTALYA      TR**** SAAT :13:18:30 Provizyon \nKodu : 561128 - 0067 - D -  Mcc: 5912\n'
        },
        {
          date: '2025-02-04T13:24:00.500',
          amount: '-830,00',
          balance: '7.051,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503513734727 Term Id :0063269C- ISLEM NO :    -ANTALYA PET              ANTALYA      TR**** SAAT :13:24:07 Provizyon Kodu :  573170 - 0067 - D -  Mcc: 5995',
          statementUid: '2025001726487478',
          originString: '04.02.2025 13:24 2025001726487478 -830,00 7.051,53 Diğer  Banka  POS-Alışveriş\nReferans :20067503513734727 Term Id :0063269C- ISLEM NO :    -ANTALYA PET              ANTALYA      TR**** SAAT :13:24:07 Provizyon Kodu : \n573170 - 0067 - D -  Mcc: 5995\n'
        },
        {
          date: '2025-02-04T13:27:00.500',
          amount: '-360,00',
          balance: '6.691,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20010503513233967 Term Id :PS822480- ISLEM NO :    -SOK-ANTALYA LIMAN 2.     ANTALYA      TR**** SAAT :13:27:48 Provizyon Kodu :  581018 - 0010 - D -  Mcc: 5411',
          statementUid: '2025001726914120',
          originString: '04.02.2025 13:27 2025001726914120 -360,00 6.691,53 Diğer  Banka  POS-Alışveriş\nReferans :20010503513233967 Term Id :PS822480- ISLEM NO :    -SOK-ANTALYA LIMAN 2.     ANTALYA      TR**** SAAT :13:27:48 Provizyon Kodu : \n581018 - 0010 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-04T13:28:00.500',
          amount: '-360,00',
          balance: '6.331,53',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20010503513241628 Term Id :PS822480- ISLEM NO :    -SOK-ANTALYA LIMAN 2.     ANTALYA      TR**** SAAT :13:28:25 Provizyon Kodu :  582254 - 0010 - D -  Mcc: 5411',
          statementUid: '2025001726918288',
          originString: '04.02.2025 13:28 2025001726918288 -360,00 6.331,53 Diğer  Banka  POS-Alışveriş\nReferans :20010503513241628 Term Id :PS822480- ISLEM NO :    -SOK-ANTALYA LIMAN 2.     ANTALYA      TR**** SAAT :13:28:25 Provizyon Kodu : \n582254 - 0010 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-04T14:47:00.500',
          amount: '-134,99',
          balance: '6.196,54',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :22637503511106474 Term Id :        - ISLEM NO :    -Google ExpressVPN        London       GB**** SAAT :14:47:17 Provizyon Kodu : 737798 -  032637 - D -  Mcc: 5734 Kur ..:36,44450',
          statementUid: '2025001730812630',
          originString: '04.02.2025 14:47 2025001730812630 -134,99 6.196,54 Overseas 3D Secure Spending\nReferans :22637503511106474 Term Id :        - ISLEM NO :    -Google ExpressVPN        London       GB**** SAAT :14:47:17 Provizyon Kodu : 737798 - \n032637 - D -  Mcc: 5734 Kur ..:36,44450\n'
        },
        {
          date: '2025-02-04T17:23:00.500',
          amount: '-468,00',
          balance: '5.728,54',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20032503517386459 Term Id :PS903478- ISLEM NO :    -ECZANE ANTALYA MODERN    ANTALYA      TR**** SAAT :17:23:03 Provizyon  Kodu : 101927 - 0032 - D -  Mcc: 5912',
          statementUid: '2025001739293202',
          originString: '04.02.2025 17:23 2025001739293202 -468,00 5.728,54 Diğer  Banka  POS-Alışveriş\nReferans :20032503517386459 Term Id :PS903478- ISLEM NO :    -ECZANE ANTALYA MODERN    ANTALYA      TR**** SAAT :17:23:03 Provizyon \nKodu : 101927 - 0032 - D -  Mcc: 5912\n'
        },
        {
          date: '2025-02-04T22:43:00.500',
          amount: '-320,00',
          balance: '5.408,54',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02503522039301221 Term Id :01048406- ISLEM NO :0002-MADO DONDURMA          Antalya      TRTR**** SAAT :22:43:06 Provizyon Kodu :  671996 - 535576 - D -  Mcc: 5812',
          statementUid: '2025001753234362',
          originString: '04.02.2025 22:43 2025001753234362 -320,00 5.408,54 VakıfBank   POS-Alışveriş\nReferans :02503522039301221 Term Id :01048406- ISLEM NO :0002-MADO DONDURMA          Antalya      TRTR**** SAAT :22:43:06 Provizyon Kodu : \n671996 - 535576 - D -  Mcc: 5812\n\n'
        },
        {
          date: '2025-02-05T11:46:00.500',
          amount: '-2.500,00',
          balance: '2.908,54',
          description1: 'ATM Withdrawal',
          description2: "S00313  şubesine   bağlı  003134 no lu KONYAALTI  LİMAN  MAH. ATM 'sinde 05/02/2025 11:46 tarihinde 445014111936 nolu  müşteri   00158007318398268  no lu  hesabından  TL para çekti.",
          statementUid: '2025001774953795',
          originString: "05.02.2025 11:46 2025001774953795 -2.500,00 2.908,54 ATM Withdrawal\nS00313  şubesine   bağlı  003134 no lu KONYAALTI  LİMAN  MAH. ATM 'sinde 05/02/2025 11:46 tarihinde 445014111936 nolu  müşteri   00158007318398268 \nno lu  hesabından  TL para çekti.\n"
        },
        {
          date: '2025-02-05T14:56:00.500',
          amount: '-87,50',
          balance: '2.821,04',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503614800776 Term Id :005159A0- ISLEM NO :    -SOK-10601 ANTALYA KONYAALANTALYA      TR**** SAAT :14:56:31 Provizyon  Kodu : 761465 - 0067 - D -  Mcc: 5411',
          statementUid: '2025001784845623',
          originString: '05.02.2025 14:56 2025001784845623 -87,50 2.821,04 Diğer  Banka  POS-Alışveriş\nReferans :20067503614800776 Term Id :005159A0- ISLEM NO :    -SOK-10601 ANTALYA KONYAALANTALYA      TR**** SAAT :14:56:31 Provizyon \nKodu : 761465 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-06T12:45:00.500',
          amount: '35.910,00',
          balance: '38.731,04',
          description1: 'FAST Instant Payment',
          description2: "(06.02.2025 tarihli 384904196 sorgu no'lu QNB Bank  A.Ş.   Khayrattın  Hamid  hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)",
          statementUid: '2025001831795567',
          originString: "06.02.2025 12:45 2025001831795567 35.910,00 38.731,04 FAST Instant Payment\n(06.02.2025 tarihli 384904196 sorgu no'lu QNB Bank  A.Ş.   Khayrattın  Hamid  hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)\n"
        },
        {
          date: '2025-02-06T12:46:00.500',
          amount: '-8.360,00',
          balance: '30.371,04',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date utility (06/02/2025 and query number 1572106688 to the account Türkiye  İş   Bankası   A.Ş.  mehmet  iğne)',
          statementUid: '2025001831803751',
          originString: '06.02.2025 12:46 2025001831803751 -8.360,00 30.371,04 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date utility (06/02/2025 and query number 1572106688 to the account Türkiye  İş   Bankası  \nA.Ş.  mehmet  iğne)\n'
        },
        {
          date: '2025-02-06T12:46:00.500',
          amount: '-12,80',
          balance: '30.358,24',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025001831803751',
          originString: '06.02.2025 12:46 2025001831803751 -12,80 30.358,24 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-02-06T12:53:00.500',
          amount: '-2.000,00',
          balance: '28.358,24',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date  (06/02/2025 and query number 1572118757 to the account Türk Ekonomi  Bankası   A.Ş.  Sema sengül)',
          statementUid: '2025001832295322',
          originString: '06.02.2025 12:53 2025001832295322 -2.000,00 28.358,24 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date  (06/02/2025 and query number 1572118757 to the account Türk Ekonomi  Bankası  \nA.Ş.  Sema sengül)\n'
        },
        {
          date: '2025-02-06T12:53:00.500',
          amount: '-6,39',
          balance: '28.351,85',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025001832295322',
          originString: '06.02.2025 12:53 2025001832295322 -6,39 28.351,85 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-02-07T15:09:00.500',
          amount: '-1.302,80',
          balance: '27.049,05',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046503815154403 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :15:09:22 Provizyon Kodu :  797703 - 0046 - D -  Mcc: 5411',
          statementUid: '2025001892123090',
          originString: '07.02.2025 15:09 2025001892123090 -1.302,80 27.049,05 Diğer  Banka  POS-Alışveriş\nReferans :20046503815154403 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :15:09:22 Provizyon Kodu : \n797703 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-07T15:13:00.500',
          amount: '-220,00',
          balance: '26.829,05',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02503815039206694 Term Id :PS451685- ISLEM NO :0007-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :15:13:47 Provizyon Kodu  : 807664 - 535576 - D -  Mcc: 5943',
          statementUid: '2025001892320946',
          originString: '07.02.2025 15:13 2025001892320946 -220,00 26.829,05 VakıfBank   POS-Alışveriş\nReferans :02503815039206694 Term Id :PS451685- ISLEM NO :0007-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :15:13:47 Provizyon Kodu \n: 807664 - 535576 - D -  Mcc: 5943\n'
        },
        {
          date: '2025-02-07T18:50:00.500',
          amount: '-199,50',
          balance: '26.629,55',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503818049398 Term Id :005159A0- ISLEM NO :    -SOK-10601 ANTALYA KONYAALANTALYA      TR**** SAAT :18:50:57 Provizyon  Kodu : 381440 - 0067 - D -  Mcc: 5411',
          statementUid: '2025001903222219',
          originString: '07.02.2025 18:50 2025001903222219 -199,50 26.629,55 Diğer  Banka  POS-Alışveriş\nReferans :20067503818049398 Term Id :005159A0- ISLEM NO :    -SOK-10601 ANTALYA KONYAALANTALYA      TR**** SAAT :18:50:57 Provizyon \nKodu : 381440 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-07T18:58:00.500',
          amount: '-113,95',
          balance: '26.515,60',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02503818039338215 Term Id :01328557- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :18:58:23 Provizyon Kodu  : 399584 - 535576 - D -  Mcc: 4121',
          statementUid: '2025001903589086',
          originString: '07.02.2025 18:58 2025001903589086 -113,95 26.515,60 VakıfBank   POS-Alışveriş\nReferans :02503818039338215 Term Id :01328557- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :18:58:23 Provizyon Kodu \n: 399584 - 535576 - D -  Mcc: 4121\n'
        },
        {
          date: '2025-02-07T21:29:00.500',
          amount: '-113,95',
          balance: '26.401,65',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02503821039412733 Term Id :01327859- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :21:29:47 Provizyon Kodu  : 664179 - 535576 - D -  Mcc: 4121',
          statementUid: '2025001909805942',
          originString: '07.02.2025 21:29 2025001909805942 -113,95 26.401,65 VakıfBank   POS-Alışveriş\nReferans :02503821039412733 Term Id :01327859- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :21:29:47 Provizyon Kodu \n: 664179 - 535576 - D -  Mcc: 4121\n'
        },
        {
          date: '2025-02-08T14:44:00.500',
          amount: '2.000,00',
          balance: '28.401,65',
          description1: 'FAST Instant Payment',
          description2: "(08.02.2025 tarihli 138608 sorgu no'lu Akbank  T.A.Ş.  MURAT  ŞENGÜL   hesabından   Evgenıı   Tıkhonov   hesabına  gelen FAST ödemesi)",
          statementUid: '2025001939670663',
          originString: "08.02.2025 14:44 2025001939670663 2.000,00 28.401,65 FAST Instant Payment\n(08.02.2025 tarihli 138608 sorgu no'lu Akbank  T.A.Ş.  MURAT  ŞENGÜL   hesabından   Evgenıı   Tıkhonov   hesabına  gelen FAST ödemesi)\n"
        },
        {
          date: '2025-02-08T15:24:00.500',
          amount: '-100,00',
          balance: '28.301,65',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20012503915274785 Term Id :02091201- ISLEM NO :    -ASLAN TAKSI              ANTALYA      TR**** SAAT :15:24:34 Provizyon Kodu : 800091  - 0012 - D -  Mcc: 4789',
          statementUid: '2025001941182144',
          originString: '08.02.2025 15:24 2025001941182144 -100,00 28.301,65 Diğer  Banka  POS-Alışveriş\nReferans :20012503915274785 Term Id :02091201- ISLEM NO :    -ASLAN TAKSI              ANTALYA      TR**** SAAT :15:24:34 Provizyon Kodu : 800091 \n- 0012 - D -  Mcc: 4789\n'
        },
        {
          date: '2025-02-08T16:01:00.500',
          amount: '-950,00',
          balance: '27.351,65',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067503916614999 Term Id :0087300A- ISLEM NO :    -WORLD ATHLETIC CLUB      ANTALYA      TR**** SAAT :16:01:21 Provizyon Kodu :  898641 - 0067 - D -  Mcc: 7997',
          statementUid: '2025001942591638',
          originString: '08.02.2025 16:01 2025001942591638 -950,00 27.351,65 Diğer  Banka  POS-Alışveriş\nReferans :20067503916614999 Term Id :0087300A- ISLEM NO :    -WORLD ATHLETIC CLUB      ANTALYA      TR**** SAAT :16:01:21 Provizyon Kodu : \n898641 - 0067 - D -  Mcc: 7997\n'
        },
        {
          date: '2025-02-08T18:56:00.500',
          amount: '-113,95',
          balance: '27.237,70',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02503918039396813 Term Id :01327981- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :18:56:11 Provizyon Kodu  : 379388 - 535576 - D -  Mcc: 4121',
          statementUid: '2025001949524812',
          originString: '08.02.2025 18:56 2025001949524812 -113,95 27.237,70 VakıfBank   POS-Alışveriş\nReferans :02503918039396813 Term Id :01327981- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :18:56:11 Provizyon Kodu \n: 379388 - 535576 - D -  Mcc: 4121\n'
        },
        {
          date: '2025-02-08T19:01:00.500',
          amount: '-451,90',
          balance: '26.785,80',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20012503919955763 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :19:01:52 Provizyon Kodu :  392865 - 0012 - D -  Mcc: 5411',
          statementUid: '2025001949716294',
          originString: '08.02.2025 19:01 2025001949716294 -451,90 26.785,80 Diğer  Banka  POS-Alışveriş\nReferans :20012503919955763 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :19:01:52 Provizyon Kodu : \n392865 - 0012 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-09T10:38:00.500',
          amount: '-639,28',
          balance: '26.146,52',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046504010022681 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :10:38:25 Provizyon Kodu :  193667 - 0046 - D -  Mcc: 5411',
          statementUid: '2025001972142922',
          originString: '09.02.2025 10:38 2025001972142922 -639,28 26.146,52 Diğer  Banka  POS-Alışveriş\nReferans :20046504010022681 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :10:38:25 Provizyon Kodu : \n193667 - 0046 - D -  Mcc: 5411\n\n'
        },
        {
          date: '2025-02-09T17:29:00.500',
          amount: '-113,95',
          balance: '26.032,57',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02504017039110690 Term Id :01328557- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :17:29:24 Provizyon Kodu  : 004534 - 535576 - D -  Mcc: 4121',
          statementUid: '2025001987249824',
          originString: '09.02.2025 17:29 2025001987249824 -113,95 26.032,57 VakıfBank   POS-Alışveriş\nReferans :02504017039110690 Term Id :01328557- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :17:29:24 Provizyon Kodu \n: 004534 - 535576 - D -  Mcc: 4121\n'
        },
        {
          date: '2025-02-09T19:46:00.500',
          amount: '-113,95',
          balance: '25.918,62',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02504019039250598 Term Id :01327985- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :19:46:47 Provizyon Kodu  : 309558 - 535576 - D -  Mcc: 4121',
          statementUid: '2025001992106015',
          originString: '09.02.2025 19:46 2025001992106015 -113,95 25.918,62 VakıfBank   POS-Alışveriş\nReferans :02504019039250598 Term Id :01327985- ISLEM NO  :0001-PAPARA/DATAJİRO  YAZI   ANKARA       TRTR**** SAAT :19:46:47 Provizyon Kodu \n: 309558 - 535576 - D -  Mcc: 4121\n'
        },
        {
          date: '2025-02-09T19:51:00.500',
          amount: '-122,65',
          balance: '25.795,97',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046504019539863 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:51:48 Provizyon Kodu :  318040 - 0046 - D -  Mcc: 5411',
          statementUid: '2025001992125564',
          originString: '09.02.2025 19:51 2025001992125564 -122,65 25.795,97 Diğer  Banka  POS-Alışveriş\nReferans :20046504019539863 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:51:48 Provizyon Kodu : \n318040 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-09T23:39:00.500',
          amount: '-1.199,99',
          balance: '24.595,98',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :21599504054584207 Term Id :00188836- ISLEM NO :    -GOOGLE *Duolingo         650-253-0000 GB**** SAAT :23:39:55 Provizyon Kodu :  547396 - 031599 - D -  Mcc: 7372 Kur ..:37,16120',
          statementUid: '2025001999586818',
          originString: '09.02.2025 23:39 2025001999586818 -1.199,99 24.595,98 Overseas 3D Secure Spending\nReferans :21599504054584207 Term Id :00188836- ISLEM NO :    -GOOGLE *Duolingo         650-253-0000 GB**** SAAT :23:39:55 Provizyon Kodu : \n547396 - 031599 - D -  Mcc: 7372 Kur ..:37,16120\n'
        },
        {
          date: '2025-02-10T13:25:00.500',
          amount: '-390,75',
          balance: '24.205,23',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046504113717043 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :13:25:23 Provizyon Kodu :  586030 - 0046 - D -  Mcc: 5411',
          statementUid: '2025002025312602',
          originString: '10.02.2025 13:25 2025002025312602 -390,75 24.205,23 Diğer  Banka  POS-Alışveriş\nReferans :20046504113717043 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :13:25:23 Provizyon Kodu : \n586030 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-10T14:12:00.500',
          amount: '-915,00',
          balance: '23.290,23',
          description1: 'CLK Akdeniz Electricity Collection',
          description2: 'Hesap  Numarası:2757785313,  Ad Soyad:EVGENII TIKHONOV, Tahakkuk  Numarası:  275989684850, Son Ödeme Tarihi:20.02.2025, Ck Akdeniz Elektrik  Tahsilatı',
          statementUid: '2025002027929877',
          originString: '10.02.2025 14:12 2025002027929877 -915,00 23.290,23 CLK Akdeniz Electricity Collection\nHesap  Numarası:2757785313,  Ad Soyad:EVGENII TIKHONOV, Tahakkuk  Numarası:  275989684850, Son Ödeme Tarihi:20.02.2025, Ck Akdeniz Elektrik \nTahsilatı\n'
        },
        {
          date: '2025-02-10T14:12:00.500',
          amount: '-1.338,87',
          balance: '21.951,36',
          description1: 'CLK Akdeniz Electricity Collection',
          description2: 'Hesap  Numarası:2757785313,  Ad Soyad:EVGENII TIKHONOV, Tahakkuk  Numarası:  275337611013, Son Ödeme Tarihi:30.01.2025, Ck Akdeniz Elektrik  Tahsilatı',
          statementUid: '2025002027929887',
          originString: '10.02.2025 14:12 2025002027929887 -1.338,87 21.951,36 CLK Akdeniz Electricity Collection\nHesap  Numarası:2757785313,  Ad Soyad:EVGENII TIKHONOV, Tahakkuk  Numarası:  275337611013, Son Ödeme Tarihi:30.01.2025, Ck Akdeniz Elektrik \nTahsilatı\n'
        },
        {
          date: '2025-02-10T14:13:00.500',
          amount: '-193,48',
          balance: '21.757,88',
          description1: 'ASAT Antalya Su Collection',
          description2: 'Abone  Numarası:  0000493041, Ad Soyad/Unvan: EVGENII TIKHONOV,Fatura  Numarası:  233538287,Tahakkuk Tipi:Su,Fatura  Tutarı:193,48TL,Borç   Gecikme  Zammı:  0,00TL,Son Ödeme Tarihi: 11.02.2025  ASAT Antalya Su  Tahsilatı',
          statementUid: '2025002027941754',
          originString: '10.02.2025 14:13 2025002027941754 -193,48 21.757,88 ASAT Antalya Su Collection\nAbone  Numarası:  0000493041, Ad Soyad/Unvan: EVGENII TIKHONOV,Fatura  Numarası:  233538287,Tahakkuk Tipi:Su,Fatura  Tutarı:193,48TL,Borç  \nGecikme  Zammı:  0,00TL,Son Ödeme Tarihi: 11.02.2025  ASAT Antalya Su  Tahsilatı\n'
        },
        {
          date: '2025-02-10T14:42:00.500',
          amount: '-323,75',
          balance: '21.434,13',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20012504114079433 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :14:42:51 Provizyon Kodu :  741763 - 0012 - D -  Mcc: 5411',
          statementUid: '2025002029500644',
          originString: '10.02.2025 14:42 2025002029500644 -323,75 21.434,13 Diğer  Banka  POS-Alışveriş\nReferans :20012504114079433 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :14:42:51 Provizyon Kodu : \n741763 - 0012 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-11T20:05:00.500',
          amount: '-219,40',
          balance: '21.214,73',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20012504220190964 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :20:05:34 Provizyon Kodu :  504490 - 0012 - D -  Mcc: 5411',
          statementUid: '2025002102537565',
          originString: '11.02.2025 20:05 2025002102537565 -219,40 21.214,73 Diğer  Banka  POS-Alışveriş\nReferans :20012504220190964 Term Id :01235838- ISLEM NO :    -SOK-10601-ANTALYA KO     ANTALYA      TR**** SAAT :20:05:34 Provizyon Kodu : \n504490 - 0012 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-12T10:28:00.500',
          amount: '-2.300,00',
          balance: '18.914,73',
          description1: 'ATM Withdrawal',
          description2: "S00313  şubesine   bağlı  003134 no lu KONYAALTI  LİMAN  MAH. ATM 'sinde 12/02/2025 10:28 tarihinde 445014111936 nolu  müşteri   00158007318398268  no lu  hesabından  TL para çekti.",
          statementUid: '2025002128394678',
          originString: "12.02.2025 10:28 2025002128394678 -2.300,00 18.914,73 ATM Withdrawal\nS00313  şubesine   bağlı  003134 no lu KONYAALTI  LİMAN  MAH. ATM 'sinde 12/02/2025 10:28 tarihinde 445014111936 nolu  müşteri   00158007318398268 \nno lu  hesabından  TL para çekti.\n"
        },
        {
          date: '2025-02-12T10:36:00.500',
          amount: '-20,00',
          balance: '18.894,73',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02504310039439935 Term Id :PS451685- ISLEM NO :0001-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :10:36:59 Provizyon Kodu  : 270341 - 535576 - D -  Mcc: 5943',
          statementUid: '2025002129239027',
          originString: '12.02.2025 10:36 2025002129239027 -20,00 18.894,73 VakıfBank   POS-Alışveriş\nReferans :02504310039439935 Term Id :PS451685- ISLEM NO :0001-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :10:36:59 Provizyon Kodu \n: 270341 - 535576 - D -  Mcc: 5943\n'
        },
        {
          date: '2025-02-12T20:49:00.500',
          amount: '-376,90',
          balance: '18.517,83',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046504320691286 Term Id :02034782- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :20:49:54 Provizyon Kodu :  555957 - 0046 - D -  Mcc: 5411',
          statementUid: '2025002158927867',
          originString: '12.02.2025 20:49 2025002158927867 -376,90 18.517,83 Diğer  Banka  POS-Alışveriş\nReferans :20046504320691286 Term Id :02034782- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :20:49:54 Provizyon Kodu : \n555957 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-13T07:00:00.500',
          amount: '-430,00',
          balance: '18.087,83',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20032504407193391 Term Id :PS833524- ISLEM NO :    -HMSHOST YIYECEK VE ICECEKISTANBUL     TR**** SAAT :07:00:00 Provizyon  Kodu : 066294 - 0032 - D -  Mcc: 5812',
          statementUid: '2025002171940960',
          originString: '13.02.2025 07:00 2025002171940960 -430,00 18.087,83 Diğer  Banka  POS-Alışveriş\nReferans :20032504407193391 Term Id :PS833524- ISLEM NO :    -HMSHOST YIYECEK VE ICECEKISTANBUL     TR**** SAAT :07:00:00 Provizyon \nKodu : 066294 - 0032 - D -  Mcc: 5812\n'
        },
        {
          date: '2025-02-13T11:10:00.500',
          amount: '-6.899,70',
          balance: '11.188,13',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20010504411674305 Term Id :01646275- ISLEM NO :    -NIKE SPORTINN            ANTALYA      TR**** SAAT :11:10:49 Provizyon Kodu :  303867 - 0010 - D -  Mcc: 5661',
          statementUid: '2025002184838460',
          originString: '13.02.2025 11:10 2025002184838460 -6.899,70 11.188,13 Diğer  Banka  POS-Alışveriş\nReferans :20010504411674305 Term Id :01646275- ISLEM NO :    -NIKE SPORTINN            ANTALYA      TR**** SAAT :11:10:49 Provizyon Kodu : \n303867 - 0010 - D -  Mcc: 5661\n'
        },
        {
          date: '2025-02-13T11:24:00.500',
          amount: '-1.090,00',
          balance: '10.098,13',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046504411425527 Term Id :03392037- ISLEM NO :    -ITX TURKEY OYSHO MIGROS  ANTALYA      TR**** SAAT :11:24:13 Provizyon Kodu  : 320913 - 0046 - D -  Mcc: 5691',
          statementUid: '2025002185949310',
          originString: '13.02.2025 11:24 2025002185949310 -1.090,00 10.098,13 Diğer  Banka  POS-Alışveriş\nReferans :20046504411425527 Term Id :03392037- ISLEM NO :    -ITX TURKEY OYSHO MIGROS  ANTALYA      TR**** SAAT :11:24:13 Provizyon Kodu \n: 320913 - 0046 - D -  Mcc: 5691\n'
        },
        {
          date: '2025-02-13T11:53:00.500',
          amount: '-2.559,91',
          balance: '7.538,22',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02504411039680911 Term Id :01551636- ISLEM NO :0003-Suwen Tekstil San.      İSTANBUL      TRTR**** SAAT :11:53:33 Provizyon Kodu :  362407 - 535576 - D -  Mcc: 5631',
          statementUid: '2025002187314399',
          originString: '13.02.2025 11:53 2025002187314399 -2.559,91 7.538,22 VakıfBank   POS-Alışveriş\nReferans :02504411039680911 Term Id :01551636- ISLEM NO :0003-Suwen Tekstil San.      İSTANBUL      TRTR**** SAAT :11:53:33 Provizyon Kodu : \n362407 - 535576 - D -  Mcc: 5631\n\n'
        },
        {
          date: '2025-02-13T18:22:00.500',
          amount: '-232,46',
          balance: '7.305,76',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504418050088 Term Id :0051270D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :18:22:33 Provizyon  Kodu : 279677 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002204971006',
          originString: '13.02.2025 18:22 2025002204971006 -232,46 7.305,76 Diğer  Banka  POS-Alışveriş\nReferans :20067504418050088 Term Id :0051270D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :18:22:33 Provizyon \nKodu : 279677 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-14T14:01:00.500',
          amount: '-2.000,00',
          balance: '5.305,76',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504514912544 Term Id :00B6844D- ISLEM NO :    -KONYAALTI VETERINER KLINIANTALYA      TR**** SAAT :14:01:27 Provizyon Kodu  : 666514 - 0067 - D -  Mcc: 8011',
          statementUid: '2025002243571263',
          originString: '14.02.2025 14:01 2025002243571263 -2.000,00 5.305,76 Diğer  Banka  POS-Alışveriş\nReferans :20067504514912544 Term Id :00B6844D- ISLEM NO :    -KONYAALTI VETERINER KLINIANTALYA      TR**** SAAT :14:01:27 Provizyon Kodu \n: 666514 - 0067 - D -  Mcc: 8011\n'
        },
        {
          date: '2025-02-14T14:25:00.500',
          amount: '-795,67',
          balance: '4.510,09',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504514367922 Term Id :0041223B- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :14:25:48 Provizyon  Kodu : 728958 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002244583893',
          originString: '14.02.2025 14:25 2025002244583893 -795,67 4.510,09 Diğer  Banka  POS-Alışveriş\nReferans :20067504514367922 Term Id :0041223B- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :14:25:48 Provizyon \nKodu : 728958 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-15T14:30:00.500',
          amount: '-1.500,00',
          balance: '3.010,09',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504614272540 Term Id :00B7196E- ISLEM NO :    -AYHAN AYDOST             ANTALYA      TR**** SAAT :14:30:07 Provizyon Kodu :  854322 - 0067 - D -  Mcc: 8021',
          statementUid: '2025002303758317',
          originString: '15.02.2025 14:30 2025002303758317 -1.500,00 3.010,09 Diğer  Banka  POS-Alışveriş\nReferans :20067504614272540 Term Id :00B7196E- ISLEM NO :    -AYHAN AYDOST             ANTALYA      TR**** SAAT :14:30:07 Provizyon Kodu : \n854322 - 0067 - D -  Mcc: 8021\n'
        },
        {
          date: '2025-02-15T14:52:00.500',
          amount: '-2.138,00',
          balance: '872,09',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02504614039396476 Term Id :PS451685- ISLEM NO :0004-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :14:52:31 Provizyon Kodu  : 923454 - 535576 - D -  Mcc: 5943',
          statementUid: '2025002304765592',
          originString: '15.02.2025 14:52 2025002304765592 -2.138,00 872,09 VakıfBank   POS-Alışveriş\nReferans :02504614039396476 Term Id :PS451685- ISLEM NO :0004-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :14:52:31 Provizyon Kodu \n: 923454 - 535576 - D -  Mcc: 5943\n'
        },
        {
          date: '2025-02-15T16:09:00.500',
          amount: '-78,00',
          balance: '794,09',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504616302596 Term Id :0051270E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :16:09:12 Provizyon  Kodu : 177333 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002308255303',
          originString: '15.02.2025 16:09 2025002308255303 -78,00 794,09 Diğer  Banka  POS-Alışveriş\nReferans :20067504616302596 Term Id :0051270E- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :16:09:12 Provizyon \nKodu : 177333 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-16T10:32:00.500',
          amount: '36.130,00',
          balance: '36.924,09',
          description1: 'FAST Instant Payment',
          description2: "(16.02.2025 tarihli 2678000059 sorgu no'lu Türkiye Garanti  Bankası   A.Ş.  MUZAFFER SÖNMEZ  hesabından  evgenii tikhonov  hesabına  gelen FAST  ödemesi)",
          statementUid: '2025002339205881',
          originString: "16.02.2025 10:32 2025002339205881 36.130,00 36.924,09 FAST Instant Payment\n(16.02.2025 tarihli 2678000059 sorgu no'lu Türkiye Garanti  Bankası   A.Ş.  MUZAFFER SÖNMEZ  hesabından  evgenii tikhonov  hesabına  gelen FAST \nödemesi)\n"
        },
        {
          date: '2025-02-16T11:22:00.500',
          amount: '-37,00',
          balance: '36.887,09',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504711435826 Term Id :0098659A- ISLEM NO :    -BEACH PARK BK            ANTALYA      TR**** SAAT :11:22:39 Provizyon Kodu :  291789 - 0067 - D -  Mcc: 5814',
          statementUid: '2025002341122886',
          originString: '16.02.2025 11:22 2025002341122886 -37,00 36.887,09 Diğer  Banka  POS-Alışveriş\nReferans :20067504711435826 Term Id :0098659A- ISLEM NO :    -BEACH PARK BK            ANTALYA      TR**** SAAT :11:22:39 Provizyon Kodu : \n291789 - 0067 - D -  Mcc: 5814\n'
        },
        {
          date: '2025-02-16T11:46:00.500',
          amount: '-60,00',
          balance: '36.827,09',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02504711039408623 Term Id :01176201- ISLEM NO :0006-ANET ANTALYA  İNŞAAT     ANTALYA      TRTR**** SAAT :11:46:05 Provizyon  Kodu : 327904 - 535576 - D -  Mcc: 5812',
          statementUid: '2025002342307633',
          originString: '16.02.2025 11:46 2025002342307633 -60,00 36.827,09 VakıfBank   POS-Alışveriş\nReferans :02504711039408623 Term Id :01176201- ISLEM NO :0006-ANET ANTALYA  İNŞAAT     ANTALYA      TRTR**** SAAT :11:46:05 Provizyon \nKodu : 327904 - 535576 - D -  Mcc: 5812\n'
        },
        {
          date: '2025-02-16T12:06:00.500',
          amount: '-2.450,00',
          balance: '34.377,09',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20032504712779578 Term Id :PS237765- ISLEM NO :    -TURKSPORT SPOR URUNLERI SANTALYA      TR**** SAAT :12:06:34 Provizyon  Kodu : 361703 - 0032 - D -  Mcc: 5941',
          statementUid: '2025002343006348',
          originString: '16.02.2025 12:06 2025002343006348 -2.450,00 34.377,09 Diğer  Banka  POS-Alışveriş\nReferans :20032504712779578 Term Id :PS237765- ISLEM NO :    -TURKSPORT SPOR URUNLERI SANTALYA      TR**** SAAT :12:06:34 Provizyon \nKodu : 361703 - 0032 - D -  Mcc: 5941\n'
        },
        {
          date: '2025-02-16T12:25:00.500',
          amount: '-1.229,95',
          balance: '33.147,14',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20111504712345509 Term Id :P1926885- ISLEM NO :    -LCW ANT ERASTA           ANTALYA      TR**** SAAT :12:25:05 Provizyon Kodu :  394746 - 0111 - D -  Mcc: 5699',
          statementUid: '2025002343824052',
          originString: '16.02.2025 12:25 2025002343824052 -1.229,95 33.147,14 Diğer  Banka  POS-Alışveriş\nReferans :20111504712345509 Term Id :P1926885- ISLEM NO :    -LCW ANT ERASTA           ANTALYA      TR**** SAAT :12:25:05 Provizyon Kodu : \n394746 - 0111 - D -  Mcc: 5699\n'
        },
        {
          date: '2025-02-16T13:42:00.500',
          amount: '-6.847,04',
          balance: '26.300,10',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20062504755362805 Term Id :01981943- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :13:42:50 Provizyon  Kodu : 554755 - 0062 - D -  Mcc: 5411',
          statementUid: '2025002347264074',
          originString: '16.02.2025 13:42 2025002347264074 -6.847,04 26.300,10 Diğer  Banka  POS-Alışveriş\nReferans :20062504755362805 Term Id :01981943- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :13:42:50 Provizyon \nKodu : 554755 - 0062 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-17T11:38:00.500',
          amount: '-860,00',
          balance: '25.440,10',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20010504811106167 Term Id :01408738- ISLEM NO :    -AYDIN BEACH              ANTALYA      TR**** SAAT :11:38:24 Provizyon Kodu : 418804  - 0010 - D -  Mcc: 5499',
          statementUid: '2025002392727115',
          originString: '17.02.2025 11:38 2025002392727115 -860,00 25.440,10 Diğer  Banka  POS-Alışveriş\nReferans :20010504811106167 Term Id :01408738- ISLEM NO :    -AYDIN BEACH              ANTALYA      TR**** SAAT :11:38:24 Provizyon Kodu : 418804 \n- 0010 - D -  Mcc: 5499\n'
        },
        {
          date: '2025-02-17T14:33:00.500',
          amount: '-1.673,20',
          balance: '23.766,90',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046504814014108 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :14:33:29 Provizyon Kodu :  826587 - 0046 - D -  Mcc: 5411',
          statementUid: '2025002404035092',
          originString: '17.02.2025 14:33 2025002404035092 -1.673,20 23.766,90 Diğer  Banka  POS-Alışveriş\nReferans :20046504814014108 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :14:33:29 Provizyon Kodu : \n826587 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-17T14:37:00.500',
          amount: '-120,00',
          balance: '23.646,90',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02504814039120397 Term Id :PS451685- ISLEM NO :0008-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :14:37:25 Provizyon Kodu  : 835575 - 535576 - D -  Mcc: 5943',
          statementUid: '2025002404274710',
          originString: '17.02.2025 14:37 2025002404274710 -120,00 23.646,90 VakıfBank   POS-Alışveriş\nReferans :02504814039120397 Term Id :PS451685- ISLEM NO :0008-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :14:37:25 Provizyon Kodu \n: 835575 - 535576 - D -  Mcc: 5943\n'
        },
        {
          date: '2025-02-17T16:29:00.500',
          amount: '-77,50',
          balance: '23.569,40',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504816512042 Term Id :004944B4- ISLEM NO :    -A101-9936-E460 MODA PARK ANTALYA      TR**** SAAT :16:29:21 Provizyon Kodu :  112576 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002412094286',
          originString: '17.02.2025 16:29 2025002412094286 -77,50 23.569,40 Diğer  Banka  POS-Alışveriş\nReferans :20067504816512042 Term Id :004944B4- ISLEM NO :    -A101-9936-E460 MODA PARK ANTALYA      TR**** SAAT :16:29:21 Provizyon Kodu : \n112576 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-17T16:47:00.500',
          amount: '-1.200,00',
          balance: '22.369,40',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date  (17/02/2025 and query number 1595434248 to the account Türkiye Cumhuriyeti Ziraat  Bankası   A.Ş.  Feride Özçelik)',
          statementUid: '2025002413329954',
          originString: '17.02.2025 16:47 2025002413329954 -1.200,00 22.369,40 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date  (17/02/2025 and query number 1595434248 to the account Türkiye Cumhuriyeti Ziraat \nBankası   A.Ş.  Feride Özçelik)\n\n'
        },
        {
          date: '2025-02-17T16:47:00.500',
          amount: '-6,39',
          balance: '22.363,01',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025002413329954',
          originString: '17.02.2025 16:47 2025002413329954 -6,39 22.363,01 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-02-17T17:48:00.500',
          amount: '-4,77',
          balance: '22.358,24',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :22153021788703198 Term Id :AAIZQCVQ- ISLEM NO :    -GITHUB, INC.             +18774484820 US**** SAAT :17:48:23 Provizyon Kodu :  358629 - 032153 - D -  Mcc: 7372 Kur ..:36,654280',
          statementUid: '2025002417078232',
          originString: '17.02.2025 17:48 2025002417078232 -4,77 22.358,24 Overseas 3D Secure Spending\nReferans :22153021788703198 Term Id :AAIZQCVQ- ISLEM NO :    -GITHUB, INC.             +18774484820 US**** SAAT :17:48:23 Provizyon Kodu : \n358629 - 032153 - D -  Mcc: 7372 Kur ..:36,654280\n'
        },
        {
          date: '2025-02-17T17:48:00.500',
          amount: '-0,01',
          balance: '22.358,23',
          description1: 'KMV',
          description2: "KAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ",
          statementUid: '2025002417078232',
          originString: "17.02.2025 17:48 2025002417078232 -0,01 22.358,23 KMV\nKAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ\n"
        },
        {
          date: '2025-02-18T12:41:00.500',
          amount: '-1.110,00',
          balance: '21.248,23',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20064504925758085 Term Id :S0L93J02- ISLEM NO :    -DUYGU TARHAN-ALPSOY ECZ  ANTALYA      TR**** SAAT :12:41:23 Provizyon  Kodu : 526679 - 0064 - D -  Mcc: 5912',
          statementUid: '2025002456607296',
          originString: '18.02.2025 12:41 2025002456607296 -1.110,00 21.248,23 Diğer  Banka  POS-Alışveriş\nReferans :20064504925758085 Term Id :S0L93J02- ISLEM NO :    -DUYGU TARHAN-ALPSOY ECZ  ANTALYA      TR**** SAAT :12:41:23 Provizyon \nKodu : 526679 - 0064 - D -  Mcc: 5912\n'
        },
        {
          date: '2025-02-18T12:59:00.500',
          amount: '-580,00',
          balance: '20.668,23',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20134504912950127 Term Id :01331504- ISLEM NO :    -GALIP YAYLACI            Antalya      TR**** SAAT :12:59:40 Provizyon Kodu : 575454 -  0134 - D -  Mcc: 5451',
          statementUid: '2025002457478697',
          originString: '18.02.2025 12:59 2025002457478697 -580,00 20.668,23 Diğer  Banka  POS-Alışveriş\nReferans :20134504912950127 Term Id :01331504- ISLEM NO :    -GALIP YAYLACI            Antalya      TR**** SAAT :12:59:40 Provizyon Kodu : 575454 - \n0134 - D -  Mcc: 5451\n'
        },
        {
          date: '2025-02-18T13:10:00.500',
          amount: '-600,00',
          balance: '20.068,23',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504913398672 Term Id :008827F4- ISLEM NO :    -MURAT DAG                ANTALYA      TR**** SAAT :13:10:35 Provizyon Kodu : 602920  - 0067 - D -  Mcc: 5499',
          statementUid: '2025002458007373',
          originString: '18.02.2025 13:10 2025002458007373 -600,00 20.068,23 Diğer  Banka  POS-Alışveriş\nReferans :20067504913398672 Term Id :008827F4- ISLEM NO :    -MURAT DAG                ANTALYA      TR**** SAAT :13:10:35 Provizyon Kodu : 602920 \n- 0067 - D -  Mcc: 5499\n'
        },
        {
          date: '2025-02-18T13:21:00.500',
          amount: '-298,03',
          balance: '19.770,20',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504913580753 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :13:21:49 Provizyon  Kodu : 629709 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002458658197',
          originString: '18.02.2025 13:21 2025002458658197 -298,03 19.770,20 Diğer  Banka  POS-Alışveriş\nReferans :20067504913580753 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :13:21:49 Provizyon \nKodu : 629709 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-18T14:46:00.500',
          amount: '-97,99',
          balance: '19.672,21',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :21599504971493201 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :14:46:32 Provizyon Kodu :  817340 - 031599 - D -  Mcc: 5816 Kur ..:36,693510',
          statementUid: '2025002462942693',
          originString: '18.02.2025 14:46 2025002462942693 -97,99 19.672,21 Overseas 3D Secure Spending\nReferans :21599504971493201 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :14:46:32 Provizyon Kodu : \n817340 - 031599 - D -  Mcc: 5816 Kur ..:36,693510\n'
        },
        {
          date: '2025-02-18T15:06:00.500',
          amount: '-97,99',
          balance: '19.574,22',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :21599504971694690 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :15:06:57 Provizyon Kodu :  864877 - 031599 - D -  Mcc: 5734 Kur ..:36,692190',
          statementUid: '2025002463990408',
          originString: '18.02.2025 15:06 2025002463990408 -97,99 19.574,22 Overseas 3D Secure Spending\nReferans :21599504971694690 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :15:06:57 Provizyon Kodu : \n864877 - 031599 - D -  Mcc: 5734 Kur ..:36,692190\n'
        },
        {
          date: '2025-02-18T15:50:00.500',
          amount: '-800,00',
          balance: '18.774,22',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067504915056629 Term Id :0050619B- ISLEM NO :    -SHISHACO NARGILE         ANTALYA      TR**** SAAT :15:50:28 Provizyon Kodu :  970711 - 0067 - D -  Mcc: 5812',
          statementUid: '2025002466792875',
          originString: '18.02.2025 15:50 2025002466792875 -800,00 18.774,22 Diğer  Banka  POS-Alışveriş\nReferans :20067504915056629 Term Id :0050619B- ISLEM NO :    -SHISHACO NARGILE         ANTALYA      TR**** SAAT :15:50:28 Provizyon Kodu : \n970711 - 0067 - D -  Mcc: 5812\n'
        },
        {
          date: '2025-02-18T16:56:00.500',
          amount: '-189,99',
          balance: '18.584,23',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :21599504954333042 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :16:56:19 Provizyon Kodu :  142740 - 031599 - D -  Mcc: 5816 Kur ..:36,692170',
          statementUid: '2025002470463682',
          originString: '18.02.2025 16:56 2025002470463682 -189,99 18.584,23 Overseas 3D Secure Spending\nReferans :21599504954333042 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :16:56:19 Provizyon Kodu : \n142740 - 031599 - D -  Mcc: 5816 Kur ..:36,692170\n'
        },
        {
          date: '2025-02-18T20:55:00.500',
          amount: '-524,51',
          balance: '18.059,72',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :22153021875762412 Term Id :AAIZQCVQ- ISLEM NO :    -GITHUB, INC.             +18774484820 US**** SAAT :20:55:09 Provizyon Kodu :  754130 - 032153 - D -  Mcc: 7372 Kur ..:37,464370',
          statementUid: '2025002482478647',
          originString: '18.02.2025 20:55 2025002482478647 -524,51 18.059,72 Overseas 3D Secure Spending\nReferans :22153021875762412 Term Id :AAIZQCVQ- ISLEM NO :    -GITHUB, INC.             +18774484820 US**** SAAT :20:55:09 Provizyon Kodu : \n754130 - 032153 - D -  Mcc: 7372 Kur ..:37,464370\n'
        },
        {
          date: '2025-02-18T20:55:00.500',
          amount: '-1,05',
          balance: '18.058,67',
          description1: 'KMV',
          description2: "KAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ",
          statementUid: '2025002482478647',
          originString: "18.02.2025 20:55 2025002482478647 -1,05 18.058,67 KMV\nKAMBİYO  MUAMELE  VERGİSİ  TUTARININ 00158007318398268 NO'LU  MÜŞTERİNİN    00158007318398268 HESABINDAN  TAHSİLİ\n"
        },
        {
          date: '2025-02-19T16:00:00.500',
          amount: '-264,00',
          balance: '17.794,67',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02505016039367035 Term Id :PS451685- ISLEM NO :0003-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :16:00:57 Provizyon Kodu  : 001306 - 535576 - D -  Mcc: 5943',
          statementUid: '2025002520137296',
          originString: '19.02.2025 16:00 2025002520137296 -264,00 17.794,67 VakıfBank   POS-Alışveriş\nReferans :02505016039367035 Term Id :PS451685- ISLEM NO :0003-BAHA  KİTAP   KIRTASİYE    ANTALYA      TRTR**** SAAT :16:00:57 Provizyon Kodu \n: 001306 - 535576 - D -  Mcc: 5943\n'
        },
        {
          date: '2025-02-19T16:02:00.500',
          amount: '-159,90',
          balance: '17.634,77',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046505016092075 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :16:02:35 Provizyon Kodu :  005437 - 0046 - D -  Mcc: 5411',
          statementUid: '2025002520150048',
          originString: '19.02.2025 16:02 2025002520150048 -159,90 17.634,77 Diğer  Banka  POS-Alışveriş\nReferans :20046505016092075 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :16:02:35 Provizyon Kodu : \n005437 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-19T17:56:00.500',
          amount: '-548,50',
          balance: '17.086,27',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067505017167928 Term Id :0051270D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :17:56:21 Provizyon  Kodu : 333390 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002526443384',
          originString: '19.02.2025 17:56 2025002526443384 -548,50 17.086,27 Diğer  Banka  POS-Alışveriş\nReferans :20067505017167928 Term Id :0051270D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :17:56:21 Provizyon \nKodu : 333390 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-20T11:43:00.500',
          amount: '-725,10',
          balance: '16.361,17',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067505111319436 Term Id :004944B3- ISLEM NO :    -A101-9936-E460 MODA PARK ANTALYA      TR**** SAAT :11:43:05 Provizyon Kodu :  366445 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002560385351',
          originString: '20.02.2025 11:43 2025002560385351 -725,10 16.361,17 Diğer  Banka  POS-Alışveriş\nReferans :20067505111319436 Term Id :004944B3- ISLEM NO :    -A101-9936-E460 MODA PARK ANTALYA      TR**** SAAT :11:43:05 Provizyon Kodu : \n366445 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-20T11:46:00.500',
          amount: '-1.200,00',
          balance: '15.161,17',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date  (20/02/2025 and query number 1600896140 to the account Türkiye Cumhuriyeti Ziraat  Bankası   A.Ş.  Feride Özçelik)',
          statementUid: '2025002560611420',
          originString: '20.02.2025 11:46 2025002560611420 -1.200,00 15.161,17 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date  (20/02/2025 and query number 1600896140 to the account Türkiye Cumhuriyeti Ziraat \nBankası   A.Ş.  Feride Özçelik)\n\n'
        },
        {
          date: '2025-02-20T11:46:00.500',
          amount: '-6,39',
          balance: '15.154,78',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025002560611420',
          originString: '20.02.2025 11:46 2025002560611420 -6,39 15.154,78 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-02-20T12:07:00.500',
          amount: '-1.173,55',
          balance: '13.981,23',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067505112677002 Term Id :0041431E- ISLEM NO :    -KONYAALTI MACROCENTER    ANTALYA      TR**** SAAT :12:07:36 Provizyon  Kodu : 411127 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002561396303',
          originString: '20.02.2025 12:07 2025002561396303 -1.173,55 13.981,23 Diğer  Banka  POS-Alışveriş\nReferans :20067505112677002 Term Id :0041431E- ISLEM NO :    -KONYAALTI MACROCENTER    ANTALYA      TR**** SAAT :12:07:36 Provizyon \nKodu : 411127 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-20T16:07:00.500',
          amount: '-355,00',
          balance: '13.626,23',
          description1: '3D Secure Spending',
          description2: 'Referans :02505116106710555 Term Id :VP288149- ISLEM NO :    -PARAM/TRENDYOL         ANKARA       TRTR**** SAAT :16:07:09 Provizyon Kodu :  950061 - 535576 - D -  Mcc: 5999',
          statementUid: '2025002573784162',
          originString: '20.02.2025 16:07 2025002573784162 -355,00 13.626,23 3D Secure Spending\nReferans :02505116106710555 Term Id :VP288149- ISLEM NO :    -PARAM/TRENDYOL         ANKARA       TRTR**** SAAT :16:07:09 Provizyon Kodu : \n950061 - 535576 - D -  Mcc: 5999\n'
        },
        {
          date: '2025-02-20T21:08:00.500',
          amount: '-97,99',
          balance: '13.528,24',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :21599505171532676 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :21:08:04 Provizyon Kodu :  673278 - 031599 - D -  Mcc: 5818 Kur ..:37,499180',
          statementUid: '2025002589010786',
          originString: '20.02.2025 21:08 2025002589010786 -97,99 13.528,24 Overseas 3D Secure Spending\nReferans :21599505171532676 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :21:08:04 Provizyon Kodu : \n673278 - 031599 - D -  Mcc: 5818 Kur ..:37,499180\n'
        },
        {
          date: '2025-02-21T13:54:00.500',
          amount: '-1.500,00',
          balance: '12.028,24',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067505213140715 Term Id :00B6844D- ISLEM NO :    -KONYAALTI VETERINER KLINIANTALYA      TR**** SAAT :13:54:47 Provizyon Kodu  : 650328 - 0067 - D -  Mcc: 8011',
          statementUid: '2025002619723586',
          originString: '21.02.2025 13:54 2025002619723586 -1.500,00 12.028,24 Diğer  Banka  POS-Alışveriş\nReferans :20067505213140715 Term Id :00B6844D- ISLEM NO :    -KONYAALTI VETERINER KLINIANTALYA      TR**** SAAT :13:54:47 Provizyon Kodu \n: 650328 - 0067 - D -  Mcc: 8011\n'
        },
        {
          date: '2025-02-21T14:07:00.500',
          amount: '-620,00',
          balance: '11.408,24',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20062505250408929 Term Id :02174488- ISLEM NO :    -VODAFONE  MOY ILETISIM-V ANTALYA      TR**** SAAT :14:07:52 Provizyon Kodu :  684844 - 0062 - D -  Mcc: 4812',
          statementUid: '2025002620353251',
          originString: '21.02.2025 14:07 2025002620353251 -620,00 11.408,24 Diğer  Banka  POS-Alışveriş\nReferans :20062505250408929 Term Id :02174488- ISLEM NO :    -VODAFONE  MOY ILETISIM-V ANTALYA      TR**** SAAT :14:07:52 Provizyon Kodu : \n684844 - 0062 - D -  Mcc: 4812\n'
        },
        {
          date: '2025-02-21T14:12:00.500',
          amount: '-635,00',
          balance: '10.773,24',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20064505203310291 Term Id :G7041203- ISLEM NO :    -GUNEY ECZANESI           ANTALYA      TR**** SAAT :14:12:44 Provizyon Kodu :  697967 - 0064 - D -  Mcc: 5912',
          statementUid: '2025002620795361',
          originString: '21.02.2025 14:12 2025002620795361 -635,00 10.773,24 Diğer  Banka  POS-Alışveriş\nReferans :20064505203310291 Term Id :G7041203- ISLEM NO :    -GUNEY ECZANESI           ANTALYA      TR**** SAAT :14:12:44 Provizyon Kodu : \n697967 - 0064 - D -  Mcc: 5912\n'
        },
        {
          date: '2025-02-21T23:04:00.500',
          amount: '-97,99',
          balance: '10.675,25',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :21599505254106439 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :23:04:54 Provizyon Kodu :  817170 - 031599 - D -  Mcc: 5817 Kur ..:37,599440',
          statementUid: '2025002647016564',
          originString: '21.02.2025 23:04 2025002647016564 -97,99 10.675,25 Overseas 3D Secure Spending\nReferans :21599505254106439 Term Id :00188836- ISLEM NO :    -GOOGLE *Gossip Harbor    g.co/helppay#GB**** SAAT :23:04:54 Provizyon Kodu : \n817170 - 031599 - D -  Mcc: 5817 Kur ..:37,599440\n'
        },
        {
          date: '2025-02-22T12:06:00.500',
          amount: '-40,00',
          balance: '10.635,25',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20012505312681533 Term Id :01261966- ISLEM NO :    -ISPARTA DAVRAZ TURIZ     ISPARTA      TR**** SAAT :12:06:41 Provizyon Kodu :  355073 - 0012 - D -  Mcc: 7011',
          statementUid: '2025002665799558',
          originString: '22.02.2025 12:06 2025002665799558 -40,00 10.635,25 Diğer  Banka  POS-Alışveriş\nReferans :20012505312681533 Term Id :01261966- ISLEM NO :    -ISPARTA DAVRAZ TURIZ     ISPARTA      TR**** SAAT :12:06:41 Provizyon Kodu : \n355073 - 0012 - D -  Mcc: 7011\n'
        },
        {
          date: '2025-02-22T12:31:00.500',
          amount: '-5.000,00',
          balance: '5.635,25',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date  (22/02/2025 and query number 1604742652 to the account Türkiye  İş   Bankası   A.Ş.   hasan  güneş)',
          statementUid: '2025002665940940',
          originString: '22.02.2025 12:31 2025002665940940 -5.000,00 5.635,25 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date  (22/02/2025 and query number 1604742652 to the account Türkiye  İş   Bankası   A.Ş.  \nhasan  güneş)\n'
        },
        {
          date: '2025-02-22T12:31:00.500',
          amount: '-6,39',
          balance: '5.628,86',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025002665940940',
          originString: '22.02.2025 12:31 2025002665940940 -6,39 5.628,86 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-02-22T12:44:00.500',
          amount: '-4.000,00',
          balance: '1.628,86',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20010505312446045 Term Id :01741600- ISLEM NO :    -DAVRAZ KAYAK MER GUN     ISPARTA      TR**** SAAT :12:44:27 Provizyon Kodu :  425367 - 0010 - D -  Mcc: 4722',
          statementUid: '2025002666080092',
          originString: '22.02.2025 12:44 2025002666080092 -4.000,00 1.628,86 Diğer  Banka  POS-Alışveriş\nReferans :20010505312446045 Term Id :01741600- ISLEM NO :    -DAVRAZ KAYAK MER GUN     ISPARTA      TR**** SAAT :12:44:27 Provizyon Kodu : \n425367 - 0010 - D -  Mcc: 4722\n'
        },
        {
          date: '2025-02-22T14:11:00.500',
          amount: '-300,00',
          balance: '1.328,86',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date  (22/02/2025 and query number 1604920453 to the account Türkiye Cumhuriyeti Ziraat  Bankası   A.Ş.  Hasan Hüseyin  Yılmaz)',
          statementUid: '2025002668914395',
          originString: '22.02.2025 14:11 2025002668914395 -300,00 1.328,86 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date  (22/02/2025 and query number 1604920453 to the account Türkiye Cumhuriyeti Ziraat \nBankası   A.Ş.  Hasan Hüseyin  Yılmaz)\n'
        },
        {
          date: '2025-02-22T14:11:00.500',
          amount: '-6,39',
          balance: '1.322,47',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025002668914395',
          originString: '22.02.2025 14:11 2025002668914395 -6,39 1.322,47 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-02-22T16:50:00.500',
          amount: '36.210,00',
          balance: '37.532,47',
          description1: 'FAST Instant Payment',
          description2: "(22.02.2025 tarihli 436714977 sorgu no'lu QNB Bank  A.Ş.   Khayrattın  Hamid  hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)",
          statementUid: '2025002675620463',
          originString: "22.02.2025 16:50 2025002675620463 36.210,00 37.532,47 FAST Instant Payment\n(22.02.2025 tarihli 436714977 sorgu no'lu QNB Bank  A.Ş.   Khayrattın  Hamid  hesabından  evgenii tikhonov  hesabına  gelen FAST ödemesi)\n"
        },
        {
          date: '2025-02-22T17:28:00.500',
          amount: '-150,00',
          balance: '37.382,47',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20010505317935251 Term Id :02307548- ISLEM NO :    -TANTUNI HKA              ISPARTA      TR**** SAAT :17:28:57 Provizyon Kodu : 151945  - 0010 - D -  Mcc: 5812',
          statementUid: '2025002677355297',
          originString: '22.02.2025 17:28 2025002677355297 -150,00 37.382,47 Diğer  Banka  POS-Alışveriş\nReferans :20010505317935251 Term Id :02307548- ISLEM NO :    -TANTUNI HKA              ISPARTA      TR**** SAAT :17:28:57 Provizyon Kodu : 151945 \n- 0010 - D -  Mcc: 5812\n'
        },
        {
          date: '2025-02-22T17:35:00.500',
          amount: '-1.900,75',
          balance: '35.481,72',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046505317064029 Term Id :00452671- ISLEM NO :    -PO DOST PETROL LTD.STI.  ISPARTA      TR**** SAAT :17:35:55 Provizyon Kodu :  171321 - 0046 - D -  Mcc: 5541',
          statementUid: '2025002677520087',
          originString: '22.02.2025 17:35 2025002677520087 -1.900,75 35.481,72 Diğer  Banka  POS-Alışveriş\nReferans :20046505317064029 Term Id :00452671- ISLEM NO :    -PO DOST PETROL LTD.STI.  ISPARTA      TR**** SAAT :17:35:55 Provizyon Kodu : \n171321 - 0046 - D -  Mcc: 5541\n'
        },
        {
          date: '2025-02-22T17:36:00.500',
          amount: '-90,00',
          balance: '35.391,72',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20210505317776061 Term Id :00681586- ISLEM NO :    -DOSTPET NAKLIYAT VE TI   ISPARTA      TR**** SAAT :17:36:08 Provizyon Kodu :  171948 - 0210 - D -  Mcc: 5411',
          statementUid: '2025002677521510',
          originString: '22.02.2025 17:36 2025002677521510 -90,00 35.391,72 Diğer  Banka  POS-Alışveriş\nReferans :20210505317776061 Term Id :00681586- ISLEM NO :    -DOSTPET NAKLIYAT VE TI   ISPARTA      TR**** SAAT :17:36:08 Provizyon Kodu : \n171948 - 0210 - D -  Mcc: 5411\n\n'
        },
        {
          date: '2025-02-22T18:21:00.500',
          amount: '-144,00',
          balance: '35.247,72',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20064505315357651 Term Id :S0SX9602- ISLEM NO :    -BIM A.S. / O003 AGLASUN  BURDUR       TR**** SAAT :18:21:13 Provizyon Kodu :  294986 - 0064 - D -  Mcc: 5411',
          statementUid: '2025002679361264',
          originString: '22.02.2025 18:21 2025002679361264 -144,00 35.247,72 Diğer  Banka  POS-Alışveriş\nReferans :20064505315357651 Term Id :S0SX9602- ISLEM NO :    -BIM A.S. / O003 AGLASUN  BURDUR       TR**** SAAT :18:21:13 Provizyon Kodu : \n294986 - 0064 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-22T19:38:00.500',
          amount: '-1.379,85',
          balance: '33.867,87',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20046505319613283 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:38:09 Provizyon Kodu :  476533 - 0046 - D -  Mcc: 5411',
          statementUid: '2025002682495722',
          originString: '22.02.2025 19:38 2025002682495722 -1.379,85 33.867,87 Diğer  Banka  POS-Alışveriş\nReferans :20046505319613283 Term Id :02034783- ISLEM NO :    -CAGLARSOY MARKET         ANTALYA      TR**** SAAT :19:38:09 Provizyon Kodu : \n476533 - 0046 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-23T11:03:00.500',
          amount: '-142,90',
          balance: '33.724,97',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067505411772915 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :11:03:08 Provizyon  Kodu : 224739 - 0067 - D -  Mcc: 5411',
          statementUid: '2025002702450079',
          originString: '23.02.2025 11:03 2025002702450079 -142,90 33.724,97 Diğer  Banka  POS-Alışveriş\nReferans :20067505411772915 Term Id :0041223D- ISLEM NO :    -MIGROS ANTALYA KONYAALTI ANTALYA      TR**** SAAT :11:03:08 Provizyon \nKodu : 224739 - 0067 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-23T19:29:00.500',
          amount: '-159,99',
          balance: '33.564,98',
          description1: 'Overseas 3D Secure Spending',
          description2: 'Referans :21599505451276984 Term Id :00188836- ISLEM NO :    -GOOGLE *YouTube          650-253-0000 GB**** SAAT :19:29:21 Provizyon Kodu :  319801 - 031599 - D -  Mcc: 5818 Kur ..:37,599440',
          statementUid: '2025002721255735',
          originString: '23.02.2025 19:29 2025002721255735 -159,99 33.564,98 Overseas 3D Secure Spending\nReferans :21599505451276984 Term Id :00188836- ISLEM NO :    -GOOGLE *YouTube          650-253-0000 GB**** SAAT :19:29:21 Provizyon Kodu : \n319801 - 031599 - D -  Mcc: 5818 Kur ..:37,599440\n'
        },
        {
          date: '2025-02-23T20:43:00.500',
          amount: '-39,00',
          balance: '33.525,98',
          description1: '3D Secure Spending',
          description2: 'Referans :02505420100731528 Term Id :VP297901- ISLEM NO :    -IYZICO/AmazonPrimeTR    İSTANBUL      TRTR**** SAAT :20:43:57 Provizyon Kodu :  447864 - 535576 - D -  Mcc: 7999',
          statementUid: '2025002723597865',
          originString: '23.02.2025 20:43 2025002723597865 -39,00 33.525,98 3D Secure Spending\nReferans :02505420100731528 Term Id :VP297901- ISLEM NO :    -IYZICO/AmazonPrimeTR    İSTANBUL      TRTR**** SAAT :20:43:57 Provizyon Kodu : \n447864 - 535576 - D -  Mcc: 7999\n'
        },
        {
          date: '2025-02-24T11:11:00.500',
          amount: '-4.300,00',
          balance: '29.225,98',
          description1: 'VakıfBank   POS-Alışveriş',
          description2: 'Referans :02505511039392145 Term Id :01464380- ISLEM NO :0002-CROWN BEAUTY SALON     Antalya      TRTR**** SAAT :11:11:15 Provizyon Kodu  : 331644 - 535576 - D -  Mcc: 7230',
          statementUid: '2025002749179592',
          originString: '24.02.2025 11:11 2025002749179592 -4.300,00 29.225,98 VakıfBank   POS-Alışveriş\nReferans :02505511039392145 Term Id :01464380- ISLEM NO :0002-CROWN BEAUTY SALON     Antalya      TRTR**** SAAT :11:11:15 Provizyon Kodu \n: 331644 - 535576 - D -  Mcc: 7230\n'
        },
        {
          date: '2025-02-24T11:58:00.500',
          amount: '-3.365,99',
          balance: '25.859,99',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20062505541159762 Term Id :01981937- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :11:58:34 Provizyon  Kodu : 406508 - 0062 - D -  Mcc: 5411',
          statementUid: '2025002751757222',
          originString: '24.02.2025 11:58 2025002751757222 -3.365,99 25.859,99 Diğer  Banka  POS-Alışveriş\nReferans :20062505541159762 Term Id :01981937- ISLEM NO :    -METRO GROSMARKET-KONYAAL ANTALYA      TR**** SAAT :11:58:34 Provizyon \nKodu : 406508 - 0062 - D -  Mcc: 5411\n'
        },
        {
          date: '2025-02-24T12:02:00.500',
          amount: '-160,00',
          balance: '25.699,99',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067505512302748 Term Id :009923FF- ISLEM NO :    -SPRING COFEE             ANTALYA      TR**** SAAT :12:02:31 Provizyon Kodu :  414373 - 0067 - D -  Mcc: 5814',
          statementUid: '2025002752067247',
          originString: '24.02.2025 12:02 2025002752067247 -160,00 25.699,99 Diğer  Banka  POS-Alışveriş\nReferans :20067505512302748 Term Id :009923FF- ISLEM NO :    -SPRING COFEE             ANTALYA      TR**** SAAT :12:02:31 Provizyon Kodu : \n414373 - 0067 - D -  Mcc: 5814\n'
        },
        {
          date: '2025-02-24T12:16:00.500',
          amount: '-1.390,00',
          balance: '24.309,99',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20064505529074463 Term Id :S1859U01- ISLEM NO :    -DOYDOY KASAP             ANTALYA      TR**** SAAT :12:16:44 Provizyon Kodu :  446049 - 0064 - D -  Mcc: 5422',
          statementUid: '2025002752898684',
          originString: '24.02.2025 12:16 2025002752898684 -1.390,00 24.309,99 Diğer  Banka  POS-Alışveriş\nReferans :20064505529074463 Term Id :S1859U01- ISLEM NO :    -DOYDOY KASAP             ANTALYA      TR**** SAAT :12:16:44 Provizyon Kodu : \n446049 - 0064 - D -  Mcc: 5422\n'
        },
        {
          date: '2025-02-24T12:20:00.500',
          amount: '-960,00',
          balance: '23.349,99',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20209505512411279 Term Id :00607725- ISLEM NO :    -DRUJBA EGITIM TICARET    ANTALYA      TR**** SAAT :12:20:00 Provizyon Kodu :  453705 - 0209 - D -  Mcc: 5812',
          statementUid: '2025002752924619',
          originString: '24.02.2025 12:20 2025002752924619 -960,00 23.349,99 Diğer  Banka  POS-Alışveriş\nReferans :20209505512411279 Term Id :00607725- ISLEM NO :    -DRUJBA EGITIM TICARET    ANTALYA      TR**** SAAT :12:20:00 Provizyon Kodu : \n453705 - 0209 - D -  Mcc: 5812\n'
        },
        {
          date: '2025-02-25T11:31:00.500',
          amount: '-10.000,00',
          balance: '13.349,99',
          description1: 'ATM Withdrawal',
          description2: "S00710  şubesine   bağlı  007101 no lu KONYAALTI/ANTALYA  ŞUBESİ  ATM 'sinde 25/02/2025 11:31 tarihinde 445014111936 nolu  müşteri    00158007318398268 no lu  hesabından  TL para çekti.",
          statementUid: '2025002803456966',
          originString: "25.02.2025 11:31 2025002803456966 -10.000,00 13.349,99 ATM Withdrawal\nS00710  şubesine   bağlı  007101 no lu KONYAALTI/ANTALYA  ŞUBESİ  ATM 'sinde 25/02/2025 11:31 tarihinde 445014111936 nolu  müşteri   \n00158007318398268 no lu  hesabından  TL para çekti.\n"
        },
        {
          date: '2025-02-25T12:11:00.500',
          amount: '-1.200,00',
          balance: '12.149,99',
          description1: 'Diğer  Banka  POS-Alışveriş',
          description2: 'Referans :20067505612961061 Term Id :00B50262- ISLEM NO :    -MEHMET GOKHAN GOK        ANTALYA      TR**** SAAT :12:11:53 Provizyon Kodu :  436679 - 0067 - D -  Mcc: 5999',
          statementUid: '2025002805420958',
          originString: '25.02.2025 12:11 2025002805420958 -1.200,00 12.149,99 Diğer  Banka  POS-Alışveriş\nReferans :20067505612961061 Term Id :00B50262- ISLEM NO :    -MEHMET GOKHAN GOK        ANTALYA      TR**** SAAT :12:11:53 Provizyon Kodu : \n436679 - 0067 - D -  Mcc: 5999\n'
        },
        {
          date: '2025-02-25T12:39:00.500',
          amount: '-10.500,00',
          balance: '1.649,99',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date  (25/02/2025 and query number 1609657292 to the account Türkiye Cumhuriyeti Ziraat  Bankası   A.Ş.  Hasan Oraner)',
          statementUid: '2025002806636381',
          originString: '25.02.2025 12:39 2025002806636381 -10.500,00 1.649,99 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date  (25/02/2025 and query number 1609657292 to the account Türkiye Cumhuriyeti Ziraat \nBankası   A.Ş.  Hasan Oraner)\n'
        },
        {
          date: '2025-02-25T12:39:00.500',
          amount: '-12,80',
          balance: '1.637,19',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025002806636381',
          originString: '25.02.2025 12:39 2025002806636381 -12,80 1.637,19 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ\n'
        },
        {
          date: '2025-02-25T16:59:00.500',
          amount: '-430,00',
          balance: '1.207,19',
          description1: 'FAST Instant Payment',
          description2: 'Fast Payment from the EVGENII TIKHONOV account with the date  (25/02/2025 and query number 1610277184 to the account Türkiye Cumhuriyeti Ziraat  Bankası   A.Ş.  Hasan Oraner)',
          statementUid: '2025002820155834',
          originString: '25.02.2025 16:59 2025002820155834 -430,00 1.207,19 FAST Instant Payment\nFast Payment from the EVGENII TIKHONOV account with the date  (25/02/2025 and query number 1610277184 to the account Türkiye Cumhuriyeti Ziraat \nBankası   A.Ş.  Hasan Oraner)\n'
        },
        {
          date: '2025-02-25T16:59:00.500',
          amount: '-6,39',
          balance: '1.200,80',
          description1: 'Fee Collection',
          description2: 'FAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ',
          statementUid: '2025002820155834',
          originString: '25.02.2025 16:59 2025002820155834 -6,39 1.200,80 Fee Collection\nFAST EFT  ÜCRETİ  ve TCMB FAST  ÜCRETİ  MASRAF VE  KOMİSYON  TUTARININ 00158007318398268   HESABINDAN  TAHSİLİ'
        }
      ]
    }
  ]
])('parse pdfString to raw account with transactions', (pdfString: string, result: unknown) => {
  expect(parseSinglePdfString(pdfString)).toEqual(result)
})
