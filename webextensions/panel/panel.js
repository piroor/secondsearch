/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

var gField;
var gEngines;
var gPageSelection;

window.addEventListener('DOMContentLoaded', async () => {
  gField = document.querySelector('#search-field');
  gEngines = document.querySelector('#search-engines');
  await buildEngines();
  focusToField();
}, { once: true });

window.addEventListener('pageshow', async () => {
  document.addEventListener('keypress', onKeyPress, { capture: true });
  focusToField()

  let tab = browser.tabs.getCurrent();
  try {
    gPageSelection = await browser.tabs.executeScript(tab.id, { code: 'window.getSelection().toString()' });
    gField.value = gPageSelection;
  }
  catch(e) {
  }
}, { once: true });

window.addEventListener('pagehide', () => {
  document.removeEventListener('keypress', onKeyPress, { capture: true });
  gPageSelection = null;
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

      case KeyEvent.DOM_VK_LEFT:
      case KeyEvent.DOM_VK_RIGHT:
        if (activeItem)
          activeItem.classList.remove('active');
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
  var bookmarks = await browser.bookmarks.search({ query: '%s' });
  bookmarks.sort((aA, aB) => aA.title > aB.title);
  var items = document.createDocumentFragment();
  for (let bookmark of bookmarks) {
    if (bookmark.type != 'bookmark' ||
        !/%s/i.test(bookmark.url))
      continue;
    let item = document.createElement('li');
    item.setAttribute('id', `search-engine-${bookmark.title}`);
    item.setAttribute('data-url', bookmark.url);

    let favicon = document.createElement('img');
    favicon.classList.add('favicon');
    let iconURI = favIconUrl(bookmark.url);
    if (iconURI)
      favicon.setAttribute('src', iconURI);
    item.appendChild(favicon);

    let label = document.createElement('span');
    label.classList.add('label');
    label.textContent = bookmark.title;
    item.appendChild(label);

    items.appendChild(item);
  }
  gEngines.appendChild(items);
}

function favIconUrl(aURI) {
  var uriMatch = aURI.match(/^(\w+:\/\/[^\/]+)/);
  if (!uriMatch)
    return null;
  return `https://www.google.com/s2/favicons?domain=${uriMatch[1]}`;
}

function doSearch(aEvent) {
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
    if (gPageSelection && gPageSelection == gField.value)
      params.openerTabId = await (browser.tabs.getCurrent()).id;
    browser.tabs.create(params);
  }
  else if (openWindow) {
    browser.windows.create({ url });
  }
  else {
    let tab = await browser.tabs.getCurrent();
    browser.tabs.update(tab.id, { url });
  }
  gField.value = '';
  window.close();
}
