/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

gLogContext = 'BG';

const SearchEngines = {
  cachedEngines: null,
  cachedEnginesById: null,
  recentlyUsedEngines: [],

  reset: async function() {
    var bookmarks = await browser.bookmarks.search({ query: '%s' });
    var engines = [];
    this.cachedEnginesById = {};
    for (let bookmark of bookmarks) {
      if (bookmark.type != 'bookmark' ||
          !/%s/i.test(bookmark.url))
        continue;
      if (!bookmark.favIconUrl)
        bookmark.favIconUrl = this.buildFavIconURI(bookmark);
      bookmark._recentlyUsedIndex = configs.recentlyUsedEngines.indexOf(bookmark.id);
      engines.push(bookmark);
      this.cachedEnginesById[bookmark.id] = bookmark;
    }
    configs.cachedEnginesById = this.cachedEnginesById;
    this.cachedEngines = engines;
    this.sort();
  },

  buildFavIconURI(aEngine) {
    var uriMatch = aEngine.url.match(/^(\w+:\/\/[^\/]+)/);
    if (!uriMatch)
      return null;
    return `https://www.google.com/s2/favicons?domain=${uriMatch[1]}`;
  },

  sort() {
    log('sort');
    for (let id of Object.keys(this.cachedEnginesById)) {
      let engine = this.cachedEnginesById[id];
      engine._recentlyUsedIndex = this.recentlyUsedEngines.indexOf(id);
    }
    log('recentlyUsedEngines sorted');
    this.cachedEngines.sort((aA, aB) =>
      aA._recentlyUsedIndex < 0 && aB._recentlyUsedIndex > -1 ?
        1 :
        aA._recentlyUsedIndex > -1 && aB._recentlyUsedIndex < 0 ?
          -1 :
          aA._recentlyUsedIndex - aB._recentlyUsedIndex ||
            aA.title > aB.title);
    log('cachedEngines sorted');
  },

  onUsed(aRecentlyUsedId) {
    this.recentlyUsedEngines = this.recentlyUsedEngines.filter(aId => aId != aRecentlyUsedId);
    this.recentlyUsedEngines.unshift(aRecentlyUsedId);
    log('updated recently used engines: ', this.recentlyUsedEngines);
    configs.recentlyUsedEngines = this.recentlyUsedEngines;
    this.sort();
  }
};

configs.$loaded.then(() => {
  if (!configs.cachedEnginesById) {
    log('initial install');
    SearchEngines.reset();
  }
  else {
    log('restore engines');
    SearchEngines.cachedEnginesById = configs.cachedEnginesById || {};
    SearchEngines.cachedEngines = [];
    for (let id of Object.keys(SearchEngines.cachedEnginesById)) {
      SearchEngines.cachedEngines.push(SearchEngines.cachedEnginesById[id]);
    }
    SearchEngines.recentlyUsedEngines = configs.recentlyUsedEngines || [];
    SearchEngines.sort();
  }
});

browser.runtime.onMessage.addListener((aMessage, aSender) => {
  if (!aMessage ||
      typeof aMessage.type != 'string' ||
      aMessage.type.indexOf('secondsearch:') != 0)
    return;

  switch (aMessage.type) {
    case kCOMMAND_GET_SEARCH_ENGINES:
      return Promise.resolve(SearchEngines.cachedEngines);

    case kCOMMAND_NOTIFY_SEARCH_ENGINE_USED:
      SearchEngines.onUsed(aMessage.id);
      break;
  }
});
