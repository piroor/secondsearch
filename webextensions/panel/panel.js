/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

var gField;

window.addEventListener('DOMContentLoaded', () => {
  gField = document.querySelector('#search-field');
  document.addEventListener('keypress', onKeyPress, { capture: true });
}, { once: true });

window.addEventListener('pageshow', () => {
  window.focus();
  setTimeout(() => gField.focus(), 100);
}, { once: true });

window.addEventListener('pagehide', () => {
  document.removeEventListener('keypress', onKeyPress, { capture: true });
}, { once: true });


function onKeyPress(aEvent) {
  console.log('onKeyPress ', aEvent.keyCode);
}
