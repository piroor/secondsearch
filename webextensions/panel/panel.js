/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

gLogContext = 'Panel';

var gStyleVariables;
var gField;
var gSearchButton;
var gContainer;
var gRecentlyUsedEngines;
var gAllEngines;
var gActiveEngines;
var gEnginesSwitchers;
var gPageSelection;
var gCurrentTab;
var gLastOperatedBy = null;

window.addEventListener('DOMContentLoaded', async () => {
  gStyleVariables = document.querySelector('#variables');

  gField = document.querySelector('#search-field');
  gSearchButton = document.querySelector('#do-search-button');
  gContainer = document.querySelector('#search-engines-container');

  gRecentlyUsedEngines = document.querySelector('#search-engines-by-recently-used');
  gAllEngines          = document.querySelector('#search-engines-by-name');
  gEnginesSwitchers = {
    toRecentlyUsed: document.querySelector('#switch-to-recently-used'),
    toAll:          document.querySelector('#switch-to-all')
  };
  switchToRecentlyUsedEngines();
}, { once: true });

window.addEventListener('pageshow', async () => {
  document.addEventListener('paste', onPaste);
  gField.addEventListener('keydown', onKeyDown, { capture: true });
  gField.addEventListener('compositionstart', onComposition, { capture: true });
  gField.addEventListener('compositionupdate', onComposition, { capture: true });
  gField.addEventListener('compositionend', onComposition, { capture: true });
  document.addEventListener('keypress', onKeyPress, { capture: true });
  gContainer.addEventListener('mouseup', onEngineClick, { capture: true });
  gContainer.addEventListener('mousemove', onMouseMove);
  gEnginesSwitchers.toRecentlyUsed.addEventListener('click', onSwitcherClick, { capture: true });
  gEnginesSwitchers.toAll.addEventListener('click', onSwitcherClick, { capture: true });
  gSearchButton.addEventListener('click', onSearchButtonClick);

  document.documentElement.classList.add('building');

  if (configs.clearFieldAfterSearch)
    gField.value = '';
  else
    gField.value = configs.lastSearchTerm;

  gPageSelection = null;
  gCurrentTab = null;
  gLastOperatedBy = kOPERATED_BY_KEY;
  
  await Promise.all([
    (async () => {
      var recentlyUsedEngines = await browser.runtime.sendMessage({ type: kCOMMAND_GET_SEARCH_ENGINES });
      if (recentlyUsedEngines.length == 0) {
        document.documentElement.classList.add('no-engine');
      }
      else {
        document.documentElement.classList.remove('no-engine');
        buildEngines(recentlyUsedEngines, gRecentlyUsedEngines);
        buildEngines(recentlyUsedEngines.sort((aA, aB) => aA.title > aB.title), gAllEngines);
      }
    })(),
    updateUIForCurrentTab()
  ]);

  gStyleVariables.textContent = `:root {
    --panel-width: ${gContainer.offsetWidth}px;
  }`;

  document.documentElement.classList.remove('building');
  focusToField();
}, { once: true });

window.addEventListener('pagehide', () => {
  document.removeEventListener('paste', onPaste);
  gField.removeEventListener('keydown', onKeyDown, { capture: true });
  gField.removeEventListener('compositionstart', onComposition, { capture: true });
  gField.removeEventListener('compositionupdate', onComposition, { capture: true });
  gField.removeEventListener('compositionend', onComposition, { capture: true });
  document.removeEventListener('keypress', onKeyPress, { capture: true });
  gContainer.removeEventListener('mouseup', onEngineClick, { capture: true });
  gContainer.removeEventListener('mousemove', onMouseMove);
  gEnginesSwitchers.toRecentlyUsed.removeEventListener('click', onSwitcherClick, { capture: true });
  gEnginesSwitchers.toAll.removeEventListener('click', onSwitcherClick, { capture: true });
  gSearchButton.removeEventListener('click', onSearchButtonClick);
}, { once: true });


function onPaste(aEvent) {
  gField.classList.add('pasted');
}

function onKeyDown(aEvent) {
  gField.classList.remove('pasted');
}

function onComposition(aEvent) {
  gField.classList.remove('pasted');
}

function onKeyPress(aEvent) {
  if (aEvent.keyCode == KeyEvent.DOM_VK_RETURN ||
      aEvent.keyCode == KeyEvent.DOM_VK_ENTER) {
    let engine = null;
    if (gLastOperatedBy == kOPERATED_BY_MOUSE || !getActiveEngine())
      engine = document.querySelector('li:hover');
    doSearch({
      where: whereToOpenIn(aEvent),
      save:  true,
      engine
    });
    return;
  }

  var noModifiers = (
    !aEvent.altKey &&
    !aEvent.ctrlKey &&
    !aEvent.shiftKey &&
    !aEvent.metaKey
  );
  var activeItem = getActiveEngine();
  switch (aEvent.keyCode) {
    case KeyEvent.DOM_VK_ESCAPE:
      if (noModifiers)
        window.close();
      return;

    case KeyEvent.DOM_VK_LEFT:
      if (!aEvent.altKey &&
          (aEvent.ctrlKey || aEvent.metaKey) &&
          !aEvent.shiftKey) {
        switchToRecentlyUsedEngines();
      }
      return;

    case KeyEvent.DOM_VK_RIGHT:
      if (!aEvent.altKey &&
          (aEvent.ctrlKey || aEvent.metaKey) &&
          !aEvent.shiftKey) {
        switchToAllEngines();
      }
      return;

    case KeyEvent.DOM_VK_UP:
      if (!noModifiers)
        return;
      gLastOperatedBy = kOPERATED_BY_KEY;
      if (activeItem) {
        activeItem.classList.remove('active');
        let item = (activeItem.previousSibling || activeItem.parentNode.lastChild);
        item.classList.add('active');
        scrollToItem(item);
      }
      else if (gActiveEngines.hasChildNodes()) {
        gActiveEngines.lastChild.classList.add('active');
        scrollToItem(gActiveEngines.lastChild);
      }
      return;

    case KeyEvent.DOM_VK_DOWN:
      if (!noModifiers)
        return;
      gLastOperatedBy = kOPERATED_BY_KEY;
      if (activeItem) {
        activeItem.classList.remove('active');
        let item = (activeItem.nextSibling || activeItem.parentNode.firstChild);
        item.classList.add('active');
        scrollToItem(item);
      }
      else if (gActiveEngines.hasChildNodes()) {
        gActiveEngines.firstChild.classList.add('active');
        scrollToItem(gActiveEngines.firstChild);
      }
      return;
  }
}

function whereToOpenIn(aEvent) {
  if (aEvent.altKey || aEvent.ctrlKey || aEvent.metaKey)
    return kOPEN_IN_TAB;

  if (aEvent.shiftKey)
    return kOPEN_IN_WINDOW;

  if (configs.recycleBlankCurrentTab &&
      configs.defaultOpenIn == kOPEN_IN_TAB &&
      (gCurrentTab.url == 'about:blank' ||
       (configs.recycleTabUrlPattern &&
        new RegExp(configs.recycleTabUrlPattern).test(gCurrentTab.url))))
    return kOPEN_IN_CURRENT;

  return configs.defaultOpenIn;
}

function onEngineClick(aEvent) {
  var engine = aEvent.target;
  while (engine.nodeType != Node.ELEMENT_NODE ||
         !engine.hasAttribute('data-id')) {
    engine = engine.parentNode;
    if (!engine)
      return;
  }
  switch (aEvent.button) {
    case 0:
      doSearch({
        where: whereToOpenIn(aEvent),
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

function onSwitcherClick(aEvent) {
  switch (aEvent.currentTarget.id) {
    case 'switch-to-recently-used':
      switchToRecentlyUsedEngines();
      gField.focus();
      return;

    case 'switch-to-all':
      switchToAllEngines();
      gField.focus();
      return;

    default:
      return;
  }
}

function onSearchButtonClick(aEvent) {
  doSearch({ where: whereToOpenIn(aEvent) });
  gField.classList.remove('pasted');
}

function onMouseMove(aEvent) {
  gLastOperatedBy = kOPERATED_BY_MOUSE;
}

function getActiveEngine() {
  return gActiveEngines.querySelector('li.active');
}

function switchToRecentlyUsedEngines() {
  document.documentElement.classList.remove('by-name');
  gActiveEngines = gRecentlyUsedEngines;
  scrollTo({ position: 0, justNow: true });
}

function switchToAllEngines() {
  document.documentElement.classList.add('by-name');
  gActiveEngines = gAllEngines;
  scrollTo({ position: 0, justNow: true });
}

async function updateUIForCurrentTab() {
  try {
    gCurrentTab = (await browser.tabs.query({
      currentWindow: true,
      active: true
    }))[0];
    gPageSelection = await browser.tabs.executeScript(gCurrentTab.id, { code: 'window.getSelection().toString()' });
    if (Array.isArray(gPageSelection))
      gPageSelection = gPageSelection.join('');
    gField.value = gPageSelection;
  }
  catch(e) {
    // if it is a special tab, we cannot execute script.
    //console.log(e);
  }
}

function focusToField() {
  window.focus();
  setTimeout(() => {
    gField.focus();
    gField.select();
  }, configs.focusDelay);
}

function buildEngines(aEngines, aContainer) {
  var items = document.createDocumentFragment();
  for (let engine of aEngines) {
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
  aContainer.appendChild(items);
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
  if (configs.clearFieldAfterSearch)
    gField.value = '';
  else
    configs.lastSearchTerm = gField.value;
  window.close();
}
