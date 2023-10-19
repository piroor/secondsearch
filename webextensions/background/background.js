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

  FAVICON_SIZE: 16,
  VALID_FAVICON_PATTERN: /^(about|app|chrome|data|file|ftp|https?|moz-extension|resource):/,
  DRAWABLE_FAVICON_PATTERN: /^(https?|moz-extension|resource):/,

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
    const promisedCompletes = [];
    for (const bookmark of bookmarks) {
      if (bookmark.type != 'bookmark' ||
          !/%s/i.test(bookmark.url))
        continue;
      if (!bookmark.favIconUrl) {
        promisedCompletes.push((async () => {
          try {
            const url = await this.getFavIconDataURI(bookmark);
            if (url)
              bookmark.favIconUrl = url;
          }
          catch(_e) {
          }
        })());
      }
      bookmark._recentlyUsedIndex = configs.recentlyUsedEngines.indexOf(bookmark.id);
      engines.push(bookmark);
      enginesById[bookmark.id] = bookmark;
    }
    await Promise.all(promisedCompletes);
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

  async getFavIconDataURI(aEngine) {
    const url = this.buildFavIconURI(aEngine);
    if (url && url.startsWith('data:'))
      return url;

    if (!url ||
        !this.VALID_FAVICON_PATTERN.test(url) ||
        !this.DRAWABLE_FAVICON_PATTERN.test(url))
      return null;

    log('getFavIconDataURI: fetch ', url);

    return new Promise((resolve, reject) => {
      const image = new Image();
      if (/^https?:/.test(url))
        image.crossOrigin = 'anonymous';
      image.addEventListener('load', () => {
        this.setupCanvas();
        const context = this.canvas.getContext('2d');
        context.clearRect(0, 0, this.FAVICON_SIZE, this.FAVICON_SIZE);
        context.drawImage(image, 0, 0, this.FAVICON_SIZE, this.FAVICON_SIZE);
        try {
          const dataURI = this.canvas.toDataURL('image/png');
          log('getFavIconDataURI: data = ', dataURI);
          resolve(dataURI);
        }
        catch(error) {
          // it can fail due to security reasons
          log('getFavIconDataURI (after load): ', url, error);
          resolve(url);
        }
      });
      image.addEventListener('error', error => {
        log('getFavIconDataURI: ', url, error);
        reject(error);
      });
      image.src = url;
    });
  },
  setupCanvas() {
    if (this.canvas)
      return;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = this.FAVICON_SIZE;
    this.canvas.setAttribute('style', `
      visibility: hidden;
      pointer-events: none;
      position: fixed
    `);
    document.body.appendChild(this.canvas);
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

  async onBookmarkCreated(aId, aMayBeEngine) {
    if (aMayBeEngine.type != 'bookmark' ||
        !/%s/i.test(aMayBeEngine.url))
      return;
    log('new engine is added: ', aMayBeEngine);
    this.cachedEnginesById[aId] = aMayBeEngine;
    if (!aMayBeEngine.favIconUrl) {
      try {
        aMayBeEngine.favIconUrl = await this.getFavIconDataURI(aMayBeEngine);
      }
      catch(_e) {
      }
    }
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
          if (!bookmark.favIconUrl) {
            try {
              bookmark.favIconUrl = await this.getFavIconDataURI(bookmark);
            }
            catch(_e) {
            }
          }
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

    const useDefaultNativeEngine = !engine && await Permissions.isGranted(Permissions.SEARCH_PERMISSION);
    const isNativeEngine = engine && /^search-engine:/.test(params.engineId);
    log('useDefaultNativeEngine: ', useDefaultNativeEngine);
    log('isNativeEngine: ', isNativeEngine);

    if (useDefaultNativeEngine || isNativeEngine)
      await this.doSearchByNativeEngine(engine, params);
    else
      await this.doSearchByBookmarkEngine(engine, params);

    if (params.save && params.engineId)
      this.onUsed(params.engineId);
  },
  async doSearchByNativeEngine(engine, params) {
    const searchParams = {
      query: params.term
    };
    if (engine)
      searchParams.engine = engine.name;

    log('doSearchByNativeEngine ', engine, params);
    const url = 'about:blank';
    switch (params.where) {
      case kOPEN_IN_TAB:
      case kOPEN_IN_BACKGROUND_TAB: {
        let tabParams = {
          active: params.where != kOPEN_IN_BACKGROUND_TAB,
          url
        };
        if (params.openerTabId)
          tabParams.openerTabId = params.openerTabId;
        const tab = await browser.tabs.create(tabParams);
        searchParams.tabId = tab.id;
        this.nativeSearchTabLastStatus.set(tab.id, null);
        if (configs.newTabDelay > 0)
          await wait(configs.newTabDelay);
      }; break;

      case kOPEN_IN_WINDOW: {
        const window = await browser.windows.create({ url });
        const tab = window.tabs[0];
        searchParams.tabId = tab.id;
        this.nativeSearchTabLastStatus.set(tab.id, null);
        if (configs.newWindowDelay > 0)
          await wait(configs.newWindowDelay);
      }; break;

      default:
        searchParams.tabId = params.tabId;
        break;
    }

    if (this.nativeSearchTabLastStatus.has(searchParams.tabId)) {
      // The new tab will be loaded with "about:bank" twice until it becomes available to be a new search tab,
      // so we cannot do search simply after only one "completely loaded" event.
      await new Promise(async (resolve, _reject) => {
        const startAt = Date.now();
        while (this.nativeSearchTabLastStatus.get(searchParams.tabId) != 'complete' &&
               Date.now() - startAt <= configs.searchTimeout) {
          await wait(100);
        }
        this.nativeSearchTabLastStatus.delete(searchParams.tabId);
        resolve();
      });
    }

    log('browser.search.search() called with params: ', searchParams);
    await browser.search.search(searchParams);
  },
  async doSearchByBookmarkEngine(engine, params) {
    let url = engine ? engine.url : configs.defaultEngine;
    url = url.replace(/%s/gi, encodeURIComponent(params.term) || '');

    log('doSearchByBookmarkEngine ', engine, params);
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
  },

  nativeSearchTabLastStatus: new Map(),
  onTabUpdated(tabId, updateInfo, tab) {
    if (!this.nativeSearchTabLastStatus.has(tabId))
      return;
    this.nativeSearchTabLastStatus.set(tabId, updateInfo.status);
  },
};

configs.$loaded.then(async () => {
  let isInitialInstall = false;
  configs.lastSearchTerm = '';
  browser.bookmarks.onCreated.addListener(SearchEngines.onBookmarkCreated.bind(SearchEngines));
  browser.bookmarks.onRemoved.addListener(SearchEngines.onBookmarkRemoved.bind(SearchEngines));
  browser.bookmarks.onChanged.addListener(SearchEngines.onBookmarkChanged.bind(SearchEngines));
  browser.tabs.onUpdated.addListener(SearchEngines.onTabUpdated.bind(SearchEngines), {
    properties: ['status'],
  });
  if (!configs.cachedEnginesById) {
    log('initial install');
    SearchEngines.reset();
    isInitialInstall = true;
  }
  else {
    log('restore engines');
    SearchEngines.cachedEnginesById = configs.cachedEnginesById || {};
    await SearchEngines.cleanupMissingEngines();
    SearchEngines.recentlyUsedEngines = configs.recentlyUsedEngines || [];
    SearchEngines.updateCache();
  }

  const kCONFIGS_VERSION = 2;
  switch (configs.configsVersion) {
    case 0:
    case 1:
      if (!isInitialInstall)
        SearchEngines.reset(); // clear cache to fetch favicons
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


const mDarkModeMatchMedia = window.matchMedia('(prefers-color-scheme: dark)');

const ORIGINAL_ICONS = {
  16: '/resources/16x16.svg',
  32: '/resources/32x32.svg',
};
const ICONS = JSON.parse(JSON.stringify(ORIGINAL_ICONS));

async function updateIconForBrowserTheme(theme) {
  // generate icons with theme specific color
      if (!theme) {
        const window = await browser.windows.getLastFocused();
        theme = await browser.theme.getCurrent(window.id);
      }

      log('updateIconForBrowserTheme: ', theme);
      if (theme.colors) {
        const actionIconColor = theme.colors.icons || theme.colors.toolbar_text || theme.colors.tab_text || theme.colors.tab_background_text || theme.colors.bookmark_text || theme.colors.textcolor;
        await Promise.all(Array.from(Object.entries(ORIGINAL_ICONS), async ([state, url]) => {
          const response = await fetch(url);
          const body = await response.text();
          const actionIconSource = body.replace(/transparent\s*\/\*\s*TO BE REPLACED WITH THEME COLOR\s*\*\//g, actionIconColor);
          ICONS[state] = `data:image/svg+xml,${escape(actionIconSource)}#toolbar-theme`;
        }));
      }
      else {
        for (const [state, url] of Object.entries(ORIGINAL_ICONS)) {
          ICONS[state] = `${url}#toolbar`;
        }
      }

  log('updateIconForBrowserTheme: applying icons: ', ICONS);

  await browser.browserAction.setIcon({
    path: ICONS,
  });
}

browser.theme.onUpdated.addListener(updateInfo => {
  updateIconForBrowserTheme(updateInfo.theme);
});

mDarkModeMatchMedia.addListener(async _event => {
  updateIconForBrowserTheme();
});

/*
configs.$addObserver(key => {
  switch (key) {
    default;
      break;
  }
});
*/
configs.$loaded.then(() => updateIconForBrowserTheme());
