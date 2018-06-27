import {InvalidPreferencesError, TemporaryError, ZPAPIError} from "./errors";

global.ZenMoney.Error = ZPAPIError;
global.TemporaryError = TemporaryError;
global.InvalidPreferencesError = InvalidPreferencesError;
