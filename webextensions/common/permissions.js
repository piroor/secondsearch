/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

const Permissions = {
  SEARCH_PERMISSION: { permissions: ['search'] },

  async isGranted(permission) {
    try {
      return browser.permissions.contains(permission);
    }
    catch(e) {
      return false;
    }
  },

  async initUI(params = {}) {
    const checkbox   = params.checkbox;
    const permission = params.permission;
    const onChange   = params.onChange;
    try {
      checkbox.checked = await browser.permissions.contains(permission);
      let lastState = checkbox.checked;
      checkbox.addEventListener('change', async () => {
        if (!checkbox.checked) {
          await browser.permissions.remove(permission);
        }
        else {
          checkbox.checked = await browser.permissions.request(permission);
        }
        if (lastState == checkbox.checked)
          return;
        if (typeof onChange == 'function')
          onChange();
        lastState = checkbox.checked;
      });
    }
    catch(e) {
      checkbox.setAttribute('disabled', true);
      checkbox.parentNode.setAttribute('disabled', true);
    }
  }
};
