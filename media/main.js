const vscode = acquireVsCodeApi();

let s_pendingUpdate = 0;
let s_pendingLoad = false;

function awtkSaveSettings() {
  const width = document.getElementById('width').value;
  const height = document.getElementById('height').value;
  const theme = document.getElementById('theme').value;
  const app_root = document.getElementById('app_root').value;
  const language = document.getElementById('language').value;
  const country = document.getElementById('country').value;

  localStorage.setItem('awtk_settings', 'true');
  localStorage.setItem('awtk_settings_width', width);
  localStorage.setItem('awtk_settings_height', height);
  localStorage.setItem('awtk_settings_app_root', app_root);
  localStorage.setItem('awtk_settings_theme', theme);
  localStorage.setItem('awtk_settings_language', language);
  localStorage.setItem('awtk_settings_country', country);

  console.log(`save settings ok: ${width} x ${height}`);
  return;
}

function awtkLoadSettings() {
  if (localStorage.getItem('awtk_settings')) {
    const width = document.getElementById('width');
    const height = document.getElementById('height');
    const theme = document.getElementById('theme');
    const app_root = document.getElementById('app_root');
    const language = document.getElementById('language');
    const country = document.getElementById('country');

    width.value = localStorage.getItem('awtk_settings_width');
    height.value = localStorage.getItem('awtk_settings_height');
    theme.value = localStorage.getItem('awtk_settings_theme');
    app_root.value = localStorage.getItem('awtk_settings_app_root');
    language.value = localStorage.getItem('awtk_settings_language');
    country.value = localStorage.getItem('awtk_settings_country');

    console.log(`load ${width.value} x ${height.value} ${theme.value} ${language.value} ${country.value} ${app_root.value}`);
  } else {
    console.log("load settings failed");
  }

  return;
}

function clientUpdateUI(escapedXml, app_root, width, height, language, country, theme) {
  const xml = unescape(escapedXml);

  const reqJson = {
    xml: xml,
    app_root: app_root,
    width: width,
    height: height,
    language: language,
    country: country,
    theme: theme
  }

  console.log(reqJson);

  try {
    const parser = new DOMParser();
    let preprocessXml = xml.replace(/v-on:/g, "v-on-");
    preprocessXml = preprocessXml.replace(/v-data:/g, "v-data-");
    preprocessXml = preprocessXml.replace(/style:/g, "style.");

    const xmlDoc = parser.parseFromString(preprocessXml, "text/xml");

    if (reqJson.xml.indexOf('parsererror') > 0) {
      console.log("invalid ui xml:", reqJson.xml);
      screenshot.width = width;
      screenshot.height = height;

      screenshot.src = "http://localhost:8000/screenshot?timestamp=" + Date.now();

      return;
    }
    reqJson.xml = xml;
  } catch (e) {
    console.log("invalid ui xml", e);
    return;
  }

  const req = JSON.stringify(reqJson, null, '\t');

  function onRequestResult() {
    const screenshot = document.getElementById('screenshot');
    const width = document.getElementById('width').value;
    const height = document.getElementById('height').value;

    screenshot.width = width;
    screenshot.height = height;
    screenshot.onload = function () {
      s_pendingLoad = false;
      console.log("screen shot loaded");
      return;
    }
    s_pendingLoad = true;
    screenshot.src = "http://localhost:8000/screenshot?timestamp=" + Date.now();

    console.log(this.responseText);
  }

  let oReq = new XMLHttpRequest();
  oReq.addEventListener("load", onRequestResult);
  oReq.open("POST", "http://localhost:8000/ui");
  oReq.send(req);

  return;
}

function clientRequestUpdateUI() {
  const width = document.getElementById('width').value;
  const height = document.getElementById('height').value;
  const source = document.getElementById('source').value;
  const theme = document.getElementById('theme').value;
  const app_root = document.getElementById('app_root').value;
  const language = document.getElementById('language').value;
  const country = document.getElementById('country').value;

  clientUpdateUI(source, app_root, width, height, language, country, theme);
}

function onPageLoad() {
  awtkLoadSettings();

  const apply = document.getElementById('apply');
  apply.onclick = () => {
    awtkSaveSettings();
    clientRequestUpdateUI();
  }

  window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case 'updateAppRoot': {
        const app_root = document.getElementById('app_root');
        app_root.value = message.app_root;
        console.log('Change AppRoot:', app_root.value)
        break;
      }
      case 'updateSource':
        {
          console.log('updateSource:', message);
          const source = document.getElementById('source');
          if (source.value != message.source) {
            source.value = message.source;
            s_pendingUpdate++;
          } else {
            console.log('not changed')
          }
          break;
        }
      default: break;
    }
  });

  clientRequestUpdateUI();
}

(function () {
  setTimeout(() => {
    onPageLoad();
  }, 100);

  setInterval(() => {
    if (s_pendingUpdate > 0) {
      if (!s_pendingLoad) {
        console.log('Pending update:', s_pendingUpdate);
        s_pendingUpdate = 0;
        clientRequestUpdateUI();
      } else {
        console.log('Pending load:', s_pendingLoad);
      }
    }
  }, 100);

}());
