interface Challenge {
  image: string
  revision: number
}

interface CaptchaBridge {
  denizCaptchaRefresh: () => Promise<Challenge>
  denizCaptchaSubmit: (revision: number, code: string) => Promise<Challenge | null>
  denizCaptchaCancel: () => Promise<void>
}

// This page receives only the image and a local revision, never bank session secrets.
export function mount (): void {
  const bridge = window as unknown as CaptchaBridge
  document.documentElement.lang = 'tr'
  document.title = 'DenizBank güvenlik kodu'
  document.body.innerHTML = `<main>
    <p class="bank">DenizBank</p><h1>Güvenlik kodu</h1>
    <p>Devam etmek için resimdeki kodu girin.</p>
    <form><div class="image"><img alt="Güvenlik kodu"></div>
      <button class="refresh" type="button">Yeni resim</button>
      <label for="captcha">Resimdeki kod</label>
      <input id="captcha" name="captcha" autocomplete="off" autocapitalize="characters" spellcheck="false" required>
      <p class="status" role="status" aria-live="polite"></p>
      <button class="submit" type="submit">Devam et</button>
      <button class="cancel" type="button">İptal</button>
    </form></main>`
  const style = document.createElement('style')
  style.textContent = ':root{color-scheme:light dark}body{margin:0;background:Canvas;color:CanvasText;font:17px system-ui,sans-serif}main{max-width:420px;padding:28px 24px;margin:auto}.bank{font-weight:700;color:#1675ad;margin:0 0 20px}h1{font-size:26px;margin:0 0 12px}p{line-height:1.5}.image{background:white;border:1px solid #aaa;border-radius:8px;padding:20px 8px;text-align:center;min-height:70px}img{max-width:100%;height:auto}label{display:block;margin:20px 0 8px}input,button{box-sizing:border-box;font:inherit;border-radius:8px;padding:13px;width:100%}input{background:Field;color:FieldText;border:1px solid #888;font-size:24px;letter-spacing:3px;text-transform:uppercase}button{cursor:pointer;border:0}.submit{background:#096b9f;color:white;font-weight:600}.refresh,.cancel{background:transparent;color:CanvasText}.refresh{padding:10px}.cancel{margin-top:8px}.status{min-height:24px;font-size:14px;margin:12px 0}button:disabled{opacity:.5;cursor:default}'
  document.head.appendChild(style)
  const image = document.querySelector('img') as HTMLImageElement
  const input = document.querySelector('input') as HTMLInputElement
  const refreshButton = document.querySelector('.refresh') as HTMLButtonElement
  const submitButton = document.querySelector('.submit') as HTMLButtonElement
  const status = document.querySelector('.status') as HTMLParagraphElement
  let revision = 0
  let busy = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const setBusy = (value: boolean): void => {
    busy = value
    input.disabled = value
    submitButton.disabled = value
    refreshButton.disabled = value
  }
  const display = (challenge: Challenge, renewed: boolean): void => {
    revision = challenge.revision
    image.src = 'data:image/jpeg;base64,' + challenge.image
    input.value = ''
    status.textContent = renewed ? 'Resim yenilendi. Yeni kodu girin.' : ''
    clearTimeout(timer)
    timer = setTimeout(() => { void refresh(true) }, 60000)
  }
  const refresh = async (renewed: boolean): Promise<void> => {
    if (busy) return
    setBusy(true)
    status.textContent = 'Resim yükleniyor…'
    try {
      display(await bridge.denizCaptchaRefresh(), renewed)
    } catch {
      status.textContent = 'Resim yüklenemedi. Pencereyi kapatıp tekrar deneyin.'
    } finally {
      setBusy(false)
    }
  }
  refreshButton.addEventListener('click', () => { void refresh(true) })
  document.querySelector('form')?.addEventListener('submit', event => {
    event.preventDefault()
    if (busy) return
    input.value = input.value.trim()
    if (!input.reportValidity()) return
    clearTimeout(timer)
    const code = input.value
    setBusy(true)
    void bridge.denizCaptchaSubmit(revision, code).then(challenge => {
      if (challenge !== null) display(challenge, true)
    }).catch(() => {
      status.textContent = 'İşlem tamamlanamadı. Pencereyi kapatıp tekrar deneyin.'
    }).finally(() => { setBusy(false) })
  })
  document.querySelector('.cancel')?.addEventListener('click', () => { void bridge.denizCaptchaCancel() })
  window.addEventListener('pagehide', () => clearTimeout(timer), { once: true })
  void refresh(false)
}
