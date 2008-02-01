var SecondSearch = { 
	SHOWN_BY_INPUT            : 1,
	SHOWN_BY_MANUAL_OPERATION : 2,
	SHOWN_BY_CONTEXT          : 4,
	SHOWN_BY_DROP             : 8,
	SHOWN_BY_DRAGOVER         : 16,

	SHOWN_BY_DRAGDROP         : 24,

	DRAGDROP_MODE_NONE     : -1,
	DRAGDROP_MODE_DEFAULT  : 0,
	DRAGDROP_MODE_DRAGOVER : 1,
	DRAGDROP_MODE_DROP     : 2,

	get browser()
	{
		return 'SplitBrowser' in window ? (SplitBrowser.browserForSearch || SplitBrowser.activeBrowser) : gBrowser ; // document.getElementById('content') ;
	},

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
 
	get delay() 
	{
		var val = this.getIntPref('secondsearch.popup.auto_show.delay');
		if (val === null) {
			val = this.defaultDelay;
			this.setIntPref('secondsearch.popup.auto_show.delay', val);
		}
		return Math.max(0, val);
	},
	defaultDelay : 0,
 
	get clearDelay() 
	{
		var val = this.getIntPref('secondsearch.clear_after_search.delay');
		if (val === null) {
			val = this.defaultClearDelay;
			this.setIntPref('secondsearch.clear_after_search.delay', val);
		}
		return Math.max(0, val);
	},
	defaultClearDelay : 100,
 
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
		var popup = this.popup;
		if (!popup || !popup.shownBy) return this.popupTypeNormal;

		return (popup.shownBy & this.SHOWN_BY_CONTEXT) ? this.popupTypeContext :
				(popup.shownBy & this.SHOWN_BY_DRAGDROP) ? this.popupTypeDragdrop :
				this.popupTypeNormal;
	},
	
	get popupTypeNormal() 
	{
		var val = this.getIntPref('secondsearch.popup.type');
		if (val === null) {
			val = this.defaultPopupTypeNormal;
			this.setIntPref('secondsearch.popup.type', val);
		}
		return val;
	},
	defaultPopupTypeNormal : 0,
 
	get popupTypeDragdrop() 
	{
		var val = this.getIntPref('secondsearch.popup.type.dragdrop');
		if (val === null) {
			val = this.defaultPopupTypeDragdrop;
			this.setIntPref('secondsearch.popup.type.dragdrop', val);
		}
		if (val < 0) val = this.popupTypeNormal;
		return val;
	},
	defaultPopupTypeDragdrop : -1,
 
	get popupTypeContext() 
	{
		var val = this.getIntPref('secondsearch.popup.type.context');
		if (val === null) {
			val = this.defaultPopupTypeContext;
			this.setIntPref('secondsearch.popup.type.context', val);
		}
		if (val < 0) val = this.popupTypeNormal;
		return val;
	},
	defaultPopupTypeContext : -1,
  
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
 
	get autoShowDragdropMode() 
	{
		var val = this.getIntPref('secondsearch.popup.auto_show.dragdrop.mode');
		if (val === null) {
			val = this.defaultAutoShowDragdropMode;
			this.setIntPref('secondsearch.popup.auto_show.dragdrop.mode', val);
		}
		return val;
	},
	defaultAutoShowDragdropMode : 1,
 
	get autoShowDragdropDelay() 
	{
		var val = this.getIntPref('secondsearch.popup.auto_show.dragdrop.delay');
		if (val === null) {
			val = this.defaultAutoShowDragdropDelay;
			this.setIntPref('secondsearch.popup.auto_show.dragdrop.delay', val);
		}
		return Math.max(0, val);
	},
	defaultAutoShowDragdropDelay : 350,
 
	get handleDragdropOnlyOnButton() 
	{
		var val = this.getBoolPref('secondsearch.handle_dragdrop_only_on_button');
		if (val === null) {
			val = this.defaultHandleDragdropOnlyOnButton;
			this.setBoolPref('secondsearch.handle_dragdrop_only_on_button', val);
		}
		return val;
	},
	defaultHandleDragdropOnlyOnButton : false,
 
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
 
	get source() 
	{
		var bar = this.searchbar;
		var node = bar ? document.getAnonymousElementByAttribute(bar, 'anonid', 'searchbar-popup') : null ;
		if (node &&
			node.hasChildNodes() &&
			node.firstChild.localName == 'menuseparator') {
			this.searchbar.rebuildPopup();
		}
		return node;
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
 
	get engineButton() 
	{
		var bar = this.searchbar;
		return bar ? (
				bar.searchButton || /* Firefox 3 */
				bar._engineButton || /* Firefox 2 */
				document.getAnonymousElementByAttribute(bar, 'id', 'searchbar-dropmarker') /* Firefox 1.5 */
			) : null ;
	},
 
	get searchterm() 
	{
		var bar = this.searchbar;
		var box = this.textbox;
		return (box && bar && bar.getAttribute('empty') != 'true') ? box.value : '' ;
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
 
	showSecondSearch : function(aReason, aX, aY) 
	{
		var popup = this.popup;
		var pos = this.popupPosition;
		if (!popup.shown) {
			popup.shownBy = aReason;

			var bar  = this.searchbar;
			var type = this.popupType;

			var num = (type == 0) ? (this.getCharPref('secondsearch.recentengines.uri') || '').split('|').length : this.source.getElementsByTagName('menuitem').length + this.keywords.length ;
			var anchor, align;

			if (aReason == this.SHOWN_BY_CONTEXT) {
				document.popupNode = this.engineButton;
				if ('openPopupAtScreen' in popup)
					popup.openPopupAtScreen(aX, aY, true);
				else
					popup.showPopup(
						bar,
						aX - document.documentElement.boxObject.screenX,
						aY - document.documentElement.boxObject.screenY,
						'menupopup',
						null,
						null
					);
			}
			else {
				var position;
				if (pos == 0 &&
					bar.boxObject.screenY >= document.documentElement.boxObject.y + (bar.boxObject.height * (num+1) * 0.8)) { // above
	//dump('above\n');
					anchor = 'topleft';
					align  = 'bottomleft';
					position = 'before_start';
				}
				else if (pos == 1 &&
					bar.boxObject.screenY + bar.boxObject.height + this.textbox.popup.boxObject.height <= document.documentElement.boxObject.y + document.documentElement.boxObject.height - (bar.boxObject.height * (num+1) * 0.8)) { // below
	//dump('below\n');
					anchor = 'bottomleft';
					align  = 'topleft';
					position = 'after_start';
				}
				else if (bar.boxObject.screenX < document.documentElement.boxObject.y+bar.boxObject.width) { // right
	//dump('right\n');
					anchor = 'bottomright';
					align  = 'bottomleft';
					position = 'end_after';
				}
				else { // left
	//dump('left\n');
					anchor = 'bottomleft';
					align  = 'bottomright';
					position = 'start_after';
				}

				document.popupNode = bar;
				if ('openPopup' in popup)
					popup.openPopup(bar, position, 0, 0, false, true);
				else
					popup.showPopup(bar, -1, -1, 'menupopup', anchor, align);
			}

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
				this.clearAfterSearch();
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

					var current = (this.popupPosition == 0) ? this.getLastItem(popup) : this.getFirstItem(popup) ;
					if (current) {
						current.setAttribute('_moz-menuactive', true);
					}

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
						 this.getLastItem(popup) :
						 ((this.popupPosition == 1) ? this.getFirstItem(popup) : null );
				}
				if (current) {
					current.setAttribute('_moz-menuactive', true);
				}
				else {
					return true;
				}

				// in Firefox 3, autocomplete popup grabs user key inputs!!
				try {
					this.textbox.popup.hidePopup();
				}
				catch(e) {
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
 
	clearAfterSearch : function() 
	{
		if (!this.getBoolPref('secondsearch.clear_after_search'))
			return;

		this.stopClearAfterSearch();

		this.clearAfterSearchTimer = window.setTimeout(function() {
			SecondSearch.clearTextBox();
			SecondSearch.clearAfterSearchTimer = null;
		}, this.clearDelay);
	},
	stopClearAfterSearch : function()
	{
		if (this.clearAfterSearchTimer)
			window.clearTimeout(this.clearAfterSearchTimer);
	},
	clearAfterSearchTimer : null,
  
/* update searchbar */ 
	
	initBar : function() 
	{
		var search = this.searchbar;
		if (!search || search.secondsearchInitialized) return;

		search.secondsearchInitialized = true;

		this.addPrefListener(this);

		var textbox = this.textbox;
		textbox.addEventListener('input',    this, true);
		textbox.addEventListener('keypress', this, true);
		textbox.addEventListener('blur',     this, false);

		textbox.addEventListener('focus',    this, true);
		this.popup.addEventListener('click', this, true);

		this.engineButton.addEventListener('contextmenu', this, true);

		search.addEventListener('dragenter', this, false);
		search.addEventListener('dragover',  this, false);
		search.addEventListener('dragexit',  this, false);
		search.addEventListener('dragdrop',  this, false);

		window.addEventListener('focus', this.onSomethingFocusedOrBlured, true);
		window.addEventListener('blur',  this.onSomethingFocusedOrBlured, true);
		window.addEventListener('click', this.onSomethingFocusedOrBlured, true);

		textbox.disableAutoComplete = (this.popupPosition == 1);

		textbox.__secondsearch__onTextEntered = textbox.onTextEntered;
		textbox.onTextEntered = this.onTextEntered;

		textbox.__secondsearch__onKeyPress = textbox.onKeyPress;
		textbox.onKeyPress = this.onTextboxKeyPress;

		eval(
			'textbox.searchbarDNDObserver.onDrop = '+
				textbox.searchbarDNDObserver.onDrop.toSource()
					.replace('this.mOuter.onTextEntered',
						'if (SecondSearch.autoShowDragdropMode == SecondSearch.DRAGDROP_MODE_DROP) {'+
							'SecondSearch.showSecondSearch(SecondSearch.SHOWN_BY_DROP);'+
							'return;'+
						'}'+
						'else if (SecondSearch.autoShowDragdropMode == SecondSearch.DRAGDROP_MODE_NONE || SecondSearch.handleDragdropOnlyOnButton) {'+
							'return;'+
						'}'+
						'this.mOuter.onTextEntered'
					)
		);
		eval(
			'textbox.searchbarDNDObserver.getSupportedFlavours = '+
				textbox.searchbarDNDObserver.getSupportedFlavours.toSource()
					.replace('flavourSet.appendFlavour',
						'if ('+
							'('+
								'SecondSearch.autoShowDragdropMode == SecondSearch.DRAGDROP_MODE_NONE ||'+
								'SecondSearch.handleDragdropOnlyOnButton'+
							') &&'+
							'("handleSearchCommand" in SecondSearch.searchbar ? (SecondSearch.searchbar.getAttribute("empty") != "true") : SecondSearch.textbox.value )'+
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
							'if (!SecondSearch.loadInBackground) $1.focus()'
						).replace(
							/(loadOneTab\([^,]+,[^,]+,[^,]+,[^,]+,)[^,]+(,[^,]+\))/,
							'$1 SecondSearch.loadInBackground $2'
						).replace(
							'if (gURLBar)',
							'if (gURLBar && !SecondSearch.loadInBackground)'
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
							'SecondSearch.addEngineToRecentList(SecondSearch.getCurrentEngine());'+
							'this.currentEngine = target.id'
						)
			);
			eval(
				'textbox.__secondsearch__onTextEntered = '+
					textbox.__secondsearch__onTextEntered.toSource()
						.replace(
							'(evt && evt.altKey)',
							'$& || SecondSearch.openintab'
						)
			);
		}

		if ('SearchLoadURL' in window) { // Fx 1.5?
			eval('window.SearchLoadURL = '+
				window.SearchLoadURL.toSource().replace(
					/([\w\d\.]+).focus\(\)/,
					'if (!SecondSearch.loadInBackground) $1.focus()'
				).replace(
					/([\w\d\.]+).selectedTab = /,
					'if (!SecondSearch.loadInBackground) $1.selectedTab = '
				).replace(
					'if (gURLBar)',
					'if (gURLBar && !SecondSearch.loadInBackground)'
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
		textbox.removeEventListener('input',    this, true);
		textbox.removeEventListener('keypress', this, true);
		textbox.removeEventListener('blur',     this, false);

		textbox.removeEventListener('focus',    this, true);
		this.popup.removeEventListener('click', this, true);

		this.engineButton.removeEventListener('contextmenu', this, true);

		search.removeEventListener('dragenter', this, false);
		search.removeEventListener('dragover',  this, false);
		search.removeEventListener('dragexit',  this, false);
		search.removeEventListener('dragdrop',  this, false);

		if ('handleSearchCommand' in search)
			search._popup.removeEventListener('command', this, true);

		window.removeEventListener('focus', this.onSomethingFocusedOrBlured, true);
		window.removeEventListener('blur',  this.onSomethingFocusedOrBlured, true);
		window.removeEventListener('click', this.onSomethingFocusedOrBlured, true);

		textbox.disableAutoComplete = false;
	},
  
/* event handlers */ 
	
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				this.init();
				break;

			case 'unload':
				this.destroy();
				break;


			case 'input':
				this.stopClearAfterSearch();
				this.onInput(aEvent);
				break;

			case 'keypress':
				this.operateSecondSearch(aEvent);
				break;

			case 'blur':
				this.hideSecondSearch();
				break;

			case 'command':
				var node = aEvent.originalTarget || aEvent.target;
				if (node.getAttribute('class').indexOf('addengine-item') > -1)
					this.addEngineToRecentList(this.getCurrentEngine());
				break;


			case 'dragenter':
			case 'dragover':
			case 'dragexit':
			case 'dragdrop':
				var bar = this.searchbar;
				if (this.handleDragdropOnlyOnButton && aEvent.target == bar) {
					var target = aEvent.originalTarget;
					var textbox = this.textbox;
					while (target != bar && target != textbox)
						target = target.parentNode;
					if (target == textbox) return;
				}
				switch (aEvent.type)
				{
					case 'dragenter':
						nsDragAndDrop.dragEnter(aEvent, this.searchDNDObserver);
						break;
					case 'dragover':
						nsDragAndDrop.dragOver(aEvent, this.searchDNDObserver);
						break;
					case 'dragexit':
						nsDragAndDrop.dragExit(aEvent, this.searchDNDObserver);
						break;
					case 'dragdrop':
						nsDragAndDrop.drop(aEvent, this.searchDNDObserver);
						break;
				}
				break;

			case 'contextmenu':
				window.setTimeout('SecondSearch.showSecondSearch(SecondSearch.SHOWN_BY_CONTEXT, '+aEvent.screenX+', '+aEvent.screenY+');', 0);
				aEvent.preventDefault();
				aEvent.stopPropagation();
				break;

			case 'click':
			case 'focus':
				this.stopClearAfterSearch();
				this.textBoxFocused = true;
				break;

		}
	},
	textBoxFocused : false,
 
	onInput : function(aEvent) 
	{
		var popup = this.popup;
		if (popup.shown) {
				var current = this.getCurrentItem(popup);
				if (current) {
					current.removeAttribute('_moz-menuactive');
				}
		}
		if (this.autoHideTimer) {
			window.clearTimeout(SecondSearch.autoHideTimer);
			this.autoHideTimer = null;
		}

		if (this.searchterm &&
			this.shouldShowAutomatically) {
			var delay = this.delay;
			if (delay) {
				if (this.autoShowTimer) window.clearTimeout(this.autoShowTimer);
				this.autoShowTimer = window.setTimeout('SecondSearch.showPopupOnInput();', delay);
			}
			else {
				this.showPopupOnInput();
			}
		}
		else
			this.hideSecondSearch();
	},
	showPopupOnInput : function()
	{
		if (!this.searchterm) return;
		this.showSecondSearch(this.SHOWN_BY_INPUT);
		this.autoHideTimer = window.setTimeout('SecondSearch.hideSecondSearch();', this.timeout);
		this.autoShowTimer = null;
	},
	autoShowTimer : null,
	autoHideTimer : null,
 
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
				(
					(SecondSearch.popupPosition == 0) ?
						(aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_UP) :
						(aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_DOWN)
				)
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
 
	onTextEntered : function(aEvent) 
	{
		if (SecondSearch.getCurrentItem())
			return false;
		else {
			var retVal = this.__secondsearch__onTextEntered(aEvent);
			SecondSearch.clearAfterSearch();
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
  
/* drag and drop */ 
	
	searchDNDObserver : { 
		showTimer : -1,
		hideTimer : -1,
	 
		onDragEnter : function(aEvent, aDragSession) 
		{
			if (SecondSearch.autoShowDragdropMode != SecondSearch.DRAGDROP_MODE_DRAGOVER)
				return;

			if (aEvent.target.localName == 'menuitem' ||
				aEvent.target.localName == 'menu') {
				aEvent.target.setAttribute('_moz-menuactive', true);
			}

			if (!aDragSession.canDrop)
				return;

			var popup = this.getPopup(aEvent);
			var now = (new Date()).getTime();

			if (this.isPlatformNotSupported) return;
			if (this.isTimerSupported || !aDragSession.sourceNode) {
				window.clearTimeout(popup.showTimer);
				if (aEvent.target == aDragSession.sourceNode) return;
				popup.showTimer = window.setTimeout(function() {
					if (popup == SecondSearch.popup)
						SecondSearch.showSecondSearch(SecondSearch.SHOWN_BY_DRAGOVER);
					else
						popup.showPopup();
				}, SecondSearch.autoShowDragdropDelay);
				this.showTimer = now;
			}
			else {
				popup.showTimer  = now;
				popup.showTarget = aEvent.target;
			}
		},
 
		onDragExit : function(aEvent, aDragSession) 
		{
			if (SecondSearch.autoShowDragdropMode != SecondSearch.DRAGDROP_MODE_DRAGOVER)
				return;

			if (aEvent.target.localName == 'menuitem' ||
				aEvent.target.localName == 'menu') {
				aEvent.target.removeAttribute('_moz-menuactive');
			}

			var popup = this.getPopup(aEvent);
			var now = (new Date()).getTime();

			if (this.isPlatformNotSupported) return;
			if (this.isTimerSupported || !aDragSession.sourceNode) {
				window.clearTimeout(popup.hideTimer);
				popup.hideTimer = window.setTimeout(function() {
					if (SecondSearch.searchDNDObserver.showTimer > SecondSearch.searchDNDObserver.hideTimer) return;
					if (popup == SecondSearch.popup)
						SecondSearch.hideSecondSearch();
					else
						popup.hidePopup();
				}, SecondSearch.autoShowDragdropDelay);
				this.hideTimer = now;
			}
			else {
				popup.hideTimer  = now;
				popup.hideTarget = aEvent.target;
				popup.showTimer  = null;
				popup.showTarget = null;

				if (aDragSession.sourceNode.localName != 'menuitem' &&
					aDragSession.sourceNode.localName != 'menu')
					window.setTimeout(function () {
						SecondSearch.searchDNDObserver.showTimer = null;
						SecondSearch.searchDNDObserver.showTarget = null;
						if (popup == SecondSearch.popup)
							SecondSearch.hideSecondSearch();
						else
							popup.hidePopup();
					}, 0);
			}
		},
 
		onDragOver : function(aEvent, aFlavour, aDragSession) 
		{
			if (this.isPlatformNotSupported) return;
			if (this.isTimerSupported || !aDragSession.sourceNode) return;

			var now   = (new Date()).getTime();
			var delay = SecondSearch.autoShowDragdropDelay;
			var popup = this.getPopup(aEvent);

			if (popup.hideTimer && (now - delay > popup.hideTimer)) {
				if (!SecondSearch.getCurrentItem(popup)) {
					if (popup == SecondSearch.popup)
						SecondSearch.hideSecondSearch();
					else
						popup.hidePopup();
					popup.hideTimer  = null;
					popup.hideTarget = null;
				}
			}
			if (popup.showTimer && (now - delay > popup.showTimer)) {
				if (popup == SecondSearch.popup)
					SecondSearch.showSecondSearch(SecondSearch.SHOWN_BY_DRAGOVER);
				else
					popup.showPopup();

				popup.showTimer  = null;
				popup.showTarget = null;
			}
		},
 
		getPopup : function(aEvent) 
		{
			var allItem = SecondSearch.allMenuItem;
			if (aEvent.target == allItem ||
				aEvent.target.parentNode == allItem ||
				aEvent.target.parentNode.parentNode == allItem)
				return SecondSearch.allMenuItem.firstChild;

			return SecondSearch.popup;
		},
 
		isPlatformNotSupported : navigator.platform.indexOf('Mac') != -1, // see bug 136524 
		isTimerSupported       : navigator.platform.indexOf('Win') == -1, // see bug 232795.
 
		onDrop : function(aEvent, aXferData, aDragSession) 
		{
			var string = aXferData.data.replace(/[\r\n]/g, '').replace(/[\s]+/g, ' ');

			var bar = SecondSearch.searchbar;
			bar.removeAttribute('empty');

			var textbox = SecondSearch.textbox;
			textbox.value = string;

			if (aEvent.target == bar) {
				textbox.onTextEntered(aEvent);
			}
			else if (aEvent.target.localName == 'menuitem') {
				SecondSearch.doSearchBy(aEvent.target, aEvent);
			}
			SecondSearch.clearAfterSearch();
			window.setTimeout('SecondSearch.hideSecondSearch();', 0);
		},
 
		getSupportedFlavours : function() 
		{
			var flavourSet = new FlavourSet();
			flavourSet.appendFlavour('text/unicode');
			return flavourSet;
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
		window.setTimeout('SecondSearch.doingSearch = false; SecondSearch.clearAfterSearch();', 1);

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
		var simpleFlag = !SecondSearch.placesAvailable;
		if (!aWhere || typeof aWhere != 'string') {
			aWhere = aWhere ? 'tab' : 'current ';
		}

		if (aWhere &&
			SecondSearch.openintab &&
			SecondSearch.reuseBlankTab &&
			SecondSearch.currentURI == 'about:blank') {
			aWhere = 'current';
		}

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
			var loadInBackground = SecondSearch.loadInBackground;
			if (aWhere.indexOf('tab') > -1) {
				if (!loadInBackground) SecondSearch.browser.contentWindow.focus();
				SecondSearch.browser.loadOneTab(url, null, null, postData, loadInBackground, false);
				if (gURLBar && !loadInBackground)
					gURLBar.value = url;
			}
			else
				SecondSearch.browser.webNavigation.loadURI(url, Components.interfaces.LOAD_FLAGS_NONE, null, postData, null);

			SecondSearch.browser.contentWindow.focus();
			return;
		}
		else {
			var retVal = this.__secondsearch__doSearch(aData, simpleFlag ? aWhere.indexOf('tab') > -1 : aWhere );
			SecondSearch.clearAfterSearch();
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
						!source.getElementsByAttribute('label', names[i]).length
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
			var item;
			for (var i = 0, maxi = this.historyNum, childNum = source.childNodes.length; list.length < maxi; i++)
			{
				if (i == childNum) break;
				if (source.childNodes[i].localName != 'menuitem' ||
					source.childNodes[i].getAttribute('label') == engine.name ||
					source.childNodes[i].getAttribute('anonid') == 'open-engine-manager')
					continue;

				item = this.getEngineFromName(source.childNodes[i].getAttribute('label'));
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
		}
		else {
			try {
				this.bookmarksDS.RemoveObserver(this.bookmarksRDFObserver);
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
		if (!this._placesObserver) {
			this._placesObserver = {
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
				}
			};
		}
		return this._placesObserver;
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
			if (
				aProperty.Value == 'http://home.netscape.com/NC-rdf#ShortcutURL' ||
				(
					aSource.Value in SecondSearch.keywordsHash &&
					(
						aProperty.Value == 'http://home.netscape.com/NC-rdf#ShortcutURL' ||
						aProperty.Value == 'http://home.netscape.com/NC-rdf#Name' ||
						aProperty.Value == 'http://home.netscape.com/NC-rdf#Icon'
					)
				)
				)
				SecondSearch.updateKeywordFromRDF(aSource.Value, aMode);
		}
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
					window.setTimeout('SecondSearch.setBoolPref("secondsearch.keyword.updating", false);', 100);
				}
				return;
		}
	},
 
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
 
	getArrayPref : function(aKey) 
	{
		var value;
		try {
			value = this.Prefs.getComplexValue(aKey, this.knsISupportsString).data;
		}
		catch(e) {
			value = null;
		}
		var array = (value || '').split('|');
		if (array.length == 1 && !array[0]) {
			array = [];
		}
		for (var i = 0, maxi = array.length; i < maxi; i++)
			array[i] = decodeURIComponent(array[i]);
		return array;
	},
 
	setArrayPref : function(aKey, aValues) 
	{
		for (var i = 0, maxi = aValues.length; i < maxi; i++)
			aValues[i] = encodeURIComponent(aValues[i]);
		var string = ('@mozilla.org/supports-wstring;1' in Components.classes) ?
				Components.classes['@mozilla.org/supports-wstring;1'].createInstance(this.knsISupportsString) :
				Components.classes['@mozilla.org/supports-string;1'].createInstance(this.knsISupportsString) ;
		string.data = aValues.join('|');
		this.Prefs.setComplexValue(aKey, this.knsISupportsString, string);
		return aValues;
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
  
/* initializing */ 
	 
	init : function() { 
		this.initBar();
		window.removeEventListener('load', this, false);

		window.__secondsearch__BrowserCustomizeToolbar = window.BrowserCustomizeToolbar;
		window.BrowserCustomizeToolbar = function() {
			SecondSearch.destroyBar();
			window.__secondsearch__BrowserCustomizeToolbar.call(window);
		};

		var toolbox = document.getElementById('browser-toolbox') || // Firefox 3
					document.getElementById('navigator-toolbox'); // Firefox 2
		if (toolbox.customizeDone) {
			toolbox.__secondsearch__customizeDone = toolbox.customizeDone;
			toolbox.customizeDone = function(aChanged) {
				this.__secondsearch__customizeDone(aChanged);
				SecondSearch.initBar();
			};
		}
		if ('BrowserToolboxCustomizeDone' in window) {
			window.__secondsearch__BrowserToolboxCustomizeDone = window.BrowserToolboxCustomizeDone;
			window.BrowserToolboxCustomizeDone = function(aChanged) {
				window.__secondsearch__BrowserToolboxCustomizeDone.apply(window, arguments);
				SecondSearch.initBar();
			};
		}

		if (this.popupTypeDragdrop == this.DRAGDROP_MODE_DRAGOVER &&
			this.searchDNDObserver.isPlatformNotSupported)
			this.setIntPref('secondsearch.popup.type.dragdrop', this.DRAGDROP_MODE_DROP);

		window.setTimeout('SecondSearch.delayedInit();', 100);
	},
	delayedInit : function()
	{
		this.initKeywords();
		this.startObserveKeyword();
	},
 
	destroy : function() { 
		this.destroyBar();
		window.removeEventListener('unload', this, false);
		this.endObserveKeyword();
	}
   
}; 

window.addEventListener('load', SecondSearch, false);
window.addEventListener('unload', SecondSearch, false);
 
