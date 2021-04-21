/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import Scroll from '/extlib/scroll.js';

/* global gLogContext, configs */ // eslint-disable-line no-unused-vars
/* global kCOMMAND_DO_SEARCH, kCOMMAND_GET_SEARCH_ENGINES */
/* global kOPEN_IN_CURRENT, kOPEN_IN_TAB, kOPEN_IN_BACKGROUND_TAB, kOPEN_IN_WINDOW */

gLogContext = 'Panel';

let gStyleVariables;
let gField;
let gHistory;
let gSearchButton;
let gContainer;
let gRecentlyUsedEngines;
let gAllEngines;
let gActiveEngines;
let gEnginesSwitchers;
let gPageSelection;
let gCurrentTab;

window.addEventListener('DOMContentLoaded', async () => {
  gStyleVariables = document.querySelector('#variables');

  gField = document.querySelector('#search-field');
  gHistory = document.querySelector('#search-history');
  gSearchButton = document.querySelector('#do-search-button');
  gContainer = document.querySelector('#search-engines-container');

  gRecentlyUsedEngines = document.querySelector('#search-engines-by-recently-used');
  gAllEngines          = document.querySelector('#search-engines-by-name');

  gRecentlyUsedEngines.scroll = new Scroll(gRecentlyUsedEngines, {
    duration: configs.smoothScrollDuration
  });
  gAllEngines.scroll = new Scroll(gAllEngines, {
    duration: configs.smoothScrollDuration
  });

  gEnginesSwitchers = {
    toRecentlyUsed: document.querySelector('#switch-to-recently-used'),
    toAll:          document.querySelector('#switch-to-all')
  };
  switchToRecentlyUsedEngines();
}, { once: true });

configs.$loaded.then(() => {
  document.documentElement.dataset.theme = configs.theme;
  for (const term of configs.history) {
    const item = document.createElement('option');
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

  await Promise.all([
    (async () => {
      const recentlyUsedEngines = await browser.runtime.sendMessage({ type: kCOMMAND_GET_SEARCH_ENGINES });
      if (recentlyUsedEngines.length == 0) {
        /*
        Permissions.initUI({
          checkbox: document.getElementById('searchPermission'),
          permission: Permissions.SEARCH_PERMISSION,
          onChange() {
            configs.cachedEnginesById = null;
            location.reload();
          }
        });
        */
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


function onPaste(_event) {
  gField.classList.add('pasted');
}

function onComposition(_event) {
  gField.classList.remove('pasted');
}

let gLastEnterEvent;

function onSubmit(_event) {
  doSearch({
    ...searchParamsFromEvent(gLastEnterEvent),
    save:   true,
    engine: getActiveEngine()
  });
  gLastEnterEvent = null;
}

function onKeyDown(event) {
  if (event.isComposing)
    return;

  gField.classList.remove('pasted');
  if (event.key == 'Enter') {
    gLastEnterEvent = event;
    return;
  }
  gLastEnterEvent = null;

  const noModifiers = (
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.metaKey
  );
  const activeItem = getActiveEngine();
  switch (event.key) {
    case 'Escape':
      if (noModifiers)
        window.close();
      return;

    case 'ArrowLeft':
      if (!event.altKey &&
          (event.ctrlKey || event.metaKey) &&
          !event.shiftKey) {
        switchToRecentlyUsedEngines();
      }
      return;

    case 'ArrowRight':
      if (!event.altKey &&
          (event.ctrlKey || event.metaKey) &&
          !event.shiftKey) {
        switchToAllEngines();
      }
      return;

    case 'ArrowUp':
      if (!noModifiers)
        return;
      if (activeItem) {
        activeItem.classList.remove('active');
        activeItem.setAttribute('aria-selected', 'false');
        const item = activeItem.previousSibling;
        if (item) {
          item.classList.add('active');
          item.setAttribute('aria-selected', 'true');
          item.parentNode.setAttribute('aria-activedescendant', item.id);
          gActiveEngines.scroll.scrollToItem(item);
        }
      }
      else if (gActiveEngines.hasChildNodes()) {
        gActiveEngines.lastChild.classList.add('active');
        gActiveEngines.scroll.scrollToItem(gActiveEngines.lastChild);
      }
      event.stopImmediatePropagation();
      event.preventDefault();
      return;

    case 'ArrowDown':
      if (!noModifiers)
        return;
      if (activeItem) {
        activeItem.classList.remove('active');
        const item = activeItem.nextSibling;
        if (item) {
          item.classList.add('active');
          gActiveEngines.scroll.scrollToItem(item);
        }
      }
      else if (gActiveEngines.hasChildNodes()) {
        gActiveEngines.firstChild.classList.add('active');
        gActiveEngines.scroll.scrollToItem(gActiveEngines.firstChild);
      }
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
  }
}

function onInput(event) {
  if (event.isComposing)
    return;

  const oldActive = getActiveEngine();
  if (oldActive && configs.clearFocusByInput)
    oldActive.classList.remove('active');

  configs.lastSearchTerm = gField.value;
  configs.lastSearchTime = -1;
}

function searchParamsFromEvent(event) {
  const searchParams = {
    where:        configs.defaultOpenIn,
    keepOpen:     false
  };
  if (event.altKey || event.ctrlKey || event.metaKey) {
    searchParams.where    = configs.accelActionOpenIn;
    searchParams.keepOpen = configs.accelActionOpenIn == kOPEN_IN_BACKGROUND_TAB;
    return searchParams;
  }

  if (event.shiftKey) {
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

function onEngineClick(event) {
  let engine = event.target;
  while (engine.nodeType != Node.ELEMENT_NODE ||
         !engine.hasAttribute('data-id')) {
    engine = engine.parentNode;
    if (!engine)
      return;
  }
  switch (event.button) {
    case 0:
      doSearch({
        ...searchParamsFromEvent(event),
        engine
      });
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

function onSwitcherClick(event) {
  switch (event.currentTarget.id) {
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

function onSearchButtonClick(event) {
  doSearch(searchParamsFromEvent(event));
  gField.classList.remove('pasted');
}

function onMouseMove(event) {
  const oldActive = getActiveEngine();
  if (oldActive)
    oldActive.classList.remove('active');

  const hoverEngine = event.target.closest('.search-engines li');
  if (hoverEngine)
    hoverEngine.classList.add('active');
}

function getActiveEngine() {
  return gActiveEngines.querySelector('li.active');
}

function switchToRecentlyUsedEngines() {
  document.documentElement.classList.remove('by-name');
  gActiveEngines = gRecentlyUsedEngines;
  gActiveEngines.scroll.scrollTo({ position: 0, justNow: true });
}

function switchToAllEngines() {
  document.documentElement.classList.add('by-name');
  gActiveEngines = gAllEngines;
  gActiveEngines.scroll.scrollTo({ position: 0, justNow: true });
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

        let selection = window.getSelection();
        if (selection.rangeCount > 0) {
          let selectionText = selection.toString().trim();
          if (selectionText != '')
            return { selection: selectionText, focused };
        }

        let field = document.activeElement;
        if (!field || !field.matches('input, textarea'))
          return { selection: '', focused };

        let selectionText = (field.value || '').substring(field.selectionStart || 0, field.selectionEnd || 0);
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
  catch(_error) {
    // if it is a special tab, we cannot execute script.
    //console.log(error);
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
  const items = document.createDocumentFragment();
  for (const engine of aEngines) {
    const item = document.createElement('li');
    item.id = `${aContainer.id}:engine:${engine.id}`;
    item.setAttribute('data-id', engine.id);
    item.setAttribute('data-url', engine.url);
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');

    const favicon = document.createElement('img');
    favicon.classList.add('favicon');
    if (engine.favIconUrl)
      favicon.setAttribute('src', engine.favIconUrl);
    item.appendChild(favicon);

    const label = document.createElement('span');
    label.classList.add('label');
    label.textContent = engine.title;
    item.appendChild(label);

    items.appendChild(item);
  }
  aContainer.appendChild(items);
}

async function doSearch(aParams = {}) {

  // I don't know why but both "click" and "submit" events are fired when
  // I hit the Enter key with highlighted search engine. So we need to
  // prevent multiple times doSearch()ing.
  if (doSearch.done)
    return;

  doSearch.done = true;

  const item = aParams.engine || getActiveEngine();
  const term = gField.value.trim();
  if (term)
    addHistory(term);

  browser.runtime.sendMessage({
    type:        kCOMMAND_DO_SEARCH,
    engineId:    item && item.getAttribute('data-id'),
    where:       aParams.where,
    term,
    tabId:       gCurrentTab.id,
    openerTabId: gPageSelection && gPageSelection == gField.value ? gCurrentTab.id : null,
    save:        !!(item && (aParams.save || gField.value))
  });

  if (!configs.closeAfterSearch || aParams.keepOpen)
    return;

  configs.lastSearchTerm = gField.value;
  configs.lastSearchTime = Date.now();

  window.close();
}

function addHistory(aTerm) {
  let history = configs.history;
  const index = history.indexOf(aTerm);
  if (index > -1) {
    history.splice(index, 1);
    const item = gHistory.querySelector(`option[value=${JSON.stringify(aTerm)}]`);
    if (item)
      gHistory.removeChild(item);
  }
  history.unshift(aTerm);
  const item = document.createElement('option');
  item.setAttribute('value', aTerm);
  gHistory.insertBefore(item, gHistory.firstChild);
  history = history.slice(0, configs.maxHistoryCount);
  configs.history = history;
}
