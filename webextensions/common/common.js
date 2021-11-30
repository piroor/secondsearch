/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

var configs;
var gLogContext = '?';

function log(aMessage, ...aArgs)
{
  if (!configs || !configs.debug)
    return;

  var nest   = (new Error()).stack.split('\n').length;
  var indent = '';
  for (let i = 0; i < nest; i++) {
    indent += ' ';
  }
  console.log(`ss<${gLogContext}>: ${indent}${aMessage}`, ...aArgs);
}

async function wait(aTask = 0, aTimeout = 0) {
  if (typeof aTask != 'function') {
    aTimeout = aTask;
    aTask    = null;
  }
  return new Promise((aResolve, aReject) => {
    setTimeout(async () => {
      if (aTask)
        await aTask();
      aResolve();
    }, aTimeout);
  });
}

function nextFrame() {
  return new Promise((aResolve, aReject) => {
    window.requestAnimationFrame(aResolve);
  });
}

configs = new Configs({
  cachedEnginesById: null,
  recentlyUsedEngines: [],
  autocomplete: false,
  history: [],
  maxHistoryCount: 100,
  theme: 'default',
  fillFieldWithSelectionText: true,
  clearFieldAfterSearch: true,
  clearFieldAfterSearchDelay: 5000,
  clearFocusByInput: true,
  lastSearchTerm: '',
  lastSearchTime: 0,
  closeAfterSearch: true,
  recycleBlankCurrentTab: true,
  recycleTabUrlPattern: '^about:(newtab|home|privatebrowsing)$',
  defaultOpenIn: kOPEN_IN_TAB,
  accelActionOpenIn: kOPEN_IN_BACKGROUND_TAB,
  defaultEngine: 'https://www.google.com/search?q=%s',
  favIconProvider: `https://www.google.com/s2/favicons?domain=%s`,
  focusDelay: 150,
  nativeSearchDelayForNewTab: 100,
  smoothScrollDuration: 150,
  newWindowDelay: 1000,
  applyThemeColorToIcon: false,
  configsVersion: 0,
  debug: false
}, {
  localKeys: `
    cachedEnginesById
    recentlyUsedEngines
    theme
    lastSearchTerm
    lastSearchTime
    debug
  `.trim().split('\n').map(aKey => aKey.trim()).filter(aKey => aKey && aKey.indexOf('//') != 0)
});
