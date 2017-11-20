/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

gLogContext = 'Panel';

var gField;
var gEngines;
var gPageSelection;
var gCurrentTab;

window.addEventListener('DOMContentLoaded', async () => {
  gField = document.querySelector('#search-field');
  gEngines = document.querySelector('#search-engines');
  await buildEngines();
  focusToField();
}, { once: true });

window.addEventListener('pageshow', async () => {
  document.addEventListener('keypress', onKeyPress, { capture: true });
  focusToField()

  gPageSelection = null;
  gCurrentTab = null;
  try {
    gCurrentTab = (await browser.tabs.query({
      currentWindow: true,
      active: true
    }))[0];
    gPageSelection = await browser.tabs.executeScript(gCurrentTab.id, { code: 'window.getSelection().toString()' });
    if (Array.isArray(gPageSelection))
      gPageSelection = gPageSelection.join('');
    gField.value = gPageSelection;
    gField.select();
  }
  catch(e) {
    // if it is a special tab, we cannot execute script.
    //console.log(e);
  }
}, { once: true });

window.addEventListener('pagehide', () => {
  document.removeEventListener('keypress', onKeyPress, { capture: true });
}, { once: true });


function onKeyPress(aEvent) {
  if (aEvent.keyCode == KeyEvent.DOM_VK_RETURN ||
      aEvent.keyCode == KeyEvent.DOM_VK_ENTER) {
    doSearch(aEvent);
    return;
  }

  if (!aEvent.altKey &&
      !aEvent.ctrlKey &&
      !aEvent.shiftKey &&
      !aEvent.metaKey) {
    let activeItem = document.querySelector('li.active');
    switch (aEvent.keyCode) {
      case KeyEvent.DOM_VK_ESCAPE:
        window.close();
        return;

      case KeyEvent.DOM_VK_UP:
        if (activeItem) {
          activeItem.classList.remove('active');
          (activeItem.previousSibling || activeItem.parentNode.lastChild).classList.add('active');
        }
        else if (gEngines.hasChildNodes()) {
          gEngines.lastChild.classList.add('active');
        }
        return;

      case KeyEvent.DOM_VK_DOWN:
        if (activeItem) {
          activeItem.classList.remove('active');
          (activeItem.nextSibling || activeItem.parentNode.firstChild).classList.add('active');
        }
        else if (gEngines.hasChildNodes()) {
          gEngines.firstChild.classList.add('active');
        }
        return;
    }
  }
}


function focusToField() {
  window.focus();
  setTimeout(() => {
    gField.focus();
    gField.select();
  }, 100);
}

async function buildEngines() {
  var engines = await browser.runtime.sendMessage({ type: kCOMMAND_GET_SEARCH_ENGINES });
  var items = document.createDocumentFragment();
  for (let engine of engines) {
    let item = document.createElement('li');
    item.setAttribute('data-id', engine.id);
    item.setAttribute('data-url', engine.url);

    let favicon = document.createElement('img');
    favicon.classList.add('favicon');
    if (engine.favIconUrl)
      favicon.setAttribute('src', engine.favIconUrl);
    item.appendChild(favicon);

    let label = document.createElement('span');
    label.classList.add('label');
    label.textContent = engine.title;
    item.appendChild(label);

    items.appendChild(item);
  }
  gEngines.appendChild(items);
}

async function doSearch(aEvent) {
  var item = document.querySelector('li.active');
  var url = item && item.getAttribute('data-url');
  if (!url)
    url = 'https://www.google.com/?q=%s';
  url = url.replace(/%s/gi, gField.value || '');
  var openTab = aEvent.altKey || aEvent.ctrlKey || aEvent.metaKey;
  var openWindow = aEvent.shiftKey;
  if (openTab) {
    let params = {
      active: true,
      url
    };
    if (gPageSelection &&
        gPageSelection == gField.value)
      params.openerTabId = gCurrentTab.id;
    browser.tabs.create(params);
  }
  else if (openWindow) {
    browser.windows.create({ url });
  }
  else {
    browser.tabs.update(gCurrentTab.id, { url });
  }
  if (item)
    browser.runtime.sendMessage({
      type: kCOMMAND_NOTIFY_SEARCH_ENGINE_USED,
      id:   item.getAttribute('data-id')
    });
  gField.value = '';
  window.close();
}
