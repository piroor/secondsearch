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
    log('reset');
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
    return configs.favIconProvider.replace(/%s/gi, uriMatch[1]);
  },

  updateCache() {
    this.cachedEngines = [];
    for (let id of Object.keys(this.cachedEnginesById)) {
      this.cachedEngines.push(this.cachedEnginesById[id]);
    }
    SearchEngines.sort();
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
  },

  onBookmarkCreated(aId, aMayBeEngine) {
    if (aMayBeEngine.type != 'bookmark' ||
        !/%s/i.test(aMayBeEngine.url))
      return;
    log('new engine is added: ', aMayBeEngine);
    this.cachedEnginesById[aId] = aMayBeEngine;
    this.updateCache();
  },

  onBookmarkRemoved(aId, aRemoveInfo) {
    if (aId in this.cachedEnginesById) {
      log('engine is removed: ', this.cachedEnginesById[aId]);
      delete this.cachedEnginesById[aId];
      this.updateCache();
    }
  },

  onBookmarkChanged(aId, aChangeInfo) {
    if ('url' in aChangeInfo) {
    if (aId in this.cachedEnginesById &&
        !/%s/i.test(aChangeInfo.url)) {
      log('engine is removed by changing URL: ', this.cachedEnginesById[aId]);
      delete this.cachedEnginesById[aId];
      this.updateCache();
    }
    else if (/%s/i.test(aChangeInfo.url)) {
      (async () => {
        let bookmark = await browser.bookmarks.get(aId);
        if (Array.isArray(bookmark))
          bookmark = bookmark[0];
        log('engine is added by changing URL: ', bookmark);
        this.cachedEnginesById[aId] = bookmark;
        this.updateCache();
      })();
    }
    }
    if ('title' in aChangeInfo &&
        aId in this.cachedEnginesById) {
      this.cachedEnginesById[aId].title = aChangeInfo.title;
      this.updateCache();
    }
  }
};

configs.$loaded.then(() => {
  configs.lastSearchTerm = '';
  browser.bookmarks.onCreated.addListener(SearchEngines.onBookmarkCreated.bind(SearchEngines));
  browser.bookmarks.onRemoved.addListener(SearchEngines.onBookmarkRemoved.bind(SearchEngines));
  browser.bookmarks.onChanged.addListener(SearchEngines.onBookmarkChanged.bind(SearchEngines));
  if (!configs.cachedEnginesById) {
    log('initial install');
    SearchEngines.reset();
  }
  else {
    log('restore engines');
    SearchEngines.cachedEnginesById = configs.cachedEnginesById || {};
    SearchEngines.recentlyUsedEngines = configs.recentlyUsedEngines || [];
    SearchEngines.updateCache();
  }
});

browser.runtime.onMessage.addListener((aMessage, aSender) => {
  if (!aMessage ||
      typeof aMessage.type != 'string' ||
      aMessage.type.indexOf('secondsearch:') != 0)
    return;

  switch (aMessage.type) {
    case kCOMMAND_GET_SEARCH_ENGINES:
      log('get engines , SearchEngines.cachedEngines');
      return Promise.resolve(SearchEngines.cachedEngines);

    case kCOMMAND_NOTIFY_SEARCH_ENGINE_USED:
      log(`on used ${aMessage.id}`);
      SearchEngines.onUsed(aMessage.id);
      break;
  }
});
