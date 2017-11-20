/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

const SearchEngines = {
  cache: null,

  reset: async function() {
    var bookmarks = await browser.bookmarks.search({ query: '%s' });
    var engines = [];
    for (let bookmark of bookmarks) {
      if (bookmark.type != 'bookmark' ||
          !/%s/i.test(bookmark.url))
        continue;
      if (!bookmark.favIconUrl)
        bookmark.favIconUrl = this.buildFavIconURI(bookmark);
      engines.push(bookmark);
    }
    engines.sort((aA, aB) => aA.title > aB.title);
    this.cache = engines;
  },

  buildFavIconURI(aEngine) {
    var uriMatch = aEngine.url.match(/^(\w+:\/\/[^\/]+)/);
    if (!uriMatch)
      return null;
    return `https://www.google.com/s2/favicons?domain=${uriMatch[1]}`;
  }
};
SearchEngines.reset();

browser.runtime.onMessage.addListener((aMessage, aSender) => {
  if (!aMessage ||
      typeof aMessage.type != 'string' ||
      aMessage.type.indexOf('secondsearch:') != 0)
    return;

  switch (aMessage.type) {
    case kCOMMAND_GET_SEARCH_ENGINES:
      return Promise.resolve(SearchEngines.cache);
  }
});
