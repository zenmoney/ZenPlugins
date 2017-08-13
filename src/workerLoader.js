import {ZPAPI} from './ZPAPI';
import {ZPAPIError} from './ZPAPIError';

// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', (event) => {
  if (!event) {
    return;
  }
  const {injectApiInstance} = require('./globals');
  injectApiInstance(new ZPAPI(event.data));

  try {
    const {main} = require('currentPlugin');
    main();
  } catch (e) {
    const zpApiError = ZPAPIError(e);
    console.log('[ZP ' + event.data.manifest.id + ']: Exception: ' + zpApiError.toString());
    if (zpApiError.stack) {
      console.log('[ZP]: Call stack:');
      console.log(zpApiError.stack);
      if (zpApiError.arguments) {
        console.log('[ZP]: Arguments:');
        console.log(zpApiError.arguments);
      }
    }
    throw zpApiError;
  }
});
