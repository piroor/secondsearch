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

	ARROWKEYS_NORMAL  : 1,
	ARROWKEYS_SHIFTED : 2,
 
	get isBrowser() 
	{
		return this.browser ? true : false ;
	},

	get isGecko19()
	{
		const XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1']
				.getService(Components.interfaces.nsIXULAppInfo);
		var version = XULAppInfo.platformVersion.split('.');
		return parseInt(version[0]) >= 2 || parseInt(version[1]) >= 9;
	},
 
/* preference values */ 
	 
	get delay() 
	{
		var val = this.getPref('secondsearch.popup.auto_show.delay');
		return Math.max(0, val);
	},
 
	get clearDelay() 
	{
		var val = this.getPref('secondsearch.clear_after_search.delay');
		return Math.max(0, val);
	},
 
	get timeout() 
	{
		var val = this.getPref('secondsearch.timeout');
		return Math.max(0, val);
	},
 
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
		return this.getPref('secondsearch.popup.type');
	},
 
	get popupTypeDragdrop() 
	{
		return this.getPref('secondsearch.popup.type.dragdrop');
	},
 
	get popupTypeContext() 
	{
		return this.getPref('secondsearch.popup.type.context');
	},
  
	get popupPosition() 
	{
		return this.getPref('secondsearch.popup.position');
	},
 
	get autoShowInput() 
	{
		return this.getPref('secondsearch.popup.auto_show');
	},
 
	get manualShowArrowKeys() 
	{
		return this.getPref('secondsearch.popup.manual_show.arrowKeys');
	},
 
	get autoShowDragdropMode() 
	{
		return this.getPref('secondsearch.popup.auto_show.dragdrop.mode');
	},
 
	get autoShowDragdropDelay() 
	{
		var val = this.getPref('secondsearch.popup.auto_show.dragdrop.delay');
		return Math.max(0, val);
	},
 
	get handleDragdropOnlyOnButton() 
	{
		return this.getPref('secondsearch.handle_dragdrop_only_on_button');
	},
  
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
 
	get popupDummy() 
	{
		return document.getElementById('secondsearch_popup_dummy');
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
	 
	getCurrentItem : function(aPopup, aDig) 
	{
		var popup = aPopup || this.popup;
		var active;
		var lastActive = null;
		while (popup)
		{
			active = this.evaluateXPath('child::*[@_moz-menuactive="true"]', popup, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
			if (!active) return lastActive;
			if (active.localName == 'menuitem') return active;
			lastActive = active;
			if (!aDig || !active.firstChild.shown) return lastActive;
			popup = active.firstChild;
		}
	},
 
	showSecondSearch : function(aReason, aX, aY, aEvent) 
	{
		var popup = this.popup;
		var pos = this.popupPosition;
		if (popup.shown) return;

		popup.shownBy = aReason;
		this.initPopup();

		var bar = this.searchbar;
		if (aReason == this.SHOWN_BY_CONTEXT) {
			document.popupNode = this.engineButton;
			if ('openPopupAtScreen' in popup)
				popup.openPopupAtScreen(aX, aY, true, aEvent);
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
		else if (this.isGecko19) {
			this.showSecondSearchInternal();
		}
		else {
			this.showSecondSearchInternalObsolete();
		}

		var current = this.getCurrentItem(popup);
		if (current) current.removeAttribute('_moz-menuactive');
	},
	canFitPopupToSearchField : true,
	correctingPopupPosition : false,
	correctingPopupPositionTimer : null,
	 
	showSecondSearchInternal : function() 
	{
		if (this.repositionController) {
			this.repositionController.cancel();
		}

		var popup = this.popup;
		var pos = this.popupPosition;
		var bar = this.searchbar;
		var self = this;

		document.popupNode = bar;

		var anchorNode = this.canFitPopupToSearchField ? bar : this.engineButton ;
		var anchorBox = anchorNode.boxObject;
		var rootBox = document.documentElement.boxObject;
		var popupStatus = 'position:'+pos+'\n'+this.getPopupStatus(popup, true);
		if (
			popup[this.kLAST_STATUS] == popupStatus &&
			popup[this.kLAST_X] !== void(0) &&
			popup[this.kLAST_Y] !== void(0) &&
			popup[this.kLAST_ANCHOR_X] == anchorBox.screenX &&
			popup[this.kLAST_ANCHOR_Y] == anchorBox.screenY
			) {
			popup.openPopup(bar, 'after_start', popup[this.kLAST_X], popup[this.kLAST_Y], true, true);
			return;
		}

		popup[this.kLAST_STATUS] = popupStatus;
		popup[this.kLAST_ANCHOR_X] = anchorBox.screenX;
		popup[this.kLAST_ANCHOR_Y] = anchorBox.screenY;

		this.repositionController = this.createRepositionController();
		this.repositionController.next();
	},
	repositionController : null,
	 
	createRepositionController : function() 
	{
		var pos = this.popupPosition;
		var position = pos == 0 ? 'before_start' : 'after_start';
		var anchorNode = this.canFitPopupToSearchField ? this.searchbar : this.engineButton ;
		var popup = this.popup;
		var dummy = this.popupDummy;

		var delta = 8;
		var anchorBox = anchorNode.boxObject;
		var rootBox = document.documentElement.boxObject;

		var controller = {
			owner : this,

			pos : pos,
			position : position,
			anchorNode : anchorNode,
			popup : popup,
			dummy : dummy,
			delta : delta,
			anchorBox : anchorBox,
			rootBox : rootBox,

			handleEvent : function(aEvent)
			{
				this.next(aEvent);
			},
			step : 0,
			next : function(aEvent)
			{
				if (this.step < this.owner.repositionTasks.length) {
					this.owner.repositionTasks[this.step++].processor.call(this, aEvent);
				}
				else {
					this.owner.repositionController = null;
				}
			},
			cancel : function()
			{
				if (this.step < this.owner.repositionTasks.length) {
					this.owner.repositionTasks[this.step].canceller.call(this);
				}
				this.owner.destroyDummy();
				this.owner.repositionController = null;
				this.owner.correctingPopupPosition = false;
				this.owner.popup.shown = false;
				delete this.pos;
				delete this.position;
				delete this.anchorNode;
				delete this.popup;
				delete this.dummy;
				delete this.delta;
				delete this.anchorBox;
				delete this.rootBox;
			},
			show : function()
			{
				this.owner.destroyDummy();
				this.popup.openPopupAtScreen(
					this.popup[this.owner.kLAST_X],
					this.popup[this.owner.kLAST_Y],
					true
				);
				this.correctingPopupPosition = false;
			}
		};
		return controller;
	},
 
	repositionTasks : [ 
		{ // step 0: create menu contents
			processor : function()
			{
				this.popup.removeAttribute('left');
				this.popup.removeAttribute('top');
				this.popup.addEventListener('popupshowing', this, false);
				this.popup.openPopup(this.anchorNode, this.position, 0, 0, true, true);
			},
			canceller : function()
			{
			}
		},
		{ // step 1: show hidden menu (it's a dummy)
			processor : function(aEvent)
			{
				this.popup.removeEventListener('popupshowing', this, false);
				aEvent.stopPropagation();
				aEvent.preventDefault();

				var range = document.createRange();
				range.selectNodeContents(this.popup);
				this.dummy.appendChild(range.cloneContents());
				range.detach();

				this.owner.correctingPopupPosition = true;

				this.dummy.removeAttribute('left');
				this.dummy.removeAttribute('top');
				this.dummy.addEventListener('popupshown', this, false);
				this.dummy.openPopup(this.anchorNode, this.position, 0, 0, true, true);
			},
			canceller : function()
			{
				this.popup.removeEventListener('popupshowing', this, false);
				if (this.popup.popupBoxObject.popupState == 'showing') {
					this.popup.hidePopup();
				}
				else {
					this.popup.addEventListener('popupshowing', function(aEvent) {
						aEvent.currentTarget.removeEventListener('popupshowing', arguments.callee, false);
						aEvent.stopPropagation();
						aEvent.preventDefault();
					}, false);
				}
				this.popup.removeEventListener('popupshown', this, false);
			}
		},
		{ // step 2: check position and try again if the popup will hide the text box.
			processor : function()
			{
				this.dummy.removeEventListener('popupshown', this, false);

				var popupBox = this.dummy.boxObject;
				this.popup[this.owner.kLAST_X] = popupBox.screenX;
				this.popup[this.owner.kLAST_Y] = popupBox.screenY;
				if (
					((this.pos == 0) &&
					(this.anchorBox.screenY + this.delta >= popupBox.screenY + popupBox.height)) ||
					((this.pos == 1) &&
					(this.anchorBox.screenY + this.anchorBox.height - this.delta <= popupBox.screenY))
					) {
					this.show();
					return;
				}

				this.dummy.hidePopup();
				this.dummy.addEventListener('popupshown', this, false);
				this.dummy.openPopupAtScreen(
					this.anchorBox.screenX - popupBox.width,
					this.anchorBox.screenY,
					true
				);
			},
			canceller : function()
			{
				this.dummy.removeEventListener('popupshown', this, false);
			}
		},
		{ // step 3: finish
			processor : function()
			{
				this.dummy.removeEventListener('popupshown', this, false);

				var popupBox = this.dummy.boxObject;
				this.popup[this.owner.kLAST_X] = popupBox.screenX;
				this.popup[this.owner.kLAST_Y] = popupBox.screenY;
				if (this.anchorBox.screenX + this.delta < popupBox.screenX + popupBox.width) {
					this.popup[this.owner.kLAST_X] = this.anchorBox.screenX + this.anchorBox.width;
					this.popup[this.owner.kLAST_Y] = this.anchorBox.screenY;
				}
				this.show();
			},
			canceller : function()
			{
				this.dummy.removeEventListener('popupshown', this, false);
			}
		}
	],
  
	showSecondSearchInternalObsolete : function() 
	{
		var popup = this.popup;
		var pos = this.popupPosition;
		var bar = this.searchbar;

		var num = this.popupHeight;
		var anchor, align;
		var anchorNode = this.canFitPopupToSearchField ? bar : bar.parentNode ;
		var anchorBox = anchorNode.boxObject;
		var rootBox = document.documentElement.boxObject;
		var popupBox = popup.boxObject;
		if (pos == 0 &&
			anchorBox.screenY >= rootBox.screenY + (anchorBox.height * (num+1) * 0.8)) { // above
			anchor = 'topleft';
			align  = 'bottomleft';
		}
		else if (pos == 1 &&
			anchorBox.screenY + anchorBox.height + this.textbox.popup.boxObject.height <= rootBox.screenY + rootBox.height - (anchorBox.height * (num+1) * 0.8)) { // below
			anchor = 'bottomleft';
			align  = 'topleft';
		}
		else if (anchorBox.screenX < rootBox.screenY + anchorBox.width) { // right
			anchor = 'bottomright';
			align  = 'bottomleft';
		}
		else { // left
			anchor = 'bottomleft';
			align  = 'bottomright';
		}

		document.popupNode = bar;
		popup.showPopup(anchorNode, -1, -1, 'menupopup', anchor, align);
	},
 
	kLAST_X        : '__secondsearch__framework__lastX', 
	kLAST_Y        : '__secondsearch__framework__lastY',
	kLAST_ANCHOR_X : '__secondsearch__framework__lastAnchorX',
	kLAST_ANCHOR_Y : '__secondsearch__framework__lastAnchorY',
	kLAST_STATUS   : '__secondsearch__framework__lastStatus',
	getPopupStatus : function(aPopupOrItemsArray, aIgnoreOrder)
	{
		var items = Array.slice(aPopupOrItemsArray.childNodes || aPopup)
				.map(function(aItem) {
					if (!aItem) return '----';
					if ('getAttribute' in aItem) {
						aItem.engineId = aItem.getAttribute('engineId');
						aItem.icon = aItem.getAttribute('src');
						if (!aItem.label) aItem.label = aItem.getAttribute('label') || '';
					}
					return {
						localName : aItem.localName || '',
						label     : aItem.label,
						engineId  : aItem.id,
						icon      : aItem.icon
					}.toSource();
				});
		if (aIgnoreOrder) items.sort();

		return items.join('\n');
	},
 
	destroyDummy : function() 
	{
		var popup = this.popupDummy;
		popup.hidePopup();
		var range = document.createRange();
		range.selectNodeContents(popup);
		range.deleteContents();
		range.detach();
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

		if (this.repositionController)
			this.repositionController.cancel();

		this.destroyPopup();
		popup.hidePopup();
	},
 	
	operateSecondSearch : function(aEvent) 
	{
try{
		var popup = this.popup;
		if (!this.onOperationPre(aEvent))
			return true;

		const nsIDOMKeyEvent = Components.interfaces.nsIDOMKeyEvent;

		if (
			popup.shown &&
			(
				aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_ENTER ||
				aEvent.keyCode == nsIDOMKeyEvent.DOM_VK_RETURN
			)
			) {
			var bar = this.searchbar;

			var current = this.getCurrentItem(popup, true);
			if (current && current.localName == 'menu') {
				if (current.firstChild.shown)
					current = this.getCurrentItem(current.firstChild, true);
				else
					current = null;
			}
			if (!current)  {
				this.hideSecondSearch(aEvent);
				this.clearAfterSearch();
			}
			else {
				aEvent.stopPropagation();
				aEvent.preventDefault();
				this.onOperationEnter(current, aEvent);
				this.hideSecondSearch(true);
			}
			return false;
		}

		if (
			aEvent.ctrlKey ||
			aEvent.altKey ||
			aEvent.metaKey
			)
			return true;

		var isUpKey = false;
		switch(aEvent.keyCode)
		{
			case nsIDOMKeyEvent.DOM_VK_DELETE:
			case nsIDOMKeyEvent.DOM_VK_BACK_SPACE:
				if (popup.shown) {
					if (!this.searchterm) {
						this.hideSecondSearch();
						aEvent.stopPropagation();
						aEvent.preventDefault();
						return false;
					}
				}
			default:
				var popups = popup.getElementsByTagName('menupopup');
				for (var i = popups.length-1; i > -1; i--)
				{
					popups[i].hidePopup();
				}
				return true;

			case nsIDOMKeyEvent.DOM_VK_ESCAPE:
				this.hideSecondSearch();
				aEvent.stopPropagation();
				aEvent.preventDefault();
				if (this.autoShowTimer) {
					window.clearTimeout(this.autoShowTimer);
					this.autoShowTimer = null;
				}
				return false;


			case nsIDOMKeyEvent.DOM_VK_UP:
				isUpKey = true;
			case nsIDOMKeyEvent.DOM_VK_DOWN:
				if (!popup.shown) {
					if (aEvent.shiftKey ?
							!(this.manualShowArrowKeys & this.ARROWKEYS_SHIFTED) :
							!(this.manualShowArrowKeys & this.ARROWKEYS_NORMAL)
						) {
						return true;
					}
					if (
						!aEvent.shiftKey &&
						(isUpKey ?
							this.popupPosition != 0 :
							this.popupPosition != 1
						)
						) {
						return true;
					}

					this.showSecondSearch(this.SHOWN_BY_MANUAL_OPERATION);

					var current = isUpKey ? this.getLastItem(popup) : this.getFirstItem(popup) ;
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

				var current = this.getCurrentItem(popup, true);
				if (current) {
					current.removeAttribute('_moz-menuactive');
					current = this.getNextOrPrevItem(current, (isUpKey ? -1 : 1 ), current.parentNode != popup);
				}
				else {
					var shifted = aEvent.shiftKey && (this.manualShowArrowKeys & this.ARROWKEYS_SHIFTED);
					current = isUpKey ?
						 this.getLastItem(popup) :
						 ((shifted || this.popupPosition == 1) ? this.getFirstItem(popup) : null );
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


			case nsIDOMKeyEvent.DOM_VK_RIGHT:
				if (!popup.shown) return true;

				var current = this.getCurrentItem(popup, true);
				if (current && current.localName == 'menu') {
					var popup = current.firstChild;
					popup.showPopup();
					popup.shown = true;
					var current = this.getCurrentItem(popup);
					if (current) current.removeAttribute('_moz-menuactive');
					if (popup.hasChildNodes()) popup.firstChild.setAttribute('_moz-menuactive', true);
					aEvent.stopPropagation();
					aEvent.preventDefault();
					return false;
				}
				return true;

			case nsIDOMKeyEvent.DOM_VK_LEFT:
				if (!popup.shown) return true;

				var current = this.getCurrentItem(popup, true);
				if (current && current.parentNode != popup) {
					current.removeAttribute('_moz-menuactive');
					current.parentNode.hidePopup();
					current.parentNode.shown = false;
					window.setTimeout(function(aMenu) { // on Firefox 3, the parent "menu" element lose its focus after the submenu popup was hidden.
						aMenu.setAttribute('_moz-menuactive', true);
					}, 0, current.parentNode.parentNode);
					aEvent.stopPropagation();
					aEvent.preventDefault();
					return false;
				}
				return true;
		}
}
catch(e) {
	dump(e+'\n');
}
	},
	
	onOperationPre : function(aEvent) 
	{
		return true;
	},
 
	onOperationEnterPre : function(aEvent) 
	{
	},
 
	onOperationEnter : function(aCurrentItem, aEvent) 
	{
	},
 
	getNextOrPrevItem : function(aCurrent, aDir, aCycle) 
	{
		var node;
		try {
			var condition = '(local-name() = "menu" or local-name() = "menuitem") and (not(@collapsed) or not(@collapsed="true")) and (not(@hidden) or not(@hidden="true"))';
			var axis = (aDir > 0) ? 'following-sibling' : 'preceding-sibling' ;
			node = this.evaluateXPath(
				axis+'::*['+condition+'][1]',
				aCurrent,
				XPathResult.FIRST_ORDERED_NODE_TYPE
			).singleNodeValue;
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
		if (!this.canClearAfterSearch ||
			!this.getPref('secondsearch.clear_after_search'))
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
	canClearAfterSearch : true,
  
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
		if (this.isGecko19) {
			textbox.addEventListener('dragover',  this, false);
			textbox.addEventListener('dragdrop',  this, false);
		}

		window.addEventListener('focus', this.focusEventListener, true);
		window.addEventListener('blur',  this.focusEventListener, true);
		window.addEventListener('click', this.focusEventListener, true);

		return true;
	},
	initBarWithDelay : function()
	{
		// initialize with delay for other addons modifying "doSearch" method (ex. Tab Mix Plus)
		window.setTimeout(function(aSelf) {
			aSelf.initBar();
		}, 100, this);
	},
  
	destroyBar : function(aBar) 
	{
		this.destroyBarBase(aBar);
	},
	 
	destroyBarBase : function(aBar) 
	{
		var search = aBar || this.searchbar;
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
		if (this.isGecko19) {
			textbox.removeEventListener('dragover',  this, false);
			textbox.removeEventListener('dragdrop',  this, false);
		}

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
					var input = this.textbox.inputField || this.textbox;
					while (target != bar && target != input)
						target = target.parentNode;
					if (target == input) return;
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
					aSelf.showSecondSearch(aSelf.SHOWN_BY_CONTEXT, aX, aY, aEvent);
				}, 0, this, aEvent.screenX, aEvent.screenY);
				aEvent.preventDefault();
				aEvent.stopPropagation();
				break;

			case 'click':
			case 'focus':
				this.stopClearAfterSearch();
				this.textBoxFocused = true;
				break;

			case 'popupshowing':
				this.onPopupShowing(aEvent);
				break;

			case 'popuphiding':
				this.onPopupHiding(aEvent);
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
			this.autoShowInput) {
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
		aEvent.target.shown = true;

//		if (aEvent.target.popupBoxObject &&
//			'setConsumeRollupEvent' in aEvent.target.popupBoxObject)
//			aEvent.target.popupBoxObject.setConsumeRollupEvent(Components.interfaces.nsIPopupBoxObject.ROLLUP_NO_CONSUME);

		if (aEvent.target != this.popup) return;

		if (this.correctingPopupPosition) return;
		var popup = this.popup;
		popup.shown = true;
//		this.initPopup(); // do it before popupshowing! (see "showSecondSearch()")
	},
	
	initPopup : function() 
	{
		dump('base-popup\n');
	},
  
	onPopupHiding : function(aEvent) 
	{
		aEvent.target.shown = false;
		var current = this.getCurrentItem(aEvent.target);
		if (current) current.removeAttribute('_moz-menuactive');
		if (aEvent.target != this.popup)
			return;

		if (this.correctingPopupPosition) return;
		var popup = this.popup;
		popup.shown = false;
		popup.shownBy = 0;

		var popups = popup.getElementsByTagName('menupopup');
		for (var i = popups.length-1; i > -1; i--)
		{
			popups[i].shown = false;
			popups[i].shownBy = 0;
		}

		window.setTimeout(function(aSelf) {
			var activeItems = aSelf.evaluateXPath('descendant::*[@_moz-menuactive="true"]', popup);
			for (var i = 0, maxi = activeItems.snapshotLength; i < maxi; i++)
			{
				activeItems.snapshotItem(i).removeAttribute('_moz-menuactive');
			}
		}, 0, this);

		this.destroyPopup();

		if (this.repositionController)
			this.repositionController.cancel();
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
				if (popup.hideTimer) {
					window.clearTimeout(popup.hideTimer);
					popup.hideTimer = null;
				}
				window.clearTimeout(popup.showTimer);
				if (aEvent.target == aDragSession.sourceNode) return;
				popup.showTimer = window.setTimeout(function(aOwner) {
					if (popup == aOwner.popup)
						aOwner.showSecondSearch(aOwner.SHOWN_BY_DRAGOVER);
					else {
						popup.showPopup();
						popup.shown = true;
					}
				}, this.owner.autoShowDragdropDelay, this.owner);
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
					else {
						popup.hidePopup();
						popup.shown = false;
					}
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
						else {
							popup.hidePopup();
							popup.shown = false;
						}
					}, 0, this);
			}
		},
 
		onDragOver : function(aEvent, aFlavour, aDragSession) 
		{
			if (this.isPlatformNotSupported) return;
			if (this.isTimerSupported || !aDragSession.sourceNode) return;
			if (aEvent.target != this.owner.searchbar) return;

			var now   = (new Date()).getTime();
			var delay = this.owner.autoShowDragdropDelay;
			var popup = this.getPopup(aEvent);

			if (popup.hideTimer && (now - delay > popup.hideTimer)) {
				if (!this.owner.getCurrentItem(popup)) {
					if (popup == this.owner.popup)
						this.owner.hideSecondSearch();
					else {
						popup.hidePopup();
						popup.shown = false;
					}
					popup.hideTimer  = null;
					popup.hideTarget = null;
				}
			}
			if (popup.showTimer && (now - delay > popup.showTimer)) {
				if (popup == this.owner.popup)
					this.owner.showSecondSearch(this.owner.SHOWN_BY_DRAGOVER);
				else {
					popup.showPopup();
					popup.shown = true;
				}

				popup.showTimer  = null;
				popup.showTarget = null;
			}
		},
 
		getPopup : function(aEvent) 
		{
			var node = aEvent.target;
			if (node.localName == 'menu')
				return node.firstChild;
			else if (node.localName == 'menuitem')
				return node.parentNode;
			return this.owner.popup;
		},
 
		isPlatformNotSupported : (!this.isGecko19 && navigator.platform.indexOf('Mac') != -1), // see bug 136524 
		isTimerSupported       : (this.isGecko19 || navigator.platform.indexOf('Win') == -1), // see bug 232795.
 
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
			flavourSet.appendFlavour('text/plain');
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
			this.mPrefs = Components
					.classes['@mozilla.org/preferences-service;1']
					.getService(Components.interfaces.nsIPrefService)
					.getBranch(null);
		return this.mPrefs;
	},
	mPrefs : null,
 
	getPref : function(aKey) 
	{
		try {
			switch (this.Prefs.getPrefType(aKey))
			{
				case this.Prefs.PREF_STRING:
					return decodeURIComponent(escape(this.Prefs.getCharPref(aKey)));
					break;
				case this.Prefs.PREF_INT:
					return this.Prefs.getIntPref(aKey);
					break;
				default:
					return this.Prefs.getBoolPref(aKey);
					break;
			}
		}
		catch(e) {
		}
		return null;
	},
 
	setPref : function(aKey, aNewValue) 
	{
		var pref = this.Prefs ;
		var type;
		try {
			type = typeof aNewValue;
		}
		catch(e) {
			type = null;
		}

		switch (type)
		{
			case 'object':
				aNewValue = uneval(aNewValue);
			case 'string':
				pref.setCharPref(aKey, unescape(encodeURIComponent(aNewValue)));
				break;
			case 'number':
				pref.setIntPref(aKey, parseInt(aNewValue));
				break;
			default:
				pref.setBoolPref(aKey, aNewValue);
				break;
		}
		return true;
	},
 
	getArrayPref : function(aKey) 
	{
		var value = this.getPref(aKey);
		var array = (value || '').split('|');
		if (array.length == 1 && !array[0]) {
			array = [];
		}
		return array.map(function(aItem) {
				return decodeURIComponent(aItem);
			});
	},
 
	setArrayPref : function(aKey, aValues) 
	{
		var encoded = aValues.map(function(aValue) {
				return encodeURIComponent(aValue);
			});
		this.setPref(aKey, encoded.join('|'));
		return aValues;
	},
 
	clearPref : function(aKey) 
	{
		try {
			this.Prefs.clearUserPref(aKey);
		}
		catch(e) {
		}
		return;
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

		this.initBarWithDelay();

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		var popup = this.popup;
		popup.addEventListener('dragenter', this, false);
		popup.addEventListener('dragexit', this, false);
		popup.addEventListener('dragover', this, false);
		popup.addEventListener('dragdrop', this, false);
		popup.addEventListener('popupshowing', this, false);
		popup.addEventListener('popuphiding', this, false);

		if (this.popupTypeDragdrop == this.DRAGDROP_MODE_DRAGOVER &&
			this.searchDNDObserver.isPlatformNotSupported)
			this.setPref('secondsearch.popup.type.dragdrop', this.DRAGDROP_MODE_DROP);
	},
  
	destroy : function() 
	{
		this.destroyBase();
	},
	 
	destroyBase : function() 
	{
		this.destroyBar();
		window.removeEventListener('unload', this, false);

		var popup = this.popup;
		popup.removeEventListener('dragenter', this, false);
		popup.removeEventListener('dragexit', this, false);
		popup.removeEventListener('dragover', this, false);
		popup.removeEventListener('dragdrop', this, false);
		popup.removeEventListener('popupshowing', this, false);
		popup.removeEventListener('popuphiding', this, false);

		this.searchDNDObserver.destroy();
		this.searchDNDObserver = null;

		window.getSecondSearch = null;
	}
   
}; 
  
