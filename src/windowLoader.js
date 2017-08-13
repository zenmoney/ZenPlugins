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
  .then((xml) => {
    let root = new DOMParser().parseFromString(xml, 'text/xml').documentElement;
    if (root.nodeName !== 'provider') {
      throw new Error('Wrong root object in ZenmoneyManifest.xml');
    }
    const manifest = {};
    const children = root.children;
    for (let i = 0; i < children.length; i++) {
      let name = children[i].nodeName;
      if (name !== 'files') {
        manifest[name] = children[i].innerHTML;
      } else {
        const files = children[i].children;
        for (let j = 0; j < files.length; j++) {
          name = files[j].nodeName;
          if (name === 'preferences') {
            manifest.preferences = files[j].innerHTML;
          } else {
            if (!manifest.files) {
              manifest.files = [];
            }
            manifest.files.push(files[j].innerHTML);
          }
        }
      }
    }
    if (!manifest.id || !manifest.build || !manifest.files || !manifest.version) {
      throw new Error('Wrong ZenmoneyManifest.xml');
    }
    return manifest;
  });

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
