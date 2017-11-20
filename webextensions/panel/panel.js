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
  gEngines.addEventListener('mouseup', onClick, { capture: true });
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
  gEngines.removeEventListener('mouseup', onClick, { capture: true });
}, { once: true });


function onKeyPress(aEvent) {
  if (aEvent.keyCode == KeyEvent.DOM_VK_RETURN ||
      aEvent.keyCode == KeyEvent.DOM_VK_ENTER) {
    let openTab = aEvent.altKey || aEvent.ctrlKey || aEvent.metaKey;
    let openWindow = aEvent.shiftKey;
    doSearch({
      where: openTab ? kOPEN_IN_TAB : openWindow ? kOPEN_IN_WINDOW : configs.defaultOpenIn,
      save:  true
    });
    return;
  }

  if (!aEvent.altKey &&
      !aEvent.ctrlKey &&
      !aEvent.shiftKey &&
      !aEvent.metaKey) {
    let activeItem = getActiveEngine();
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

function onClick(aEvent) {
  var engine = aEvent.target;
  while (engine.nodeType != Node.ELEMENT_NODE || !engine.hasAttribute('data-id')) {
    engine = engine.parentNode;
  }
  switch (aEvent.button) {
    case 0:
      let openTab = aEvent.altKey || aEvent.ctrlKey || aEvent.metaKey;
      let openWindow = aEvent.shiftKey;
      doSearch({
        where: openTab ? kOPEN_IN_TAB : openWindow ? kOPEN_IN_WINDOW : configs.defaultOpenIn,
        engine
      });
      break;

    case 1:
      doSearch({
        where: kOPEN_IN_TAB,
        engine
      });
      break;

    default:
      break;
  }
}

function getActiveEngine() {
  return document.querySelector('li.active');
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

async function doSearch(aParams = {}) {
  var item = aParams.engine || getActiveEngine();
  var url = item && item.getAttribute('data-url');
  if (!url)
    url = configs.defaultEngine;
  url = url.replace(/%s/gi, gField.value || '');
  switch (aParams.where) {
    case kOPEN_IN_TAB: {
    let params = {
      active: true,
      url
    };
    if (gPageSelection &&
        gPageSelection == gField.value)
      params.openerTabId = gCurrentTab.id;
    browser.tabs.create(params);
    }; break;

    case kOPEN_IN_WINDOW:
    browser.windows.create({ url });
      break;

    default:
    browser.tabs.update(gCurrentTab.id, { url });
      break;
  }
  if (item && (aParams.save || gField.value))
    browser.runtime.sendMessage({
      type: kCOMMAND_NOTIFY_SEARCH_ENGINE_USED,
      id:   item.getAttribute('data-id')
    });
  gField.value = '';
  window.close();
}
