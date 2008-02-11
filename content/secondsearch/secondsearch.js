function SecondSearchBase() 
{
}
SecondSearchBase.prototype = {
	 
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
 
	get isBrowser() 
	{
		return this.browser ? true : false ;
	},
 
/* preference values */ 
	
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
  
/* elements */ 
	
	get browser() 
	{
		return 'SplitBrowser' in window ? (SplitBrowser.browserForSearch || SplitBrowser.activeBrowser) : window.gBrowser ; // document.getElementById('content') ;
	},
 
	get searchbar() 
	{
		return null;
	},
 
	get textbox() 
	{
		return null;
	},
 
	get searchterm() 
	{
		var bar = this.searchbar;
		var box = this.textbox;
		return (box && bar && bar.getAttribute(this.emptyAttribute) != 'true') ? box.value : '' ;
	},
	
	get emptyAttribute() 
	{
		return this.isBrowser ? 'empty' : 'searchCriteria' ;
	},
  
	get popup() 
	{
		return document.getElementById('secondsearch_popup');
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
 
	showSecondSearch : function(aReason, aX, aY) 
	{
		var popup = this.popup;
		var pos = this.popupPosition;
		if (!popup.shown) {
			popup.shownBy = aReason;

			var bar = this.searchbar;
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
				var num = this.popupHeight;
				var anchor, align, position;
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
	
	get popupHeight() 
	{
		return this.popup.childNodes.length;
	},
  
	hideSecondSearch : function(aWithDelay) 
	{
		if (aWithDelay) {
			window.setTimeout(function(aSelf) {
				aSelf.hideSecondSearch();
			}, 0, this);
			return;
		}
		var popup = this.popup;
		if (!popup.shown) return;

		this.destroyPopup();
		popup.hidePopup();
	},
 
	operateSecondSearch : function(aEvent) 
	{
try{
		var popup = this.popup;
		if (!this.onOperationPre(aEvent))
			return true;

		if (
			popup.shown &&
			(
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER ||
				aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN
			)
			) {
			var bar = this.searchbar;

			var current = this.getCurrentItem(popup);
			if (!current)  {
				this.hideSecondSearch(aEvent);
				this.clearAfterSearch();
			}
			else {
				current = this.getOverriddenItemOnEnter(current, aEvent);
				if (!current) return false;
				aEvent.stopPropagation();
				aEvent.preventDefault();
				this.onOperationEnter(current, aEvent);
				this.hideSecondSearch(true);
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
				this.onOperationDefault(popup, aEvent);
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
				}
				this.onOperationDelete(popup, aEvent);
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
					var newCurrent = this.getOverriddenItemOnUpDown(current, isUpKey, aEvent);
					if (current != newCurrent) {
						current = newCurrent;
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
				return this.onOperationRight(this.getCurrentItem(popup), aEvent);

			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_LEFT:
				if (!popup.shown) return true;
				return this.onOperationLeft(this.getCurrentItem(popup), aEvent);
		}
}
catch(e) {
	dump(e+'\n');
}
	},
	 
	getOverriddenItemOnEnter : function(aCurrentItem, aEvent) 
	{
		return aCurrentItem;
	},
 
	getOverriddenItemOnUpDown : function(aCurrentItem, aIsUpKey, aEvent) 
	{
		return aCurrentItem;
	},
 
	onOperationPre : function(aEvent) 
	{
		return true;
	},
 
	onOperationDefault : function(aPopup, aEvent) 
	{
	},
 
	onOperationDelete : function(aPopup, aEvent) 
	{
	},
 
	onOperationEnterPre : function(aEvent) 
	{
	},
 
	onOperationEnter : function(aCurrentItem, aEvent) 
	{
	},
 
	onOperationRight : function(aCurrentItem, aEvent) 
	{
		return true;
	},
 
	onOperationLeft : function(aCurrentItem, aEvent) 
	{
		return true;
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
  	
	clearTextBox : function() 
	{
		if (
			!this.textbox.value ||
			this.searchbar.getAttribute(this.emptyAttribute) == 'true'
			)
			return;

		this.textbox.value = '';
		this.initEmptySearchBar();
	},
	
	initEmptySearchBar : function() 
	{
	},
  
	clearAfterSearch : function() 
	{
		if (!this.getBoolPref('secondsearch.clear_after_search'))
			return;

		this.stopClearAfterSearch();

		this.clearAfterSearchTimer = window.setTimeout(function(aSelf) {
			aSelf.clearTextBox();
			aSelf.clearAfterSearchTimer = null;
		}, this.clearDelay, this);
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
		this.initBarBase();
	},
	 
	initBarBase : function() 
	{
		var search = this.searchbar;
		if (!search || search.secondsearchInitialized) return false;

		search.secondsearchInitialized = true;

		var textbox = this.textbox;
		textbox.addEventListener('input',    this, true);
		textbox.addEventListener('keypress', this, true);
		textbox.addEventListener('blur',     this, false);

		textbox.addEventListener('focus',    this, true);
		this.popup.addEventListener('click', this, true);

		search.addEventListener('dragenter', this, false);
		search.addEventListener('dragover',  this, false);
		search.addEventListener('dragexit',  this, false);
		search.addEventListener('dragdrop',  this, false);

		window.addEventListener('focus', this.focusEventListener, true);
		window.addEventListener('blur',  this.focusEventListener, true);
		window.addEventListener('click', this.focusEventListener, true);

		return true;
	},
  
	destroyBar : function() 
	{
		this.destroyBarBase();
	},
	 
	destroyBarBase : function() 
	{
		var search = this.searchbar;
		if (!search || !search.secondsearchInitialized) return false;;

		search.secondsearchInitialized = false;

		var textbox = this.textbox;
		textbox.removeEventListener('input',    this, true);
		textbox.removeEventListener('keypress', this, true);
		textbox.removeEventListener('blur',     this, false);

		textbox.removeEventListener('focus',    this, true);
		this.popup.removeEventListener('click', this, true);

		search.removeEventListener('dragenter', this, false);
		search.removeEventListener('dragover',  this, false);
		search.removeEventListener('dragexit',  this, false);
		search.removeEventListener('dragdrop',  this, false);

		window.removeEventListener('focus', this.focusEventListener, true);
		window.removeEventListener('blur',  this.focusEventListener, true);
		window.removeEventListener('click', this.focusEventListener, true);

		this.focusEventListener.destroy();
		this.focusEventListener = null;

		return true;
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
				this.onCommand(aEvent);
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
				window.setTimeout(function(aSelf, aX, aY) {
					aSelf.showSecondSearch(aSelf.SHOWN_BY_CONTEXT, aX, aY);
				}, 0, this, aEvent.screenX, aEvent.screenY);
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
 
	onCommand : function(aEvent) 
	{
	},
 
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
			window.clearTimeout(this.autoHideTimer);
			this.autoHideTimer = null;
		}

		if (this.searchterm &&
			this.shouldShowAutomatically) {
			var delay = this.delay;
			if (delay) {
				if (this.autoShowTimer) window.clearTimeout(this.autoShowTimer);
				this.autoShowTimer = window.setTimeout(function(aSelf) {
					aSelf.showPopupOnInput();
				}, delay, this);
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
		this.autoHideTimer = window.setTimeout(function(aSelf) {
			aSelf.hideSecondSearch();
		}, this.timeout, this);
		this.autoShowTimer = null;
	},
	autoShowTimer : null,
	autoHideTimer : null,
 
	onPopupShowing : function(aEvent) 
	{
		var popup = this.popup;
		popup.shown = true;
		this.initPopup();
	},
	
	initPopup : function() 
	{
	},
  
	onPopupHiding : function(aEvent) 
	{
		var popup = this.popup;

		popup.shown = false;
		popup.shownBy = 0;

		var current = this.getCurrentItem(popup);
		if (current) current.removeAttribute('_moz-menuactive');

		this.destroyPopup();
	},
	
	destroyPopup : function() 
	{
	},
  
	get focusEventListener() 
	{
		if (!this.mFocusEventListener) {
			this.mFocusEventListener = {
				owner : this,
				handleEvent : function(aEvent)
				{
					var node = aEvent.originalTarget || aEvent.target;
					if (node.ownerDocument == document) {
						while (node.parentNode)
						{
							if (node == this.owner.textbox || node == this.owner.popup)
								return;
							node = node.parentNode;
						}
					}

					window.setTimeout(function(aOwner) {
						if (!aOwner.textBoxFocused)
							aOwner.hideSecondSearch();

						aOwner.textBoxFocused = false;
					}, 0, this.owner);
				},
				destroy : function()
				{
					this.owner.mFocusEventListener = null;
					this.owner = null;
				}
			};
		}
		return this.mFocusEventListener;
	},
 
	set focusEventListener(val) 
	{
		this.mFocusEventListener = val;
		return val;
	},
  
/* drag and drop */ 
	
	getPopupForDragDrop : function(aEvent) 
	{
		return null;
	},
 
	onSearchTermDrop : function(aEvent) 
	{
	},
 
	get searchDNDObserver() 
	{
		if (!this.mSearchDNDObserver) {
			this.mSearchDNDObserver = this.createSearchDNDObserver();
		}
		return this.mSearchDNDObserver;
	},
 
	set searchDNDObserver(val) 
	{
		this.mSearchDNDObserver = val;
		return val;
	},
 
	createSearchDNDObserver : function() 
	{
		return ({

		owner : this,
		showTimer : -1,
		hideTimer : -1,
	
		onDragEnter : function(aEvent, aDragSession) 
		{
			if (this.owner.autoShowDragdropMode != this.owner.DRAGDROP_MODE_DRAGOVER)
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
					if (popup == this.owner.popup)
						this.owner.showSecondSearch(this.owner.SHOWN_BY_DRAGOVER);
					else
						popup.showPopup();
				}, this.owner.autoShowDragdropDelay);
				this.showTimer = now;
			}
			else {
				popup.showTimer  = now;
				popup.showTarget = aEvent.target;
			}
		},
 
		onDragExit : function(aEvent, aDragSession) 
		{
			if (this.owner.autoShowDragdropMode != this.owner.DRAGDROP_MODE_DRAGOVER)
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
				popup.hideTimer = window.setTimeout(function(aSelf) {
					if (aSelf.owner.searchDNDObserver.showTimer > aSelf.hideTimer) return;
					if (popup == aSelf.owner.popup)
						aSelf.owner.hideSecondSearch();
					else
						popup.hidePopup();
				}, this.owner.autoShowDragdropDelay, this);
				this.hideTimer = now;
			}
			else {
				popup.hideTimer  = now;
				popup.hideTarget = aEvent.target;
				popup.showTimer  = null;
				popup.showTarget = null;

				if (aDragSession.sourceNode.localName != 'menuitem' &&
					aDragSession.sourceNode.localName != 'menu')
					window.setTimeout(function (aSelf) {
						aSelf.showTimer = null;
						aSelf.showTarget = null;
						if (popup == aSelf.owner.popup)
							aSelf.owner.hideSecondSearch();
						else
							popup.hidePopup();
					}, 0, this);
			}
		},
 
		onDragOver : function(aEvent, aFlavour, aDragSession) 
		{
			if (this.isPlatformNotSupported) return;
			if (this.isTimerSupported || !aDragSession.sourceNode) return;

			var now   = (new Date()).getTime();
			var delay = this.owner.autoShowDragdropDelay;
			var popup = this.getPopup(aEvent);

			if (popup.hideTimer && (now - delay > popup.hideTimer)) {
				if (!this.owner.getCurrentItem(popup)) {
					if (popup == this.owner.popup)
						this.owner.hideSecondSearch();
					else
						popup.hidePopup();
					popup.hideTimer  = null;
					popup.hideTarget = null;
				}
			}
			if (popup.showTimer && (now - delay > popup.showTimer)) {
				if (popup == this.owner.popup)
					this.owner.showSecondSearch(this.owner.SHOWN_BY_DRAGOVER);
				else
					popup.showPopup();

				popup.showTimer  = null;
				popup.showTarget = null;
			}
		},
 
		getPopup : function(aEvent) 
		{
			return this.owner.getPopupForDragDrop(aEvent) || this.owner.popup;
		},
 
		isPlatformNotSupported : navigator.platform.indexOf('Mac') != -1, // see bug 136524 
		isTimerSupported       : navigator.platform.indexOf('Win') == -1, // see bug 232795.
 
		onDrop : function(aEvent, aXferData, aDragSession) 
		{
			var string = aXferData.data.replace(/[\r\n]/g, '').replace(/[\s]+/g, ' ');

			var bar = this.owner.searchbar;
			bar.removeAttribute(this.owner.emptyAttribute);

			var textbox = this.owner.textbox;
			textbox.value = string;
			this.owner.onSearchTermDrop(aEvent);
			this.owner.clearAfterSearch();
			window.setTimeout(function(aOwner) {
				aOwner.hideSecondSearch();
			}, 0, this.owner);
		},
 
		getSupportedFlavours : function() 
		{
			var flavourSet = new FlavourSet();
			flavourSet.appendFlavour('text/unicode');
			return flavourSet;
		},
 
			destroy : function() 
			{
				this.owner = null;
			}
 
		}); 
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
	
	init : function() 
	{
		this.initBase();
	},
	 
	initBase : function() 
	{
		var self = this;
		window.getSecondSearch = function() {
			return self;
		};

		this.initBar();
		window.removeEventListener('load', this, false);

		if (this.popupTypeDragdrop == this.DRAGDROP_MODE_DRAGOVER &&
			this.searchDNDObserver.isPlatformNotSupported)
			this.setIntPref('secondsearch.popup.type.dragdrop', this.DRAGDROP_MODE_DROP);
	},
  
	destroy : function() 
	{
		this.destroyBase();
	},
	 
	destroyBase : function() 
	{
		this.destroyBar();
		window.removeEventListener('unload', this, false);

		this.searchDNDObserver.destroy();
		this.searchDNDObserver = null;

		window.getSecondSearch = null;
	}
   
}; 
  
