var SecondSearch = { 
	SHOWN_BY_INPUT            : 1,
	SHOWN_BY_MANUAL_OPERATION : 2,
	SHOWN_BY_DRAGDROP         : 4,
	 
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
 
	get timeout() 
	{
		var val = this.getIntPref('secondsearch.timeout');
		if (val === null) {
			val = this.defaultTimeout;
			this.setIntPref('secondsearch.timeout', val);
		}
		return Math.max(0, val);
	},
	defaultTimeout : 5000,
 
	get popupType() 
	{
		var val = this.getIntPref('secondsearch.popup.type');
		if (val === null) {
			val = this.defaultPopupType;
			this.setIntPref('secondsearch.popup.type', val);
		}
		return val;
	},
	defaultPopupType : 0,
 
	get popupPosition() 
	{
		var val = this.getIntPref('secondsearch.popup.position');
		if (val === null) {
			val = this.defaultPopupPosition;
			this.setIntPref('secondsearch.popup.position', val);
		}
		return val;
	},
	defaultPopupPosition : 0,
 
	get shouldShowAutomatically() 
	{
		var val = this.getBoolPref('secondsearch.popup.auto_show');
		if (val === null) {
			val = this.defaultShouldShowAutomatically;
			this.setBoolPref('secondsearch.popup.auto_show', val);
		}
		return val;
	},
	defaultShouldShowAutomatically : true,
 
	get shouldShowAutomaticallyDragDrop() 
	{
		var val = this.getBoolPref('secondsearch.popup.auto_show.dragdrop');
		if (val === null) {
			val = this.defaultShouldShowAutomaticallyDragDrop;
			this.setBoolPref('secondsearch.popup.auto_show.dragdrop', val);
		}
		return val;
	},
	defaultShouldShowAutomaticallyDragDrop : true,
 
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
  
/* elements */ 
	
	get searchbar() 
	{
		var bar = document.getElementsByTagName('searchbar');
		return bar && bar.length ? bar[0] : null ;
	},
 
	get source() 
	{
		var bar = this.searchbar;
		return bar ? document.getAnonymousElementByAttribute(bar, 'anonid', 'searchbar-popup') : null ;
	},
 
	get textbox() 
	{
		var bar = this.searchbar;
		return bar ? (
				bar._textbox || /* Firefox 2 */
				bar.mTextbox /* Firefox 1.5 */
			) : null ;
	},
 
	get searchterm() 
	{
		var box = this.textbox;
		return box ? box.value : '' ;
	},
 
	get popup() 
	{
		return document.getElementById('secondsearch_popup');
	},
 
	get allMenuItem() 
	{
		return document.getElementById('secondsearch_popup_all');
	},
 
	get engine() 
	{
		return this.searchbar.getAttribute('searchengine');
	},
 
	evaluateXPath : function(aExpression, aContextNode, aType) 
	{
		aExpression  = aExpression || '';
		aContextNode = aContextNode || document.documentElement;

		const type       = aType || XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
		const resolver   = {
			lookupNamespaceURI : function(aPrefix)
			{
				return 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
			}
		};
		return document.evaluate(aExpression, aContextNode, resolver, type, null);
	},
  
/* update searchbar */ 
	 
	initBar : function() 
	{
		var search = this.searchbar;
		if (!search || search.secondsearchInitialized) return;

		search.secondsearchInitialized = true;

		this.addPrefListener(this);

		var textbox = this.textbox;
		textbox.addEventListener('input', this.onInput, true);
		textbox.addEventListener('keypress', this.onKeyPress, true);
		textbox.addEventListener('blur', this.onBlur, false);

		textbox.addEventListener('focus', this.onTextboxFocused, true);
		this.popup.addEventListener('click', this.onTextboxFocused, true);
		window.addEventListener('focus',  this.onSomethingFocusedOrBlured, true);
		window.addEventListener('blur',   this.onSomethingFocusedOrBlured, true);
		window.addEventListener('click',  this.onSomethingFocusedOrBlured, true);

		textbox.disableAutoComplete = (this.popupPosition == 1);

		textbox.__secondsearch__onTextEntered = textbox.onTextEntered;
		textbox.onTextEntered = this.onTextEntered;

		textbox.__secondsearch__onKeyPress = textbox.onKeyPress;
		textbox.onKeyPress = this.onTextboxKeyPress;

		eval(
			'textbox.searchbarDNDObserver.onDrop = '+
				textbox.searchbarDNDObserver.onDrop.toSource()
					.replace('this.mOuter.onTextEntered',
						'if (SecondSearch.shouldShowAutomaticallyDragDrop) {'+
							'SecondSearch.showSecondSearch(SecondSearch.SHOWN_BY_DRAGDROP);'+
							'return;'+
						'};'+
						'this.mOuter.onTextEntered'
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
				'search.onEnginePopupCommand = '+
					search.onEnginePopupCommand.toSource()
						.replace('this.currentEngine = aTarget.engine',
							'{'+
								'SecondSearch.addEngineToRecentList(SecondSearch.getCurrentEngine());'+
								'this.currentEngine = aTarget.engine;'+
							'};'
						)
			);
			search.__secondsearch__doSearch = search.doSearch;
			search.doSearch = this.doSearchbarSearch;
		}
		else { // Firefox 1.5
			eval(
				'textbox.onEnginePopupCommand = '+
					textbox.onEnginePopupCommand.toSource()
						.replace('this.currentEngine = target.id',
							'SecondSearch.addEngineToRecentList(SecondSearch.getCurrentEngine());'+
							'this.currentEngine = target.id'
						)
			);
		}

		// GSuggest
		if ('GSuggest' in window && !GSuggest.__secondsearch__operateSuggesList) {
			GSuggest.__secondsearch__operateSuggesList = GSuggest.operateSuggesList;
			GSuggest.operateSuggesList = this.operateSuggesList;
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
							'if (SecondSearch.selectedEngine) {'+
								'overrideEngine = SecondSearch.getSearchEngineFromName(SecondSearch.selectedEngine.name);'+
							'};'+
							'var submission = (overrideEngine || searchbar.currentEngine)'
						)
			);
		}
	},
 
	destroyBar : function() 
	{
		var search = this.searchbar;
		if (!search || !search.secondsearchInitialized) return;

		search.secondsearchInitialized = false;

		this.removePrefListener(this);

		var textbox = this.textbox;
		textbox.removeEventListener('input', this.onInput, true);
		textbox.removeEventListener('keypress', this.onKeyPress, true);
		textbox.removeEventListener('blur', this.onBlur, false);

		textbox.removeEventListener('focus', this.onTextboxFocused, true);
		this.popup.removeEventListener('click', this.onTextboxFocused, true);
		window.removeEventListener('focus', this.onSomethingFocusedOrBlured, true);
		window.removeEventListener('blur',   this.onSomethingFocusedOrBlured, true);
		window.removeEventListener('click',  this.onSomethingFocusedOrBlured, true);

		textbox.disableAutoComplete = false;
	},
  
/* event handlers */ 
	 
	onKeyPress : function(aEvent) 
	{
		SecondSearch.operateSecondSearch(aEvent);
	},
 
	onBlur : function(aEvent) 
	{
		SecondSearch.hideSecondSearch();
	},
 
	onTextboxFocused : function(aEvent) 
	{
		SecondSearch.textBoxFocused = true;
	},
	textBoxFocused : false,
 
	onSomethingFocusedOrBlured : function(aEvent) 
	{
		var node = aEvent.originalTarget || aEvent.target;
		if (node.ownerDocument == document) {
			while (node.parentNode)
			{
				if (node == SecondSearch.textbox || node == SecondSearch.popup)
					return;
				node = node.parentNode;
			}
		}

		window.setTimeout(function() {
			if (!SecondSearch.textBoxFocused)
				SecondSearch.hideSecondSearch();

			SecondSearch.textBoxFocused = false;
		}, 0);
	},
 
	onTextboxKeyPress : function(aEvent) 
	{
		if (
			(
				(
					!SecondSearch.shouldShowAutomatically ||
					SecondSearch.popup.shown
				) &&
				this.popup.selectedIndex < 0 &&
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_UP
			) ||
			(
				SecondSearch.getCurrentItem() &&
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
 
	onInput : function(aEvent) 
	{
		var popup = SecondSearch.popup;
		if (popup.shown) {
				var current = SecondSearch.getCurrentItem(popup);
				if (current) {
					current.removeAttribute('_moz-menuactive');
				}
		}
		if (SecondSearch.autoHideTimer) {
			window.clearTimeout(SecondSearch.autoHideTimer);
			SecondSearch.autoHideTimer = null;
		}

		if (SecondSearch.searchterm &&
			SecondSearch.shouldShowAutomatically) {
			SecondSearch.showSecondSearch(SecondSearch.SHOWN_BY_INPUT);
			SecondSearch.autoHideTimer = window.setTimeout('SecondSearch.hideSecondSearch();', SecondSearch.timeout);
		}
		else
			SecondSearch.hideSecondSearch();
	},
	autoHideTimer : null,
 
	onTextEntered : function(aEvent) 
	{
		if (SecondSearch.getCurrentItem())
			return false;
		else {
			var retVal = this.__secondsearch__onTextEntered(aEvent);
			if (SecondSearch.getBoolPref('secondsearch.clear_after_search'))
				window.setTimeout('SecondSearch.clearTextBox();', 0);
			return retVal;
		}
	},
 
	onPopupShowing : function(aEvent) 
	{
		var popup = this.popup;
		popup.shown = true;

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
 
	onPopupHiding : function(aEvent) 
	{
		var popup = this.popup;

		if (
			popup.shownBy == this.SHOWN_BY_DRAGDROP &&
			!this.doingSearch
			) {
			this.textbox.onTextEntered(aEvent);

			if (this.getBoolPref('secondsearch.clear_after_search'))
				this.clearTextBox();
		}

		popup.shown = false;
		popup.shownBy = 0;

		var current = this.getCurrentItem(popup);
		if (current) current.removeAttribute('_moz-menuactive');

		try {
			this.allMenuItem.hidePopup();
		}
		catch(e) {
		}
	},
 	
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
		}
	},
  
/* do search */ 

	 
	doSearchBy : function(aItem, aEvent) 
	{
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
				retVal = SearchLoadURL(uri, (aEvent && aEvent.altKey) || (aEvent.type == 'click' && aEvent.button == 1));
			}
		}

		this.selectedEngine = null;
		window.setTimeout('SecondSearch.doingSearch = false;', 1);

		if (this.getBoolPref('secondsearch.clear_after_search'))
			this.clearTextBox();

		return retVal;
	},
	loadForSearch : function(aURI, aPostData, aEvent)
	{
		var newTab = (aEvent && aEvent.altKey) ||
					(aEvent.type == 'click' && aEvent.button == 1);

		var inBackground = false;
		if ('TabbrowserService' in window) { // TBE
			var behavior = this.getIntPref('browser.tabs.opentabfor.searchbar.behavior');
			newTab = behavior > 0 ? !newTab : newTab ;
			inBackground = behavior == 2;
		}
		else if ('TM_init' in window) { // Tab Mix Plus
			newTab = this.getBoolPref('extensions.tabmix.opentabfor.search') ? !newTab : newTab ;
			inBackground = this.getBoolPref('extensions.tabmix.loadSearchInBackground');
		}
		else { // Firefox 2
			newTab = this.getBoolPref('browser.search.openintab') ? !newTab : newTab ;
		}

		if (gBrowser.localName == 'tabbrowser' && newTab) {
			content.focus();
			var t = 'loadOneTab' in gBrowser ?
				gBrowser.loadOneTab(aURI, null, null, aPostData, false, true) :
				gBrowser.addTab(uri, null, null, aPostData);
			if (inBackground)
				gBrowser.selectedTab = t;
			if (gURLBar)
				gURLBar.value = uri;
		}
		else if ('loadURL' in window)
			loadURL(aURI, null, aPostData, true);
		else
			loadURI(aURI, null, aPostData, true);

		content.focus();
	},
	selectedEngine : null,
	doingSearch : false,
 
	doSearchbarSearch : function(aData, aInNewTab, aOverride) 
	{ // Firefox 2
		if (aOverride) {
			var engine = SecondSearch.getRecentEngines()[0];
			engine = SecondSearch.getSearchEngineFromName(engine.name);
			if (!engine) return;

			var postData = null;
			var url = 'about:blank';
			var submission = engine.getSubmission(aData, null);
			if (submission) {
				url = submission.uri.spec;
				postData = submission.postData;
			}
			if (aInNewTab) {
				content.focus();
				gBrowser.loadOneTab(url, null, null, postData, false, false);
				if (gURLBar)
					gURLBar.value = url;
			}
			else
				loadURI(url, null, postData, false);

			content.focus();
			return;
		}
		else {
			var retVal = this.__secondsearch__doSearch(aData, aInNewTab);
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
  
/* prefs */ 
	
	get Prefs() 
	{
		if (!this.mPrefs)
			this.mPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(null);
		return this.mPrefs;
	},
	mPrefs : null,
	knsISupportsString : ('nsISupportsWString' in Components.interfaces) ? Components.interfaces.nsISupportsWString : Components.interfaces.nsISupportsString,
 
	getBoolPref : function(aKey) 
	{
		var value;
		try {
			value = this.Prefs.getBoolPref(aKey);
		}
		catch(e) {
			value = null;
		}
		return value;
	},
 
	setBoolPref : function(aKey, aValue) 
	{
		try {
			this.Prefs.setBoolPref(aKey, aValue);
		}
		catch(e) {
		}
	},
 
	getIntPref : function(aKey) 
	{
		var value;
		try {
			value = this.Prefs.getIntPref(aKey);
		}
		catch(e) {
			value = null;
		}
		return value;
	},
 
	setIntPref : function(aKey, aValue) 
	{
		try {
			this.Prefs.setIntPref(aKey, aValue);
		}
		catch(e) {
		}
	},
 
	getCharPref : function(aKey) 
	{
		var value;
		try {
			value = this.Prefs.getComplexValue(aKey, this.knsISupportsString).data;
		}
		catch(e) {
			value = null;
		}
		return value;
	},
 
	setCharPref : function(aKey, aValue) 
	{
		var string = ('@mozilla.org/supports-wstring;1' in Components.classes) ?
				Components.classes['@mozilla.org/supports-wstring;1'].createInstance(this.knsISupportsString) :
				Components.classes['@mozilla.org/supports-string;1'].createInstance(this.knsISupportsString) ;
		string.data = aValue;
		this.Prefs.setComplexValue(aKey, this.knsISupportsString, string);
		return aValue;
	},
 
	addPrefListener : function(aObserver) 
	{
		try {
			var pbi = this.Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			pbi.addObserver(aObserver.domain, aObserver, false);
		}
		catch(e) {
		}
	},
 
	removePrefListener : function(aObserver) 
	{
		try {
			var pbi = this.Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			pbi.removeObserver(aObserver.domain, aObserver, false);
		}
		catch(e) {
		}
	},
  
/* operate engines */ 
	
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
					keyword : this.keywords[i].keyword,
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
					icon    : bar._engines[i].iconURI.spec,
					uri     : bar._engines[i].getSubmission('', null).uri.spec,
					keyword : '',
					id      : ''
				};
				break;
			}
		}
		else { // Firefox 1.5
			var source = this.source;
			for (var i = 0, maxi = source.childNodes.length; i < maxi; i++)
			{
				if (
					!source.childNodes[i].id ||
					(aNot ?
						source.childNodes[i].getAttribute('label') == aName :
						source.childNodes[i].getAttribute('label') != aName
					)
					) continue;

				engine = {
					name    : source.childNodes[i].getAttribute('label'),
					icon    : source.childNodes[i].getAttribute('src'),
					uri     : this.getSearchURI('', source.childNodes[i].id),
					keyword : '',
					id      : source.childNodes[i].id
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
				icon    : bar.currentEngine.iconURI.spec,
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
		var names    = (this.getCharPref('secondsearch.recentengines.name') || '').split('|');
		var icons    = (this.getCharPref('secondsearch.recentengines.icon') || '').split('|');
		var uris     = (this.getCharPref('secondsearch.recentengines.uri') || '').split('|');
		var keywords = (this.getCharPref('secondsearch.recentengines.keyword') || '').split('|');
		var ids      = (this.getCharPref('secondsearch.recentengines.id') || '').split('|');

		var list = [];
		var source = this.source;

		for (var i = 0, maxi = uris.length; i < maxi; i++)
		{
			if (
				keywords[i] ?
					!(decodeURIComponent(uris[i]) in this.keywordsHash) :
					(
						!uris[i] ||
						!source.getElementsByAttribute('label', decodeURIComponent(names[i])).length
					)
				)
				continue;

			list.push({
				name    : decodeURIComponent(names[i]),
				icon    : decodeURIComponent(icons[i]),
				uri     : decodeURIComponent(uris[i]),
				keyword : decodeURIComponent(keywords[i]),
				id      : decodeURIComponent(ids[i])
			});
		}

		if (!list.length) {
			var engine = this.getEngineFromName(this.getCurrentEngine().name, true);
			this.addEngineToRecentList(engine);
			list.push(engine);
		}

		return list;
	},
 
	updateRecentList : function(aOperation, aEngine) 
	{
		var names    = (this.getCharPref('secondsearch.recentengines.name') || '').split('|');
		var icons    = (this.getCharPref('secondsearch.recentengines.icon') || '').split('|');
		var uris     = (this.getCharPref('secondsearch.recentengines.uri') || '').split('|');
		var keywords = (this.getCharPref('secondsearch.recentengines.keyword') || '').split('|');
		var ids      = (this.getCharPref('secondsearch.recentengines.id') || '').split('|');

		if (aOperation == 'add' ||
			aOperation == 'remove' ||
			aOperation == 'check') {
			for (var i = 0, maxi = names.length; i < maxi; i++)
			{
				if (decodeURIComponent(names[i]) != aEngine.name) continue;
				if (aOperation == 'check') return true;
				names.splice(i, 1);
				icons.splice(i, 1);
				uris.splice(i, 1);
				keywords.splice(i, 1);
				ids.splice(i, 1);
				break;
			}
		}

		if (aOperation == 'add') {
			names.splice(0, 0, encodeURIComponent(aEngine.name));
			icons.splice(0, 0, encodeURIComponent(aEngine.icon));
			uris.splice(0, 0, encodeURIComponent(aEngine.uri));
			keywords.splice(0, 0, encodeURIComponent(aEngine.keyword));
			ids.splice(0, 0, encodeURIComponent(aEngine.id));
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

		this.setCharPref('secondsearch.recentengines.name',    names.join('|'));
		this.setCharPref('secondsearch.recentengines.icon',    icons.join('|'));
		this.setCharPref('secondsearch.recentengines.uri',     uris.join('|'));
		this.setCharPref('secondsearch.recentengines.keyword', keywords.join('|'));
		this.setCharPref('secondsearch.recentengines.id',      ids.join('|'));
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
   
/* UI */ 
	 
	getCurrentItem : function(aPopup) 
	{
		aPopup = aPopup || this.popup;
		var active = aPopup.getElementsByAttribute('_moz-menuactive', 'true');
		for (var i = 0, maxi = active.length; i < maxi; i++)
			if (active[i].parentNode == aPopup) return active[i];
		return null;
	},
 
	initAllEngines : function(aPopup, aParent, aReverse) 
	{
		var source = this.source;
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

		for (var i = 0, maxi = source.childNodes.length; i < maxi; i++)
		{
			if (
				source.childNodes[i].localName != 'menuitem' ||
				source.childNodes[i].getAttribute('anonid') == 'open-engine-manager' ||
				(parent && parent.getElementsByAttribute('engineName', source.childNodes[i].getAttribute('label')).length)
				)
				continue;

			popup.appendChild(source.childNodes[i].cloneNode(true));
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
				if (!count)
					popup.lastChild.setAttribute('_moz-menuactive', 'true');

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
 
	showSecondSearch : function(aReason) 
	{
		var popup = this.popup;
		var pos = this.popupPosition;
		if (!popup.shown) {
			var bar  = this.searchbar;
			var type = this.popupType;
			var num  = type == 0 ? (this.getCharPref('secondsearch.recentengines.uri') || '').split('|').length : this.source.getElementsByTagName('menuitem').length + this.keywords.length ;
			var anchor, align;

			if (pos == 0 &&
				bar.boxObject.screenY >= document.documentElement.boxObject.y + (bar.boxObject.height * (num+1) * 0.8)) { // above
//dump('above\n');
				anchor = 'topleft';
				align  = 'bottomleft';
			}
			else if (pos == 1 &&
				bar.boxObject.screenY + bar.boxObject.height + this.textbox.popup.boxObject.height <= document.documentElement.boxObject.y + document.documentElement.boxObject.height - (bar.boxObject.height * (num+1) * 0.8)) { // below
//dump('below\n');
				anchor = 'bottomleft';
				align  = 'topleft';
			}
			else if (bar.boxObject.screenX < document.documentElement.boxObject.y+bar.boxObject.width) { // right
//dump('right\n');
				anchor = 'bottomright';
				align  = 'bottomleft';
			}
			else { // left
//dump('left\n');
				anchor = 'bottomleft';
				align  = 'bottomright';
			}

			popup.shownBy = aReason;
			document.popupNode = bar;
			popup.showPopup(bar, -1, -1, 'popup', anchor, align);

			var current = this.getCurrentItem(popup);
			if (current) current.removeAttribute('_moz-menuactive');
		}
	},
 
	hideSecondSearch : function(aWithDelay) 
	{
		if (aWithDelay) {
			window.setTimeout('SecondSearch.hideSecondSearch();', 0);
			return;
		}
		var popup = this.popup;
		if (!popup.shown) return;

		try {
			this.allMenuItem.hidePopup();
		}
		catch(e) {
		}
		popup.hidePopup();
	},
 
	operateSecondSearch : function(aEvent) 
	{
try{
		var popup = this.popup;
		if (
			(
				'GSuggest' in window &&
				GSuggest.getCurrentItem()
			) ||
			this.textbox.popup.selectedIndex > -1
			)
			return true;

		if (
			popup.shown &&
			(
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER ||
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN
			)
			) {
			var bar = this.searchbar;

			if ('GSuggest' in window) GSuggest.hideSuggestPopup();

			var current = this.getCurrentItem(popup);
			if (!current)  {
				this.hideSecondSearch(aEvent);
				if (this.getBoolPref('secondsearch.clear_after_search'))
					window.setTimeout('SecondSearch.clearTextBox();', 0);
			}
			else {
				if (current == this.allMenuItem) {
					if (this.allMenuItem.firstChild.shown) {
						current = this.getCurrentItem(this.allMenuItem.firstChild);
					}
					else {
						this.hideSecondSearch(aEvent);
						return false;
					}
				}
				aEvent.stopPropagation();
				aEvent.preventDefault();
				this.doSearchBy(current, aEvent);
			}
			return false;
		}

		if (
			aEvent.ctrlKey ||
			aEvent.shiftKey ||
			aEvent.altKey ||
			aEvent.metaKey
			)
			return true;

		var isUpKey = false;
		switch(aEvent.keyCode)
		{
			default:
				if (popup.shown &&
					this.allMenuItem.firstChild.shown) {
					this.allMenuItem.firstChild.hidePopup();
				}
				return true;

			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_DELETE:
			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE:
				if (popup.shown) {
					if (!this.searchterm) {
						this.hideSecondSearch();
						aEvent.stopPropagation();
						aEvent.preventDefault();
						return false;
					}
					if (this.allMenuItem.firstChild.shown)
						this.allMenuItem.firstChild.hidePopup();
				}
				return true;


			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_UP:
				isUpKey = true;
			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_DOWN:
				if (!popup.shown) {
					if (
						isUpKey ?
							this.popupPosition != 0 :
							this.popupPosition != 1
						) {
						return true;
					}

					this.showSecondSearch(this.SHOWN_BY_MANUAL_OPERATION);
					window.setTimeout(function(aEvent) {
						SecondSearch.popup.shown = true;
						SecondSearch.operateSecondSearch({
							keyCode         : aEvent.keyCode,
							stopPropagation : function() {},
							preventDefault  : function() {}
						});
					}, 0, aEvent);
					aEvent.stopPropagation();
					aEvent.preventDefault();
					return false;
				}
				if (this.autoHideTimer) {
					window.clearTimeout(this.autoHideTimer);
					this.autoHideTimer = null;
				}

				var current = this.getCurrentItem(popup);
				if (current) {
					if (current == this.allMenuItem &&
						this.allMenuItem.firstChild.shown) {
						current = this.getCurrentItem(this.allMenuItem.firstChild);
						if (!current) {
							current = isUpKey ? this.allMenuItem.firstChild.lastChild : this.allMenuItem.firstChild.firstChild ;
						}
						else {
							current.removeAttribute('_moz-menuactive');
							current = this.getNextOrPrevItem(current, (isUpKey ? -1 : 1 ), true);
						}
					}
					else {
						current.removeAttribute('_moz-menuactive');
						current = this.getNextOrPrevItem(current, (isUpKey ? -1 : 1 ));
					}
				}
				else {
					current = isUpKey ?
						 ((this.popupPosition == 0) ? this.getLastItem(popup) : null ) :
						 ((this.popupPosition == 1) ? this.getFirstItem(popup) : null );
				}
				if (current) {
					current.setAttribute('_moz-menuactive', true);
				}
				else {
					return true;
				}

				aEvent.stopPropagation();
				aEvent.preventDefault();
				return false;


			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_RIGHT:
				if (!popup.shown) return true;

				var current = this.getCurrentItem(popup);
				if (
					!current ||
					current != this.allMenuItem
					)
					return true;

				this.allMenuItem.firstChild.showPopup();
				aEvent.stopPropagation();
				aEvent.preventDefault();
				return false;

			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_LEFT:
				if (!popup.shown) return true;

				var current = this.getCurrentItem(popup);
				if (
					!current ||
					current != this.allMenuItem
					)
					return true;

				this.allMenuItem.firstChild.hidePopup();
				aEvent.stopPropagation();
				aEvent.preventDefault();
				return false;
		}
}
catch(e) {
	dump(e+'\n');
}
	},
	
	getNextOrPrevItem : function(aCurrent, aDir, aCycle) 
	{
		var xpathResult;
		var node;
		try {
			if (aDir > 0) {
				xpathResult = this.evaluateXPath('following-sibling::*[(local-name() = "menu" or local-name() = "menuitem") and (not(@collapsed) or not(@collapsed="true")) and (not(@hidden) or not(@hidden="true"))]', aCurrent, XPathResult.FIRST_ORDERED_NODE_TYPE);
				node = xpathResult.singleNodeValue;
			}
			else {
				xpathResult = this.evaluateXPath('preceding-sibling::*[(local-name() = "menu" or local-name() = "menuitem") and (not(@collapsed) or not(@collapsed="true")) and (not(@hidden) or not(@hidden="true"))]', aCurrent);
				if (xpathResult && xpathResult.snapshotLength)
					 node = xpathResult.snapshotItem(xpathResult.snapshotLength-1);
			}
		}
		catch(e) {
		}
		return node ||
			(
				!aCycle ? null :
				aDir > 0 ? aCurrent.parentNode.firstChild : aCurrent.parentNode.lastChild
			);
	},
 
	getFirstItem : function(aPopup) 
	{
		return this.getNextOrPrevItem(aPopup.lastChild, 1, true);
	},
 
	getLastItem : function(aPopup) 
	{
		return this.getNextOrPrevItem(aPopup.firstChild, -1, true);
	},
  
	operateSuggesList : function(aEvent) 
	{
		if (
			SecondSearch.getCurrentItem() ||
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
				SecondSearch.hideSecondSearch();

			return this.__secondsearch__operateSuggesList(aEvent);
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
 
	clearTextBox : function() 
	{
		if (
			!this.textbox.value ||
			this.searchbar.getAttribute('empty') == 'true'
			)
			return;

		this.textbox.value = '';
		if ('_displayCurrentEngine' in this.textbox)
			this.textbox._displayCurrentEngine();
	},
  
/* keywords */ 
	 
	initKeywords : function(aForceUpdate) 
	{
		this.keywords     = [];
		this.keywordsHash = {};
		if (!this.shouldShowKeywords) return;

		var names = (this.getCharPref('secondsearch.keyword.cache.name') || '').split('|');
		var icons = (this.getCharPref('secondsearch.keyword.cache.icon') || '').split('|');
		var uris  = (this.getCharPref('secondsearch.keyword.cache.uri') || '').split('|');
		var keywords = (this.getCharPref('secondsearch.keyword.cache.keyword') || '').split('|');
		if (
			!aForceUpdate &&
			this.getIntPref('secondsearch.keyword.cache.count') !== null
			) {
			for (var i = 0, maxi = uris.length; i < maxi; i++)
			{
				if (!uris[i]) continue;
				this.keywords.push({
					name    : decodeURIComponent(names[i]),
					icon    : decodeURIComponent(icons[i]),
					uri     : decodeURIComponent(uris[i]),
					keyword : decodeURIComponent(keywords[i])
				});
				this.keywordsHash[this.keywords[this.keywords.length-1].uri] = this.keywords[this.keywords.length-1];
			}
		}
		else if ('PlacesController' in window) { // places build
		}
		else {
			var resources = this.bookmarksDS.GetAllResources()
			var res;
			var shortcut,
				name,
				icon;
			var shortcuts = [];
			while (resources.hasMoreElements())
			{
				res = resources.getNext();
				try{
					res = res.QueryInterface(Components.interfaces.nsIRDFResource);
					shortcut = this.bookmarksDS.GetTargets(res, this.shortcutRes, true);
					if (!shortcut) continue;
					shortcut = shortcut.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral);
					if (shortcut.Value) {
						name = this.bookmarksDS.GetTargets(res, this.nameRes, true);
						icon = this.bookmarksDS.GetTargets(res, this.iconRes, true);

						this.keywords.push({
							name    : name.hasMoreElements() ? name.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : shortcut.Value ,
							icon    : icon.hasMoreElements() ? icon.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral).Value : '' ,
							uri     : res.Value,
							keyword : shortcut.Value
						});

						this.keywordsHash[res.Value] = this.keywords[this.keywords.length-1];

						names.push(encodeURIComponent(this.keywords[this.keywords.length-1].name));
						icons.push(encodeURIComponent(this.keywords[this.keywords.length-1].icon));
						uris.push(encodeURIComponent(this.keywords[this.keywords.length-1].uri));
						keywords.push(encodeURIComponent(this.keywords[this.keywords.length-1].keyword));
					}
				}
				catch(e) {
					continue;
				}
			}

			this.setCharPref('secondsearch.keyword.cache.name', names.join('|'));
			this.setCharPref('secondsearch.keyword.cache.icon', icons.join('|'));
			this.setCharPref('secondsearch.keyword.cache.uri', uris.join('|'));
			this.setCharPref('secondsearch.keyword.cache.keyword', keywords.join('|'));
			this.setIntPref('secondsearch.keyword.cache.count', uris.length);
		}

		this.keywords.sort(function(aA, aB) { return aA.name > aB.name ? 1 : -1 });
	},
	keywords : [],
	keywordsHash : {},
 
	updateKeyword : function(aSource, aMode) 
	{
		var names = (this.getCharPref('secondsearch.keyword.cache.name') || '').split('|');
		var icons = (this.getCharPref('secondsearch.keyword.cache.icon') || '').split('|');
		var uris  = (this.getCharPref('secondsearch.keyword.cache.uri') || '').split('|');
		var keywords = (this.getCharPref('secondsearch.keyword.cache.keyword') || '').split('|');

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
					names.push(encodeURIComponent(name));
					icons.push(encodeURIComponent(icon));
					uris.push(encodeURIComponent(uri));
					keywords.push(encodeURIComponent(shortcut));
				}
				else {
					this.keywords.push({
						name    : name,
						icon    : icon,
						uri     : aSource,
						keyword : shortcut
					});
					this.keywordsHash[aSource] = this.keywords[this.keywords.length-1];
					for (var i = 0, maxi = uris.length; i < maxi; i++)
					{
						if (uris[i] == aSource) {
							names.splice(i, 1, encodeURIComponent(name));
							icons.splice(i, 1, encodeURIComponent(icon));
							uris.splice(i, 1, encodeURIComponent(uri));
							keywords.splice(i, 1, encodeURIComponent(shortcut));
							break;
						}
					}
				}
				break;

			case 'remove':
				for (var i = 0, maxi = this.keywords.length; i < maxi; i++)
				{
					if (this.keywords[i].uri == aSource) {
						this.keywords.splice(i, 1);
						delete this.keywordsHash[aSource];
						break;
					}
				}
				for (var i = 0, maxi = uris.length; i < maxi; i++)
				{
					if (uris[i] == aSource) {
						names.splice(i, 1);
						icons.splice(i, 1);
						uris.splice(i, 1);
						keywords.splice(i, 1);
						break;
					}
				}
				break;
		}

		this.setCharPref('secondsearch.keyword.cache.name', names.join('|'));
		this.setCharPref('secondsearch.keyword.cache.icon', icons.join('|'));
		this.setCharPref('secondsearch.keyword.cache.uri', uris.join('|'));
		this.setCharPref('secondsearch.keyword.cache.keyword', keywords.join('|'));
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
 
	bookmarksRDFObserver : { 
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
			if (aProperty.Value == 'http://home.netscape.com/NC-rdf#ShortcutURL' ||
				aSource.Value in SecondSearch.keywordsHash)
				SecondSearch.updateKeyword(aSource.Value, aMode);
		}
	},
  
	init : function() { 
		SecondSearch.initBar();
		window.removeEventListener('load', SecondSearch.init, false);
		window.addEventListener('unload', SecondSearch.destroy, false);

		var originalBrowserCustomizeToolbar = window.BrowserCustomizeToolbar;
		window.BrowserCustomizeToolbar = function() {
			SecondSearch.destroyBar();
			originalBrowserCustomizeToolbar.call(window);
		};

		var toolbox = document.getElementById('navigator-toolbox');
		if (toolbox.customizeDone) {
			toolbox.__secondsearch__customizeDone = toolbox.customizeDone;
			toolbox.customizeDone = function(aChanged) {
				this.__secondsearch__customizeDone(aChanged);
				SecondSearch.initBar();
			};
		}
		if ('BrowserToolboxCustomizeDone' in window) {
			var originalBrowserToolboxCustomizeDone = window.BrowserToolboxCustomizeDone;
			window.BrowserToolboxCustomizeDone = function(aChanged) {
				originalBrowserToolboxCustomizeDone.apply(window, arguments);
				SecondSearch.initBar();
			};
		}

		if (!('PlacesController' in window)) {
			try {
				SecondSearch.bookmarksDS.AddObserver(SecondSearch.bookmarksRDFObserver);
			}
			catch(e) {
			}
		}
		window.setTimeout('SecondSearch.initKeywords();', 100);
	},
	destroy : function() {
		SecondSearch.destroyBar();
		window.removeEventListener('unload', SecondSearch.destroy, false);
		if (!('PlacesController' in window)) {
			try {
				SecondSearch.bookmarksDS.RemoveObserver(SecondSearch.bookmarksRDFObserver);
			}
			catch(e) {
			}
		}
	}
};

window.addEventListener('load', SecondSearch.init, false);
  
