var EXPORTED_SYMBOLS = ['SecondSearchSearchbar', 'SecondSearchLocationbar'];

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://secondsearch-modules/inherit.jsm');
Cu.import('resource://secondsearch-modules/base.js');
Cu.import('resource://gre/modules/Services.jsm');

function SecondSearchBrowser(aWindow) 
{
	this.window = aWindow;
	this.window.addEventListener('DOMContentLoaded', this, false);
	this.window.SecondSearchWindowHelper.services[this.name] = this;
}
SecondSearchBrowser.prototype = inherit(SecondSearchBase.prototype, {
	name : 'SecondSearchBrowser',
	toolbarItemId : null,
	
	get currentURI() 
	{
		var b = this.browser;
		var uri = b.currentURI;
		return (uri && uri.spec) ? uri.spec : 'about:blank' ;
	},
 
	canOpenNewTab : function SSBrowser_canOpenNewTab(aURI, aWhere, aEvent) 
	{
		if (this.browser.localName != 'tabbrowser') return false;

		var newTabPref = this.openintab;
		// old Tab Mix Plus
		if ('TM_init' in this.window) {
			var TMPPref = this.getPref('extensions.tabmix.opentabfor.search');
			if (TMPPref !== null) newTabPref = TMPPref;
		}

		var newTabAction = !aEvent ?
				false :
				(
					(aEvent.type.indexOf('key') == 0 && aEvent.altKey) ||
					(aEvent.type == 'click' && aEvent.button == 1)
				);
		var shouldRecycle = this.reuseBlankTab && (this.window.isBlankPageURL ? this.window.isBlankPageURL(this.currentURI) : (this.currentURI == 'about:blank'));

		// "foreground" and "background" are specified by Tab Utilities.
		// https://addons.mozilla.org/firefox/addon/tab-utilities/
		var newTabOption = /^tab|^(foreground|background)$/.test(String(aWhere));

		return (
				(newTabAction ? !newTabPref : (newTabPref && !shouldRecycle) ) &&
				(!aWhere || newTabOption) &&
				(!aURI || aURI.indexOf('javascript:') != 0)
			);
	},
 
	isInVisibleContainer : function SSBrowser_isInVisibleContainer() 
	{
		var searchbar = this.searchbar;
		return searchbar && this.evaluateXPath(
				'ancestor::*[(local-name()="panel" and @panelopen="true") or local-name()="toolbar"]',
				searchbar,
				XPathResult.BOOLEAN_TYPE
			).booleanValue;
	},
 
/* preference values */ 
	
	get historyNum() 
	{
		var val = this.getPref('secondsearch.recentengines.num');
		if (val === null) {
			val = this.defaultHistoryNum;
			this.setPref('secondsearch.recentengines.num', val);
		}
		return val;
	},
	defaultHistoryNum : 3,
 
	get shouldShowKeywords() 
	{
		var val = this.getPref('secondsearch.keyword.show');
		if (val === null) {
			val = this.defaultShouldShowKeywords;
			this.setPref('secondsearch.keyword.show', val);
		}
		return val;
	},
	defaultShouldShowKeywords : true,
 
	get switchBlankInput() 
	{
		var val = this.getPref('secondsearch.switch.blank_input');
		if (val === null) {
			val = this.defaultSwitch;
			this.setPref('secondsearch.switch.blank_input', val);
		}
		return val;
	},
	defaultSwitch : true,
 
	get openintab() 
	{
		var val = this.getPref('browser.search.openintab');
		if (val === null) {
			val = this.defaultOpenintab;
			this.setPref('browser.search.openintab', val);
		}
		return val;
	},
	defaultOpenintab : false,
 
	get loadInBackground() 
	{
		var val = this.getPref('secondsearch.loadInBackground');
		if (val === null) {
			val = this.getPref('browser.tabs.loadDivertedInBackground') || false;
			this.setPref('secondsearch.loadInBackground', val);
		}
		return val;
	},
 
	get reuseBlankTab() 
	{
		var val = this.getPref('secondsearch.reuse_blank_tab');
		if (val === null) {
			val = this.defaultReuseBlankTab;
			this.setPref('secondsearch.reuse_blank_tab', val);
		}
		return val;
	},
	defaultReuseBlankTab : true,
  
/* elements */ 
	
	get searchbar() 
	{
		return null;
	},
 
	get textbox() 
	{
		var bar = this.searchbar;
		return bar ? (
				bar.textbox ||
				(bar.localName == 'textbox' ? bar : null ) /* location bar*/
			) : null ;
	},
 
	get allMenuItem() 
	{
		return this.document.getElementById('secondsearch_popup_all');
	},
 
	get engineButton() 
	{
		var bar = this.searchbar;
		return bar ? (
				bar.searchButton ||
				this.document.getElementById('page-proxy-stack') || /* location bar */
				this.document.getElementById('identity-box') /* location bar, Firefox 16 and later */
			) : null ;
	},
 
	get canClearAfterSearch() 
	{
		return this.searchbar.localName == 'searchbar';
	},
 
	get canFitPopupToSearchField() 
	{
		return this.searchbar.localName == 'searchbar';
	},
  
/* UI */ 
	
	initAllEngines : function SSBrowser_initAllEngines(aPopup, aParent, aReverse) 
	{
		var popup  = aPopup || this.popup;
		var parent = aParent || null;

		var shouldLoadAsURI = popup.shownBy == this.SHOWN_BY_DROP && this.droppedURI;

		var engines = this.engines
			.filter(function(aEngine) {
				return (
					!parent ||
					!this.evaluateXPath('child::*[@engineId="'+aEngine.id+'"]', parent).snapshotLength
				);
			}, this);

		var keywords = this.keywords
			.filter(function(aKeyword) {
				return (
					!parent ||
					!this.evaluateXPath('child::*[@engineId="'+aKeyword.id+'"]', parent).snapshotLength
				);
			}, this);


		var items = engines.map(function(aEngine) {
				return this.createItemForEngine(aEngine);
			}, this);

		if (keywords.length) {
			if (items.length)
				items.push(this.document.createElement('menuseparator'));
			items = items.concat(
				keywords.map(function(aEngine) {
					return this.createItemForEngine(aEngine);
				}, this)
			);
		}

		if (shouldLoadAsURI) {
			if (items.length)
				items.unshift(this.document.createElement('menuseparator'));
			var item = this.document.createElement('menuitem');
			item.setAttribute('label', popup.getAttribute('labelLoadAsURI'));
			item.setAttribute('engineId', this.kLOAD_AS_URI);
			items.unshift(item);
		}

		if (items.length)
			items[0].setAttribute('_moz-menuactive', 'true');


		var range = this.document.createRange();
		range.selectNodeContents(popup);
		if (popup.hasChildNodes()) {
			if (popup.firstChild.localName == 'menu') {
				range.setStartAfter(popup.firstChild);
			}
			else if (popup.lastChild.localName == 'menu') {
				range.setEndBefore(popup.lastChild);
			}
		}
		range.deleteContents();

		range.selectNodeContents(popup);
		if (aReverse) {
			items = items.reverse();
			range.collapse(false);
		}
		else {
			range.collapse(true);
		}

		var fragment = this.document.createDocumentFragment();
		items.forEach(function(aItem) {
			fragment.appendChild(aItem);
		});
		range.insertNode(fragment);
		range.detach();
	},
	
	createItemForEngine : function SSBrowser_createItemForEngine(aEngine, aLabel) 
	{
		var item = this.document.createElement('menuitem');
		item.setAttribute('label', aLabel || aEngine.name);
		item.setAttribute('engineId', aEngine.id);
		item.setAttribute('class', 'menuitem-iconic searchbar-engine-menuitem');
		item.setAttribute('tooltiptext', this.searchStringBundle.formatStringFromName('searchtip', [aEngine.name], 1));
		if (aEngine.keyword)
			item.setAttribute('keyword', aEngine.keyword);
		if (aEngine.icon) {
			item.setAttribute('src', aEngine.icon);
			this.addIconCache(aEngine.id, aEngine.icon);
		}
		return item;
	},
 
	getFaviconForPage : function SSBrowser_getFaviconForPage(aURI) 
	{
		var uri = this.makeURIFromSpec(aURI);
		var revHost;
		try {
			revHost = uri.host.split('').reverse().join('');
		}
		catch(e) {
		}
		if (!revHost) return this.FaviconService.defaultFavicon.spec;

		var statement = this._getStatement(
				'getFaviconForPage',
				'SELECT f.url' +
				'  FROM moz_favicons f' +
				'       JOIN moz_places p ON p.favicon_id = f.id' +
				' WHERE p.rev_host = ?1' +
				' ORDER BY p.frecency'
			);
		var result;
		try {
			statement.bindStringParameter(0, revHost+'.');
			while (statement.executeStep())
			{
				result = statement.getString(0);
				if (!this.FaviconService.isFailedFavicon(this.makeURIFromSpec(result)))
					break;
			}
		}
		finally {
			statement.reset();
		}
		return result ? 'moz-anno:favicon:'+result : '' ;
	},
	
	makeURIFromSpec : function SSBrowser_makeURIFromSpec(aURI) 
	{
		var newURI;
		aURI = aURI || '';
		if (aURI && String(aURI).indexOf('file:') == 0) {
			var fileHandler = Services.io.getProtocolHandler('file')
					.QueryInterface(Ci.nsIFileProtocolHandler);
			var tempLocalFile = fileHandler.getFileFromURLSpec(aURI);
			newURI = Services.io.newFileURI(tempLocalFile);
		}
		else {
			newURI = Services.io.newURI(aURI || 'about:blank', null, null);
		}
		return newURI;
	},
	

    
	addIconCache : function SSBrowser_addIconCache(aKey, aURI) 
	{
		/* create a dummy element, because Firefox forgets image data
		   from the memory if no more element shows the image. */
		var id = 'secondsearch_cached_icon_'+encodeURIComponent(aKey);
		var oldCache = this.document.getElementById(id);
		if (oldCache) {
			if (oldCache.getAttribute('src') == aURI) return;
			oldCache.parentNode.removeChild(oldCache);
		}

		var cache = this.document.createElement('image');
		cache.setAttribute('id', id);
		cache.setAttribute('src', aURI);
		this.document.getElementById('secondsearch_cached_icons').appendChild(cache);
	},
 
	initRecentEngines : function SSBrowser_initRecentEngines(aPopup) 
	{
		var popup = aPopup || this.popup;

		var current = this.getCurrentEngine();
		if (current && this.isEngineInRecentList(current))
			this.removeEngineFromRecentList(current);

		var engines = this.getRecentEngines();
		if (popup.shownBy == this.SHOWN_BY_DROP) {
			if (current) {
				engines.unshift(current);
			}
			else if (this.droppedURI) {
				engines.unshift(null);
				engines.unshift({
					label : popup.getAttribute('labelLoadAsURI'),
					id    : this.kLOAD_AS_URI
				});
			}
		}

		var range = this.document.createRange();
		range.selectNodeContents(popup);
		if (popup.firstChild.localName == 'menu') {
			range.setStartAfter(popup.firstChild);
		}
		else if (popup.lastChild.localName == 'menu') {
			range.setEndBefore(popup.lastChild);
		}
		range.deleteContents();

		range.selectNodeContents(popup);
		if (this.popupPosition == 0) { // above
			engines.reverse();
			range.collapse(false);
		}
		else { // below
			range.collapse(true);
		}

		var template = popup.getAttribute('labelTemplate');
		var fragment = this.document.createDocumentFragment();
		engines.forEach(function(aEngine) {
			if (!aEngine) {
				fragment.appendChild(this.document.createElement('menuseparator'));
				return;
			}
			fragment.appendChild(this.createItemForEngine(
				aEngine,
				aEngine.label || template.replace(/\%s/i, (aEngine.name || ''))
			));
		}, this);

		range.insertNode(fragment);
		range.detach();
	},
 
	switchTo : function SSBrowser_switchTo(aEngine) 
	{
		var bar = this.searchbar;
		if (bar.localName != 'searchbar') return;

		var current = this.getCurrentEngine();
		if (!current) return;

		if (current.name != aEngine.name) {
			this.removeEngineFromRecentList(aEngine);
			bar.currentEngine = this.getSearchEngineFromName(aEngine.name);
			this.addEngineToRecentList(current);
		}
		var box = this.textbox;
		box.focus();
		box.select();
	},
 
	get popupHeight() 
	{
		return (this.popupType == 0) ?
			(this.getPref('secondsearch.recentengines.list') || '').split('|').length :
			(this.searchEngines.length + this.keywords.length) ;
	},
 
	initEmptySearchBar : function SSBrowser_initEmptySearchBar() 
	{
		if ('_displayCurrentEngine' in this.textbox)
			this.textbox._displayCurrentEngine();
	},
 
	initPopup : function SSBrowser_initPopup() 
	{
		var popup = this.popup;
		var typeFlag = this.popupType;
		if (typeFlag == 0) {
			this.initRecentEngines(popup);
			this.initAllEngines(this.allMenuItem.firstChild, popup);
			this.allMenuItem.removeAttribute('hidden');
		}
		else {
			this.initAllEngines(popup, null, typeFlag == 2);
			this.allMenuItem.setAttribute('hidden', true);
		}
	},
	lastPopupType : -1,
 
	destroyPopup : function SSBrowser_destroyPopup() 
	{
		try {
			this.allMenuItem.hidePopup();
		}
		catch(e) {
		}
	},
  
/* update searchbar */ 
	
	initBar : function SSBrowser_initBar() 
	{
		if (!this.initBarBase()) return;

		var search = this.searchbar;
		var textbox = this.textbox;

		this.addPrefListener(this);

		this.engineButton.addEventListener('contextmenu', this, true);

		textbox.disableAutoComplete = (this.popupPosition == 1);

		if (!textbox.__secondsearch__onTextEntered) {
			textbox.__secondsearch__onTextEntered = textbox.onTextEntered;
			textbox.onTextEntered = this.onTextEntered.bind(this);

			textbox.__secondsearch__onKeyPress = textbox.onKeyPress;
			textbox.onKeyPress = this.onTextboxKeyPress.bind(this);
		}

		this.window.SecondSearchWindowHelper.initBar(this);

		this.window.setTimeout(function(aSelf) {
			aSelf.testOpenPopup();
		}, 1000, this);
	},
	
	testOpenPopup : function SSBrowser_testOpenPopup() 
	{
		// ドラッグ中の最初のメニュー展開に何故か失敗するので、この時点で一度試行しておく
		this.popup.style.opacity = 0;
		this.popup.openPopupAtScreen(0, 0, false);
		var popup = this.allMenuItem .firstChild;
		this.window.setTimeout(function(aSelf) {
			popup.style.opacity = 0;
			popup.openPopupAtScreen(0, 0, false);
			popup.hidePopup();
			popup.style.opacity = 1;
			aSelf.popup.hidePopup();
			aSelf.popup.style.opacity = 1;
		}, 10, this);
	},
 
	onTextEntered : function SSBrowser_onTextEntered(aEvent) 
	{
		if (this.getCurrentItem()) {
			return false;
		}
		else {
			var retVal = this.textbox.__secondsearch__onTextEntered(aEvent);
			this.clearAfterSearch();
			return retVal;
		}
	},
 
	onTextboxKeyPress : function SSBrowser_onTextboxKeyPress(aEvent) 
	{
		const nsIDOMKeyEvent = Ci.nsIDOMKeyEvent;

		var normalOpenKeys = (
				(
					(this.autoShowInput && this.popup.shown) ||
					(this.manualShowArrowKeys & this.ARROWKEYS_NORMAL)
				) &&
				(
					(this.popupPosition == 0) ?
						(aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_UP) :
						(aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_DOWN)
				)
			);
		var shiftedOpenKeys = (
				(this.manualShowArrowKeys & this.ARROWKEYS_SHIFTED) &&
				aEvent.shiftKey &&
				(
					aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_UP ||
					aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_DOWN
				)
			);
		var current = this.getCurrentItem(this.popup, true);

		if (
			(
				(this.textbox.popup.selectedIndex < 0 && normalOpenKeys) ||
				shiftedOpenKeys
			) ||
			(
				current &&
				(
				aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_DOWN ||
				aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_UP ||
				(
					current.parentNode.parentNode.localName == 'menu' &&
					(
						aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_RIGHT ||
						aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_LEFT
					)
				)
				)
			)
			)
			return false;
		else
			return this.textbox.__secondsearch__onKeyPress(aEvent);
	},
 
	// for Firefox 29 and later (Australis)
	onWidgetBeforeDOMChange : function SSBrowser_onWidgetBeforeDOMChange(aNode, aNextNode, aContainer, aIsRemoval) 
	{
		if (aNode.id == this.toolbarItemId)
			this.destroyBar();
	},
 
	// for Firefox 29 and later (Australis)
	onWidgetAfterDOMChange : function SSBrowser_onWidgetAfterDOMChange(aNode, aNextNode, aContainer, aWasRemoval) 
	{
		if (aNode.id == this.toolbarItemId)
			this.initBarWithDelay();
	},
 
	// for Firefox 29 and later (Australis)
	onWidgetOverflow : function SSBrowser_onWidgetOverflow(aNode, aContainer) 
	{
		if (aNode.id == this.toolbarItemId) {
			this.destroyBar();
			this.initBarWithDelay();
		}
	},
 
	// for Firefox 29 and later (Australis)
	onWidgetUnderflow : function SSBrowser_onWidgetUnderflow(aNode, aContainer) 
	{
		if (aNode.id == this.toolbarItemId) {
			this.destroyBar();
			this.initBarWithDelay();
		}
	},
  
	destroyBar : function SSBrowser_destroyBar(aBar) 
	{
		if (!this.destroyBarBase(aBar)) return;

		var search = aBar || this.searchbar;
		var textbox = this.textbox;

		this.removePrefListener(this);

		this.engineButton.removeEventListener('contextmenu', this, true);

		if ('handleSearchCommand' in search)
			search._popup.removeEventListener('command', this, true);

		textbox.disableAutoComplete = false;
	},
  
/* event handling */ 
	
	handleEvent : function SSBrowser_handleEvent(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'DOMContentLoaded':
				this.preInit()
				return;

			case 'beforecustomization':
				this.destroyBar();
				return;

			case 'aftercustomization':
				this.destroyBar();
				this.initBarWithDelay();
				return;

			case 'popupshowing':
				if (!this.isEventFiredOnMyPopup(aEvent)) {
					this.initBarWithDelay();
					return;
				}
				break;
		}
		return this.handleEventBase(aEvent);
	},
 
	onSearchTermDrop : function SSBrowser_onSearchTermDrop(aEvent) 
	{
		if (aEvent.target == this.searchbar ||
			this.getSearchDropTarget(aEvent)) {
			this.textbox.onTextEntered(aEvent);
		}
		else if (aEvent.target.localName == 'menuitem') {
			this.doSearchBy(aEvent.target, aEvent);
		}
	},
	getSearchDropTarget : function SSBrowser_getSearchDropTarget(aEvent)
	{
		return this.evaluateXPath(
				'ancestor-or-self::*[local-name()="button" or @class="search-go-container"]',
				aEvent.originalTarget,
				Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE
			).singleNodeValue;
	},
 
	onCommand : function SSBrowser_onCommand(aEvent) 
	{
		var node = aEvent.originalTarget || aEvent.target;
		if (node.getAttribute('class').indexOf('addengine-item') < 0) return;
		var current = this.getCurrentEngine();
		if (current)
			this.addEngineToRecentList(current);
	},
 
	onOperationPre : function SSBrowser_onOperationPre(aEvent) 
	{
		const nsIDOMKeyEvent = Ci.nsIDOMKeyEvent;
		var textbox = this.textbox;
		if (
			(this.manualShowArrowKeys & this.ARROWKEYS_SHIFTED) &&
			aEvent.shiftKey &&
			(
				aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_UP ||
				aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_DOWN
			)
			) {
			try {
				textbox.controller.stopSearch();
				textbox.closePopup();
				textbox.value = textbox.controller.searchString;
				aEvent.stopPropagation();
				aEvent.preventDefault();
			}
			catch(e) {
			}
			return true;
		}
		if (
			(
				'GSuggest' in this.window &&
				this.window.GSuggest.getCurrentItem()
			) ||
			textbox.popup.selectedIndex > -1
			)
			return false;
		return true;
	},
 
	onOperationEnterPre : function SSBrowser_onOperationEnterPre(aEvent) 
	{
		if ('GSuggest' in this.window) this.window.GSuggest.hideSuggestPopup();
	},
 
	onOperationEnter : function SSBrowser_onOperationEnter(aCurrentItem, aEvent) 
	{
		this.doSearchBy(aCurrentItem, aEvent);
	},
  
/* do search */ 
	
	doSearchBy : function SSBrowser_doSearchBy(aItem, aEvent) 
	{
		if (!aItem.getAttribute('engineId'))
			aItem.setAttribute('engineId', 'search:'+aItem.getAttribute('label'));

		var engineId = aItem.getAttribute('engineId');
		if (engineId == this.kLOAD_AS_URI) { // location bar
			this.loadDroppedURI();
			this.revertAutoFill();
			return false;
		}

		var engine = this.getEngineById(engineId);
		this.selectedEngine = engine;
		this.doingSearch = true;

		var retVal;

		this.hideSecondSearch(true);

		if (!this.searchterm &&
			this.switchBlankInput != aEvent.ctrlKey &&
			!engine.keyword) {
			aEvent.stopPropagation();
			aEvent.preventDefault();
			this.switchTo(engine);
			retVal = false;
		}
		else {
			var current = this.getCurrentEngine();
			if (!current || current.id != engine.id)
				this.addEngineToRecentList(engine);

			var bar = this.searchbar;
			var isSearchBar = 'handleSearchCommand' in bar;
			if (engine.keyword || !isSearchBar) {
				var postData = {};
				var uri = engine.keyword ?
					this._getShortcutOrURI(engine.keyword+' '+this.searchterm, postData) :
					engine.uri;

				if (!engine.keyword) {
					var submission = this.getSearchEngineFromName(engine.name)
							.getSubmission(this.searchterm, null);
					if (submission) {
						uri = submission.uri.spec;
						postData.value = submission.postData;
					}
				}

				if (!uri)
					return retVal;

				this.loadForSearch(uri, (postData.value || null), aEvent, this.searchterm);
			}
			else if (isSearchBar) {
				retVal = bar.handleSearchCommand(aEvent, true);
			}
		}

		this.selectedEngine = null;
		this.window.setTimeout(function(aSelf) {
			aSelf.doingSearch = false;
			aSelf.clearAfterSearch();
		}, 1, this);

		this.clearAfterSearch();
		this.revertAutoFill();

		return retVal;
	},
	_getShortcutOrURI : function SSBrowser__getShortcutOrURI(aURI, aPostData) 
	{
		if ('getShortcutOrURL' in this.window) // too old Firefox
			return this.window.getShortcutOrURL(aURI, aPostData);

		if ('getShortcutOrURI' in this.window) // Firefox 24 and older
			return this.window.getShortcutOrURI(aURI, aPostData);

		aPostData = aPostData || {};

		var done = false;
		if (this.window.getShortcutOrURIAndPostData.length == 2) {
			// Firefox 31 and later, after https://bugzilla.mozilla.org/show_bug.cgi?id=989984
			this.window.getShortcutOrURIAndPostData(aURI, function(aData) {
				aURI = aData.url;
				done = true;
			});
		}
		else {
			// Firefox 25-30
			let Task = this._Task;
			let self = this;
			Task.spawn(function() {
				var data = yield self.window.getShortcutOrURIAndPostData(aURI);
				aURI = data.url;
				done = true;
			});
		}

		// this should be rewritten in asynchronous style...
		var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
		while (!done)
		{
			thread.processNextEvent(true);
		}

		return aURI;
	},
	get _Task()
	{
		if (!this.__Task) {
			let TaskNS = {};
			Cu.import('resource://gre/modules/Task.jsm', TaskNS);
			this.__Task = TaskNS.Task;
		}
		return this.__Task;
	},
	
	loadForSearch : function SSBrowser_loadForSearch(aURI, aPostData, aEvent, aTerm) 
	{
		var inBackground = false;
		if ('TM_init' in this.window) { // Tab Mix Plus
			inBackground = this.getPref('extensions.tabmix.loadSearchInBackground');
		}
		else { // Firefox native
			inBackground = this.loadInBackground;
		}

		var b = this.browser;
		if (this.canOpenNewTab(aURI, null, aEvent)) {
			// for Tree Style Tab
			if (
				'TreeStyleTabService' in this.window &&
				'readyToOpenChildTab' in this.window.TreeStyleTabService &&
				'shouldOpenSearchResultAsChild' in this.window.TreeStyleTabService &&
				this.window.TreeStyleTabService.shouldOpenSearchResultAsChild(aTerm)
				)
				this.window.TreeStyleTabService.readyToOpenChildTab();

			b.contentWindow.focus();

			// for location bar
			if (b.userTypedValue == this.searchterm)
				b.userTypedValue = null;

			var t = b.loadOneTab(aURI, null, null, aPostData, false, true);
			if (!inBackground)
				b.selectedTab = t;
			if (this.window.gURLBar)
				this.window.gURLBar.value = aURI;
		}
		else {
			b.webNavigation.loadURI(aURI, Ci.LOAD_FLAGS_NONE, null, aPostData, null);
		}

		b.contentWindow.focus();
	},
 
	selectedEngine : null, 
	doingSearch : false,
  
	doSearchbarSearch : function SSBrowser_doSearchbarSearch(aData, aWhere, aEvent, aOverride) 
	{
		var ss = this.window.getSecondSearch();
		if (!aWhere || typeof aWhere != 'string') {
			aWhere = aWhere ? 'tab' : 'current ';
		}

		var b = ss.browser;
		if (aOverride) {
			let engine = ss.selectedEngine || ss.getRecentEngines()[0];
			engine = ss.getSearchEngineFromName(engine.name);
			if (!engine) return;

			let postData = null;
			let url = 'about:blank';
			let submission = engine.getSubmission(aData, null);
			if (submission) {
				url = submission.uri.spec;
				postData = submission.postData;
			}
			let loadInBackground = ss.loadInBackground;
			if (ss.canOpenNewTab(url, aWhere, aEvent)) {
				// for location bar
				if (b.userTypedValue == ss.searchterm)
					b.userTypedValue = null;

				// for Tree Style Tab
				if (
					'TreeStyleTabService' in this.window &&
					'readyToOpenChildTab' in this.window.TreeStyleTabService &&
					'shouldOpenSearchResultAsChild' in this.window.TreeStyleTabService &&
					this.window.TreeStyleTabService.shouldOpenSearchResultAsChild(ss.searchterm)
					)
					this.window.TreeStyleTabService.readyToOpenChildTab();

				if (!loadInBackground) b.contentWindow.focus();
				b.loadOneTab(url, null, null, postData, loadInBackground, false);
				if (this.window.gURLBar && !loadInBackground)
					this.window.gURLBar.value = url;
			}
			else {
				b.webNavigation.loadURI(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, postData, null);
			}

			b.contentWindow.focus();
			ss.revertAutoFill();
			return;
		}
		else {
			// "foreground" and "background" are specified by Tab Utilities.
			// https://addons.mozilla.org/firefox/addon/tab-utilities/
			let newTabAction = /^tab|^(foreground|background)$/.test(String(aWhere));
			if (ss.canOpenNewTab(null, !aEvent ? aWhere : null , aEvent) != newTabAction) {
				aWhere = newTabAction ?
							'current' :
							(aWhere == 'background' || ss.loadInBackground ? 'tabshifted' : 'tab' );
				newTabAction = !newTabAction;
			}

			// for Tree Style Tab
			if (
				newTabAction &&
				'TreeStyleTabService' in this.window &&
				'readyToOpenChildTab' in this.window.TreeStyleTabService &&
				'shouldOpenSearchResultAsChild' in this.window.TreeStyleTabService &&
				this.window.TreeStyleTabService.shouldOpenSearchResultAsChild(ss.searchterm)
				)
				this.window.TreeStyleTabService.readyToOpenChildTab();

			let retVal = this.__secondsearch__doSearch(aData, aWhere);
			ss.clearAfterSearch();
			ss.revertAutoFill();

			// for Tree Style Tab
			if ('TreeStyleTabService' in this.window &&
				'stopToOpenChildTab' in this.window.TreeStyleTabService)
				this.window.TreeStyleTabService.stopToOpenChildTab();

			return retVal;
		}
	},
 
	checkToDoSearch : function SSBrowser_checkToDoSearch(aURI, aWhere, aAllowThirdPartyFixup, aPostData, aReferrerURI) 
	{
		if (!this.doingSearch) return false;

		var b = this.browser;
		if (!this.canOpenNewTab(aURI, aWhere)) {
			if (
				b.localName != 'tabbrowser' ||
				(// Tab Mix Plus
					'TM_init' in this.window &&
					(
						('isBlankNotBusyTab' in b && b.isBlankNotBusyTab(b.selectedTab)) ||
						!b.selectedTab.hasAttribute('locked')
					)
				)
				)
				aWhere = 'current';
		}

		var loadInBackground = this.loadInBackground;
		switch (aWhere)
		{
			default:
				b.webNavigation.loadURI(
					aURI,
					(aAllowThirdPartyFixup ?
						Ci.nsIWebNavigation.LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP :
						Ci.nsIWebNavigation.LOAD_FLAGS_NONE
					),
					aReferrerURI,
					aPostData,
					null
				);
				break;

			case 'tabshifted':
				loadInBackground = !loadInBackground;
			// "foreground" and "background" are specified by Tab Utilities.
			// https://addons.mozilla.org/firefox/addon/tab-utilities/
			case 'foreground':
			case 'background':
			case 'tab':
				b.loadOneTab(
					aURI,
					aReferrerURI,
					null,
					aPostData,
					(aWhere == 'background') || loadInBackground,
					aAllowThirdPartyFixup || false
				);
				break;
		}
		if (!this.loadInBackground)
			b.contentWindow.focus();

		return true;
	},
	readyToSearch : function SSBrowser_readyToSearch()
	{
		this.doingSearch = true;
	},
	searchDone : function SSBrowser_searchDone()
	{
		this.doingSearch = false;
	},
	doingSearch : false,
 
	loadDroppedURI : function SSBrowser_loadDroppedURI() 
	{
		this.textbox.value = this.droppedURI;
		this.textbox.handleCommand();
		this.droppedURI = null;
	},
	droppedURI : null,
	kLOAD_AS_URI : 'secondsearch::loadAsURI',
  
/* operate engines */ 
	
	get engines() 
	{
		return this.searchEngines.map(this.getEngineFromSearchEngine, this);
	},
 
	get searchEngines() 
	{
		return this.SearchService.getVisibleEngines({});
	},
	
	get SearchService() 
	{
		if (!this._SearchService)
			this._SearchService = Cc['@mozilla.org/browser/search-service;1']
				.getService(Ci.nsIBrowserSearchService);
		return this._SearchService;
	},
	_SearchService : null,
 
	get searchStringBundle() 
	{
		if (!this._searchStringBundle)
			this._searchStringBundle = Cc['@mozilla.org/intl/stringbundle;1']
				.getService(Ci.nsIStringBundleService)
				.createBundle('chrome://browser/locale/search.properties');
		return this._searchStringBundle;
	},
	_searchStringBundle : null,
  
	getCurrentEngine : function SSBrowser_getCurrentEngine() 
	{
		var bar = this.searchbar;
		return (bar.localName == 'searchbar') ?
			this.getEngineFromSearchEngine(bar.currentEngine) :
			null ;
	},
 
	getEngineById : function SSBrowser_getEngineById(aId, aNot) 
	{
		if (aId.indexOf('search:') == 0) {
			if (aNot) {
				var engine;
				this.engines.filter(function(aEngine) {
					if (aEngine.id == aId) return false;
					engine = aEngine;
					return true;
				}, this);
				return engine;
			}
			else {
				return this.getEngineFromSearchEngine(
						this.getSearchEngineFromName(aId.substring(aId.indexOf(':')+1))
					);
			}
		}
		else {
			var engine;
			this.keywords.some(function(aKeyword) {
				if (aNot ?
						aKeyword.id == aId :
						aKeyword.id != aId
					)
					return false;

				engine = aKeyword;
				return true;
			});
			return engine;
		}
	},
	
	getSearchEngineFromName : function SSBrowser_getSearchEngineFromName(aName) 
	{
		var engine = null;
		this.searchEngines.some(function(aEngine) {
			if (aEngine.name != aName)
				return false;
			engine = aEngine;
			return true;
		});
		return engine;
	},
 
	getEngineFromSearchEngine : function SSBrowser_getEngineFromSearchEngine(aEngine) 
	{
		if (!aEngine) return null;
		var engine = {
				name    : aEngine.name,
				icon    : (aEngine.iconURI ? aEngine.iconURI.spec : '' ),
				uri     : aEngine.getSubmission('', null).uri.spec,
				keyword : ''
			};
		engine.id = 'search:'+engine.name;
		if (!engine.icon)
			engine.icon = this.getFaviconForPage(aEngine.uri);
		return engine;
	},
 
	isSearchEngineAvailable : function SSBrowser_isSearchEngineAvailable(aName) 
	{
		return this.searchEngines.some(function(aEngine) {
				return aEngine.name == aName;
			});
	},
  
	getRecentEngines : function SSBrowser_getRecentEngines() 
	{
		var ids = this.getArrayPref('secondsearch.recentengines.list');

		// clear old cache for Second Search 0.4.x
		if (!ids.length &&
			this.getPref('secondsearch.recentengines.uri')) {
			var names = this.getArrayPref('secondsearch.recentengines.name');
			ids = names.map(function(aName) {
				return 'search:'+aName;
			});
			this.clearPref('secondsearch.recentengines.icon');
			this.clearPref('secondsearch.recentengines.id');
			this.clearPref('secondsearch.recentengines.keyword');
			this.clearPref('secondsearch.recentengines.name');
			this.clearPref('secondsearch.recentengines.uri');
		}

		var done = {};
		var list = ids
				.map(function(aId) {
					return this.getEngineById(aId);
				}, this)
				.filter(function(aEngine) {
					if (!aEngine || aEngine.id in done) return false;
					done[aEngine.id] = true;
					return true;
				});
		if (list.length < this.historyNum) {
			var current = this.getCurrentEngine();
			if (current) ids.push(current.id);
			var engines = this.engines.concat(this.keywords);
			engines.some(function(aEngine) {
				if (list.length >= this.historyNum) return true;
				if (ids.indexOf(aEngine.id) < 0) {
					list.push(aEngine);
					ids.push(aEngine.id);
				}
				return false;
			}, this);
			this.setArrayPref('secondsearch.recentengines.list', ids);
		}
		return list;
	},
 
	updateRecentList : function SSBrowser_updateRecentList(aOperation, aEngine) 
	{
		var ids = this.getArrayPref('secondsearch.recentengines.list');

		var retVal;
		var engines = [];
		ids.forEach(function(aId, aIndex) {
			if (!aId) return;
			if (aId == aEngine.id) {
				switch (aOperation)
				{
					case 'add':
					case 'remove':
						return;

					case 'check':
						retVal = true;
						break;
				}
			}
			var engine = this.getEngineById(aId);
			if (engine)
				engines.push(engine);
		}, this);

		if (aOperation == 'add')
			engines.unshift(aEngine);

		var history = this.historyNum;
		if (history > -1) {
			while (engines.length > history)
			{
				engines.pop();
			}
		}

		this.setArrayPref('secondsearch.recentengines.list',
			engines.map(function(aEngine) {
				return aEngine.id;
			})
		);

		return retVal;
	},
	removeAndAddRecentEngine : function SSBrowser_removeAndAddRecentEngine(aRemoveId, aAddId)
	{
		var ids = this.getArrayPref('secondsearch.recentengines.list');
		if (aRemoveId) {
			ids = ids.filter(function(aId) {
					return aId != aRemoveId;
				});
		}
		if (aAddId) ids.push(aAddId);
		this.setArrayPref('secondsearch.recentengines.list', ids);
	},
	
	addEngineToRecentList : function SSBrowser_addEngineToRecentList(aEngine) 
	{
		if (!aEngine) return;
		this.updateRecentList('add', aEngine);
	},
 
	removeEngineFromRecentList : function SSBrowser_removeEngineFromRecentList(aEngine) 
	{
		if (!aEngine) return;
		this.updateRecentList('remove', aEngine);
	},
 
	isEngineInRecentList : function SSBrowser_isEngineInRecentList(aEngine) 
	{
		var retVal = this.updateRecentList('check', aEngine);
		return retVal ? true : false ;
	},
   
/* keywords */ 
	
	keywords : [], 
	keywordsHash : {},
 
	startObserveKeyword : function SSBrowser_startObserveKeyword() 
	{
		this.NavBMService.addObserver(this.placesObserver, false);
	},
 
	endObserveKeyword : function SSBrowser_endObserveKeyword() 
	{
		this.NavBMService.removeObserver(this.placesObserver);
		this.placesObserver.destroy();
		this.placesObserver = null;
	},
 
	initKeywords : function SSBrowser_initKeywords(aForceUpdate) 
	{
		this.keywords     = [];
		this.keywordsHash = {};
		if (!this.shouldShowKeywords) return;

		var cachedKeywords = this.getPref('secondsearch.keyword.cache');
		if (cachedKeywords) {
			try {
				cachedKeywords = JSON.parse(cachedKeywords);
			}
			catch(e) {
				cachedKeywords = [];
				aForceUpdate = true; // cache is broken!
			}
		}

		var count = this.getPref('secondsearch.keyword.cache.count');
		if (
			cachedKeywords &&
			!aForceUpdate &&
			count !== null &&
			count != -1
			) { // load cache
			var updated = false;
			this.keywords = cachedKeywords;
			this.keywords.forEach(function(aKeyword) {
				if (!aKeyword.icon) {
					aKeyword.icon = this.getFaviconForPage(aKeyword.uri);
					if (aKeyword.icon) updated = true;
				}
				this.keywordsHash[aKeyword.id] = aKeyword;
			}, this);
			if (updated)
				this.saveKeywordsCache();
		}
		else {
			var statement = this._getStatement(
					'initKeywords',
					'SELECT b.id FROM moz_bookmarks b'+
					' JOIN moz_keywords k ON k.id = b.keyword_id'
				);
			try {
				var data;
				while (statement.executeStep())
				{
					data = this.newKeywordFromPlaces(statement.getDouble(0));
					this.keywords.push(data);
					this.keywordsHash[data.id] = data;
				}
			}
			finally {
				statement.reset();
			}
			this.saveKeywordsCache();
		}
	},
 
	// SQLite based bookmarks 
	
	newKeywordFromPlaces : function SSBrowser_newKeywordFromPlaces(aId) 
	{
		var uri = this.NavBMService.getBookmarkURI(aId);
		return {
			id      : 'bookmark:'+aId,
			name    : this.NavBMService.getItemTitle(aId),
			icon    : this.getFaviconForPage(uri.spec),
			uri     : uri.spec,
			keyword : this.NavBMService.getKeywordForBookmark(aId)
		};
	},
 
	updateKeywordFromPlaces : function SSBrowser_updateKeywordFromPlaces(aId, aMode) 
	{
		var data = this.newKeywordFromPlaces(aId);
		var removedId = null;

		this.keywords.slice().some(function(aKeyword, aIndex) {
			if (aKeyword.id != data.id)
				return false;

			if (aMode == 'delete' ||
				aMode == 'keyword') {
				delete this.keywordsHash[aKeyword.id];
				this.keywords.splice(aIndex, 1);
				removedId = aKeyword.id;
			}
			if (aMode == 'keyword') {
				this.keywords.push(data);
				this.keywordsHash[data.id] = data;
			}
			if (aMode != 'delete') {
				this.keywordsHash[data.id].id      = data.id;
				this.keywordsHash[data.id].name    = data.name;
				this.keywordsHash[data.id].icon    = data.icon;
				this.keywordsHash[data.id].uri     = data.uri;
				this.keywordsHash[data.id].keyword = data.keyword;
			}
			return true;
		}, this);

		if (!removedId) {
			if (aMode != 'delete') {
				this.keywords.push(data);
				this.keywordsHash[data.id] = data;
			}
		}
		else {
			this.removeAndAddRecentEngine(
				removedId,
				(aMode == 'delete' ? null : data.id )
			);
		}

		this.saveKeywordsCache();
	},
 
	saveKeywordsCache : function SSBrowser_saveKeywordsCache() 
	{
		this.keywords.sort(function(aA, aB) { return aA.name > aB.name ? 1 : -1 });

		this.setPref('secondsearch.keyword.cache', JSON.stringify(this.keywords));
		this.setPref('secondsearch.keyword.cache.count', this.keywords.length);
	},
 
	get placesDB() 
	{
		if (!this._placesDB) {
			this._placesDB = Cc['@mozilla.org/browser/nav-history-service;1']
						.getService(Ci.nsINavHistoryService)
						.QueryInterface(Ci.nsPIPlacesDatabase)
						.DBConnection;
		}
		return this._placesDB;
	},
	_placesDB : null,
 
	_getStatement : function SSBrowser__getStatement(aName, aSQL) 
	{
		if (!(aName in this._statements)) {
			this._statements[aName] = this.placesDB.createStatement(aSQL);
		}
		return this._statements[aName];
	},
	_statements : {},
 
	get NavBMService() 
	{
		if (!this._NavBMService) {
			this._NavBMService = Cc['@mozilla.org/browser/nav-bookmarks-service;1']
						.getService(Ci.nsINavBookmarksService);
		}
		return this._NavBMService;
	},
 
	get FaviconService() 
	{
		if (!this._FaviconService) {
			this._FaviconService = Cc['@mozilla.org/browser/favicon-service;1']
						.getService(Ci.nsIFaviconService);
		}
		return this._FaviconService;
	},
 
	get placesObserver() 
	{
		if (!this.mPlacesObserver) {
			this.mPlacesObserver = {
				owner : this,
				onItemAdded : function(aId, aContainer, aIndex)
				{
				},
				onItemRemoved : function(aId, aContainer, aIndex)
				{
//dump('onItemRemoved '+aId+'\n');
//var keyword = this.owner.NavBMService.getKeywordForBookmark(aId);
//dump('  keyword: '+keyword+'\n');
					var idString = 'bookmark:'+aId;
					this.owner.keywords.some(function(aKeyword) {
						if (aKeyword.id != idString) return false;
						this.owner.updateKeywordFromPlaces(aId, 'delete');
						return true;
					}, this);
				},
				onItemChanged : function(aId, aProperty, aIsAnnotation, aValue)
				{
//dump('onItemChanged '+aId+' ['+aProperty+' = '+aValue+']\n');
					var keyword = this.owner.NavBMService.getKeywordForBookmark(aId);
//dump('  keyword: '+keyword+'\n');
					switch (aProperty)
					{
						case 'keyword':
							if (keyword)
								this.owner.updateKeywordFromPlaces(aId, 'keyword');
							return;

						case 'title':
						case 'uri':
						case 'favicon':
							if (keyword)
								this.owner.updateKeywordFromPlaces(aId, aProperty);
							return;

						default:
							if (aIsAnnotation && !aProperty && !aValue && keyword)
								this.owner.updateKeywordFromPlaces(aId, 'delete');
							return;
					}
				},
				onItemVisited : function(aId, aVisitedId, aTime) {},
				onItemMoved : function(aId, aOldContainer, aOldIndex, aNewContainer, aNewIndex) {},
				onBeginUpdateBatch : function() {},
				onEndUpdateBatch : function() {},
				QueryInterface : function(aIID)
				{
					if (aIID.equals(Ci.nsINavBookmarkObserver) ||
						aIID.equals(Ci.nsISupports))
						return this;

					throw Cr.NS_NOINTERFACE;
				},
				destroy : function()
				{
					this.owner = null;
				}
			};
		}
		return this.mPlacesObserver;
	},
 
	set placesObserver(val) 
	{
		this.mPlacesObserver = val;
		return val;
	},
   
/* prefs */ 
	
	domain  : 'secondsearch', 
 
	observe : function SSBrowser_observe(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		switch (aPrefName)
		{
			default:
				return;

			case 'secondsearch.popup.position':
				this.textbox.disableAutoComplete = (this.popupPosition == 1);
				return;

			case 'secondsearch.keyword.cache.count':
				if (this.getPref(aPrefName) == -1 &&
					!this.getPref('secondsearch.keyword.updating')) {
					this.setPref('secondsearch.keyword.updating', true);
					this.initKeywords(true);
					this.window.setTimeout(function(aSelf) {
						aSelf.setPref('secondsearch.keyword.updating', false);
					}, 100, this);
				}
				return;
		}
	},
  
/* initializing */ 
	
	preInit : function SSBrowser_preInit() 
	{
		this.window.removeEventListener('DOMContentLoaded', this, false);
		this.window.addEventListener('load', this, false);

		this.window.SecondSearchWindowHelper.preInit(this);
	},
 
	init : function SSBrowser_init() 
	{
		this.initBase();

		this.window.addEventListener('beforecustomization', this, false);
		this.window.addEventListener('aftercustomization', this, false);

		if ('CustomizableUI' in this.window) { // Firefox 29 and later (Australis)
			this.window.CustomizableUI.addListener(this);
			[
				this.document.getElementById('widget-overflow'),
				this.document.getElementById('PanelUI-popup')
			].forEach(function(aPanel) {
				if (aPanel)
					aPanel.addEventListener('popupshowing', this, false);
			}, this);
		}

		this.window.setTimeout(function(aSelf) {
			aSelf.delayedInit();
		}, 100, this);
	},
	
	delayedInit : function SSBrowser_delayedInit() 
	{
		this.initKeywords();
		this.startObserveKeyword();
	},
  
	destroy : function SSBrowser_destroy() 
	{
		this.destroyBase();
		this.endObserveKeyword();

		this.window.removeEventListener('beforecustomization', this, false);
		this.window.removeEventListener('aftercustomization', this, false);

		if ('CustomizableUI' in this.window) { // Firefox 29 and later (Australis)
			this.window.CustomizableUI.removeListener(this);
			[
				this.document.getElementById('widget-overflow'),
				this.document.getElementById('PanelUI-popup')
			].forEach(function(aPanel) {
				if (aPanel)
					aPanel.removeEventListener('popupshowing', this, false);
			}, this);
		}

		for (var i in this._statements)
		{
			if ('finalize' in this._statements[i])
				this._statements[i].finalize();
		}
	}
  
}); 
  
function SecondSearchSearchbar(aWindow)
{
	SecondSearchBrowser.apply(this, arguments);
}
SecondSearchSearchbar.prototype = inherit(SecondSearchBrowser.prototype, {
	name : 'SecondSearchSearchbar',
	toolbarItemId : 'search-container',
	get active()
	{
		if (!this.searchbar)
			return false;

		return this.isInVisibleContainer();
	},
	get searchbar()
	{
		var container = this.document.getElementById(this.toolbarItemId);
		if (container)
			return container.firstChild;

		var bar = this.document.getElementsByTagName('searchbar');
		return (bar && bar.length) ? bar[0] : null ;
	}
});

function SecondSearchLocationbar(aWindow)
{
	SecondSearchBrowser.apply(this, arguments);
}
SecondSearchLocationbar.prototype = inherit(SecondSearchBrowser.prototype, {
	name : 'SecondSearchLocationbar',
	toolbarItemId : 'urlbar-container',
	get active()
	{
		if (!this.getPref('secondsearch.override.locationBar'))
			return false;
		return !this.window.SecondSearchWindowHelper.services[SecondSearchSearchbar.prototype.name].active;
	},
	get searchbar()
	{
		return this.document.getElementById('urlbar');
	}
});
