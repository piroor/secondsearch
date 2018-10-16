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

  async reset() {
    log('reset');
    const engines     = [];
    const enginesById = {};
    this.cachedEngines     = [];
    this.cachedEnginesById = {};
    await Promise.all([
      this.collectBookmarksEngines(engines, enginesById),
      this.collectNativeEngines(engines, enginesById)
    ]);
    configs.cachedEnginesById = this.cachedEnginesById = enginesById;
    this.cachedEngines = engines;
    log('engines ', engines);
    this.sort();
  },
  async collectBookmarksEngines(engines, enginesById) {
    const bookmarks = await browser.bookmarks.search({ query: '%s' });
    for (const bookmark of bookmarks) {
      if (bookmark.type != 'bookmark' ||
          !/%s/i.test(bookmark.url))
        continue;
      if (!bookmark.favIconUrl)
        bookmark.favIconUrl = this.buildFavIconURI(bookmark);
      bookmark._recentlyUsedIndex = configs.recentlyUsedEngines.indexOf(bookmark.id);
      engines.push(bookmark);
      enginesById[bookmark.id] = bookmark;
    }
  },
  async collectNativeEngines(engines, enginesById) {
    const available = await Permissions.isGranted(Permissions.SEARCH_PERMISSION);
    if (!available)
      return;
    const searchEngines = await browser.search.get();
    for (const engine of searchEngines) {
      engine.id =
        engine.url = `search-engine:${engine.name}`;
      engine.title = engine.name;
      engine._recentlyUsedIndex = configs.recentlyUsedEngines.indexOf(engine.id);
      engines.push(engine);
      enginesById[engine.id] = engine;
    }
  },

  async updateNativeEngines() {
    const engines     = [];
    const enginesById = [];
    await this.collectNativeEngines(engines, enginesById);

    let updated = false;

    // handle removed engines
    for (const id of Object.keys(this.cachedEnginesById)) {
      if (!/search-engine:/.test(id) ||
          id in enginesById)
        continue;
      delete this.cachedEnginesById[id];
      updated = true;
    }

    // handle added engines
    for (const engine of engines) {
      if (engine.id in this.cachedEnginesById)
        continue;
      this.cachedEnginesById[engine.id] = engine;
      updated = true;
    }

    if (updated) {
      configs.cachedEnginesById = this.cachedEnginesById
      this.updateCache();
    }
  },

  buildFavIconURI(aEngine) {
    const uriMatch = aEngine.url.match(/^(\w+:\/\/[^\/]+)/);
    if (!uriMatch)
      return null;
    return configs.favIconProvider.replace(/%s/gi, uriMatch[1]);
  },

  updateCache() {
    this.cachedEngines = [];
    for (const id of Object.keys(this.cachedEnginesById)) {
      this.cachedEngines.push(this.cachedEnginesById[id]);
    }
    SearchEngines.sort();
  },

  sort() {
    log('sort');
    for (const id of Object.keys(this.cachedEnginesById)) {
      const engine = this.cachedEnginesById[id];
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
    if (!aMayBeEngine.favIconUrl)
      aMayBeEngine.favIconUrl = this.buildFavIconURI(aMayBeEngine);
    configs.cachedEnginesById = this.cachedEnginesById;
    this.updateCache();
  },

  onBookmarkRemoved(aId, aRemoveInfo) {
    if (aId in this.cachedEnginesById) {
      log('engine is removed: ', this.cachedEnginesById[aId]);
      delete this.cachedEnginesById[aId];
      configs.cachedEnginesById = this.cachedEnginesById;
      this.updateCache();
    }
  },

  onBookmarkChanged(aId, aChangeInfo) {
    if ('url' in aChangeInfo) {
      if (aId in this.cachedEnginesById &&
          !/%s/i.test(aChangeInfo.url)) {
        log('engine is removed by changing URL: ', this.cachedEnginesById[aId]);
        delete this.cachedEnginesById[aId];
        configs.cachedEnginesById = this.cachedEnginesById;
        this.updateCache();
      }
      else if (/%s/i.test(aChangeInfo.url)) {
        (async () => {
          let bookmark = await browser.bookmarks.get(aId);
          if (Array.isArray(bookmark))
            bookmark = bookmark[0];
          log('engine is added by changing URL: ', bookmark);
          this.cachedEnginesById[aId] = bookmark;
          if (!bookmark.favIconUrl)
            bookmark.favIconUrl = this.buildFavIconURI(bookmark);
          configs.cachedEnginesById = this.cachedEnginesById;
          this.updateCache();
        })();
      }
    }
    if ('title' in aChangeInfo &&
        aId in this.cachedEnginesById) {
      this.cachedEnginesById[aId].title = aChangeInfo.title;
      configs.cachedEnginesById = this.cachedEnginesById;
      this.updateCache();
    }
  },

  async cleanupMissingEngines() {
    log('cleanupMissingEngines');
    const ids = Object.keys(this.cachedEnginesById).sort();
    log('ids: ', ids);
    let bookmarks = await Promise.all(ids.map(aId => browser.bookmarks.get(aId).catch(aError => null)));
    if (bookmarks.length > 0) {
      if (Array.isArray(bookmarks[0]))
        bookmarks = Array.prototype.concat.apply([], bookmarks);
      bookmarks = bookmarks.filter(aBookmark => !!aBookmark).map(aBookmark => aBookmark.id).sort();
    }
    log('actual bookmarks: ', bookmarks);
    if (ids.join('\n') != bookmarks.join('\n')) {
      for (const id of ids) {
        if (bookmarks.indexOf(id) > -1)
          continue;
        log('delete ', id);
        delete this.cachedEnginesById[id];
      }
      configs.cachedEnginesById = this.cachedEnginesById;
    }
  },

  async doSearch(params) {
    const engine = params.engineId ? this.cachedEnginesById[params.engineId] : null;
    log('do search by engine: ', engine);

    let url = engine ? engine.url : configs.defaultEngine;
    url = url.replace(/%s/gi, encodeURIComponent(params.term) || '');

    switch (params.where) {
      case kOPEN_IN_TAB:
      case kOPEN_IN_BACKGROUND_TAB: {
        let tabParams = {
          active: params.where != kOPEN_IN_BACKGROUND_TAB,
          url
        };
        if (params.openerTabId)
          tabParams.openerTabId = params.openerTabId;
        await browser.tabs.create(tabParams);
      }; break;

      case kOPEN_IN_WINDOW:
        await browser.windows.create({ url });
        break;

      default:
        await browser.tabs.update(params.tabId, { url });
        break;
    }
    if (params.save && params.engineId)
      this.onUsed(params.engineId);
  }
};

configs.$loaded.then(async () => {
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
    await SearchEngines.cleanupMissingEngines();
    SearchEngines.recentlyUsedEngines = configs.recentlyUsedEngines || [];
    SearchEngines.updateCache();
  }

  const kCONFIGS_VERSION = 1;
  switch (configs.configsVersion) {
    case 0:
      ShortcutCustomizeUI.setDefaultShortcuts();
  }
  configs.configsVersion = kCONFIGS_VERSION;

  configs.$addObserver(key => {
    switch (key) {
      case 'cachedEnginesById':
        if (!configs.cachedEnginesById)
          SearchEngines.reset();
        break;

      default:
        break;
    }
  });
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message ||
      typeof message.type != 'string' ||
      message.type.indexOf('secondsearch:') != 0)
    return;

  switch (message.type) {
    case kCOMMAND_GET_SEARCH_ENGINES:
      log('get engines , SearchEngines.cachedEngines');
      return SearchEngines.updateNativeEngines()
               .then(() => SearchEngines.cachedEngines);

    case kCOMMAND_DO_SEARCH:
      log('do search ', message);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          SearchEngines.doSearch(message).then(resolve);
        }, 100);
      });
  }
});
