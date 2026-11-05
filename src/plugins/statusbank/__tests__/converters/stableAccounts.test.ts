// @ts-expect-error Legacy JavaScript converters have no declarations.
import * as converters from '../../converters'

const { convertAccounts } = converters as { convertAccounts: (products: unknown[]) => unknown[] }

// Complete product graphs from reports 197053 and 197054 for the same customer.
// Public fixture: natural product identifiers and the customer phone are anonymized consistently.
const cases = [
  {
    logId: 197053,
    products: [
      {
        Id: [
          '27616225-2bfc37'
        ],
        No: [
          '521000******1001'
        ],
        ProductType: [
          'MS'
        ],
        ProductTypeName: [
          'Платёжная карточка'
        ],
        PayTool: [
          'Y'
        ],
        DefaultPayTool: [
          'Y'
        ],
        Class: [
          '(к текущему счёту 300000001)'
        ],
        Expired: [
          '20310831'
        ],
        Opened: [
          '20260805'
        ],
        Currency: [
          '933'
        ],
        CurrencyAbbr: [
          'BYN'
        ],
        Balance: [
          '26,14'
        ],
        CustomName: [
          'пластиковая'
        ],
        Icon: [
          'S_M_W_NFC_CH'
        ],
        BankId: [
          'MB-000006-0004-0300000001.01'
        ],
        LinkedProductType: [
          'ACCOUNT'
        ],
        LinkedProductId: [
          '27616224-f87c51'
        ],
        Action: [
          {
            Id: [
              '28721253-a25e98-ms-1672615-setidentusername-1'
            ],
            Type: [
              'SetIdentUserName'
            ],
            Name: [
              'Имя  карты'
            ],
            Icon: [
              'Name-card-icon'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  'пластиковая'
                ],
                Id: [
                  'UserName'
                ],
                Name: [
                  'Пользовательское наименование'
                ],
                MaxLength: [
                  '50'
                ],
                Mandatory: [
                  'N'
                ]
              }
            ]
          },
          {
            Id: [
              '28721254-a5eebb-ms-1672615-b735-getproductinfo-1'
            ],
            Type: [
              'B735:GetProductInfo'
            ],
            Name: [
              'Реквизиты карты'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '28721255-20915e-ms-1672615-wsig-cardlock-2'
            ],
            Type: [
              'wsig:CardLock2'
            ],
            Name: [
              'Блокировать карточку'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '28721256-6a2529-ms-1672615-b735-viewprintformsaction-1'
            ],
            Type: [
              'B735:ViewPrintFormsAction'
            ],
            Name: [
              'Документы'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '28721257-3c0bf1-ms-1672615-b735-cardissue-2'
            ],
            Type: [
              'LossCard'
            ],
            Name: [
              'Перевыпуск карты'
            ],
            Icon: [
              'free-animated-icon-credit-card'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  'Masterсard World'
                ],
                Id: [
                  'B735$CA$ProductCode'
                ],
                Name: [
                  'Тип карточки'
                ],
                Editable: [
                  'N'
                ],
                NotMandatoryFor: [
                  {
                    Button: [
                      'Cancel'
                    ]
                  }
                ]
              }
            ],
            Info: [
              'Внимание! Карточку на физическом носителе необходимо активировать в течение 60 дней с момента оформления. При отсутствии активации карточка будет аннулирована и повторно её можно будет заказать в отделении Банка. При оплате за рубежом или в интернете (международные сервисы) возможны ограничения со стороны иностранных банков-эквайеров. Рекомендуем Вам рассмотреть возможность выпуска карточек нескольких платежных систем.<br><b>Карточка будет перевыпущена с тем же сроком действия.</b>'
            ]
          },
          {
            Id: [
              '28721258-e603b5-ms-1672615-b735-moneybackstatement-1'
            ],
            Type: [
              'B735:MoneyBackStatement'
            ],
            Name: [
              'Выписка мани-бэк'
            ],
            Icon: [
              'ManyBack-card-icon'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  '0926'
                ],
                Id: [
                  'Period'
                ],
                Name: [
                  'Период формирования выписки'
                ],
                DataType: [
                  '3'
                ],
                DataFormat: [
                  'mmyy'
                ],
                MinLength: [
                  '4'
                ],
                MaxLength: [
                  '4'
                ],
                Hint: [
                  'mmyy - две цифры(mm) месяц, две цифры(yy) год'
                ]
              }
            ]
          },
          {
            Id: [
              '28721259-3cd1e8-ms-1672615-b735-cardinformconfig-2'
            ],
            Type: [
              'B735_CardInformConfig2'
            ],
            Name: [
              'SMS/PUSH'
            ],
            FullName: [
              'SMS-ОПОВЕЩЕНИЕ /  PUSH-УВЕДОМЛЕНИЕ'
            ],
            Options: [
              '0'
            ],
            Parameter: [
              {
                Value: [
                  'N'
                ],
                Id: [
                  'PushInfo'
                ],
                Name: [
                  'Push - уведомление'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ],
                Hint: [
                  '<p><span style="color: red;">Услуга БЕСПЛАТНАЯ.</span></p><br> <p align="justify"> <a href=https://stbank.by/upload/iblock/fe7/st0c3lpsx2hstok0v6aeimd6of4angbl/DKBO-ot-07.11.2025..pdf>Условия оказания услуги «Push-уведомление»</a>  </p><p><span style="color: red;">Работает на Мобильном приложении</span></p><br> <p align="justify">'
                ]
              },
              {
                Value: [
                  'N'
                ],
                Id: [
                  'PhoneInfo'
                ],
                Name: [
                  'SMS - оповещение'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ],
                Hint: [
                  '</p><p><span style="color: red;">Стоимость услуги:</span></p>  номер мобильного оператора РБ: <b>3,99</b> руб./мес.<br> иные номера: <b>49</b> руб./мес.<br><br> <p align="justify"><a href=https://stbank.by/upload/iblock/fe7/st0c3lpsx2hstok0v6aeimd6of4angbl/DKBO-ot-07.11.2025..pdf> Условия оказания услуги «SMS-оповещение»  </a>   <br><br>Вводом  сеансового пароля я подтверждаю, что ознакомлен с Размерами плат и согласен на подключение услуги. Номер +<b>79000000001</b>.'
                ]
              }
            ],
            Info: [
              '<p align="center">Выберите удобный способ получения уведомлений по вашей карте</p>'
            ],
            Buttons: [
              {
                Button: [
                  {
                    _: 'OK',
                    Name: [
                      'Подтверждаю'
                    ],
                    Default: [
                      'Y'
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '28721260-916b89-ms-1672615-group-ms-3-1'
            ],
            Type: [
              'Group$MS$3'
            ],
            Name: [
              'Перевод / Пополнение'
            ],
            FullName: [
              'Перевод / Пополнение'
            ],
            Options: [
              '5'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '14733',
                        Name: [
                          'Перевод по № телефона'
                        ],
                        Hint: [
                          'При переводе по номеру телефона перевод осуществляется на карту ОАО "СтатусБанк" другого клиента, установленную клиентом-владельцем номера телефона как "Платежное средство по умолчанию".<br>Номер телефона клиента, на карту которого осуществляется перевод, следует набирать в полном формате, без пробелов, разделителей и знака "+".<br>Например: 375251234567.<br><br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам будет осуществлено не позднее следующего банковского дня'
                        ]
                      },
                      {
                        _: '13481',
                        Name: [
                          'Перевод по № карты'
                        ],
                        Hint: [
                          '<br>Перевод с карты ОАО "СтатусБанк" на другую карту ОАО "СтатусБанк".<br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам будет осуществлено не позднее следующего банковского дня'
                        ]
                      },
                      {
                        _: '13482',
                        Name: [
                          'Пополнить эту карту'
                        ],
                        Hint: [
                          'Выберите из выпадающего списка свою карточку ОАО "СтатусБанк" или сохраненную карточку иного банка РБ, с которой хотите перевести деньги, либо вручную укажите номер своей карточки, выпущенной иным банком РБ. <br><br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам, открытым  в ОАО "СтатусБанк" будет осуществлено не позднее банковского дня, следующего за днем получения ОАО "СтатусБанк" от процессингового центра информации, необходимой для отражения операции'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '28721261-59e67f-ms-1672615-group-ms-2-1'
            ],
            Type: [
              'Group$MS$2'
            ],
            Name: [
              'Действия с карточкой'
            ],
            FullName: [
              'Действия с карточкой'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '14723',
                        Name: [
                          'Повторно получить ПИН-код'
                        ]
                      },
                      {
                        _: '13489',
                        Name: [
                          'Лимиты по карточке'
                        ]
                      },
                      {
                        _: '13493',
                        Name: [
                          'Приоритет автооплаты'
                        ],
                        Hint: [
                          'Укажите значение в цифрах для установления очередности участия карточки в автооплате (например, 1)'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '28721262-667d74-ms-1672615-group-ms-4-1'
            ],
            Type: [
              'Group$MS$4'
            ],
            Name: [
              'Информация об операциях'
            ],
            FullName: [
              'Информация об операциях'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '13485',
                        Name: [
                          'Выписка по карте'
                        ],
                        Hint: [
                          'Окончание периода не может быть позже предыдущего банковского дня'
                        ]
                      },
                      {
                        _: '13486',
                        Name: [
                          'Последние операции'
                        ]
                      },
                      {
                        _: '13487',
                        Name: [
                          'Заблокированные суммы'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        Id: [
          '27616226-6fbdac'
        ],
        No: [
          '521000******1002'
        ],
        ProductType: [
          'MS'
        ],
        ProductTypeName: [
          'Платёжная карточка'
        ],
        PayTool: [
          'Y'
        ],
        Class: [
          '(к текущему счёту 300000001)'
        ],
        Expired: [
          '20310731'
        ],
        Opened: [
          '20260805'
        ],
        Currency: [
          '933'
        ],
        CurrencyAbbr: [
          'BYN'
        ],
        Balance: [
          '26,14'
        ],
        CustomName: [
          'виртуальная'
        ],
        Icon: [
          'MC_Crypto_Virt'
        ],
        BankId: [
          'MB-000006-0004-0300000001'
        ],
        LinkedProductType: [
          'ACCOUNT'
        ],
        LinkedProductId: [
          '27616224-f87c51'
        ],
        Action: [
          {
            Id: [
              '28721263-710bf9-ms-1672601-setdefaultpayident-1'
            ],
            Type: [
              'SetDefaultPayIdent'
            ],
            Name: [
              'Назначить платёжным средством по умолчанию'
            ],
            FullName: [
              'Карточка по умолчанию'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '28721264-3bbc62-ms-1672601-setidentusername-1'
            ],
            Type: [
              'SetIdentUserName'
            ],
            Name: [
              'Имя  карты'
            ],
            Icon: [
              'Name-card-icon'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  'виртуальная'
                ],
                Id: [
                  'UserName'
                ],
                Name: [
                  'Пользовательское наименование'
                ],
                MaxLength: [
                  '50'
                ],
                Mandatory: [
                  'N'
                ]
              }
            ]
          },
          {
            Id: [
              '28721265-42b4d2-ms-1672601-b735-getproductinfo-1'
            ],
            Type: [
              'B735:GetProductInfo'
            ],
            Name: [
              'Реквизиты карты'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '28721266-fde2c0-ms-1672601-wsig-cardlock-2'
            ],
            Type: [
              'wsig:CardLock2'
            ],
            Name: [
              'Блокировать карточку'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '28721267-bf1f90-ms-1672601-b735-viewprintformsaction-1'
            ],
            Type: [
              'B735:ViewPrintFormsAction'
            ],
            Name: [
              'Документы'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '28721268-8760c4-ms-1672601-b735-cardissue-2'
            ],
            Type: [
              'LossCard'
            ],
            Name: [
              'Перевыпуск карты'
            ],
            Icon: [
              'free-animated-icon-credit-card'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  'Masterсard World'
                ],
                Id: [
                  'B735$CA$ProductCode'
                ],
                Name: [
                  'Тип карточки'
                ],
                Editable: [
                  'N'
                ],
                NotMandatoryFor: [
                  {
                    Button: [
                      'Cancel'
                    ]
                  }
                ]
              }
            ],
            Info: [
              'Внимание! Карточку на физическом носителе необходимо активировать в течение 60 дней с момента оформления. При отсутствии активации карточка будет аннулирована и повторно её можно будет заказать в отделении Банка. При оплате за рубежом или в интернете (международные сервисы) возможны ограничения со стороны иностранных банков-эквайеров. Рекомендуем Вам рассмотреть возможность выпуска карточек нескольких платежных систем.<br><b>Карточка будет перевыпущена с тем же сроком действия.</b>'
            ]
          },
          {
            Id: [
              '28721269-bf0f38-ms-1672601-b735-cardinformconfig-2'
            ],
            Type: [
              'B735_CardInformConfig2'
            ],
            Name: [
              'SMS/PUSH'
            ],
            FullName: [
              'SMS-ОПОВЕЩЕНИЕ /  PUSH-УВЕДОМЛЕНИЕ'
            ],
            Options: [
              '0'
            ],
            Parameter: [
              {
                Value: [
                  'N'
                ],
                Id: [
                  'PushInfo'
                ],
                Name: [
                  'Push - уведомление'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ],
                Hint: [
                  '<p><span style="color: red;">Услуга БЕСПЛАТНАЯ.</span></p><br> <p align="justify"> <a href=https://stbank.by/upload/iblock/fe7/st0c3lpsx2hstok0v6aeimd6of4angbl/DKBO-ot-07.11.2025..pdf>Условия оказания услуги «Push-уведомление»</a>  </p><p><span style="color: red;">Работает на Мобильном приложении</span></p><br> <p align="justify">'
                ]
              },
              {
                Value: [
                  'N'
                ],
                Id: [
                  'PhoneInfo'
                ],
                Name: [
                  'SMS - оповещение'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ],
                Hint: [
                  '</p><p><span style="color: red;">Стоимость услуги:</span></p>  номер мобильного оператора РБ: <b>3,99</b> руб./мес.<br> иные номера: <b>49</b> руб./мес.<br><br> <p align="justify"><a href=https://stbank.by/upload/iblock/fe7/st0c3lpsx2hstok0v6aeimd6of4angbl/DKBO-ot-07.11.2025..pdf> Условия оказания услуги «SMS-оповещение»  </a>   <br><br>Вводом  сеансового пароля я подтверждаю, что ознакомлен с Размерами плат и согласен на подключение услуги. Номер +<b>79000000001</b>.'
                ]
              }
            ],
            Info: [
              '<p align="center">Выберите удобный способ получения уведомлений по вашей карте</p>'
            ],
            Buttons: [
              {
                Button: [
                  {
                    _: 'OK',
                    Name: [
                      'Подтверждаю'
                    ],
                    Default: [
                      'Y'
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '28721270-bac87c-ms-1672601-group-ms-3-1'
            ],
            Type: [
              'Group$MS$3'
            ],
            Name: [
              'Перевод / Пополнение'
            ],
            FullName: [
              'Перевод / Пополнение'
            ],
            Options: [
              '5'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '14733',
                        Name: [
                          'Перевод по № телефона'
                        ],
                        Hint: [
                          'При переводе по номеру телефона перевод осуществляется на карту ОАО "СтатусБанк" другого клиента, установленную клиентом-владельцем номера телефона как "Платежное средство по умолчанию".<br>Номер телефона клиента, на карту которого осуществляется перевод, следует набирать в полном формате, без пробелов, разделителей и знака "+".<br>Например: 375251234567.<br><br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам будет осуществлено не позднее следующего банковского дня'
                        ]
                      },
                      {
                        _: '13481',
                        Name: [
                          'Перевод по № карты'
                        ],
                        Hint: [
                          '<br>Перевод с карты ОАО "СтатусБанк" на другую карту ОАО "СтатусБанк".<br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам будет осуществлено не позднее следующего банковского дня'
                        ]
                      },
                      {
                        _: '13482',
                        Name: [
                          'Пополнить эту карту'
                        ],
                        Hint: [
                          'Выберите из выпадающего списка свою карточку ОАО "СтатусБанк" или сохраненную карточку иного банка РБ, с которой хотите перевести деньги, либо вручную укажите номер своей карточки, выпущенной иным банком РБ. <br><br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам, открытым  в ОАО "СтатусБанк" будет осуществлено не позднее банковского дня, следующего за днем получения ОАО "СтатусБанк" от процессингового центра информации, необходимой для отражения операции'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '28721271-0e4e9d-ms-1672601-group-ms-2-1'
            ],
            Type: [
              'Group$MS$2'
            ],
            Name: [
              'Действия с карточкой'
            ],
            FullName: [
              'Действия с карточкой'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '14723',
                        Name: [
                          'Повторно получить ПИН-код'
                        ]
                      },
                      {
                        _: '13489',
                        Name: [
                          'Лимиты по карточке'
                        ]
                      },
                      {
                        _: '13493',
                        Name: [
                          'Приоритет автооплаты'
                        ],
                        Hint: [
                          'Укажите значение в цифрах для установления очередности участия карточки в автооплате (например, 1)'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '28721272-1dde96-ms-1672601-group-ms-4-1'
            ],
            Type: [
              'Group$MS$4'
            ],
            Name: [
              'Информация об операциях'
            ],
            FullName: [
              'Информация об операциях'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '13485',
                        Name: [
                          'Выписка по карте'
                        ],
                        Hint: [
                          'Окончание периода не может быть позже предыдущего банковского дня'
                        ]
                      },
                      {
                        _: '13486',
                        Name: [
                          'Последние операции'
                        ]
                      },
                      {
                        _: '13487',
                        Name: [
                          'Заблокированные суммы'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '28721273-8e3542-ms-1672601-group-ms-5-1'
            ],
            Type: [
              'Group$MS$5'
            ],
            Name: [
              'Посмотреть реквизиты карточки'
            ],
            FullName: [
              'Посмотреть реквизиты карточки'
            ],
            Options: [
              '5'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '58919',
                        Name: [
                          'Получить CVV-код'
                        ],
                        Hint: [
                          'СМС-сообщение с CVV-кодом будет отправлено на Ваш номер мобильного телефона'
                        ]
                      },
                      {
                        _: '58921',
                        Name: [
                          'Посмотреть полный номер карточки'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        Id: [
          '27616224-f87c51'
        ],
        No: [
          'договор N 300000001'
        ],
        ProductType: [
          'ACCOUNT'
        ],
        ProductTypeName: [
          'Счёт с картой'
        ],
        DefaultCreditTool: [
          'Y'
        ],
        Subclass: [
          'карточки 521000******1002, 521000******1001'
        ],
        Opened: [
          '20260805'
        ],
        Currency: [
          '933'
        ],
        CurrencyAbbr: [
          'BYN'
        ],
        Balance: [
          '26,14'
        ],
        Icon: [
          'ACCOUNT'
        ],
        BankId: [
          '300000001'
        ],
        Extra: [
          {
            Cards: [
              {
                CardDetails: [
                  {
                    Id: [
                      '1672615'
                    ],
                    Icon: [
                      'S_M_W_NFC_CH'
                    ],
                    Name: [
                      'пластиковая'
                    ],
                    Last4Digits: [
                      '4261'
                    ],
                    PaymentSystem: [
                      'Masterсard World'
                    ],
                    ValidTo: [
                      '31-AUG-31'
                    ],
                    Currency: [
                      'BYN'
                    ]
                  },
                  {
                    Id: [
                      '1672601'
                    ],
                    Icon: [
                      'MC_Crypto_Virt'
                    ],
                    Name: [
                      'виртуальная'
                    ],
                    Last4Digits: [
                      '4331'
                    ],
                    PaymentSystem: [
                      'Masterсard World'
                    ],
                    ValidTo: [
                      '31-JUL-31'
                    ],
                    Currency: [
                      'BYN'
                    ]
                  }
                ]
              }
            ]
          }
        ],
        Action: [
          {
            Id: [
              '28721274-511ada-account-1672600-setidentusername-2'
            ],
            Type: [
              'SetIdentUserName2'
            ],
            Name: [
              'Переименовать'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'UserName'
                ],
                Name: [
                  'Пользовательское наименование'
                ],
                MaxLength: [
                  '50'
                ],
                Mandatory: [
                  'N'
                ]
              }
            ]
          },
          {
            Id: [
              '28721275-e64c97-account-1672600-b735-getproductinfo-1'
            ],
            Type: [
              'B735:GetProductInfo'
            ],
            Name: [
              'Реквизиты счета'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '28721276-d7ae71-account-1672600-b735-cardissue-2'
            ],
            Type: [
              'B735:CardIssue2'
            ],
            Name: [
              'Выпустить доп. карточку'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'B735$CA$ProductCode'
                ],
                Name: [
                  'Тип карточки'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: 'MPMDZBYC',
                        Name: [
                          'Masterсard World'
                        ]
                      },
                      {
                        _: 'VPGDZBYC',
                        Name: [
                          'Visa Gold'
                        ]
                      }
                    ]
                  }
                ],
                NotMandatoryFor: [
                  {
                    Button: [
                      'Cancel'
                    ]
                  }
                ]
              }
            ],
            Info: [
              'Внимание! Карточку на физическом носителе необходимо активировать в течение 60 дней с момента оформления. При отсутствии активации карточка будет аннулирована и повторно её можно будет заказать в отделении Банка. При оплате за рубежом или в интернете (международные сервисы) возможны ограничения со стороны иностранных банков-эквайеров. Рекомендуем Вам рассмотреть возможность выпуска карточек нескольких платежных систем.'
            ]
          },
          {
            Id: [
              '28721277-6f6224-account-1672600-b735-getordering-1'
            ],
            Type: [
              'B735:GetOrdering'
            ],
            Name: [
              'Выписка по счёту'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  '27.09.2026'
                ],
                Id: [
                  'DateFrom'
                ],
                Name: [
                  'Начало периода'
                ],
                DataType: [
                  '3'
                ],
                DataFormat: [
                  'dd.mm.yyyy'
                ],
                MinLength: [
                  '10'
                ],
                MaxLength: [
                  '10'
                ]
              },
              {
                Value: [
                  '27.10.2026'
                ],
                Id: [
                  'DateTo'
                ],
                Name: [
                  'Окончание периода'
                ],
                DataType: [
                  '3'
                ],
                DataFormat: [
                  'dd.mm.yyyy'
                ],
                MaxValue: [
                  '27.10.2026'
                ],
                MinLength: [
                  '10'
                ],
                MaxLength: [
                  '10'
                ]
              },
              {
                Value: [
                  'N'
                ],
                Id: [
                  'B735$OpenNewWindow'
                ],
                Name: [
                  'Открывать в новом окне?'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ]
              }
            ],
            Info: [
              'Окончание периода не может быть позже предыдущего банковского дня'
            ]
          },
          {
            Id: [
              '28721278-3f8e22-account-1672600-b735-accounttransfer-1'
            ],
            Type: [
              'B735:AccountTransfer'
            ],
            Name: [
              'Пополнить этот счёт'
            ],
            FullName: [
              'для бел рублей'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '28721279-d3d2d4-account-1672600-b735-viewprintformsaction-1'
            ],
            Type: [
              'B735:ViewPrintFormsAction'
            ],
            Name: [
              'Документы'
            ],
            FullName: [
              'Документы, подписанные в электронном виде'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '28721280-06d30d-account-1672600-b735-accountclose-1'
            ],
            Type: [
              'B735:AccountClose'
            ],
            Name: [
              'Закрыть счёт'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '28721281-02e256-account-1672600-unsetdefaultcredittool-1'
            ],
            Type: [
              'UnSetDefaultCreditTool'
            ],
            Name: [
              'Пополнение по номеру телефона (отключить )'
            ],
            Options: [
              '0'
            ]
          }
        ]
      }
    ],
    expected: [
      {
        id: 'MB-000006-0004-0300000001.01',
        type: 'card',
        title: 'Платёжная карточка*1001',
        currencyCode: '933',
        cardNumber: '521000******1001',
        instrument: 'BYN',
        balance: 26.14,
        syncID: [
          '1001'
        ],
        productId: '27616225-2bfc37',
        productType: 'MS'
      },
      {
        id: 'MB-000006-0004-0300000001',
        type: 'card',
        title: 'Платёжная карточка*1002',
        currencyCode: '933',
        cardNumber: '521000******1002',
        instrument: 'BYN',
        balance: 26.14,
        syncID: [
          '1002'
        ],
        productId: '27616226-6fbdac',
        productType: 'MS'
      }
    ]
  },
  {
    logId: 197054,
    products: [
      {
        Id: [
          '14447090-c5737f'
        ],
        No: [
          '521000******1001'
        ],
        ProductType: [
          'MS'
        ],
        ProductTypeName: [
          'Платёжная карточка'
        ],
        PayTool: [
          'Y'
        ],
        DefaultPayTool: [
          'Y'
        ],
        Class: [
          '(к текущему счёту 300000001)'
        ],
        Expired: [
          '20310831'
        ],
        Opened: [
          '20260805'
        ],
        Currency: [
          '933'
        ],
        CurrencyAbbr: [
          'BYN'
        ],
        Balance: [
          '26,03'
        ],
        CustomName: [
          'пластиковая'
        ],
        Icon: [
          'S_M_W_NFC_CH'
        ],
        BankId: [
          'MB-000006-0004-0300000001.01'
        ],
        LinkedProductType: [
          'ACCOUNT'
        ],
        LinkedProductId: [
          '14447091-ed706a'
        ],
        Action: [
          {
            Id: [
              '14447080-6aab7c-ms-1672615-setidentusername-1'
            ],
            Type: [
              'SetIdentUserName'
            ],
            Name: [
              'Имя  карты'
            ],
            Icon: [
              'Name-card-icon'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  'пластиковая'
                ],
                Id: [
                  'UserName'
                ],
                Name: [
                  'Пользовательское наименование'
                ],
                MaxLength: [
                  '50'
                ],
                Mandatory: [
                  'N'
                ]
              }
            ]
          },
          {
            Id: [
              '14447081-bd986d-ms-1672615-b735-getproductinfo-1'
            ],
            Type: [
              'B735:GetProductInfo'
            ],
            Name: [
              'Реквизиты карты'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '14447082-162dec-ms-1672615-wsig-cardlock-2'
            ],
            Type: [
              'wsig:CardLock2'
            ],
            Name: [
              'Блокировать карточку'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '14447083-de0f31-ms-1672615-b735-viewprintformsaction-1'
            ],
            Type: [
              'B735:ViewPrintFormsAction'
            ],
            Name: [
              'Документы'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '14447084-8a2694-ms-1672615-b735-cardissue-2'
            ],
            Type: [
              'LossCard'
            ],
            Name: [
              'Перевыпуск карты'
            ],
            Icon: [
              'free-animated-icon-credit-card'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  'Masterсard World'
                ],
                Id: [
                  'B735$CA$ProductCode'
                ],
                Name: [
                  'Тип карточки'
                ],
                Editable: [
                  'N'
                ],
                NotMandatoryFor: [
                  {
                    Button: [
                      'Cancel'
                    ]
                  }
                ]
              }
            ],
            Info: [
              'Внимание! Карточку на физическом носителе необходимо активировать в течение 60 дней с момента оформления. При отсутствии активации карточка будет аннулирована и повторно её можно будет заказать в отделении Банка. При оплате за рубежом или в интернете (международные сервисы) возможны ограничения со стороны иностранных банков-эквайеров. Рекомендуем Вам рассмотреть возможность выпуска карточек нескольких платежных систем.<br><b>Карточка будет перевыпущена с тем же сроком действия.</b>'
            ]
          },
          {
            Id: [
              '14447085-c133b1-ms-1672615-b735-moneybackstatement-1'
            ],
            Type: [
              'B735:MoneyBackStatement'
            ],
            Name: [
              'Выписка мани-бэк'
            ],
            Icon: [
              'ManyBack-card-icon'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  '0926'
                ],
                Id: [
                  'Period'
                ],
                Name: [
                  'Период формирования выписки'
                ],
                DataType: [
                  '3'
                ],
                DataFormat: [
                  'mmyy'
                ],
                MinLength: [
                  '4'
                ],
                MaxLength: [
                  '4'
                ],
                Hint: [
                  'mmyy - две цифры(mm) месяц, две цифры(yy) год'
                ]
              }
            ]
          },
          {
            Id: [
              '14447086-daf65c-ms-1672615-b735-cardinformconfig-2'
            ],
            Type: [
              'B735_CardInformConfig2'
            ],
            Name: [
              'SMS/PUSH'
            ],
            FullName: [
              'SMS-ОПОВЕЩЕНИЕ /  PUSH-УВЕДОМЛЕНИЕ'
            ],
            Options: [
              '0'
            ],
            Parameter: [
              {
                Value: [
                  'N'
                ],
                Id: [
                  'PushInfo'
                ],
                Name: [
                  'Push - уведомление'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ],
                Hint: [
                  '<p><span style="color: red;">Услуга БЕСПЛАТНАЯ.</span></p><br> <p align="justify"> <a href=https://stbank.by/upload/iblock/fe7/st0c3lpsx2hstok0v6aeimd6of4angbl/DKBO-ot-07.11.2025..pdf>Условия оказания услуги «Push-уведомление»</a>  </p><p><span style="color: red;">Работает на Мобильном приложении</span></p><br> <p align="justify">'
                ]
              },
              {
                Value: [
                  'N'
                ],
                Id: [
                  'PhoneInfo'
                ],
                Name: [
                  'SMS - оповещение'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ],
                Hint: [
                  '</p><p><span style="color: red;">Стоимость услуги:</span></p>  номер мобильного оператора РБ: <b>3,99</b> руб./мес.<br> иные номера: <b>49</b> руб./мес.<br><br> <p align="justify"><a href=https://stbank.by/upload/iblock/fe7/st0c3lpsx2hstok0v6aeimd6of4angbl/DKBO-ot-07.11.2025..pdf> Условия оказания услуги «SMS-оповещение»  </a>   <br><br>Вводом  сеансового пароля я подтверждаю, что ознакомлен с Размерами плат и согласен на подключение услуги. Номер +<b>79000000001</b>.'
                ]
              }
            ],
            Info: [
              '<p align="center">Выберите удобный способ получения уведомлений по вашей карте</p>'
            ],
            Buttons: [
              {
                Button: [
                  {
                    _: 'OK',
                    Name: [
                      'Подтверждаю'
                    ],
                    Default: [
                      'Y'
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '14447087-3b7603-ms-1672615-group-ms-3-1'
            ],
            Type: [
              'Group$MS$3'
            ],
            Name: [
              'Перевод / Пополнение'
            ],
            FullName: [
              'Перевод / Пополнение'
            ],
            Options: [
              '5'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '14733',
                        Name: [
                          'Перевод по № телефона'
                        ],
                        Hint: [
                          'При переводе по номеру телефона перевод осуществляется на карту ОАО "СтатусБанк" другого клиента, установленную клиентом-владельцем номера телефона как "Платежное средство по умолчанию".<br>Номер телефона клиента, на карту которого осуществляется перевод, следует набирать в полном формате, без пробелов, разделителей и знака "+".<br>Например: 375251234567.<br><br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам будет осуществлено не позднее следующего банковского дня'
                        ]
                      },
                      {
                        _: '13481',
                        Name: [
                          'Перевод по № карты'
                        ],
                        Hint: [
                          '<br>Перевод с карты ОАО "СтатусБанк" на другую карту ОАО "СтатусБанк".<br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам будет осуществлено не позднее следующего банковского дня'
                        ]
                      },
                      {
                        _: '13482',
                        Name: [
                          'Пополнить эту карту'
                        ],
                        Hint: [
                          'Выберите из выпадающего списка свою карточку ОАО "СтатусБанк" или сохраненную карточку иного банка РБ, с которой хотите перевести деньги, либо вручную укажите номер своей карточки, выпущенной иным банком РБ. <br><br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам, открытым  в ОАО "СтатусБанк" будет осуществлено не позднее банковского дня, следующего за днем получения ОАО "СтатусБанк" от процессингового центра информации, необходимой для отражения операции'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '14447088-16f53c-ms-1672615-group-ms-2-1'
            ],
            Type: [
              'Group$MS$2'
            ],
            Name: [
              'Действия с карточкой'
            ],
            FullName: [
              'Действия с карточкой'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '14723',
                        Name: [
                          'Повторно получить ПИН-код'
                        ]
                      },
                      {
                        _: '13489',
                        Name: [
                          'Лимиты по карточке'
                        ]
                      },
                      {
                        _: '13493',
                        Name: [
                          'Приоритет автооплаты'
                        ],
                        Hint: [
                          'Укажите значение в цифрах для установления очередности участия карточки в автооплате (например, 1)'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '14447089-a0056c-ms-1672615-group-ms-4-1'
            ],
            Type: [
              'Group$MS$4'
            ],
            Name: [
              'Информация об операциях'
            ],
            FullName: [
              'Информация об операциях'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '13485',
                        Name: [
                          'Выписка по карте'
                        ],
                        Hint: [
                          'Окончание периода не может быть позже предыдущего банковского дня'
                        ]
                      },
                      {
                        _: '13486',
                        Name: [
                          'Последние операции'
                        ]
                      },
                      {
                        _: '13487',
                        Name: [
                          'Заблокированные суммы'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        Id: [
          '14447104-00aa1c'
        ],
        No: [
          '521000******1002'
        ],
        ProductType: [
          'MS'
        ],
        ProductTypeName: [
          'Платёжная карточка'
        ],
        PayTool: [
          'Y'
        ],
        Class: [
          '(к текущему счёту 300000001)'
        ],
        Expired: [
          '20310731'
        ],
        Opened: [
          '20260805'
        ],
        Currency: [
          '933'
        ],
        CurrencyAbbr: [
          'BYN'
        ],
        Balance: [
          '26,03'
        ],
        CustomName: [
          'виртуальная'
        ],
        Icon: [
          'MC_Crypto_Virt'
        ],
        BankId: [
          'MB-000006-0004-0300000001'
        ],
        LinkedProductType: [
          'ACCOUNT'
        ],
        LinkedProductId: [
          '14447091-ed706a'
        ],
        Action: [
          {
            Id: [
              '14447093-a857c6-ms-1672601-setdefaultpayident-1'
            ],
            Type: [
              'SetDefaultPayIdent'
            ],
            Name: [
              'Назначить платёжным средством по умолчанию'
            ],
            FullName: [
              'Карточка по умолчанию'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '14447094-e4a377-ms-1672601-setidentusername-1'
            ],
            Type: [
              'SetIdentUserName'
            ],
            Name: [
              'Имя  карты'
            ],
            Icon: [
              'Name-card-icon'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  'виртуальная'
                ],
                Id: [
                  'UserName'
                ],
                Name: [
                  'Пользовательское наименование'
                ],
                MaxLength: [
                  '50'
                ],
                Mandatory: [
                  'N'
                ]
              }
            ]
          },
          {
            Id: [
              '14447095-67dfe1-ms-1672601-b735-getproductinfo-1'
            ],
            Type: [
              'B735:GetProductInfo'
            ],
            Name: [
              'Реквизиты карты'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '14447096-e1071f-ms-1672601-wsig-cardlock-2'
            ],
            Type: [
              'wsig:CardLock2'
            ],
            Name: [
              'Блокировать карточку'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '14447097-43e435-ms-1672601-b735-viewprintformsaction-1'
            ],
            Type: [
              'B735:ViewPrintFormsAction'
            ],
            Name: [
              'Документы'
            ],
            Options: [
              '0'
            ]
          },
          {
            Id: [
              '14447098-0c9120-ms-1672601-b735-cardissue-2'
            ],
            Type: [
              'LossCard'
            ],
            Name: [
              'Перевыпуск карты'
            ],
            Icon: [
              'free-animated-icon-credit-card'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  'Masterсard World'
                ],
                Id: [
                  'B735$CA$ProductCode'
                ],
                Name: [
                  'Тип карточки'
                ],
                Editable: [
                  'N'
                ],
                NotMandatoryFor: [
                  {
                    Button: [
                      'Cancel'
                    ]
                  }
                ]
              }
            ],
            Info: [
              'Внимание! Карточку на физическом носителе необходимо активировать в течение 60 дней с момента оформления. При отсутствии активации карточка будет аннулирована и повторно её можно будет заказать в отделении Банка. При оплате за рубежом или в интернете (международные сервисы) возможны ограничения со стороны иностранных банков-эквайеров. Рекомендуем Вам рассмотреть возможность выпуска карточек нескольких платежных систем.<br><b>Карточка будет перевыпущена с тем же сроком действия.</b>'
            ]
          },
          {
            Id: [
              '14447099-385634-ms-1672601-b735-cardinformconfig-2'
            ],
            Type: [
              'B735_CardInformConfig2'
            ],
            Name: [
              'SMS/PUSH'
            ],
            FullName: [
              'SMS-ОПОВЕЩЕНИЕ /  PUSH-УВЕДОМЛЕНИЕ'
            ],
            Options: [
              '0'
            ],
            Parameter: [
              {
                Value: [
                  'N'
                ],
                Id: [
                  'PushInfo'
                ],
                Name: [
                  'Push - уведомление'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ],
                Hint: [
                  '<p><span style="color: red;">Услуга БЕСПЛАТНАЯ.</span></p><br> <p align="justify"> <a href=https://stbank.by/upload/iblock/fe7/st0c3lpsx2hstok0v6aeimd6of4angbl/DKBO-ot-07.11.2025..pdf>Условия оказания услуги «Push-уведомление»</a>  </p><p><span style="color: red;">Работает на Мобильном приложении</span></p><br> <p align="justify">'
                ]
              },
              {
                Value: [
                  'N'
                ],
                Id: [
                  'PhoneInfo'
                ],
                Name: [
                  'SMS - оповещение'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ],
                Hint: [
                  '</p><p><span style="color: red;">Стоимость услуги:</span></p>  номер мобильного оператора РБ: <b>3,99</b> руб./мес.<br> иные номера: <b>49</b> руб./мес.<br><br> <p align="justify"><a href=https://stbank.by/upload/iblock/fe7/st0c3lpsx2hstok0v6aeimd6of4angbl/DKBO-ot-07.11.2025..pdf> Условия оказания услуги «SMS-оповещение»  </a>   <br><br>Вводом  сеансового пароля я подтверждаю, что ознакомлен с Размерами плат и согласен на подключение услуги. Номер +<b>79000000001</b>.'
                ]
              }
            ],
            Info: [
              '<p align="center">Выберите удобный способ получения уведомлений по вашей карте</p>'
            ],
            Buttons: [
              {
                Button: [
                  {
                    _: 'OK',
                    Name: [
                      'Подтверждаю'
                    ],
                    Default: [
                      'Y'
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '14447100-25a6f4-ms-1672601-group-ms-3-1'
            ],
            Type: [
              'Group$MS$3'
            ],
            Name: [
              'Перевод / Пополнение'
            ],
            FullName: [
              'Перевод / Пополнение'
            ],
            Options: [
              '5'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '14733',
                        Name: [
                          'Перевод по № телефона'
                        ],
                        Hint: [
                          'При переводе по номеру телефона перевод осуществляется на карту ОАО "СтатусБанк" другого клиента, установленную клиентом-владельцем номера телефона как "Платежное средство по умолчанию".<br>Номер телефона клиента, на карту которого осуществляется перевод, следует набирать в полном формате, без пробелов, разделителей и знака "+".<br>Например: 375251234567.<br><br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам будет осуществлено не позднее следующего банковского дня'
                        ]
                      },
                      {
                        _: '13481',
                        Name: [
                          'Перевод по № карты'
                        ],
                        Hint: [
                          '<br>Перевод с карты ОАО "СтатусБанк" на другую карту ОАО "СтатусБанк".<br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам будет осуществлено не позднее следующего банковского дня'
                        ]
                      },
                      {
                        _: '13482',
                        Name: [
                          'Пополнить эту карту'
                        ],
                        Hint: [
                          'Выберите из выпадающего списка свою карточку ОАО "СтатусБанк" или сохраненную карточку иного банка РБ, с которой хотите перевести деньги, либо вручную укажите номер своей карточки, выпущенной иным банком РБ. <br><br>Доступные суммы по картам (балансы) будут изменены сразу, отражение операции по текущим счетам, открытым  в ОАО "СтатусБанк" будет осуществлено не позднее банковского дня, следующего за днем получения ОАО "СтатусБанк" от процессингового центра информации, необходимой для отражения операции'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '14447101-7f65cc-ms-1672601-group-ms-2-1'
            ],
            Type: [
              'Group$MS$2'
            ],
            Name: [
              'Действия с карточкой'
            ],
            FullName: [
              'Действия с карточкой'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '14723',
                        Name: [
                          'Повторно получить ПИН-код'
                        ]
                      },
                      {
                        _: '13489',
                        Name: [
                          'Лимиты по карточке'
                        ]
                      },
                      {
                        _: '13493',
                        Name: [
                          'Приоритет автооплаты'
                        ],
                        Hint: [
                          'Укажите значение в цифрах для установления очередности участия карточки в автооплате (например, 1)'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '14447102-1a2046-ms-1672601-group-ms-4-1'
            ],
            Type: [
              'Group$MS$4'
            ],
            Name: [
              'Информация об операциях'
            ],
            FullName: [
              'Информация об операциях'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '13485',
                        Name: [
                          'Выписка по карте'
                        ],
                        Hint: [
                          'Окончание периода не может быть позже предыдущего банковского дня'
                        ]
                      },
                      {
                        _: '13486',
                        Name: [
                          'Последние операции'
                        ]
                      },
                      {
                        _: '13487',
                        Name: [
                          'Заблокированные суммы'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            Id: [
              '14447103-a951c8-ms-1672601-group-ms-5-1'
            ],
            Type: [
              'Group$MS$5'
            ],
            Name: [
              'Посмотреть реквизиты карточки'
            ],
            FullName: [
              'Посмотреть реквизиты карточки'
            ],
            Options: [
              '5'
            ],
            Parameter: [
              {
                Id: [
                  'SubActionId'
                ],
                Name: [
                  'Действие'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: '58919',
                        Name: [
                          'Получить CVV-код'
                        ],
                        Hint: [
                          'СМС-сообщение с CVV-кодом будет отправлено на Ваш номер мобильного телефона'
                        ]
                      },
                      {
                        _: '58921',
                        Name: [
                          'Посмотреть полный номер карточки'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        Id: [
          '14447091-ed706a'
        ],
        No: [
          'договор N 300000001'
        ],
        ProductType: [
          'ACCOUNT'
        ],
        ProductTypeName: [
          'Счёт с картой'
        ],
        DefaultCreditTool: [
          'Y'
        ],
        Subclass: [
          'карточки 521000******1002, 521000******1001'
        ],
        Opened: [
          '20260805'
        ],
        Currency: [
          '933'
        ],
        CurrencyAbbr: [
          'BYN'
        ],
        Balance: [
          '26,14'
        ],
        Icon: [
          'ACCOUNT'
        ],
        BankId: [
          '300000001'
        ],
        Extra: [
          {
            Cards: [
              {
                CardDetails: [
                  {
                    Id: [
                      '1672615'
                    ],
                    Icon: [
                      'S_M_W_NFC_CH'
                    ],
                    Name: [
                      'пластиковая'
                    ],
                    Last4Digits: [
                      '4261'
                    ],
                    PaymentSystem: [
                      'Masterсard World'
                    ],
                    ValidTo: [
                      '31-AUG-31'
                    ],
                    Currency: [
                      'BYN'
                    ]
                  },
                  {
                    Id: [
                      '1672601'
                    ],
                    Icon: [
                      'MC_Crypto_Virt'
                    ],
                    Name: [
                      'виртуальная'
                    ],
                    Last4Digits: [
                      '4331'
                    ],
                    PaymentSystem: [
                      'Masterсard World'
                    ],
                    ValidTo: [
                      '31-JUL-31'
                    ],
                    Currency: [
                      'BYN'
                    ]
                  }
                ]
              }
            ]
          }
        ],
        Action: [
          {
            Id: [
              '14447118-05751f-account-1672600-setidentusername-2'
            ],
            Type: [
              'SetIdentUserName2'
            ],
            Name: [
              'Переименовать'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'UserName'
                ],
                Name: [
                  'Пользовательское наименование'
                ],
                MaxLength: [
                  '50'
                ],
                Mandatory: [
                  'N'
                ]
              }
            ]
          },
          {
            Id: [
              '14447119-e0de8f-account-1672600-b735-getproductinfo-1'
            ],
            Type: [
              'B735:GetProductInfo'
            ],
            Name: [
              'Реквизиты счета'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '14447120-3e6549-account-1672600-b735-cardissue-2'
            ],
            Type: [
              'B735:CardIssue2'
            ],
            Name: [
              'Выпустить доп. карточку'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Id: [
                  'B735$CA$ProductCode'
                ],
                Name: [
                  'Тип карточки'
                ],
                MinLength: [
                  '1'
                ],
                Lookup: [
                  {
                    Item: [
                      {
                        _: 'MPMDZBYC',
                        Name: [
                          'Masterсard World'
                        ]
                      },
                      {
                        _: 'VPGDZBYC',
                        Name: [
                          'Visa Gold'
                        ]
                      }
                    ]
                  }
                ],
                NotMandatoryFor: [
                  {
                    Button: [
                      'Cancel'
                    ]
                  }
                ]
              }
            ],
            Info: [
              'Внимание! Карточку на физическом носителе необходимо активировать в течение 60 дней с момента оформления. При отсутствии активации карточка будет аннулирована и повторно её можно будет заказать в отделении Банка. При оплате за рубежом или в интернете (международные сервисы) возможны ограничения со стороны иностранных банков-эквайеров. Рекомендуем Вам рассмотреть возможность выпуска карточек нескольких платежных систем.'
            ]
          },
          {
            Id: [
              '14447121-aaff74-account-1672600-b735-getordering-1'
            ],
            Type: [
              'B735:GetOrdering'
            ],
            Name: [
              'Выписка по счёту'
            ],
            Options: [
              '1'
            ],
            Parameter: [
              {
                Value: [
                  '19.09.2026'
                ],
                Id: [
                  'DateFrom'
                ],
                Name: [
                  'Начало периода'
                ],
                DataType: [
                  '3'
                ],
                DataFormat: [
                  'dd.mm.yyyy'
                ],
                MinLength: [
                  '10'
                ],
                MaxLength: [
                  '10'
                ]
              },
              {
                Value: [
                  '19.10.2026'
                ],
                Id: [
                  'DateTo'
                ],
                Name: [
                  'Окончание периода'
                ],
                DataType: [
                  '3'
                ],
                DataFormat: [
                  'dd.mm.yyyy'
                ],
                MaxValue: [
                  '19.10.2026'
                ],
                MinLength: [
                  '10'
                ],
                MaxLength: [
                  '10'
                ]
              },
              {
                Value: [
                  'N'
                ],
                Id: [
                  'B735$OpenNewWindow'
                ],
                Name: [
                  'Открывать в новом окне?'
                ],
                DataType: [
                  '5'
                ],
                MinLength: [
                  '1'
                ],
                Mandatory: [
                  'N'
                ]
              }
            ],
            Info: [
              'Окончание периода не может быть позже предыдущего банковского дня'
            ]
          },
          {
            Id: [
              '14447122-928d89-account-1672600-b735-accounttransfer-1'
            ],
            Type: [
              'B735:AccountTransfer'
            ],
            Name: [
              'Пополнить этот счёт'
            ],
            FullName: [
              'для бел рублей'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '14447123-c1ed5b-account-1672600-b735-viewprintformsaction-1'
            ],
            Type: [
              'B735:ViewPrintFormsAction'
            ],
            Name: [
              'Документы'
            ],
            FullName: [
              'Документы, подписанные в электронном виде'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '14447124-4f1c6c-account-1672600-b735-accountclose-1'
            ],
            Type: [
              'B735:AccountClose'
            ],
            Name: [
              'Закрыть счёт'
            ],
            Options: [
              '1'
            ]
          },
          {
            Id: [
              '14447125-d6bc5b-account-1672600-unsetdefaultcredittool-1'
            ],
            Type: [
              'UnSetDefaultCreditTool'
            ],
            Name: [
              'Пополнение по номеру телефона (отключить )'
            ],
            Options: [
              '0'
            ]
          }
        ]
      }
    ],
    expected: [
      {
        id: 'MB-000006-0004-0300000001.01',
        type: 'card',
        title: 'Платёжная карточка*1001',
        currencyCode: '933',
        cardNumber: '521000******1001',
        instrument: 'BYN',
        balance: 26.03,
        syncID: [
          '1001'
        ],
        productId: '14447090-c5737f',
        productType: 'MS'
      },
      {
        id: 'MB-000006-0004-0300000001',
        type: 'card',
        title: 'Платёжная карточка*1002',
        currencyCode: '933',
        cardNumber: '521000******1002',
        instrument: 'BYN',
        balance: 26.03,
        syncID: [
          '1002'
        ],
        productId: '14447104-00aa1c',
        productType: 'MS'
      }
    ]
  }
]

it.each(cases)('keeps stable card IDs despite session-specific IDs in report $logId', ({ products, expected }) => {
  global.ZenMoney = { isAccountSkipped: () => false } as unknown as typeof ZenMoney
  expect(convertAccounts(products)).toEqual(expected)
})
