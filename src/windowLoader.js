const fetchFile = (url) => {
  return new Promise(function(resolve, reject) {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onerror = reject;
    req.onload = function() {
      resolve({
        status: this.status,
        body: this.responseText,
      });
    };
    req.send();
  });
};

const fetchJson = (url) => fetchFile(url)
  .then(({status, body}) => {
    const parsedBody = JSON.parse(body);
    const isHttpSuccess = 200 <= status && status < 300;
    return isHttpSuccess ? parsedBody : Promise.reject(parsedBody);
  });

const fetchPreferences = () => fetchJson('/zen/preferences');
const fetchManifest = () => fetchJson('/zen/manifest');
const fetchData = () => fetchJson('/zen/data');

window.onload = function() {
  Promise.all([fetchPreferences(), fetchManifest(), fetchData()])
    .then(([preferences, manifest, data]) => {
      const worker = new Worker('/workerLoader.js');
      worker.postMessage({manifest, preferences, data});
      worker.onmessage = function(e) {
        if (e && (e === 'close' || e.data === 'close')) {
          worker.terminate();
        }
      };
    });
};
