/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import * as Constants from './constants.js';

import Configs from '/extlib/Configs.js';

let mLogContext = '?';

export const configs = new Configs({
  cachedEnginesById:          null,
  recentlyUsedEngines:        [],
  autocomplete:               false,
  history:                    [],
  maxHistoryCount:            100,
  theme:                      'default',
  iconColor:                  'auto',
  fillFieldWithSelectionText: true,
  clearFieldAfterSearch:      true,
  clearFieldAfterSearchDelay: 5000,
  clearFocusByInput:          true,
  lastSearchTerm:             '',
  lastSearchTime:             0,
  closeAfterSearch:           true,
  recycleBlankCurrentTab:     true,
  recycleTabUrlPattern:       '^about:(newtab|home|privatebrowsing)$',
  defaultOpenIn:              Constants.kOPEN_IN_TAB,
  accelActionOpenIn:          Constants.kOPEN_IN_BACKGROUND_TAB,
  defaultEngine:              'https://www.google.com/search?q=%s',
  favIconProvider:            `https://www.google.com/s2/favicons?domain=%s`,
  focusDelay:                 150,
  smoothScrollDuration:       150,
  newWindowDelay:             1000,
  newTabDelay:                100,
  searchTimeout:              2000,
  applyThemeColorToIcon:      false,
  configsVersion:             0,
  debug:                      false
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

export function setLogContext(context) {
  mLogContext = context;
}

export function log(aMessage, ...aArgs) {
  if (!configs.debug)
    return;

  const nest = (new Error()).stack.split('\n').length;
  let indent = '';
  for (let i = 0; i < nest; i++) {
    indent += ' ';
  }
  console.log(`ss<${mLogContext}>: ${indent}${aMessage}`, ...aArgs);
}

export async function wait(task = 0, timeout = 0) {
  if (typeof task != 'function') {
    timeout = task;
    task = null;
  }
  return new Promise((resolve, _reject) => {
    setTimeout(async () => {
      if (task)
        await task();
      resolve();
    }, timeout);
  });
}

export function nextFrame() {
  return new Promise((resolve, _reject) => {
    window.requestAnimationFrame(resolve);
  });
}

const RTL_LANGUAGES = new Set([
  'ar',
  'he',
  'fa',
  'ur',
  'ps',
  'sd',
  'ckb',
  'prs',
  'rhg',
]);

export function isRTL() {
  const lang = (
    navigator.language ||
    navigator.userLanguage ||
    //(new Intl.DateTimeFormat()).resolvedOptions().locale ||
    ''
  ).split('-')[0];
  return RTL_LANGUAGES.has(lang);
}
