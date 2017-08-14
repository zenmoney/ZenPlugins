const fetchFile = (url, error) => {
  return new Promise(function(resolve, reject) {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onerror = function(e) {
      reject(error || e);
    };
    req.onload = function() {
      const isHttpSuccess = 200 <= this.status && this.status < 300;
      if (isHttpSuccess) {
        resolve(this.responseText);
      } else {
        reject(error || this.statusText);
      }
    };
    req.send();
  });
};

const fetchPreferences = () => fetchFile('/zen/preferences')
  .then((preferences) => JSON.parse(preferences));

const fetchManifest = () => fetchFile('/zen/manifest')
  .then((preferences) => JSON.parse(preferences));

const fetchData = () => fetchFile('/zen/data');

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
