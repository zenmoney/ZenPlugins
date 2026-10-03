// Captured on 2026-10-03 at 09:22 Europe/Minsk from the mobile API, appVersion 2026.3.0.
// POST https://mb.asb.by/ibanking/users/auth/login/preparation, without loginMode.
// One request used the owner's login and a generated wrong password; the other used
// a generated login and the same password. Complete response bodies contain no personal data.
// Recovery instructions follow the bank's guide (checked 2026-10-02):
// https://belarusbank.by/fizicheskim_licam/online_services/online_bank_belarusbank/bystraya_registratsiya_i_udobnyy_vkhod/
export const wrongCredentialsResponse = {
  status: 400,
  body: {
    errorInfo: {
      code: 1042,
      errorText: 'Failed login attempt: please check if the data you entered is correct. The number of attempts before blocking is 4'
    }
  }
}

export const registrationRequiredResponse = {
  status: 400,
  body: {
    errorInfo: {
      code: 1011,
      errorText: 'To log in to the application, please register'
    }
  }
}
