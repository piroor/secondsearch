function SecondSearchBrowser() 
{
}
SecondSearchBrowser.prototype = {
	
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
		if ('TM_init' in window) {
			var TMPPref = this.getPref('extensions.tabmix.opentabfor.search');
			if (TMPPref !== null) newTabPref = TMPPref;
		}

		var newTabAction = !aEvent ?
				false :
				(
					(aEvent.type.indexOf('key') == 0 && aEvent.altKey) ||
					(aEvent.type == 'click' && aEvent.button == 1)
				);
		var shouldRecycle = this.reuseBlankTab && (window.isBlankPageURL ? window.isBlankPageURL(this.currentURI) : (this.currentURI == 'about:blank'));

		// "foreground" and "background" are specified by Tab Utilities.
		// https://addons.mozilla.org/firefox/addon/tab-utilities/
		var newTabOption = /^tab|^(foreground|background)$/.test(String(aWhere));

		return (
				(newTabAction ? !newTabPref : (newTabPref && !shouldRecycle) ) &&
				(!aWhere || newTabOption) &&
				(!aURI || aURI.indexOf('javascript:') != 0)
			);
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
 
	get overrideLocationBar() 
	{
		var val = this.getPref('secondsearch.override.locationBar');
		if (val === null) {
			val = this.defaultOverrideLocationBar;
			this.setPref('secondsearch.override.locationBar', val);
		}
		return val;
	},
	defaultOverrideLocationBar : true,
  
/* elements */ 
	
	get searchbar() 
	{
		var bar = document.getElementsByTagName('searchbar');
		return (bar && bar.length) ? bar[0] :
			this.overrideLocationBar ? document.getElementById('urlbar') :
			null ;
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
		return document.getElementById('secondsearch_popup_all');
	},
 
	get engineButton() 
	{
		var bar = this.searchbar;
		return bar ? (
				bar.searchButton ||
				document.getElementById('page-proxy-stack') || /* location bar */
				document.getElementById('identity-box') /* location bar, Firefox 16 and later */
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
				items.push(document.createElement('menuseparator'));
			items = items.concat(
				keywords.map(function(aEngine) {
					return this.createItemForEngine(aEngine);
				}, this)
			);
		}

		if (shouldLoadAsURI) {
			if (items.length)
				items.unshift(document.createElement('menuseparator'));
			var item = document.createElement('menuitem');
			item.setAttribute('label', popup.getAttribute('labelLoadAsURI'));
			item.setAttribute('engineId', this.kLOAD_AS_URI);
			items.unshift(item);
		}

		if (items.length)
			items[0].setAttribute('_moz-menuactive', 'true');


		var range = document.createRange();
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

		var fragment = document.createDocumentFragment();
		items.forEach(function(aItem) {
			fragment.appendChild(aItem);
		});
		range.insertNode(fragment);
		range.detach();
	},
	
	createItemForEngine : function SSBrowser_createItemForEngine(aEngine, aLabel) 
	{
		var item = document.createElement('menuitem');
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
			var fileHandler = this.IOService.getProtocolHandler('file')
					.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
			var tempLocalFile = fileHandler.getFileFromURLSpec(aURI);
			newURI = this.IOService.newFileURI(tempLocalFile);
		}
		else {
			newURI = this.IOService.newURI(aURI || 'about:blank', null, null);
		}
		return newURI;
	},
	
	get IOService() { 
		if (!this._IOService) {
			this._IOService = Components
					.classes['@mozilla.org/network/io-service;1']
					.getService(Components.interfaces.nsIIOService);
		}
		return this._IOService;
	},
	_IOService : null,
    
	addIconCache : function SSBrowser_addIconCache(aKey, aURI) 
	{
		/* create a dummy element, because Firefox forgets image data
		   from the memory if no more element shows the image. */
		var id = 'secondsearch_cached_icon_'+encodeURIComponent(aKey);
		var oldCache = document.getElementById(id);
		if (oldCache) {
			if (oldCache.getAttribute('src') == aURI) return;
			oldCache.parentNode.removeChild(oldCache);
		}

		var cache = document.createElement('image');
		cache.setAttribute('id', id);
		cache.setAttribute('src', aURI);
		document.getElementById('secondsearch_cached_icons').appendChild(cache);
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

		var range = document.createRange();
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
		var fragment = document.createDocumentFragment();
		engines.forEach(function(aEngine) {
			if (!aEngine) {
				fragment.appendChild(document.createElement('menuseparator'));
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
			textbox.onTextEntered = this.onTextEntered;

			textbox.__secondsearch__onKeyPress = textbox.onKeyPress;
			textbox.onKeyPress = this.onTextboxKeyPress;
		}

		if (search.localName == 'searchbar') { // search bar
			if ('handleSearchCommand' in search && !search.__secondsearch__doSearch) {
				let target = 'search.handleSearchCommand';
				let func = search.handleSearchCommand;

				// compatibility for Searchbar Autosizer
				// https://addons.mozilla.org/firefox/addon/searchbar-autosizer/
				if ('autosizer' in window && autosizer.originalHandleSearchCommand) {
					target = 'autosizer.originalHandleSearchCommand';
					func = autosizer.originalHandleSearchCommand;
				}

				// compatibility for Tab Control
				// https://addons.mozilla.org/firefox/addon/tab-control/
				if ('gTabControl' in window && gTabControl.origHandleSearchCommand) {
					target = 'gTabControl.origHandleSearchCommand';
					func = gTabControl.origHandleSearchCommand;
				}

				// compatibility for SearchLoad Options
				// https://addons.mozilla.org/firefox/addon/searchload-options/
				if ('esteban_torres' in window &&
					'searchLoad_Options' in esteban_torres &&
					esteban_torres.searchLoad_Options.MOZhandleSearch) {
					target = 'esteban_torres.searchLoad_Options.MOZhandleSearch';
					func = esteban_torres.searchLoad_Options.MOZhandleSearch;
				}

				eval(target+' = '+func.toSource().replace(
					')',
					', aOverride)'
				).replace(
					/doSearch\(([^\)]+)\)/,
					'doSearch($1, aEvent, aOverride)'
				));
				eval('search.doSearch = '+search.doSearch.toSource().replace(
					'{',
					'$& window.getSecondSearch().readyToSearch();'
				).replace(
					/(\}\)?)$/,
					'window.getSecondSearch().searchDone(); $1'
				));
				search.__secondsearch__doSearch = search.doSearch;
				search.doSearch = this.doSearchbarSearch;
				search._popup.addEventListener('command', this, true);
			}

			// old Tab Mix Plus, only Firefox 2?
			if ('handleSearchCommand' in search &&
				'TMP_SearchLoadURL' in window && !window.__secondsearch__TMP_SearchLoadURL) {
				window.__secondsearch__TMP_SearchLoadURL = window.TMP_SearchLoadURL;
				eval('window.TMP_SearchLoadURL = '+window.TMP_SearchLoadURL.toSource().replace(
					'var submission = searchbar.currentEngine',
					'var overrideEngine = null;' +
					'if (window.getSecondSearch().selectedEngine) {' +
					'  overrideEngine = window.getSecondSearch().getSearchEngineFromName(window.getSecondSearch().selectedEngine.name);' +
					'};' +
					'var submission = (overrideEngine || searchbar.currentEngine)'
				));
			}
		}
		else { // location bar
			if (textbox.onDrop &&
				!textbox.__secondsearch__updated) {
				eval('textbox.onDrop = '+textbox.onDrop.toSource().replace(
					'{',
					'{' +
					'  var ss = window.getSecondSearch();' +
					'  ss.droppedURI = null;' +
					'  var showSecondSearch = false;' +
					'  if ((typeof aXferData == "undefined" ? ' +
					'         ss.getDroppedText(aEvent) : ' +
					'         aXferData.flavour.contentType == "text/unicode") &&' +
					'    ss.autoShowDragdropMode == ss.DRAGDROP_MODE_DROP) {' +
					'    showSecondSearch = (ss.searchbar == this);' +
					'  }'
				).replace(
					'return;',
					'if (showSecondSearch)' +
					'  ss.showSecondSearch(ss.SHOWN_BY_DROP);' +
					'$&'
				).replace(
					/((handleURLBarCommand|this\.handleCommand)\(\);)/,
					'if (showSecondSearch) {' +
					'  ss.droppedURI = this.value;' +
					'  ss.showSecondSearch(ss.SHOWN_BY_DROP);' +
					'}' +
					'else {' +
					'  $1;' +
					'}'
				));
				textbox.__secondsearch__updated = true;
			}
		}

		window.setTimeout(function(aSelf) {
			aSelf.testOpenPopup();
		}, 1000, this);
	},
	
	testOpenPopup : function SSBrowser_testOpenPopup() 
	{
		// ドラッグ中の最初のメニュー展開に何故か失敗するので、この時点で一度試行しておく
		this.popup.style.opacity = 0;
		this.popup.openPopupAtScreen(0, 0, false);
		var popup = this.allMenuItem .firstChild;
		window.setTimeout(function(aSelf) {
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
		var ss = window.getSecondSearch();
		if (ss.getCurrentItem()) {
			return false;
		}
		else {
			var retVal = this.__secondsearch__onTextEntered(aEvent);
			ss.clearAfterSearch();
			return retVal;
		}
	},
 
	onTextboxKeyPress : function SSBrowser_onTextboxKeyPress(aEvent) 
	{
		const nsIDOMKeyEvent = Components.interfaces.nsIDOMKeyEvent;

		var ss = window.getSecondSearch();

		var normalOpenKeys = (
				(
					(ss.autoShowInput && ss.popup.shown) ||
					(ss.manualShowArrowKeys & ss.ARROWKEYS_NORMAL)
				) &&
				(
					(ss.popupPosition == 0) ?
						(aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_UP) :
						(aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_DOWN)
				)
			);
		var shiftedOpenKeys = (
				(ss.manualShowArrowKeys & ss.ARROWKEYS_SHIFTED) &&
				aEvent.shiftKey &&
				(
					aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_UP ||
					aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_DOWN
				)
			);
		var current = ss.getCurrentItem(ss.popup, true);

		if (
			(
				(this.popup.selectedIndex < 0 && normalOpenKeys) ||
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
			return this.__secondsearch__onKeyPress(aEvent);
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
				return this.preInit();
			case 'beforecustomization':
				return this.destroyBar();
			case 'aftercustomization':
				return this.initBarWithDelay();

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
				XPathResult.FIRST_ORDERED_NODE_TYPE
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
		const nsIDOMKeyEvent = Components.interfaces.nsIDOMKeyEvent;
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
				'GSuggest' in window &&
				GSuggest.getCurrentItem()
			) ||
			textbox.popup.selectedIndex > -1
			)
			return false;
		return true;
	},
 
	onOperationEnterPre : function SSBrowser_onOperationEnterPre(aEvent) 
	{
		if ('GSuggest' in window) GSuggest.hideSuggestPopup();
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
					('getShortcutOrURL' in window ?
						getShortcutOrURL(engine.keyword+' '+this.searchterm, postData) :
						getShortcutOrURI(engine.keyword+' '+this.searchterm, postData)
					) :
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
		window.setTimeout(function(aSelf) {
			aSelf.doingSearch = false;
			aSelf.clearAfterSearch();
		}, 1, this);

		this.clearAfterSearch();
		this.revertAutoFill();

		return retVal;
	},
	
	loadForSearch : function SSBrowser_loadForSearch(aURI, aPostData, aEvent, aTerm) 
	{
		var inBackground = false;
		if ('TM_init' in window) { // Tab Mix Plus
			inBackground = this.getPref('extensions.tabmix.loadSearchInBackground');
		}
		else { // Firefox native
			inBackground = this.loadInBackground;
		}

		var b = this.browser;
		if (this.canOpenNewTab(aURI, null, aEvent)) {
			// for Tree Style Tab
			if (
				'TreeStyleTabService' in window &&
				'readyToOpenChildTab' in TreeStyleTabService &&
				'shouldOpenSearchResultAsChild' in TreeStyleTabService &&
				TreeStyleTabService.shouldOpenSearchResultAsChild(aTerm)
				)
				TreeStyleTabService.readyToOpenChildTab();

			b.contentWindow.focus();

			// for location bar
			if (b.userTypedValue == this.searchterm)
				b.userTypedValue = null;

			var t = b.loadOneTab(aURI, null, null, aPostData, false, true);
			if (!inBackground)
				b.selectedTab = t;
			if (gURLBar)
				gURLBar.value = aURI;
		}
		else {
			b.webNavigation.loadURI(aURI, Components.interfaces.LOAD_FLAGS_NONE, null, aPostData, null);
		}

		b.contentWindow.focus();
	},
 
	selectedEngine : null, 
	doingSearch : false,
  
	doSearchbarSearch : function SSBrowser_doSearchbarSearch(aData, aWhere, aEvent, aOverride) 
	{
		var ss = window.getSecondSearch();
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
					'TreeStyleTabService' in window &&
					'readyToOpenChildTab' in TreeStyleTabService &&
					'shouldOpenSearchResultAsChild' in TreeStyleTabService &&
					TreeStyleTabService.shouldOpenSearchResultAsChild(ss.searchterm)
					)
					TreeStyleTabService.readyToOpenChildTab();

				if (!loadInBackground) b.contentWindow.focus();
				b.loadOneTab(url, null, null, postData, loadInBackground, false);
				if (gURLBar && !loadInBackground)
					gURLBar.value = url;
			}
			else {
				b.webNavigation.loadURI(url, Components.interfaces.LOAD_FLAGS_NONE, null, postData, null);
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
				'TreeStyleTabService' in window &&
				'readyToOpenChildTab' in TreeStyleTabService &&
				'shouldOpenSearchResultAsChild' in TreeStyleTabService &&
				TreeStyleTabService.shouldOpenSearchResultAsChild(ss.searchterm)
				)
				TreeStyleTabService.readyToOpenChildTab();

			let retVal = this.__secondsearch__doSearch(aData, aWhere);
			ss.clearAfterSearch();
			ss.revertAutoFill();

			// for Tree Style Tab
			if ('TreeStyleTabService' in window &&
				'stopToOpenChildTab' in TreeStyleTabService)
				TreeStyleTabService.stopToOpenChildTab();

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
					'TM_init' in window &&
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
						Components.interfaces.nsIWebNavigation.LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP :
						Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE
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
			this._SearchService = Components
				.classes['@mozilla.org/browser/search-service;1']
				.getService(Components.interfaces.nsIBrowserSearchService);
		return this._SearchService;
	},
	_SearchService : null,
 
	get searchStringBundle() 
	{
		if (!this._searchStringBundle)
			this._searchStringBundle = Components
				.classes['@mozilla.org/intl/stringbundle;1']
				.getService(Components.interfaces.nsIStringBundleService)
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
				cachedKeywords = this.evalInSandbox('('+cachedKeywords+')');
			}
			catch(e) {
			}
		}

		// clear old cache for Second Search 0.4.x
		if (cachedKeywords === null &&
			this.getPref('secondsearch.keyword.cache.uri')) {
			this.clearPref('secondsearch.keyword.cache.icon');
			this.clearPref('secondsearch.keyword.cache.id');
			this.clearPref('secondsearch.keyword.cache.keyword');
			this.clearPref('secondsearch.keyword.cache.name');
			this.clearPref('secondsearch.keyword.cache.uri');
		}

		if (
			!aForceUpdate &&
			( // from Fx 2 to Fx 3
				cachedKeywords &&
				cachedKeywords.length &&
				cachedKeywords.some(function(aKeyword) {
					return aKeyword.uri.indexOf('rdf:#') > -1;
				})
			)
			)
			aForceUpdate = true;

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
		else { // initialize for Firefox 3
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
	evalInSandbox : function SSBrowser_evalInSandbox(aCode, aOwner)
	{
		try {
			var sandbox = new Components.utils.Sandbox(aOwner || 'about:blank');
			return Components.utils.evalInSandbox(aCode, sandbox);
		}
		catch(e) {
		}
		return void(0);
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

		this.setPref('secondsearch.keyword.cache', this.keywords.toSource());
		this.setPref('secondsearch.keyword.cache.count', this.keywords.length);
	},
 
	get placesDB() 
	{
		if (!this._placesDB) {
			this._placesDB = Components
						.classes['@mozilla.org/browser/nav-history-service;1']
						.getService(Components.interfaces.nsINavHistoryService)
						.QueryInterface(Components.interfaces.nsPIPlacesDatabase)
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
			this._NavBMService = Components.classes['@mozilla.org/browser/nav-bookmarks-service;1']
						.getService(Components.interfaces.nsINavBookmarksService);
		}
		return this._NavBMService;
	},
 
	get FaviconService() 
	{
		if (!this._FaviconService) {
			this._FaviconService = Components.classes['@mozilla.org/browser/favicon-service;1']
						.getService(Components.interfaces.nsIFaviconService);
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
					if (aIID.equals(Components.interfaces.nsINavBookmarkObserver) ||
						aIID.equals(Components.interfaces.nsISupports))
						return this;

					throw Components.results.NS_NOINTERFACE;
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

			case 'secondsearch.override.locationBar':
				var search = document.getElementsByTagName('searchbar');
				var locationbar = document.getElementById('urlbar');
				if ((!search || !search.length) && locationbar)
					this.destroyBar(locationbar);
				return;

			case 'secondsearch.popup.position':
				this.textbox.disableAutoComplete = (this.popupPosition == 1);
				return;

			case 'secondsearch.keyword.cache.count':
				if (this.getPref(aPrefName) == -1 &&
					!this.getPref('secondsearch.keyword.updating')) {
					this.setPref('secondsearch.keyword.updating', true);
					this.initKeywords(true);
					window.setTimeout(function(aSelf) {
						aSelf.setPref('secondsearch.keyword.updating', false);
					}, 100, this);
				}
				return;
		}
	},
  
/* initializing */ 
	
	preInit : function SSBrowser_preInit() 
	{
		window.removeEventListener('DOMContentLoaded', this, false);
		window.addEventListener('load', this, false);

		// compatibility for Tab Control
		// https://addons.mozilla.org/firefox/addon/tab-control/
		if ('gTabControl' in window && gTabControl.handleSearchCommand) {
			eval('gTabControl.handleSearchCommand = '+gTabControl.handleSearchCommand.toSource().replace(
				')',
				', aOverride)'
			).replace(
				'[aEvent]',
				'[aEvent, aOverride]'
			));
		}
	},
 
	init : function SSBrowser_init() 
	{
		this.initBase();

		window.addEventListener('beforecustomization', this, false);
		window.addEventListener('aftercustomization', this, false);

		eval('window.openUILinkIn = '+window.openUILinkIn.toSource().replace(
			'{',
			'{' +
			'  if (SecondSearch.checkToDoSearch.apply(SecondSearch, arguments))' +
			'    return;'
		));

		window.setTimeout(function(aSelf) {
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

		window.removeEventListener('beforecustomization', this, false);
		window.removeEventListener('aftercustomization', this, false);

		for (var i in this._statements)
		{
			if ('finalize' in this._statements[i])
				this._statements[i].finalize();
		}
	}
  
}; 
  
SecondSearchBrowser.prototype.__proto__ = SecondSearchBase.prototype; 
var SecondSearch = new SecondSearchBrowser();

window.addEventListener('DOMContentLoaded', SecondSearch, false);
 
