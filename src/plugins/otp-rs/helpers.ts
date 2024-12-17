import { TemporaryUnavailableError } from "../../errors"
import { setCookies } from "../yettelbank-rs/helpers"

export function checkResponseAndSetCookies (response: FetchResponse): void {
    if (response.status !== 200) {
        throw new TemporaryUnavailableError()
      }
    setCookies(response)
  }

