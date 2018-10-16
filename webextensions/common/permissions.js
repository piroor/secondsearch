/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

const PERMISSIONS = {
  SEARCH: { permissions: ['search'] }
};

async function initPermissionCheckbox(checkbox, permission) {
  try {
    checkbox.checked = await browser.permissions.contains(permission);
    checkbox.addEventListener('change', async () => {
      if (!checkbox.checked) {
        await browser.permissions.remove(permission);
        return;
      }
      checkbox.checked = await browser.permissions.request(permission);
    });
  }
  catch(e) {
    checkbox.setAttribute('disabled', true);
    checkbox.parentNode.setAttribute('disabled', true);
  }
}
