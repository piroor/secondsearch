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
 
/* preference values */ 
	
	get historyNum() 
	{
		var val = this.getIntPref('secondsearch.recentengines.num');
		if (val === null) {
			val = this.defaultHistoryNum;
			this.setIntPref('secondsearch.recentengines.num', val);
		}
		return val;
	},
	defaultHistoryNum : 3,
 
	get shouldShowKeywords() 
	{
		var val = this.getBoolPref('secondsearch.keyword.show');
		if (val === null) {
			val = this.defaultShouldShowKeywords;
			this.setBoolPref('secondsearch.keyword.show', val);
		}
		return val;
	},
	defaultShouldShowKeywords : true,
 
	get switchBlankInput() 
	{
		var val = this.getBoolPref('secondsearch.switch.blank_input');
		if (val === null) {
			val = this.defaultSwitch;
			this.setBoolPref('secondsearch.switch.blank_input', val);
		}
		return val;
	},
	defaultSwitch : true,
 
	get openintab() 
	{
		var val = this.getBoolPref('browser.search.openintab');
		if (val === null) {
			val = this.defaultOpenintab;
			this.setBoolPref('browser.search.openintab', val);
		}
		return val;
	},
	defaultOpenintab : false,
 
	get loadInBackground() 
	{
		var val = this.getBoolPref('secondsearch.loadInBackground');
		if (val === null) {
			val = this.getBoolPref('browser.tabs.loadInBackground');
			this.setBoolPref('secondsearch.loadInBackground', val);
		}
		return val;
	},
 
	get reuseBlankTab() 
	{
		var val = this.getBoolPref('secondsearch.reuse_blank_tab');
		if (val === null) {
			val = this.defaultReuseBlankTab;
			this.setBoolPref('secondsearch.reuse_blank_tab', val);
		}
		return val;
	},
	defaultReuseBlankTab : true,
 
	get overrideLocationBar() 
	{
		var val = this.getBoolPref('secondsearch.override.locationBar');
		if (val === null) {
			val = this.defaultOverrideLocationBar;
			this.setBoolPref('secondsearch.override.locationBar', val);
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
				bar.textbox || /* Firefox 3 */
				bar._textbox || /* Firefox 2 */
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
				bar.searchButton || /* Firefox 3 */
				bar._engineButton || /* Firefox 2 */
				document.getElementById('page-proxy-stack') || /* Firefox 3, location bar*/
				document.getElementById('page-proxy-deck') /* Firefox 2, location bar*/
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
	 
	initAllEngines : function(aPopup, aParent, aReverse) 
	{
		var popup  = aPopup || this.popup;
		var parent = aParent || null;
		var offset = 0;

		var range = document.createRange();
		range.selectNodeContents(popup);
		if (popup.hasChildNodes()) {
			if (popup.firstChild.localName == 'menu') {
				range.setStartAfter(popup.firstChild);
				offset = 1;
			}
			else if (popup.lastChild.localName == 'menu') {
				range.setEndBefore(popup.lastChild);
			}
		}
		range.deleteContents();

		var items = [];

		var engines = this.engines
			.filter(function(aEngine) {
				return !parent ||
					!parent.getElementsByAttribute('engineName', aEngine.name).length;
			})
			.map(function(aEngine) {
				var item = this.createItemForSearchEngine(aEngine);
				item.setAttribute('id', 'secondsearch-'+(item.getAttribute('id') || encodeURIComponent(aEngine.name)));
				return item;
			}, this);

		var keywords = this.keywords
			.filter(function(aKeyword) {
				return !aKeyword.uri ||
					!parent ||
					!parent.getElementsByAttribute('engineName', aKeyword.name+'\n'+aKeyword.keyword).length;
			})
			.map(function(aKeyword) {
				return this.createItemForKeyword(aKeyword);
			}, this);

		items = items.concat(engines);
		if (keywords.length) {
			if (items.length)
				items.push(document.createElement('menuseparator'));
			items = items.concat(keywords);
		}

		if (popup.shownBy == this.SHOWN_BY_DROP &&
			this.droppedURI) {
			if (items.length)
				items.push(document.createElement('menuseparator'));
			var item = document.createElement('menuitem');
			item.setAttribute('label', popup.getAttribute('labelLoadAsURI'));
			item.setAttribute('engineName', this.kLOAD_AS_URI);
			items.push(item);
		}

		if (items.length)
			items[0].setAttribute('_moz-menuactive', 'true');

		if (aReverse) items = items.reverse();

		var fragment = document.createDocumentFragment();
		items.forEach(function(aItem) {
			fragment.appendChild(aItem);
		});
		range.insertNode(fragment);
		range.detach();
	},
	 
	createItemForSearchEngine : function(aEngine) 
	{
		var item = document.createElement('menuitem');
		item.setAttribute('label', aEngine.name);
		item.setAttribute('engineName', aEngine.name);
		item.setAttribute('id', aEngine.name);
		item.setAttribute('class', 'menuitem-iconic searchbar-engine-menuitem');
		item.setAttribute('tooltiptext', this.searchStringBundle.formatStringFromName('searchtip', [aEngine.name], 1));
		if (aEngine.iconURI)
			item.setAttribute('src', aEngine.iconURI.spec);
		return item;
	},
 
	createItemForKeyword : function(aKeyword) 
	{
		var item = document.createElement('menuitem');
		item.setAttribute('label', aKeyword.name);
		item.setAttribute('engineName', aKeyword.name+'\n'+aKeyword.keyword);
		item.setAttribute('id', 'secondsearch-keyword-'+encodeURIComponent(aKeyword.name));
		item.setAttribute('class', 'menuitem-iconic searchbar-engine-menuitem');
		item.setAttribute('keyword', aKeyword.keyword);
		if (aKeyword.icon)
			item.setAttribute('src', aKeyword.icon);
		return item;
	},
  
	initRecentEngines : function(aPopup) 
	{
		var popup = aPopup || this.popup;
		var range = document.createRange();
		range.selectNodeContents(popup);
		if (popup.firstChild.localName == 'menu') {
			range.setStartAfter(popup.firstChild);
		}
		else if (popup.lastChild.localName == 'menu') {
			range.setEndBefore(popup.lastChild);
		}
		range.deleteContents();


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
					name  : this.kLOAD_AS_URI
				});
			}
		}

		if (this.popupPosition != 1)
			engines.reverse();

		var template = popup.getAttribute('labelTemplate');
		var fragment = document.createDocumentFragment();
		engines.forEach(function(aEngine) {
			if (!aEngine) {
				fragment.appendChild(document.createElement('menuseparator'));
				return;
			}
			var node = document.createElement('menuitem');
			node.setAttribute('label', aEngine.label || template.replace(/\%s/i, (aEngine.name || '')));
			node.setAttribute('src',   aEngine.icon || '');
			node.setAttribute('class', 'menuitem-iconic searchbar-engine-menuitem');
			node.setAttribute('engineName', (aEngine.name || '')+(aEngine.keyword ? '\n'+aEngine.keyword : '' ));
			fragment.appendChild(node);
		});

		range.insertNode(fragment);
		range.detach();
	},
 
	switchTo : function(aEngine) 
	{
		var bar = this.searchbar;
		if (bar.localName != 'searchbar') return;

		var current = this.getCurrentEngine();
		if (!current) return;

		if (current.name != aEngine.name) {
			this.removeEngineFromRecentList(aEngine);
			this.addEngineToRecentList(current);
			bar.currentEngine = this.getSearchEngineFromName(aEngine.name);
		}
		var box = this.textbox;
		box.focus();
		box.select();
	},
 
	get popupHeight() 
	{
		return (this.popupType == 0) ? (this.getCharPref('secondsearch.recentengines.uri') || '').split('|').length :
				(this.engines.length + this.keywords.length) ;
	},
 
	initEmptySearchBar : function() 
	{
		if ('_displayCurrentEngine' in this.textbox)
			this.textbox._displayCurrentEngine();
	},
 
	initPopup : function() 
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
 
	destroyPopup : function() 
	{
		try {
			this.allMenuItem.hidePopup();
		}
		catch(e) {
		}
	},
  
/* update searchbar */ 
	 
	initBar : function() 
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
			if (!textbox.searchbarDNDObserver.__secondsearch__updated) {
				eval('textbox.searchbarDNDObserver.onDrop = '+
					textbox.searchbarDNDObserver.onDrop.toSource().replace(
						'this.mOuter.onTextEntered',
						<![CDATA[
							var ss = window.getSecondSearch();
							if (ss.searchbar == this.mOuter) {
								if (ss.autoShowDragdropMode == ss.DRAGDROP_MODE_DROP) {
									ss.showSecondSearch(ss.SHOWN_BY_DROP);
									return;
								}
								else if (ss.autoShowDragdropMode == ss.DRAGDROP_MODE_NONE ||
										ss.handleDragdropOnlyOnButton) {
									return;
								}
							}
							this.mOuter.onTextEntered]]>.toString()
					)
				);
				eval('textbox.searchbarDNDObserver.getSupportedFlavours = '+
					textbox.searchbarDNDObserver.getSupportedFlavours.toSource().replace(
						'flavourSet.appendFlavour',
						<![CDATA[
							var ss = window.getSecondSearch();
							if (
								ss.searchbar == this.mOuter &&
								(
									ss.autoShowDragdropMode == ss.DRAGDROP_MODE_NONE ||
									ss.handleDragdropOnlyOnButton
								) &&
								("handleSearchCommand" in ss.searchbar ? (ss.searchbar.getAttribute(ss.emptyAttribute) != "true") : ss.textbox.value )
								) {
								return flavourSet;
							};
							flavourSet.appendFlavour]]>.toString()
					)
				);
				textbox.searchbarDNDObserver.__secondsearch__updated = true;
			}

			if ('handleSearchCommand' in search && !search.__secondsearch__doSearch) {
				eval('search.handleSearchCommand = '+
					search.handleSearchCommand.toSource().replace(
						')',
						', aOverride)'
					).replace(
						/doSearch\(([^\)]+)\)/,
						'doSearch($1, aOverride)'
					)
				);
				var source = search.doSearch.toSource();
				if (source.indexOf('openUILinkIn') > -1) { // Firefox 3
					eval('search.doSearch = '+source.replace(
							'{',
							'$& window.getSecondSearch().readyToSearch();'
						).replace(
							/(\}\)?)$/,
							'window.getSecondSearch().searchDone(); $1'
						)
					);
				}
				else { // Firefox 2
					eval('search.doSearch = '+source.replace(
							/([\w\d\.]+).focus\(\)/,
							'if (!window.getSecondSearch().loadInBackground) $1.focus()'
						).replace(
							/(loadOneTab\([^,]+,[^,]+,[^,]+,[^,]+,)[^,]+(,[^,]+\))/,
							'$1 window.getSecondSearch().loadInBackground $2'
						).replace(
							'if (gURLBar)',
							'if (gURLBar && !window.getSecondSearch().loadInBackground)'
						)
					);
				}
				search.__secondsearch__doSearch = search.doSearch;
				search.doSearch = this.doSearchbarSearch;
				search._popup.addEventListener('command', this, true);
			}

			if ('SearchLoadURL' in window &&
				!('__secondsearch__SearchLoadURLUpdated' in window)) { // Fx 1.5?
				eval('window.SearchLoadURL = '+
					window.SearchLoadURL.toSource().replace(
						/([\w\d\.]+).focus\(\)/,
						'if (!window.getSecondSearch().loadInBackground) $1.focus()'
					).replace(
						/([\w\d\.]+).selectedTab = /,
						'if (!window.getSecondSearch().loadInBackground) $1.selectedTab = '
					).replace(
						'if (gURLBar)',
						'if (gURLBar && !window.getSecondSearch().loadInBackground)'
					)
				);
				window.__secondsearch__SearchLoadURLUpdated = true;
			}

			// GSuggest
			if ('GSuggest' in window && !GSuggest.__secondsearch__operateSuggesList) {
				GSuggest.__secondsearch__operateSuggesList = GSuggest.operateSuggesList;
				GSuggest.operateSuggesList = this.operateSuggesList;
				GSuggest.secondSearch = this;
			}

			// Tab Mix Plus, only Firefox 2?
			if ('handleSearchCommand' in search &&
				'TMP_SearchLoadURL' in window && !window.__secondsearch__TMP_SearchLoadURL) {
				window.__secondsearch__TMP_SearchLoadURL = window.TMP_SearchLoadURL;
				eval('window.TMP_SearchLoadURL = '+
					window.TMP_SearchLoadURL.toSource().replace(
						'var submission = searchbar.currentEngine',
						<![CDATA[
							var overrideEngine = null;
							if (window.getSecondSearch().selectedEngine) {
								overrideEngine = window.getSecondSearch().getSearchEngineFromName(window.getSecondSearch().selectedEngine.name);
							};
							var submission = (overrideEngine || searchbar.currentEngine)]]>.toString()
					)
				);
			}
		}
		else { // location bar
			if (!textbox.__secondsearch__updated) {
				eval('textbox.onDrop = '+
					textbox.onDrop.toSource().replace(
						'{',
						<![CDATA[$&
							var ss = window.getSecondSearch();
							ss.droppedURI = null;
							var showSecondSearch = false;
							if (aXferData.flavour.contentType == 'text/unicode' &&
								ss.autoShowDragdropMode == ss.DRAGDROP_MODE_DROP) {
								showSecondSearch = (ss.searchbar == this);
							}
						]]>.toString()
					).replace(
						'return;',
						<![CDATA[
							if (showSecondSearch)
								ss.showSecondSearch(ss.SHOWN_BY_DROP);
						$&]]>.toString()
					).replace(
						'handleURLBarCommand();',
						<![CDATA[
							if (showSecondSearch) {
								ss.droppedURI = this.value;
								ss.showSecondSearch(ss.SHOWN_BY_DROP);
							}
							else {
								$&;
							}
						]]>.toString()
					)
				);
				textbox.__secondsearch__updated = true;
			}
		}

		if (this.placesAvailable)
			window.setTimeout(function(aSelf) {
				aSelf.testOpenPopup();
			}, 1000, this);
	},
	
	testOpenPopup : function() 
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
 
	operateSuggesList : function(aEvent) 
	{
		if (
			this.secondSearch.getCurrentItem() ||
			(
				!this.getCurrentItem() &&
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_UP &&
				!aEvent.ctrlKey &&
				!aEvent.shiftKey &&
				!aEvent.altKey &&
				!aEvent.metaKey
			)
			) {
			return false;
		}
		else {
			if (aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER ||
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN)
				this.secondSearch.hideSecondSearch();

			return this.__secondsearch__operateSuggesList(aEvent);
		}
	},
 
	onTextEntered : function(aEvent) 
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
 
	onTextboxKeyPress : function(aEvent) 
	{
		var ss = window.getSecondSearch();
		if (
			(
				(
					!ss.shouldShowAutomatically ||
					ss.popup.shown
				) &&
				this.popup.selectedIndex < 0 &&
				(
					(ss.popupPosition == 0) ?
						(aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_UP) :
						(aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_DOWN)
				)
			) ||
			(
				ss.getCurrentItem() &&
				(
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_DOWN ||
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_UP ||
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RIGHT ||
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_LEFT
				)
			)
			)
			return false;
		else
			return this.__secondsearch__onKeyPress(aEvent);
	},
  
	destroyBar : function(aBar) 
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
	 
	onSearchTermDrop : function(aEvent) 
	{
		if (aEvent.target == this.searchbar) {
			this.textbox.onTextEntered(aEvent);
		}
		else if (aEvent.target.localName == 'menuitem') {
			this.doSearchBy(aEvent.target, aEvent);
		}
	},
 
	onCommand : function(aEvent) 
	{
		var node = aEvent.originalTarget || aEvent.target;
		if (node.getAttribute('class').indexOf('addengine-item') < 0) return;
		var current = this.getCurrentEngine();
		if (current)
			this.addEngineToRecentList(current);
	},
 
	onOperationPre : function(aEvent) 
	{
		if (
			(
				'GSuggest' in window &&
				GSuggest.getCurrentItem()
			) ||
			this.textbox.popup.selectedIndex > -1
			)
			return false;
		return true;
	},
 
	onOperationEnterPre : function(aEvent) 
	{
		if ('GSuggest' in window) GSuggest.hideSuggestPopup();
	},
 
	onOperationEnter : function(aCurrentItem, aEvent) 
	{
		this.doSearchBy(aCurrentItem, aEvent);
	},
  
/* do search */ 
	 
	doSearchBy : function(aItem, aEvent) 
	{
		if (!aItem.getAttribute('engineName'))
			aItem.setAttribute('engineName', aItem.getAttribute('label'));

		var engineName = aItem.getAttribute('engineName');
		if (engineName == this.kLOAD_AS_URI) { // location bar
			this.loadDroppedURI();
			return false;
		}

		var engine = this.getEngineFromName(engineName);
		this.selectedEngine = engine;
		this.doingSearch = true;

		var retVal;

		this.hideSecondSearch(true);

		if (!this.searchterm &&
			this.switchBlankInput) {
			if (!engine.keyword) {
				aEvent.stopPropagation();
				aEvent.preventDefault();
				this.switchTo(engine);
				retVal = false;
			}
		}
		else {
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

				this.loadForSearch(uri, (postData.value || null), aEvent);
			}
			else if (isSearchBar) { // Firefox 2
				retVal = bar.handleSearchCommand(aEvent, true);
			}
		}

		this.selectedEngine = null;
		window.setTimeout(function(aSelf) {
			aSelf.doingSearch = false;
			aSelf.clearAfterSearch();
		}, 1, this);

		this.clearAfterSearch();

		return retVal;
	},
	 
	loadForSearch : function(aURI, aPostData, aEvent) 
	{
		var newTab = (aEvent && aEvent.altKey) ||
					(aEvent.type == 'click' && aEvent.button == 1);
		var isManual = newTab;

		var inBackground = false;
		if ('TM_init' in window) { // Tab Mix Plus
			newTab = this.getBoolPref('extensions.tabmix.opentabfor.search') ? !newTab : newTab ;
			if (newTab) isManual = false;
			inBackground = this.getBoolPref('extensions.tabmix.loadSearchInBackground');
		}
		else { // Firefox 2
			newTab = this.openintab ? !newTab : newTab ;
			if (newTab) isManual = false;
			inBackground = this.loadInBackground;
		}

		if (
			this.browser.localName == 'tabbrowser' &&
			newTab &&
			(
				isManual ||
				!this.reuseBlankTab ||
				this.currentURI != 'about:blank'
			)
			) {
			this.browser.contentWindow.focus();

			// for location bar
			if (this.browser.userTypedValue == this.searchterm)
				this.browser.userTypedValue = null;

			var t = 'loadOneTab' in this.browser ?
				this.browser.loadOneTab(aURI, null, null, aPostData, false, true) :
				this.browser.addTab(aURI, null, null, aPostData);
			if (!inBackground)
				this.browser.selectedTab = t;
			if (gURLBar)
				gURLBar.value = aURI;
		}
		else
			this.browser.webNavigation.loadURI(aURI, Components.interfaces.LOAD_FLAGS_NONE, null, aPostData, null);

		this.browser.contentWindow.focus();
	},
 
	selectedEngine : null, 
	doingSearch : false,
  
	doSearchbarSearch : function(aData, aWhere, aOverride) 
	{ // Firefox 2
		var ss = window.getSecondSearch();
		var simpleFlag = !ss.placesAvailable;
		if (!aWhere || typeof aWhere != 'string') {
			aWhere = aWhere ? 'tab' : 'current ';
		}

		if (aWhere &&
			ss.openintab &&
			ss.reuseBlankTab &&
			ss.currentURI == 'about:blank') {
			aWhere = 'current';
		}

		if (aOverride) {
			var engine = ss.getRecentEngines()[0];
			engine = ss.getSearchEngineFromName(engine.name);
			if (!engine) return;

			var postData = null;
			var url = 'about:blank';
			var submission = engine.getSubmission(aData, null);
			if (submission) {
				url = submission.uri.spec;
				postData = submission.postData;
			}
			var loadInBackground = ss.loadInBackground;
			if (aWhere.indexOf('tab') > -1) {

				// for location bar
				if (ss.browser.userTypedValue == ss.searchterm)
					ss.browser.userTypedValue = null;

				if (!loadInBackground) ss.browser.contentWindow.focus();
				ss.browser.loadOneTab(url, null, null, postData, loadInBackground, false);
				if (gURLBar && !loadInBackground)
					gURLBar.value = url;
			}
			else
				ss.browser.webNavigation.loadURI(url, Components.interfaces.LOAD_FLAGS_NONE, null, postData, null);

			ss.browser.contentWindow.focus();
			return;
		}
		else {
			var retVal = this.__secondsearch__doSearch(aData, simpleFlag ? aWhere.indexOf('tab') > -1 : aWhere );
			ss.clearAfterSearch();
			return retVal;
		}
	},
 
	checkToDoSearch : function(aURI, aWhere, aAllowThirdPartyFixup, aPostData, aReferrerURI) 
	{
		if (!this.doingSearch) return false;

		var b = this.browser;
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
			case 'tab':
				b.loadOneTab(
					aURI,
					aReferrerURI,
					null,
					aPostData,
					loadInBackground,
					aAllowThirdPartyFixup || false
				);
				break;
		}
		if (!this.loadInBackground)
			b.contentWindow.focus();

		return true;
	},
	readyToSearch : function()
	{
		this.doingSearch = true;
	},
	searchDone : function()
	{
		this.doingSearch = false;
	},
	doingSearch : false,
 
	loadDroppedURI : function()
	{
		if ('handleURLBarCommand' in window) {
			this.textbox.value = this.droppedURI;
			handleURLBarCommand();
			this.droppedURI = null;
		}
	},
	droppedURI : null,
	kLOAD_AS_URI : 'secondsearch::loadAsURI',
  
/* operate engines */ 
	 
	get engines() 
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
  
	isEngineAvailable : function(aName) 
	{
		return this.engines.some(function(aEngine) {
				return aEngine.name == aName;
			});
	},
 
	getSearchEngineFromName : function(aName) 
	{
		var engine = null;
		this.engines.some(function(aEngine) {
			if (aEngine.name == aName) {
				engine = aEngine;
				return true;
			}
			return false;
		});
		return engine;
	},
 
	getEngineFromName : function(aName, aNot) 
	{
		var engine;

		aName = aName.split('\n');
		if (aName.length > 1) {
			this.keywords.some(function(aKeyword) {
				if (aNot ?
						aKeyword.keyword == aName[1] :
						aKeyword.keyword != aName[1]
					)
					return false;

				engine = {
					name    : aKeyword.name,
					icon    : aKeyword.icon,
					uri     : aKeyword.uri,
					keyword : (aKeyword.keyword || ''),
					id      : ''
				};
				return true;
			});
			return engine;
		}

		aName = aName[0];

		this.engines.some(function(aEngine) {
			if (aNot ?
					aEngine.name == aName :
					aEngine.name != aName
				)
				return false;

			engine = {
				name    : aEngine.name,
				icon    : (aEngine.iconURI ? aEngine.iconURI.spec : '' ),
				uri     : aEngine.getSubmission('', null).uri.spec,
				keyword : '',
				id      : ''
			};
			return true;
		}, this);

		return engine;
	},
 
	getCurrentEngine : function() 
	{
		var bar = this.searchbar;
		if (bar.localName != 'searchbar') return null;
		var engine = {
				name    : bar.currentEngine.name,
				icon    : (bar.currentEngine.iconURI ? bar.currentEngine.iconURI.spec : '' ),
				uri     : bar.currentEngine.getSubmission('', null).uri.spec,
				keyword : '',
				id      : ''
			};
		return engine;
	},
 
	getRecentEngines : function(aName) 
	{
		var names    = this.getArrayPref('secondsearch.recentengines.name');
		var icons    = this.getArrayPref('secondsearch.recentengines.icon');
		var uris     = this.getArrayPref('secondsearch.recentengines.uri');
		var keywords = this.getArrayPref('secondsearch.recentengines.keyword');
		var ids      = this.getArrayPref('secondsearch.recentengines.id');

		var list = [];
		var listDone = {};

		uris.forEach(function(aURI, aIndex) {
			if (
				keywords[aIndex] ?
					!(aURI in this.keywordsHash) :
					(
						!aURI ||
						!this.isEngineAvailable(names[aIndex])
					)
				)
				return;

			list.push({
				name    : names[aIndex],
				icon    : icons[aIndex],
				uri     : aURI,
				keyword : (keywords[aIndex] ? keywords[aIndex] : '' ),
				id      : ids[aIndex]
			});
			listDone[encodeURIComponent(names[aIndex])+':'+encodeURIComponent(aURI)] = true;
		}, this);

		if (list.length < this.historyNum) {
			var engine = this.getCurrentEngine();
			var engines = this.engines;
			var source;
			var item;
			for (var i = 0, maxi = this.historyNum, childNum = engines.length; list.length < maxi; i++)
			{
				if (i == childNum) break;
				source = engines[i];
				if (engine && source.name == engine.name)
					continue;

				item = this.getEngineFromName(source.name);
				if (encodeURIComponent(item.name)+':'+encodeURIComponent(item.uri) in listDone)
					continue;

				list.push(item);
				this.addEngineToRecentList(list[list.length-1]);
			}
		}

		return list;
	},
 
	updateRecentList : function(aOperation, aEngine) 
	{
		var names    = this.getArrayPref('secondsearch.recentengines.name');
		var icons    = this.getArrayPref('secondsearch.recentengines.icon');
		var uris     = this.getArrayPref('secondsearch.recentengines.uri');
		var keywords = this.getArrayPref('secondsearch.recentengines.keyword');
		var ids      = this.getArrayPref('secondsearch.recentengines.id');

		var retVal;
		var engines = [];
		uris.forEach(function(aURI, aIndex) {
			if (!aURI && !keywords[aIndex]) return;

			if (names[aIndex] == aEngine.name) {
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

			engines.push({
				name    : names[aIndex],
				icon    : icons[aIndex],
				uri     : aURI,
				keyword : keywords[aIndex],
				id      : ids[aIndex]
			});
		});

		if (aOperation == 'add')
			engines.unshift(aEngine);

		var history = this.historyNum;
		if (history > -1) {
			while (engines.length > history)
			{
				engines.pop();
			}
		}

		this.saveRecentEnginesCache(engines);

		return retVal;
	},
	saveRecentEnginesCache : function(aEngines)
	{
		this.setArrayPref('secondsearch.recentengines.name',
			aEngines.map(function(aEngine) { return aEngine.name; }));
		this.setArrayPref('secondsearch.recentengines.icon',
			aEngines.map(function(aEngine) { return aEngine.icon; }));
		this.setArrayPref('secondsearch.recentengines.uri',
			aEngines.map(function(aEngine) { return aEngine.uri; }));
		this.setArrayPref('secondsearch.recentengines.keyword',
			aEngines.map(function(aEngine) { return aEngine.keyword; }));
		this.setArrayPref('secondsearch.recentengines.id',
			aEngines.map(function(aEngine) { return aEngine.id; }));
	},
	
	addEngineToRecentList : function(aEngine) 
	{
		if (!aEngine) return;
		this.updateRecentList('add', aEngine);
	},
 
	removeEngineFromRecentList : function(aEngine) 
	{
		if (!aEngine) return;
		this.updateRecentList('remove', aEngine);
	},
 
	isEngineInRecentList : function(aEngine) 
	{
		var retVal = this.updateRecentList('check', aEngine);
		return retVal ? true : false ;
	},
   
/* keywords */ 
	 
	keywords : [], 
	keywordsHash : {},
 
	startObserveKeyword : function() 
	{
		if (this.placesAvailable) {
			this.NavBMService.addObserver(this.placesObserver, false);
		}
		else {
			try {
				this.bookmarksDS.AddObserver(this.bookmarksRDFObserver);
			}
			catch(e) {
			}
		}
	},
 
	endObserveKeyword : function() 
	{
		if (this.placesAvailable) {
			this.NavBMService.removeObserver(this.placesObserver);
			this.placesObserver.destroy();
			this.placesObserver = null;
		}
		else {
			try {
				this.bookmarksDS.RemoveObserver(this.bookmarksRDFObserver);
				this.bookmarksRDFObserver.destroy();
				this.bookmarksRDFObserver = null;
			}
			catch(e) {
			}
		}
	},
 
	initKeywords : function(aForceUpdate) 
	{
		this.keywords     = [];
		this.keywordsHash = {};
		if (!this.shouldShowKeywords) return;

		var names    = this.getArrayPref('secondsearch.keyword.cache.name');
		var icons    = this.getArrayPref('secondsearch.keyword.cache.icon');
		var uris     = this.getArrayPref('secondsearch.keyword.cache.uri');
		var keywords = this.getArrayPref('secondsearch.keyword.cache.keyword');

		var count = this.getIntPref('secondsearch.keyword.cache.count');
		if (
			!aForceUpdate &&
			count !== null &&
			count != -1
			) { // load cache
			uris.forEach(function(aURI, aIndex) {
				if (!aURI) return;
				this.keywordsHash[aURI] = {
					name    : names[aIndex],
					icon    : icons[aIndex],
					uri     : aURI,
					keyword : keywords[aIndex]
				};
				this.keywords.push(this.keywordsHash[aURI]);
			}, this);
		}
		else if (this.placesAvailable) { // initialize for Firefox 3
			var statement = this.placesDB.createStatement(
						'SELECT b.id FROM moz_bookmarks b'+
						' JOIN moz_keywords k ON k.id = b.keyword_id'
					);
			try {
				var data;
				while (statement.executeStep())
				{
					data = this.newKeywordFromPlaces(statement.getDouble(0));
					this.keywords.push(data);
					this.keywordsHash[data.uri] = data;
				}
			}
			finally {
				statement.reset();
			}
		}
		else { // initialize for Firefox 2
			var resources = this.bookmarksDS.GetAllResources()
			var res;
			var shortcut,
				name,
				icon;
			var doneKeywords = {};
			while (resources.hasMoreElements())
			{
				res = resources.getNext();
				try{
					res = res.QueryInterface(Components.interfaces.nsIRDFResource);
					shortcut = this.bookmarksDS.GetTargets(res, this.shortcutRes, true);
					if (!shortcut) continue;
					shortcut = shortcut.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral);
					if (!shortcut.Value || shortcut.Value in doneKeywords) continue;

					name = this.bookmarksDS.GetTargets(res, this.nameRes, true);
					icon = this.bookmarksDS.GetTargets(res, this.iconRes, true);
					this.keywordsHash[res.Value] = {
						name    : name.hasMoreElements() ? name.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : shortcut.Value ,
						icon    : icon.hasMoreElements() ? icon.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' ,
						uri     : res.Value,
						keyword : shortcut.Value
					};
					this.keywords.push(this.keywordsHash[res.Value]);
					doneKeywords[shortcut.Value] = true;
				}
				catch(e) {
				}
			}
		}
		this.saveKeywordsCache();
	},
 	
	// Firefox 3: SQLite based bookmarks 
	 
	newKeywordFromPlaces : function(aId) 
	{
		var name    = this.NavBMService.getItemTitle(aId);
		var uri     = this.NavBMService.getBookmarkURI(aId);
		var keyword = this.NavBMService.getKeywordForBookmark(aId);
		var favicon = '';
		try {
			favicon = this.FavIconService.getFaviconForPage(uri).spec;
		}
		catch(e) {
		}
		return {
			name    : name,
			icon    : favicon,
			uri     : uri.spec,
			keyword : keyword
		};
	},
 
	updateKeywordFromPlaces : function(aId, aMode) 
	{
		var keyword = this.NavBMService.getKeywordForBookmark(aId);
		var data    = this.newKeywordFromPlaces(aId);
		var oldData = null;

		this.keywords.slice().some(function(aKeyword, aIndex) {
			if (aKeyword.uri != data.uri &&
				aKeyword.keyword != keyword)
				return false;

			if (aMode == 'delete' ||
				aMode == 'keyword' ||
				aMode == 'uri') {
				delete this.keywordsHash[aKeyword.uri];
				this.keywords.splice(aIndex, 1);
			}
			if (aMode == 'keyword' ||
				aMode == 'uri') {
				this.keywords.push(data);
				this.keywordsHash[data.uri] = data;
			}
			if (aMode != 'delete') {
				oldData = {
					uri     : aKeyword.uri,
					keyword : aKeyword.keyword
				};
				this.keywordsHash[data.uri].name    = data.name;
				this.keywordsHash[data.uri].icon    = data.icon;
				this.keywordsHash[data.uri].uri     = data.uri;
				this.keywordsHash[data.uri].keyword = data.keyword;
			}
			return true;
		}, this);

		if (!oldData) {
			this.keywords.push(data);
			this.keywordsHash[data.uri] = data;
		}
		else {
			this.updateRecentEnginesForKeywordModification(
				oldData,
				(aMode == 'delete' ? null : data )
			);
		}

		this.saveKeywordsCache();
	},
 
	updateRecentEnginesForKeywordModification : function(aOldData, aNewData)
	{
		var ids      = this.getArrayPref('secondsearch.recentengines.id');
		var names    = this.getArrayPref('secondsearch.recentengines.name');
		var icons    = this.getArrayPref('secondsearch.recentengines.icon');
		var uris     = this.getArrayPref('secondsearch.recentengines.uri');
		var keywords = this.getArrayPref('secondsearch.recentengines.keyword');

		var recentEngines = [];
		var modified = false;
		uris.forEach(function(aURI, aIndex) {
			if (aURI == aOldData.uri ||
				keywords[aIndex] == aOldData.keyword) {
				modified = true;
				if (!aNewData) return;

				recentEngines.push({
					name    : aNewData.name,
					icon    : aNewData.icon,
					uri     : aNewData.uri,
					keyword : aNewData.keyword,
					id      : ''
				});
				return;
			}
			recentEngines.push({
				name    : names[aIndex],
				icon    : icons[aIndex],
				uri     : aURI,
				keyword : keywords[aIndex],
				id      : ids[aIndex]
			});
		});

		if (modified)
			this.saveRecentEnginesCache(recentEngines);
	},
 
	saveKeywordsCache : function()
	{
		this.keywords.sort(function(aA, aB) { return aA.name > aB.name ? 1 : -1 });

		this.setArrayPref('secondsearch.keyword.cache.name',
			this.keywords.map(function(aEngine) { return aEngine.name; }));
		this.setArrayPref('secondsearch.keyword.cache.icon',
			this.keywords.map(function(aEngine) { return aEngine.icon; }));
		this.setArrayPref('secondsearch.keyword.cache.uri',
			this.keywords.map(function(aEngine) { return aEngine.uri; }));
		this.setArrayPref('secondsearch.keyword.cache.keyword',
			this.keywords.map(function(aEngine) { return aEngine.keyword; }));

		this.setIntPref('secondsearch.keyword.cache.count', this.keywords.length);
	},
 
	get placesAvailable() 
	{
		return 'PlacesController' in window;
	},
 
	get placesDB() 
	{
		if (!this._placesDB) {
			const DirectoryService = Components.classes['@mozilla.org/file/directory_service;1']
						.getService(Components.interfaces.nsIProperties);
			var file = DirectoryService.get('ProfD', Components.interfaces.nsIFile);
			file.append('places.sqlite');

			var storageService = Components.classes['@mozilla.org/storage/service;1']
						.getService(Components.interfaces.mozIStorageService);
			this._placesDB = storageService.openDatabase(file);
		}
		return this._placesDB;
	},
	_placesDB : null,
 
	get NavBMService() 
	{
		if (!this._NavBMService) {
			this._NavBMService = Components.classes['@mozilla.org/browser/nav-bookmarks-service;1']
						.getService(Components.interfaces.nsINavBookmarksService);
		}
		return this._NavBMService;
	},
 
	get FavIconService() 
	{
		if (!this._FavIconService) {
			this._FavIconService = Components.classes['@mozilla.org/browser/favicon-service;1']
						.getService(Components.interfaces.nsIFaviconService);
		}
		return this._FavIconService;
	},
 
	get placesObserver() 
	{
		if (!this.mPlacesObserver) {
			this.mPlacesObserver = {
				owner : this,
				onItemAdded : function(aId, aContainer, aIndex)
				{
//					dump('onItemAdded '+aId+'\n');
//					var keyword = this.owner.NavBMService.getKeywordForBookmark(aId);
//					dump('  keyword: '+keyword+'\n');
				},
				onItemRemoved : function(aId, aContainer, aIndex)
				{
//					dump('onItemRemoved '+aId+'\n');
//					var keyword = this.owner.NavBMService.getKeywordForBookmark(aId);
//					dump('  keyword: '+keyword+'\n');
				},
				onItemChanged : function(aId, aProperty, aIsAnnotation, aValue)
				{
//					dump('onItemChanged '+aId+' ['+aProperty+' = '+aValue+']\n');
//					var keyword = this.owner.NavBMService.getKeywordForBookmark(aId);
//					dump('  keyword: '+keyword+'\n');
					var keyword = this.owner.NavBMService.getKeywordForBookmark(aId);
					switch (aProperty)
					{
						case 'keyword':
							if (keyword)
								this.owner.updateKeywordFromPlaces(aId, 'keyword');
							else
								this.owner.updateKeywordFromPlaces(aId, 'delete');
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
  
	// Firefox 2: RDF based bookmarks 
	
	updateKeywordFromRDF : function(aSource, aMode) 
	{
		var res = this.RDF.GetResource(aSource);
		var keyword = this.bookmarksDS.GetTargets(res, this.shortcutRes, true);

		var name = this.bookmarksDS.GetTargets(res, this.nameRes, true);
		var icon = this.bookmarksDS.GetTargets(res, this.iconRes, true);
		var data = {
				name    : (name.hasMoreElements() ? name.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' ),
				icon    : (icon.hasMoreElements() ? icon.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' ),
				uri     : aSource,
				keyword : (keyword.hasMoreElements() ? keyword.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' )
			};
		keyword = data.keyword;

		if (!keyword) aMode = 'delete';

		var oldData = null;
		this.keywords.slice().some(function(aKeyword, aIndex) {
			if (aKeyword.uri != data.uri &&
				aKeyword.keyword != keyword)
				return false;

			if (aMode != 'add') {
				delete this.keywordsHash[aKeyword.uri];
				this.keywords.splice(aIndex, 1);
				oldData = {
					uri     : aKeyword.uri,
					keyword : aKeyword.keyword
				};
			}
			if (aMode != 'delete') {
				this.keywords.push(data);
				this.keywordsHash[data.uri] = data;
			}
			return true;
		}, this);

		if (!oldData) {
			this.keywords.push(data);
			this.keywordsHash[data.uri] = data;
		}
		else {
			this.updateRecentEnginesForKeywordModification(
				oldData,
				(aMode == 'delete' ? null : data )
			);
		}

		this.saveKeywordsCache();
	},
 
	get RDF() 
	{
		if (!this._RDF)
			this._RDF = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(Components.interfaces.nsIRDFService);
		return this._RDF;
	},
	_RDF : null,
 
	get shortcutRes() 
	{
		if (!this._shortcutRes)
			this._shortcutRes = this.RDF.GetResource('http://home.netscape.com/NC-rdf#ShortcutURL')
		return this._shortcutRes;
	},
	_shortcutRes : null,
 
	get nameRes() 
	{
		if (!this._nameRes)
			this._nameRes = this.RDF.GetResource('http://home.netscape.com/NC-rdf#Name')
		return this._nameRes;
	},
	_nameRes : null,
 
	get iconRes() 
	{
		if (!this._iconRes)
			this._iconRes = this.RDF.GetResource('http://home.netscape.com/NC-rdf#Icon')
		return this._iconRes;
	},
	_iconRes : null,
 
	get bookmarksDS() 
	{
		if (!this._bookmarksDS)
			this._bookmarksDS = this.RDF.GetDataSource('rdf:bookmarks')
		return this._bookmarksDS;
	},
	_bookmarksDS : null,
 
	get bookmarksRDFObserver() 
	{
		if (!this.mBookmarksRDFObserver) {
			this.mBookmarksRDFObserver = {
				owner : this,
				onAssert: function (aDataSource, aSource, aProperty, aTarget)
				{
					this.setOverflowTimeout(aSource, aProperty, 'add');
				},
				onUnassert: function (aDataSource, aSource, aProperty, aTarget)
				{
					this.setOverflowTimeout(aSource, aProperty, 'delete');
				},
				onChange: function (aDataSource, aSource, aProperty, aOldTarget, aNewTarget)
				{
					this.setOverflowTimeout(aSource, aProperty, 'change');
				},
				onMove: function (aDataSource, aOldSource, aNewSource, aProperty, aTarget) {},
				onBeginUpdateBatch: function (aDataSource) {},
				onEndUpdateBatch: function (aDataSource) {},
				setOverflowTimeout: function (aSource, aProperty, aMode)
				{
					if (
						aProperty.Value == 'http://home.netscape.com/NC-rdf#ShortcutURL' ||
						(
							aSource.Value in this.owner.keywordsHash &&
							(
								aProperty.Value == 'http://home.netscape.com/NC-rdf#ShortcutURL' ||
								aProperty.Value == 'http://home.netscape.com/NC-rdf#Name' ||
								aProperty.Value == 'http://home.netscape.com/NC-rdf#Icon'
							)
						)
						)
						this.owner.updateKeywordFromRDF(aSource.Value, aMode);
				},
				destroy : function()
				{
					this.owner = null;
				}
			};
		}
		return this.mBookmarksRDFObserver;
	},
 
	set bookmarksRDFObserver(val) 
	{
		this.mBookmarksRDFObserver = val;
		return val;
	},
   
/* prefs */ 
	 
	domain  : 'secondsearch', 
 
	observe : function(aSubject, aTopic, aPrefName) 
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
				if (this.getIntPref(aPrefName) == -1 &&
					!this.getBoolPref('secondsearch.keyword.updating')) {
					this.setBoolPref('secondsearch.keyword.updating', true);
					this.initKeywords(true);
					window.setTimeout(function(aSelf) {
						aSelf.setBoolPref('secondsearch.keyword.updating', false);
					}, 100, this);
				}
				return;
		}
	},
  
/* initializing */ 
	 
	init : function() 
	{
		this.initBase();

		window.__secondsearch__BrowserCustomizeToolbar = window.BrowserCustomizeToolbar;
		window.BrowserCustomizeToolbar = function() {
			window.getSecondSearch().destroyBar();
			window.__secondsearch__BrowserCustomizeToolbar.call(window);
		};

		var toolbox = document.getElementById('browser-toolbox') || // Firefox 3
					document.getElementById('navigator-toolbox'); // Firefox 2
		if (toolbox.customizeDone) {
			toolbox.__secondsearch__customizeDone = toolbox.customizeDone;
			toolbox.customizeDone = function(aChanged) {
				this.__secondsearch__customizeDone(aChanged);
				window.getSecondSearch().initBar();
			};
		}
		if ('BrowserToolboxCustomizeDone' in window) {
			window.__secondsearch__BrowserToolboxCustomizeDone = window.BrowserToolboxCustomizeDone;
			window.BrowserToolboxCustomizeDone = function(aChanged) {
				window.__secondsearch__BrowserToolboxCustomizeDone.apply(window, arguments);
				window.getSecondSearch().initBar();
			};
		}

		// for Firefox 3
		eval('window.openUILinkIn = '+
			window.openUILinkIn.toSource().replace(
				'{',
				<><![CDATA[$&
					if (SecondSearch.checkToDoSearch.apply(SecondSearch, arguments))
						return;
				]]></>
			)
		);

		window.setTimeout(function(aSelf) {
			aSelf.delayedInit();
		}, 100, this);
	},
	 
	delayedInit : function() 
	{
		this.initKeywords();
		this.startObserveKeyword();
	},
  
	destroy : function() 
	{
		this.destroyBase();
		this.endObserveKeyword();
	}
  
}; 
  
SecondSearchBrowser.prototype.__proto__ = SecondSearchBase.prototype; 
var SecondSearch = new SecondSearchBrowser();

window.addEventListener('load', SecondSearch, false);
 
