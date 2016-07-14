var ZP_HEADER_PREFIX = 'zenplugin-';

var allowRequestHeaders = {};
var rewriteRequests = {};

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        var headers = [];
        var rewrite = false;
        var accessControlHeader = null;

        details.requestHeaders.forEach(function (header) {
            if (header.name === 'Access-Control-Request-Headers') {
                accessControlHeader = header;
            }
            if (header.name !== 'Origin' &&
                header.name.indexOf('Access-Control-') < 0) {
                if (header.name.indexOf(ZP_HEADER_PREFIX) === 0) {
                    rewrite = true;
                    if (header.name.length === ZP_HEADER_PREFIX.length) {
                        return;
                    }
                    header.name = header.name.substring(ZP_HEADER_PREFIX.length);
                }
                headers.push(header);
            }
        });

        if (accessControlHeader && (rewrite ||
                (accessControlHeader.value &&
                 accessControlHeader.value.indexOf(ZP_HEADER_PREFIX) >= 0))) {
            if (accessControlHeader.value) {
                var names = accessControlHeader.value
                    .split(', ')
                    .map(function (name) {
                        return name.replace(ZP_HEADER_PREFIX, '');
                    })
                    .concat(headers.map(function (header) {
                        return header.name.toLowerCase();
                    }))
                    .filter(function (name, index, self) {
                        return name.length > 0 && self.indexOf(name) === index;
                    });
                accessControlHeader.value = names.join(', ');
            }
            allowRequestHeaders[details.requestId] = accessControlHeader.value;
        }

        if (rewrite) {
            rewriteRequests[details.requestId] = 1;
        } else {
            headers = details.requestHeaders;
        }

        return {requestHeaders: headers};
    },
    {urls: ['<all_urls>']},
    ['blocking', 'requestHeaders']
);

chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
        var headers = details.responseHeaders || [];
        if (!(details.requestId in allowRequestHeaders) &&
            !(details.requestId in rewriteRequests)) {
            return {responseHeaders: headers};
        }

        var headersData = details.requestId in allowRequestHeaders ? {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': allowRequestHeaders[details.requestId],
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
            'Allow': 'POST, GET, OPTIONS, PUT, DELETE'
        } : {};
        headers.forEach(function (header, idx, headers) {
            var value = headersData[header.name];
            if (value !== undefined) {
                header.value = value;
                headersData[header.name] = undefined;
            }
            if (header.name === 'Set-Cookie' ||
                header.name === 'Set-Cookie2') {
                headers.push({
                    name: ZP_HEADER_PREFIX + header.name,
                    value: header.value
                });
            }
        });
        for (var name in headersData) {
            var value = headersData[name];
            if (value !== undefined) {
                headers.push({
                    name: name,
                    value: value
                });
            }
        }

        return {responseHeaders: headers};
    },
    {urls: ['<all_urls>']},
    ['blocking', 'responseHeaders']
);