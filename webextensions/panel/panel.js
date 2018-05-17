/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

gLogContext = 'Panel';

var gStyleVariables;
var gField;
var gHistory;
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
  gHistory = document.querySelector('#search-history');
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

configs.$loaded.then(() => {
  document.documentElement.dataset.theme = configs.theme;
  console.log('document.documentElement.dataset.theme ', document.documentElement.dataset.theme);
  for (let term of configs.history) {
    let item = document.createElement('option');
    item.setAttribute('value', term);
    gHistory.appendChild(item);
  }
});

window.addEventListener('pageshow', async () => {
  document.addEventListener('paste', onPaste);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onKeyDown, { capture: true });
  gField.addEventListener('compositionstart', onComposition, { capture: true });
  gField.addEventListener('compositionupdate', onComposition, { capture: true });
  gField.addEventListener('compositionend', onComposition, { capture: true });
  gField.addEventListener('input', onInput);
  gContainer.addEventListener('mouseup', onEngineClick, { capture: true });
  gContainer.addEventListener('mousemove', onMouseMove);
  gField.parentNode.addEventListener('mousemove', onMouseMove);
  gEnginesSwitchers.toRecentlyUsed.addEventListener('click', onSwitcherClick, { capture: true });
  gEnginesSwitchers.toAll.addEventListener('click', onSwitcherClick, { capture: true });
  gSearchButton.addEventListener('click', onSearchButtonClick);

  document.documentElement.classList.add('building');

  if (configs.autocomplete) {
    gField.setAttribute('autocomplete', 'on');
    gField.setAttribute('list', gHistory.id);
  }
  else {
    gField.setAttribute('autocomplete', 'off');
    gField.removeAttribute('list');
  }

  await configs.$loaded;

  if (configs.clearFieldAfterSearch &&
      configs.lastSearchTime >= 0 &&
      Date.now() - configs.lastSearchTime > configs.clearFieldAfterSearchDelay) {
    gField.value = '';
  }
  else {
    gField.value = configs.lastSearchTerm;
  }

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
  document.removeEventListener('submit', onSubmit);
  document.removeEventListener('keydown', onKeyDown, { capture: true });
  gField.removeEventListener('compositionstart', onComposition, { capture: true });
  gField.removeEventListener('compositionupdate', onComposition, { capture: true });
  gField.removeEventListener('compositionend', onComposition, { capture: true });
  gField.removeEventListener('input', onInput);
  gContainer.removeEventListener('mouseup', onEngineClick, { capture: true });
  gContainer.removeEventListener('mousemove', onMouseMove);
  gField.parentNode.removeEventListener('mousemove', onMouseMove);
  gEnginesSwitchers.toRecentlyUsed.removeEventListener('click', onSwitcherClick, { capture: true });
  gEnginesSwitchers.toAll.removeEventListener('click', onSwitcherClick, { capture: true });
  gSearchButton.removeEventListener('click', onSearchButtonClick);
}, { once: true });


function onPaste(aEvent) {
  gField.classList.add('pasted');
}

function onComposition(aEvent) {
  gField.classList.remove('pasted');
}

var gLastEnterEvent;

function onSubmit(aEvent) {
  doSearch(Object.assign(searchParamsFromEvent(gLastEnterEvent), {
    save:   true,
    engine: getActiveEngine()
  }));
  gLastEnterEvent = null;
}

function onKeyDown(aEvent) {
  if (aEvent.isComposing)
    return;

  gField.classList.remove('pasted');
  if (aEvent.key == 'Enter') {
    gLastEnterEvent = aEvent;
    return;
  }
  gLastEnterEvent = null;

  var noModifiers = (
    !aEvent.altKey &&
    !aEvent.ctrlKey &&
    !aEvent.shiftKey &&
    !aEvent.metaKey
  );
  var activeItem = getActiveEngine();
  switch (aEvent.key) {
    case 'Escape':
      if (noModifiers)
        window.close();
      return;

    case 'ArrowLeft':
      if (!aEvent.altKey &&
          (aEvent.ctrlKey || aEvent.metaKey) &&
          !aEvent.shiftKey) {
        switchToRecentlyUsedEngines();
      }
      return;

    case 'ArrowRight':
      if (!aEvent.altKey &&
          (aEvent.ctrlKey || aEvent.metaKey) &&
          !aEvent.shiftKey) {
        switchToAllEngines();
      }
      return;

    case 'ArrowUp':
      if (!noModifiers)
        return;
      gLastOperatedBy = kOPERATED_BY_KEY;
      if (activeItem) {
        activeItem.classList.remove('active');
        let item = activeItem.previousSibling;
        if (item) {
          item.classList.add('active');
          scrollToItem(item);
        }
      }
      else if (gActiveEngines.hasChildNodes()) {
        gActiveEngines.lastChild.classList.add('active');
        scrollToItem(gActiveEngines.lastChild);
      }
      aEvent.stopImmediatePropagation();
      aEvent.stopPropagation();
      return;

    case 'ArrowDown':
      if (!noModifiers)
        return;
      gLastOperatedBy = kOPERATED_BY_KEY;
      if (activeItem) {
        activeItem.classList.remove('active');
        let item = activeItem.nextSibling;
        if (item) {
          item.classList.add('active');
          scrollToItem(item);
        }
      }
      else if (gActiveEngines.hasChildNodes()) {
        gActiveEngines.firstChild.classList.add('active');
        scrollToItem(gActiveEngines.firstChild);
      }
      aEvent.stopImmediatePropagation();
      aEvent.stopPropagation();
      return;
  }
}

function onInput(aEvent) {
  if (aEvent.isComposing)
    return;

  const oldActive = getActiveEngine();
  if (oldActive && configs.clearFocusByInput)
    oldActive.classList.remove('active');

  configs.lastSearchTerm = gField.value;
  configs.lastSearchTime = -1;
}

function searchParamsFromEvent(aEvent) {
  var searchParams = {
    where:        configs.defaultOpenIn,
    keepOpen:     false
  };
  if (aEvent.altKey || aEvent.ctrlKey || aEvent.metaKey) {
    searchParams.where    = configs.accelActionOpenIn;
    searchParams.keepOpen = configs.accelActionOpenIn == kOPEN_IN_BACKGROUND_TAB;
    return searchParams;
  }

  if (aEvent.shiftKey) {
    searchParams.where = kOPEN_IN_WINDOW;
    return searchParams;
  }

  if (configs.recycleBlankCurrentTab &&
      configs.defaultOpenIn == kOPEN_IN_TAB &&
      (gCurrentTab.url == 'about:blank' ||
       (configs.recycleTabUrlPattern &&
        new RegExp(configs.recycleTabUrlPattern).test(gCurrentTab.url)))) {
    searchParams.where = kOPEN_IN_CURRENT;
    return searchParams;
  }

  return searchParams;
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
      doSearch(Object.assign(searchParamsFromEvent(aEvent), {
        engine
      }));
      break;

    case 1:
      doSearch({
        where:    configs.accelActionOpenIn,
        keepOpen: configs.accelActionOpenIn == kOPEN_IN_BACKGROUND_TAB,
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
  doSearch(searchParamsFromEvent(aEvent));
  gField.classList.remove('pasted');
}

function onMouseMove(aEvent) {
  gLastOperatedBy = kOPERATED_BY_MOUSE;

  const oldActive = getActiveEngine();
  if (oldActive)
    oldActive.classList.remove('active');

  const hoverEngine = aEvent.target.closest('.search-engines li');
  if (hoverEngine)
    hoverEngine.classList.add('active');
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
    if (!configs.fillFieldWithSelectionText)
      return;
    const selections = await browser.tabs.executeScript(gCurrentTab.id, {
      code: `(() => {
        const focused = document.hasFocus();

        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
          let selectionText = selection.toString().trim();
          if (selectionText != '')
            return { selection: selectionText, focused };
        }

        var field = document.activeElement;
        if (!field || !field.matches('input, textarea'))
          return { selection: '', focused };

        var selectionText = (field.value || '').substring(field.selectionStart || 0, field.selectionEnd || 0);
        return { selection: selectionText.trim(), focused };
      })();`,
      allFrames: true
    });
    const activeSelection = selections.filter(aSelection => aSelection.focused)[0] || selections[0];
    gPageSelection = activeSelection.selection.trim();
    if (gPageSelection != '') {
      gField.value = gPageSelection;
      gField.select();
    }
    if (gField.value != '')
      gField.classList.add('pasted');
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
    if (configs.lastSearchTime > 0)
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
  var term = gField.value.trim();
  url = url.replace(/%s/gi, encodeURIComponent(term) || '');
  if (term)
    addHistory(term);
  switch (aParams.where) {
    case kOPEN_IN_TAB:
    case kOPEN_IN_BACKGROUND_TAB: {
      let params = {
        active: aParams.where != kOPEN_IN_BACKGROUND_TAB,
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

  if (!configs.closeAfterSearch || aParams.keepOpen)
    return;

  configs.lastSearchTerm = gField.value;
  configs.lastSearchTime = Date.now();

  window.close();
}

function addHistory(aTerm) {
  var history = configs.history;
  var index = history.indexOf(aTerm);
  if (index > -1) {
    history.splice(index, 1);
    let item = gHistory.querySelector(`option[value=${JSON.stringify(aTerm)}]`);
    if (item)
      gHistory.removeChild(item);
  }
  history.unshift(aTerm);
  let item = document.createElement('option');
  item.setAttribute('value', aTerm);
  gHistory.insertBefore(item, gHistory.firstChild);
  history = history.slice(0, configs.maxHistoryCount);
  configs.history = history;
}
