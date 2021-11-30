/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

gLogContext = 'Options';
var options = new Options(configs);

function onConfigChanged(aKey) {
  switch (aKey) {
    case 'debug':
      if (configs.debug)
        document.documentElement.classList.add('debugging');
      else
        document.documentElement.classList.remove('debugging');
      break;
  }
}

async function updateDefaultEngineUI() {
  const engineField = document.getElementById('defaultEngine');
  const tabDelayField = document.getElementById('newTabDelay');
  const windowDelayField = document.getElementById('newWindowDelay');
  if (await Permissions.isGranted(Permissions.SEARCH_PERMISSION)) {
    engineField.setAttribute('disabled', true);
    engineField.parentNode.setAttribute('disabled', true);
    tabDelayField.removeAttribute('disabled');
    tabDelayField.parentNode.removeAttribute('disabled');
    windowDelayField.removeAttribute('disabled');
    windowDelayField.parentNode.removeAttribute('disabled');
  }
  else {
    engineField.removeAttribute('disabled');
    engineField.parentNode.removeAttribute('disabled');
    tabDelayField.setAttribute('disabled', true);
    tabDelayField.parentNode.setAttribute('disabled', true);
    windowDelayField.setAttribute('disabled', true);
    windowDelayField.parentNode.setAttribute('disabled', true);
  }
}

configs.$addObserver(onConfigChanged);
window.addEventListener('DOMContentLoaded', async () => {
  await configs.$loaded;

  options.buildUIForAllConfigs(document.querySelector('#debug-configs'));
  onConfigChanged('debug');

  /*
  const searchPermissionCheck = document.getElementById('searchPermission');
  Permissions.initUI({
    checkbox: searchPermissionCheck,
    permission: Permissions.SEARCH_PERMISSION,
    onChange() {
      configs.cachedEnginesById = null;
      updateDefaultEngineUI();
    }
  });
  */
  updateDefaultEngineUI();

  const clearCache = () => {
    configs.cachedEnginesById = null;
  };
  const clearCacheButton = document.getElementById('clearCache');
  clearCacheButton.addEventListener('click', event => {
    if (event.button == 0)
      clearCache();
  });
  clearCacheButton.addEventListener('keydown', event => {
    if (event.key =='Enter')
      clearCache();
  });

  document.documentElement.classList.add('initialized');
}, { once: true });

