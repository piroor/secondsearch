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
  
/* elements */ 
	
	get searchbar() 
	{
		var bar = document.getElementsByTagName('searchbar');
		return bar && bar.length ? bar[0] : null ;
	},
 
	get textbox() 
	{
		var bar = this.searchbar;
		return bar ? (
				bar.textbox || /* Firefox 3 */
				bar._textbox || /* Firefox 2 */
				bar.mTextbox /* Firefox 1.5 */
			) : null ;
	},
 
	get source() 
	{
//		var organized = document.getElementById('search-popup');
//		if (organized) return organized;

		var bar = this.searchbar;
		var node = bar ? document.getAnonymousElementByAttribute(bar, 'anonid', 'searchbar-popup') : null ;
		if (node &&
			node.hasChildNodes() &&
			node.firstChild.localName == 'menuseparator') {
			this.searchbar.rebuildPopup();
		}
		return node;
	},
	get sourceItems() 
	{
		return this.evaluateXPath('descendant::xul:menuitem[contains(@class, "searchbar-engine-menuitem")]', this.source);
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
				document.getAnonymousElementByAttribute(bar, 'id', 'searchbar-dropmarker') /* Firefox 1.5 */
			) : null ;
	},
 
	get engine() 
	{
		return this.searchbar.getAttribute('searchengine');
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
		range.detach();

		var count = 0;

		var items = this.sourceItems;
		var item;
		for (var i = 0, maxi = items.snapshotLength; i < maxi; i++)
		{
			item = items.snapshotItem(i);
			if (parent && parent.getElementsByAttribute('engineName', item.getAttribute('label')).length)
				continue;

			popup.appendChild(item.cloneNode(true));
			popup.lastChild.setAttribute('engineName', popup.lastChild.getAttribute('label'));
			popup.lastChild.id = 'secondsearch-'+(popup.lastChild.id || encodeURIComponent(popup.lastChild.getAttribute('label')));
			if (!count)
				popup.lastChild.setAttribute('_moz-menuactive', 'true');

			count++;
		}

		if (this.keywords.length) {
			if (count)
				popup.appendChild(document.createElement('menuseparator'));

			for (var i = 0, maxi = this.keywords.length; i < maxi; i++)
			{
				if (this.keywords[i].uri &&
					parent &&
					parent.getElementsByAttribute('engineName', this.keywords[i].name+'\n'+this.keywords[i].keyword).length)
					continue;

				popup.appendChild(document.createElement('menuitem'));
				popup.lastChild.setAttribute('label',      this.keywords[i].name);
				popup.lastChild.setAttribute('class',      'menuitem-iconic');
				popup.lastChild.setAttribute('src',        this.keywords[i].icon);
				popup.lastChild.setAttribute('keyword',    this.keywords[i].keyword);
				popup.lastChild.setAttribute('engineName', this.keywords[i].name+'\n'+this.keywords[i].keyword);
				popup.lastChild.id = 'secondsearch-keyword-'+encodeURIComponent(this.keywords[i].name);

				count++;
			}

			if (popup.lastChild && popup.lastChild.localName == 'menuseparator')
				popup.removeChild(popup.lastChild);
		}

		if (aReverse) {
			var nodes = [];
			for (var i = 0, maxi = popup.childNodes.length; i < maxi; i++)
			{
				if (popup.childNodes[i].localName != 'menu')
					nodes.push(popup.childNodes[i]);
			}
			nodes.reverse();
			var node;
			for (var i = 0, maxi = nodes.length; i < maxi; i++)
			{
				node = popup.removeChild(nodes[i]);
				if (i+offset < popup.childNodes.length)
					popup.insertBefore(node, popup.childNodes[i+offset]);
				else
					popup.appendChild(node);
			}
		}
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
		range.detach();


		var current = this.getCurrentEngine();
		if (this.isEngineInRecentList(current))
			this.removeEngineFromRecentList(current);

		var engines = this.getRecentEngines();
		if (popup.shownBy == this.SHOWN_BY_DROP) {
			engines.unshift(current);
		}

		var refNode = null;
		if (this.popupPosition == 1) {
			engines.reverse();
			refNode = popup.firstChild;
		}

		var template = popup.getAttribute('labelTemplate');
		var node;
		for (var i = engines.length-1; i > -1; i--)
		{
			node = document.createElement('menuitem');
			if (refNode) {
				popup.insertBefore(node, refNode);
			}
			else {
				popup.appendChild(node);
			}
			node.setAttribute('label', template.replace(/\%s/i, (engines[i].name || '')));
			node.setAttribute('src',   engines[i].icon || '');
			node.setAttribute('class', 'menuitem-iconic');
			node.setAttribute('engineName', (engines[i].name || '')+(engines[i].keyword ? '\n'+engines[i].keyword : '' ));
		}
	},
 
	switchTo : function(aEngine) 
	{
		var bar = this.searchbar;
		var box = this.textbox;
		var current = this.getCurrentEngine();
		if (current.name != aEngine.name) {
			this.removeEngineFromRecentList(aEngine);
			this.addEngineToRecentList(current);
			if ('_engines' in bar) { // Firefox 2
				bar.currentEngine = this.getSearchEngineFromName(aEngine.name);
			}
			else { // Firefox 1.5
				box.currentEngine = aEngine.id;
			}
		}
		box.focus();
		box.select();
	},
 
	get popupHeight() 
	{
		return (this.popupType == 0) ? (this.getCharPref('secondsearch.recentengines.uri') || '').split('|').length :
				(this.sourceItems.length + this.keywords.length) ;
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

		textbox.__secondsearch__onTextEntered = textbox.onTextEntered;
		textbox.onTextEntered = this.onTextEntered;

		textbox.__secondsearch__onKeyPress = textbox.onKeyPress;
		textbox.onKeyPress = this.onTextboxKeyPress;

		eval(
			'textbox.searchbarDNDObserver.onDrop = '+
				textbox.searchbarDNDObserver.onDrop.toSource()
					.replace('this.mOuter.onTextEntered',
						'var ss = window.getSecondSearch();'+
						'if (ss.autoShowDragdropMode == ss.DRAGDROP_MODE_DROP) {'+
							'ss.showSecondSearch(ss.SHOWN_BY_DROP);'+
							'return;'+
						'}'+
						'else if (ss.autoShowDragdropMode == ss.DRAGDROP_MODE_NONE || ss.handleDragdropOnlyOnButton) {'+
							'return;'+
						'}'+
						'this.mOuter.onTextEntered'
					)
		);
		eval(
			'textbox.searchbarDNDObserver.getSupportedFlavours = '+
				textbox.searchbarDNDObserver.getSupportedFlavours.toSource()
					.replace('flavourSet.appendFlavour',
						'var ss = window.getSecondSearch();'+
						'if ('+
							'('+
								'ss.autoShowDragdropMode == ss.DRAGDROP_MODE_NONE ||'+
								'ss.handleDragdropOnlyOnButton'+
							') &&'+
							'("handleSearchCommand" in ss.searchbar ? (ss.searchbar.getAttribute(ss.emptyAttribute) != "true") : ss.textbox.value )'+
							') {'+
							'return flavourSet;'+
						'};'+
						'flavourSet.appendFlavour'
					)
		);

		if ('handleSearchCommand' in search && !search.__secondsearch__doSearch) { // Firefox 2
			eval(
				'search.handleSearchCommand = '+
					search.handleSearchCommand.toSource()
						.replace(')', ', aOverride)')
						.replace(/doSearch\(([^\)]+)\)/, 'doSearch($1, aOverride)')
			);
			eval(
				'search.doSearch = '+
					search.doSearch.toSource()
						.replace(
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
			search.__secondsearch__doSearch = search.doSearch;
			search.doSearch = this.doSearchbarSearch;
			search._popup.addEventListener('command', this, true);
		}
		else if ('onEnginePopupCommand' in textbox && textbox.onEnginePopupCommand.toSource().indexOf('SecondSearch') < 0) { // Firefox 1.5
			eval(
				'textbox.onEnginePopupCommand = '+
					textbox.onEnginePopupCommand.toSource()
						.replace('this.currentEngine = target.id',
							'window.getSecondSearch().addEngineToRecentList(window.getSecondSearch().getCurrentEngine());'+
							'this.currentEngine = target.id'
						)
			);
			eval(
				'textbox.__secondsearch__onTextEntered = '+
					textbox.__secondsearch__onTextEntered.toSource()
						.replace(
							'(evt && evt.altKey)',
							'$& || window.getSecondSearch().openintab'
						)
			);
		}

		if ('SearchLoadURL' in window) { // Fx 1.5?
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
			eval(
				'window.TMP_SearchLoadURL = '+
					window.TMP_SearchLoadURL.toSource()
						.replace('var submission = searchbar.currentEngine',
							'var overrideEngine = null;'+
							'if (window.getSecondSearch().selectedEngine) {'+
								'overrideEngine = window.getSecondSearch().getSearchEngineFromName(window.getSecondSearch().selectedEngine.name);'+
							'};'+
							'var submission = (overrideEngine || searchbar.currentEngine)'
						)
			);
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
		if (window.getSecondSearch().getCurrentItem())
			return false;
		else {
			var retVal = this.__secondsearch__onTextEntered(aEvent);
			window.getSecondSearch().clearAfterSearch();
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
  
	destroyBar : function() 
	{
		if (!this.destroyBarBase()) return;

		var search = this.searchbar;
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
		if (node.getAttribute('class').indexOf('addengine-item') > -1)
			this.addEngineToRecentList(this.getCurrentEngine());
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

		var engine = this.getEngineFromName(aItem.getAttribute('engineName'));
		this.selectedEngine = engine;
		this.doingSearch = true;

		var bar = this.searchbar;
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
			if (engine.keyword) {
				var postData = {};
				var uri = ('getShortcutOrURL' in window) ?
					getShortcutOrURL(engine.keyword+' '+this.searchterm, postData) :
					getShortcutOrURI(engine.keyword+' '+this.searchterm, postData);

				if (!uri)
					return retVal;

				this.loadForSearch(uri, (postData.value || null), aEvent);
			}
			else if ('handleSearchCommand' in bar) { // Firefox 2
				retVal = bar.handleSearchCommand(aEvent, true);
			}
			else { // Firefox 1.5
				var uri = this.getSearchURI(this.searchterm, engine.id);
				var newTab = (aEvent && aEvent.altKey) || (aEvent.type == 'click' && aEvent.button == 1);
				var isManual = newTab;
				newTab = this.openintab ? !newTab : newTab ;
				if (!isManual &&
					newTab &&
					this.reuseBlankTab &&
					this.currentURI == 'about:blank')
					newTab = !newTab;
				retVal = SearchLoadURL(uri, newTab);
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
		if ('TabbrowserService' in window) { // TBE
			var behavior = this.getIntPref('browser.tabs.opentabfor.searchbar.behavior');
			newTab = behavior > 0 ? !newTab : newTab ;
			if (newTab) isManual = false;
			inBackground = behavior == 2;
		}
		else if ('TM_init' in window) { // Tab Mix Plus
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
 
	getSearchURI : function(aTerm, aEngine) 
	{
		var bar = this.searchbar;
		var current = bar.getAttribute('searchengine');
		if (current) { // Firefox 1.5
			var ISEARCHSVC = Components.classes['@mozilla.org/rdf/datasource;1?name=internetsearch'].getService(Components.interfaces.nsIInternetSearchService);
			if (aEngine) current = aEngine;
			try {
				current = ISEARCHSVC.GetInternetSearchURL(current, (aTerm || ''), 0, 0, {value:0});
				if (!aTerm) {
					var uri = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService).newURI(current, null, null);
					try {
						current = uri.host;
					}
					catch (e) {
					}
				}
			}
			catch(e) {
			}
		}
		if (!current && 'currentEngine' in this.searchbar) { // Firefox 2
			var engine = bar.currentEngine;
			current = engine.getSubmission((aTerm || ''), null).uri.spec;
		}
		return current;
	},
  
/* operate engines */ 
	
	isEngineAvailable : function(aName)
	{
		var bar = this.searchbar;
		if ('_engines' in bar) // Firefox 2
			return this.getSearchEngineFromName(aName) ? true : false ;
		return this.source.getElementsByAttribute('label', aName).length ? true : false ;
	},
 
	getSearchEngineFromName : function(aName) 
	{ // Firefox 2
		var bar = this.searchbar;
		for (var i = 0, maxi = bar._engines.length; i < maxi; i++)
		{
			if (bar._engines[i].name == aName)
				return bar._engines[i];
		}
		return null;
	},
 
	getEngineFromName : function(aName, aNot) 
	{
		var bar = this.searchbar;
		var engine;

		aName = aName.split('\n');
		if (aName.length > 1) {
			for (var i = 0, maxi = this.keywords.length; i < maxi; i++)
			{
				if (aNot ?
						this.keywords[i].keyword == aName[1] :
						this.keywords[i].keyword != aName[1]
					) continue;

				engine = {
					name    : this.keywords[i].name,
					icon    : this.keywords[i].icon,
					uri     : this.keywords[i].uri,
					keyword : (this.keywords[i].keyword || ''),
					id      : ''
				};
				break;
			}
			return engine;
		}

		aName = aName[0];

		if ('_engines' in bar) { // Firefox 2
			for (var i = 0, maxi = bar._engines.length; i < maxi; i++)
			{
				if (aNot ?
						bar._engines[i].name == aName :
						bar._engines[i].name != aName
					) continue;

				engine = {
					name    : bar._engines[i].name,
					icon    : (bar._engines[i].iconURI ? bar._engines[i].iconURI.spec : '' ),
					uri     : bar._engines[i].getSubmission('', null).uri.spec,
					keyword : '',
					id      : ''
				};
				break;
			}
		}
		else { // Firefox 1.5
			var items = this.sourceItems;
			var item;
			for (var i = 0, maxi = items.snapshotLength; i < maxi; i++)
			{
				item = items.snapshotItem(i);
				if (
					!item.id ||
					(aNot ?
						item.getAttribute('label') == aName :
						item.getAttribute('label') != aName
					)
					) continue;

				engine = {
					name    : item.getAttribute('label'),
					icon    : item.getAttribute('src'),
					uri     : this.getSearchURI('', item.id),
					keyword : '',
					id      : item.id
				};
				break;
			}
		}


		return engine;
	},
 
	getCurrentEngine : function() 
	{
		var bar = this.searchbar;
		var engine;
		if ('_engines' in bar) { // Firefox 2
			engine = {
				name    : bar.currentEngine.name,
				icon    : (bar.currentEngine.iconURI ? bar.currentEngine.iconURI.spec : '' ),
				uri     : bar.currentEngine.getSubmission('', null).uri.spec,
				keyword : '',
				id      : ''
			};
		}
		else { // Firefox 1.5
			var box = this.textbox;
			var engineRes = box.rdfService.GetResource(box.currentEngine);
			const kNC_Name = box.rdfService.GetResource('http://home.netscape.com/NC-rdf#Name');
			var name = box.readRDFString(engineRes, kNC_Name);
			engine = {
				name    : name,
				icon    : bar.getAttribute('src'),
				uri     : this.getSearchURI('', box.currentEngine),
				keyword : '',
				id      : box.currentEngine
			};
		}
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
		var source = this.source;

		for (var i = 0, maxi = uris.length; i < maxi; i++)
		{
			if (
				keywords[i] ?
					!(uris[i] in this.keywordsHash) :
					(
						!uris[i] ||
						!this.isEngineAvailable(names[i])
					)
				)
				continue;

			list.push({
				name    : names[i],
				icon    : icons[i],
				uri     : uris[i],
				keyword : (keywords[i] ? keywords[i] : '' ),
				id      : ids[i]
			});
			listDone[encodeURIComponent(names[i])+':'+encodeURIComponent(uris[i])] = true;
		}

		if (list.length < this.historyNum) {
			var engine = this.getCurrentEngine();
			var items = this.sourceItems;
			var source;
			var item;
			for (var i = 0, maxi = this.historyNum, childNum = items.snapshotLength; list.length < maxi; i++)
			{
				if (i == childNum) break;
				source = items.snapshotItem(i);
				if (source.localName != 'menuitem' ||
					source.getAttribute('label') == engine.name ||
					source.getAttribute('anonid') == 'open-engine-manager')
					continue;

				item = this.getEngineFromName(source.getAttribute('label'));
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

		for (var i = uris.length-1; i > -1; i--)
		{
			if (uris[i] || keywords[i]) continue;
			names.splice(i, 1);
			icons.splice(i, 1);
			uris.splice(i, 1);
			keywords.splice(i, 1);
			ids.splice(i, 1);
		}

		var retVal;

		if (aOperation == 'add' ||
			aOperation == 'remove' ||
			aOperation == 'check') {
			for (var i = 0, maxi = names.length; i < maxi; i++)
			{
				if (names[i] != aEngine.name) continue;
				if (aOperation == 'check') {
					retVal = true;
					break;
				}
				names.splice(i, 1);
				icons.splice(i, 1);
				uris.splice(i, 1);
				keywords.splice(i, 1);
				ids.splice(i, 1);
				break;
			}
		}

		if (aOperation == 'add') {
			names.splice(0, 0, aEngine.name);
			icons.splice(0, 0, aEngine.icon);
			uris.splice(0, 0, aEngine.uri);
			keywords.splice(0, 0, aEngine.keyword);
			ids.splice(0, 0, aEngine.id);
		}

		var history = this.historyNum;
		if (history > -1) {
			while (uris.length > history)
			{
				names.splice(names.length-1, 1);
				icons.splice(icons.length-1, 1);
				uris.splice(uris.length-1, 1);
				keywords.splice(keywords.length-1, 1);
				ids.splice(ids.length-1, 1);
			}
		}

		this.setArrayPref('secondsearch.recentengines.name',    names);
		this.setArrayPref('secondsearch.recentengines.icon',    icons);
		this.setArrayPref('secondsearch.recentengines.uri',     uris);
		this.setArrayPref('secondsearch.recentengines.keyword', keywords);
		this.setArrayPref('secondsearch.recentengines.id',      ids);

		return retVal;
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
			var data;
			for (var i = 0, maxi = uris.length; i < maxi; i++)
			{
				data = {
					name    : names[i],
					icon    : icons[i],
					uri     : uris[i],
					keyword : keywords[i]
				}
				if (!uris[i]) continue;
				this.keywords.push(data);
				this.keywordsHash[data.uri] = data;
			}
		}
		else if (this.placesAvailable) { // initialize for Firefox 3
			var s = this.placesDB.createStatement(
						'SELECT b.id FROM moz_bookmarks b'+
						' JOIN moz_keywords k ON k.id = b.keyword_id'
					);
			try {
				var data;
				while (s.executeStep())
				{
					data = this.newKeywordFromPlaces(s.getDouble(0));
					this.keywords.push(data);
					this.keywordsHash[data.uri] = data;

					names.push(data.name);
					icons.push(data.icon);
					uris.push(data.uri);
					keywords.push(data.keyword);
				}
			}
			catch(e) {
			}
			s.reset();
		}
		else { // initialize for Firefox 2
			var resources = this.bookmarksDS.GetAllResources()
			var res;
			var shortcut,
				name,
				icon;
			var shortcuts = [];
			var doneKeywords = {};
			var data;
			while (resources.hasMoreElements())
			{
				res = resources.getNext();
				try{
					res = res.QueryInterface(Components.interfaces.nsIRDFResource);
					shortcut = this.bookmarksDS.GetTargets(res, this.shortcutRes, true);
					if (!shortcut) continue;
					shortcut = shortcut.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral);
					if (shortcut.Value && !(shortcut.Value in doneKeywords)) {
						name = this.bookmarksDS.GetTargets(res, this.nameRes, true);
						icon = this.bookmarksDS.GetTargets(res, this.iconRes, true);

						data = {
							name    : name.hasMoreElements() ? name.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : shortcut.Value ,
							icon    : icon.hasMoreElements() ? icon.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' ,
							uri     : res.Value,
							keyword : shortcut.Value
						};
						this.keywords.push(data);
						this.keywordsHash[res.Value] = data;

						names.push(data.name);
						icons.push(data.icon);
						uris.push(data.uri);
						keywords.push(data.keyword);
						doneKeywords[shortcut.Value] = true;
					}
				}
				catch(e) {
					continue;
				}
			}
		}

		this.setArrayPref('secondsearch.keyword.cache.name', names);
		this.setArrayPref('secondsearch.keyword.cache.icon', icons);
		this.setArrayPref('secondsearch.keyword.cache.uri', uris);
		this.setArrayPref('secondsearch.keyword.cache.keyword', keywords);
		this.setIntPref('secondsearch.keyword.cache.count', uris.length);

		this.keywords.sort(function(aA, aB) { return aA.name > aB.name ? 1 : -1 });
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
		var names    = this.getArrayPref('secondsearch.keyword.cache.name');
		var icons    = this.getArrayPref('secondsearch.keyword.cache.icon');
		var uris     = this.getArrayPref('secondsearch.keyword.cache.uri');
		var keywords = this.getArrayPref('secondsearch.keyword.cache.keyword');

		var recentIds      = this.getArrayPref('secondsearch.recentengines.id');
		var recentNames    = this.getArrayPref('secondsearch.recentengines.name');
		var recentIcons    = this.getArrayPref('secondsearch.recentengines.icon');
		var recentUris     = this.getArrayPref('secondsearch.recentengines.uri');
		var recentKeywords = this.getArrayPref('secondsearch.recentengines.keyword');
		var recentNum = recentUris.length;

		var keyword = this.NavBMService.getKeywordForBookmark(aId);
		var data    = this.newKeywordFromPlaces(aId);

		var modified = false;
		for (var i = 0, maxi = this.keywords.length; i < maxi; i++)
		{
			if (this.keywords[i].uri != data.uri &&
				this.keywords[i].keyword != keyword)
				continue;

			if (aMode == 'delete' ||
				aMode == 'keyword' ||
				aMode == 'uri') {
				delete this.keywordsHash[this.keywords[i].uri];
				this.keywords.splice(i, 1);
			}
			if (aMode == 'keyword' ||
				aMode == 'uri') {
				this.keywords.push(data);
				this.keywordsHash[data.uri] = data;
			}
			if (aMode != 'delete') {
				this.keywordsHash[data.uri].name    = data.name;
				this.keywordsHash[data.uri].icon    = data.icon;
				this.keywordsHash[data.uri].uri     = data.uri;
				this.keywordsHash[data.uri].keyword = data.keyword;
			}
			modified = true;
			break;
		}

		if (!modified) {
			this.keywords.push(data);
			this.keywordsHash[data.uri] = data;
			names.push(data.name);
			icons.push(data.icon);
			uris.push(data.uri);
			keywords.push(keyword);
		}
		else {
			for (var i = 0, maxi = keywords.length; i < maxi; i++)
			{
				if (uris[i] != data.uri &&
					keywords[i] != keyword)
					continue;

				if (aMode == 'delete') {
					for (var j = 0, maxj = recentUris.length; j < maxj; j++)
					{
						if (recentUris[j] != uris[i] &&
							recentKeywords[j] != keywords[i])
							continue;

						recentIds.splice(j, 1);
						recentNames.splice(j, 1);
						recentIcons.splice(j, 1);
						recentUris.splice(j, 1);
						recentKeywords.splice(j, 1);
					}
					names.splice(i, 1);
					icons.splice(i, 1);
					uris.splice(i, 1);
					keywords.splice(i, 1);
				}
				else {
					for (var j = 0, maxj = recentUris.length; j < maxj; j++)
					{
						if (recentUris[j] != uris[i] &&
							recentKeywords[j] != keywords[i])
							continue;

						recentIds.splice(j, 1, '');
						recentNames.splice(j, 1, data.name);
						recentIcons.splice(j, 1, data.icon);
						recentUris.splice(j, 1, data.uri);
						recentKeywords.splice(j, 1, keyword);
					}
					names.splice(i, 1, data.name);
					icons.splice(i, 1, data.icon);
					uris.splice(i, 1, data.uri);
					keywords.splice(i, 1, keyword);
				}
				break;
			}
		}

		if (recentNum != recentUris.length) {
			this.setArrayPref('secondsearch.recentengines.id', recentIds);
			this.setArrayPref('secondsearch.recentengines.name', recentNames);
			this.setArrayPref('secondsearch.recentengines.icon', recentIcons);
			this.setArrayPref('secondsearch.recentengines.uri', recentUris);
			this.setArrayPref('secondsearch.recentengines.keyword', recentKeywords);
		}

		this.setArrayPref('secondsearch.keyword.cache.name', names);
		this.setArrayPref('secondsearch.keyword.cache.icon', icons);
		this.setArrayPref('secondsearch.keyword.cache.uri', uris);
		this.setArrayPref('secondsearch.keyword.cache.keyword', keywords);
		this.setIntPref('secondsearch.keyword.cache.count', uris.length);
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
		var names    = this.getArrayPref('secondsearch.keyword.cache.name');
		var icons    = this.getArrayPref('secondsearch.keyword.cache.icon');
		var uris     = this.getArrayPref('secondsearch.keyword.cache.uri');
		var keywords = this.getArrayPref('secondsearch.keyword.cache.keyword');

		var recentIds      = this.getArrayPref('secondsearch.recentengines.id');
		var recentNames    = this.getArrayPref('secondsearch.recentengines.name');
		var recentIcons    = this.getArrayPref('secondsearch.recentengines.icon');
		var recentUris     = this.getArrayPref('secondsearch.recentengines.uri');
		var recentKeywords = this.getArrayPref('secondsearch.recentengines.keyword');

		var res = this.RDF.GetResource(aSource);
		var shortcut = this.bookmarksDS.GetTargets(res, this.shortcutRes, true);
		shortcut = shortcut.hasMoreElements() ? shortcut.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' ;

		if (!shortcut) aMode = 'remove';

		switch (aMode)
		{
			case 'change':
			case 'add':
				var name = this.bookmarksDS.GetTargets(res, this.nameRes, true);
				name = name.hasMoreElements() ? name.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' ;
				var icon = this.bookmarksDS.GetTargets(res, this.iconRes, true);
				icon = icon.hasMoreElements() ? icon.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' ;

				if (aSource in this.keywordsHash) {
					this.keywordsHash[aSource].name    = name;
					this.keywordsHash[aSource].icon    = icon;
					this.keywordsHash[aSource].uri     = aSource;
					this.keywordsHash[aSource].keyword = shortcut;
					for (var i = 0, maxi = uris.length; i < maxi; i++)
					{
						if (uris[i] != aSource) continue;

						for (var j = 0, maxj = recentUris.length; j < maxj; j++)
						{
							if (recentUris[j] != aSource &&
								recentKeywords[j] != shortcut)
								continue;

							recentIds.splice(j, 1, '');
							recentNames.splice(j, 1, name);
							recentIcons.splice(j, 1, icon);
							recentUris.splice(j, 1, aSource);
							recentKeywords.splice(j, 1, shortcut);
						}

						names.splice(i, 1, name);
						icons.splice(i, 1, icon);
						uris.splice(i, 1, aSource);
						keywords.splice(i, 1, shortcut);
						break;
					}
				}
				else {
					this.keywords.push({
						name    : name,
						icon    : icon,
						uri     : aSource,
						keyword : shortcut
					});
					this.keywordsHash[aSource] = this.keywords[this.keywords.length-1];
					names.push(name);
					icons.push(icon);
					uris.push(aSource);
					keywords.push(shortcut);
				}
				break;

			case 'remove':
				for (var i = 0, maxi = this.keywords.length; i < maxi; i++)
				{
					if (this.keywords[i].uri != aSource) continue;
					this.keywords.splice(i, 1);
					delete this.keywordsHash[aSource];
					break;
				}
				for (var i = 0, maxi = uris.length; i < maxi; i++)
				{
					if (uris[i] != aSource) continue;

					for (var j = 0, maxj = recentUris.length; j < maxj; j++)
					{
						if (recentUris[j] != uris[i] &&
							recentKeywords[j] != keywords[i])
							continue;

						recentIds.splice(j, 1);
						recentNames.splice(j, 1);
						recentIcons.splice(j, 1);
						recentUris.splice(j, 1);
						recentKeywords.splice(j, 1);
					}

					names.splice(i, 1);
					icons.splice(i, 1);
					uris.splice(i, 1);
					keywords.splice(i, 1);
					break;
				}
				break;
		}

		if (recentNum != recentUris.length) {
			this.setArrayPref('secondsearch.recentengines.id', recentIds);
			this.setArrayPref('secondsearch.recentengines.name', recentNames);
			this.setArrayPref('secondsearch.recentengines.icon', recentIcons);
			this.setArrayPref('secondsearch.recentengines.uri', recentUris);
			this.setArrayPref('secondsearch.recentengines.keyword', recentKeywords);
		}

		this.setArrayPref('secondsearch.keyword.cache.name', names);
		this.setArrayPref('secondsearch.keyword.cache.icon', icons);
		this.setArrayPref('secondsearch.keyword.cache.uri', uris);
		this.setArrayPref('secondsearch.keyword.cache.keyword', keywords);
		this.setIntPref('secondsearch.keyword.cache.count', uris.length);
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
					this.setOverflowTimeout(aSource, aProperty, 'remove');
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
 
