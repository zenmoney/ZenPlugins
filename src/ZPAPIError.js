function ZPAPIError(message, allowRetry, fatal) {
  message = message || '';
  let self;
  if (this instanceof ZPAPIError) {
    self = this;
    self.toString = function() {
      return (this.fatal ? 'F' : '_') +
        (this.allowRetry ? 'R' : '_') + ' ' + this.message;
    };
    if (message instanceof ZPAPIError) {
      self.message = message.message;
      self.allowRetry = message.allowRetry;
      self.fatal = message.fatal;
      self.stack = message.stack;
    } else {
      self.message = message.message !== undefined ? message.message : message.toString();
      if (message.stack !== undefined ||
        message.stacktrace !== undefined) {
        self.stack = message.stack || message.stacktrace;
      } else if (!self.stack) {
        const error = new Error();
        self.stack = error.stack || error.stacktrace;
      }
      if (typeof self.stack === 'string') {
        self.stack = self.stack.split('\n');
      }
      if (self.stack && self.stack.length > 0) {
        self.stack = self.stack.map(function(item) {
          return item.trim();
        }).filter(function(item) {
          return item.length > 0 &&
            item.indexOf('handleException') < 0 &&
            item.indexOf('ZPAPI') < 0 &&
            item !== 'Error' &&
            item !== 'global code' &&
            item !== '[native code]';
        }).join('\n');
      } else {
        self.stack = null;
      }
    }
    if (message.arguments) {
      self.arguments = message.arguments;
    }
  } else {
    if (message instanceof ZPAPIError) {
      self = message;
    } else {
      self = new ZPAPIError(message);
    }
  }
  if (self.fatal === undefined || fatal !== undefined) {
    self.fatal = !!fatal;
  }
  if (self.allowRetry === undefined || allowRetry !== undefined) {
    self.allowRetry = !!allowRetry;
  }
  return self;
}

ZPAPIError.prototype = Error.prototype;

export {ZPAPIError};