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

configs.$addObserver(onConfigChanged);
window.addEventListener('DOMContentLoaded', () => {
  browser.commands.getAll().then(aCommands => {
    const fragment = document.createDocumentFragment();
    for (let command of aCommands) {
      const item = document.createElement('li');
      const label = item.appendChild(document.createElement('label'));
      label.textContent = `${command.description || command.name}:`;
      const field = label.appendChild(document.createElement('input'));
      field.setAttribute('type', 'text');
      field.setAttribute('value', command.shortcut);
      field.setAttribute('placeholder', command.shortcut);
      field.addEventListener('input', () => {
        browser.commands.update({
          name:     command.name,
          shortcut: field.value
        });
      });
      fragment.appendChild(item);
    }
    document.getElementById('shortcuts').appendChild(fragment);
    l10n.updateDocument();
  });

  configs.$loaded.then(() => {
    options.buildUIForAllConfigs(document.querySelector('#debug-configs'));
    onConfigChanged('debug');
  });
}, { once: true });

