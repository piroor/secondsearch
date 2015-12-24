var EXPORTED_SYMBOLS = ['SecondSearchBase'];

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://secondsearch-modules/prefs.js');

function SecondSearchBase(aWindow) 
{
	this.window = aWindow;
}
SecondSearchBase.prototype = {
	active : true,
	domain : 'extensions.{0AE5CAA4-8BAB-11DB-AF59-ED4B56D89593}.secondsearch.',
	
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
 
/* preference values */ 
	
	get delay() 
	{
		var val = this.getPref(this.domain + 'popup.auto_show.delay');
		return Math.max(0, val);
	},
 
	get clearDelay() 
	{
		var val = this.getPref(this.domain + 'clear_after_search.delay');
		return Math.max(0, val);
	},
 
	get timeout() 
	{
		var val = this.getPref(this.domain + 'timeout');
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
		return this.getPref(this.domain + 'popup.type');
	},
 
	get popupTypeDragdrop() 
	{
		return this.getPref(this.domain + 'popup.type.dragdrop');
	},
 
	get popupTypeContext() 
	{
		return this.getPref(this.domain + 'popup.type.context');
	},
  
	get popupPosition() 
	{
		return this.getPref(this.domain + 'popup.position');
	},
 
	get autoShowInput() 
	{
		return this.getPref(this.domain + 'popup.auto_show');
	},
 
	get manualShowArrowKeys() 
	{
		return this.getPref(this.domain + 'popup.manual_show.arrowKeys');
	},
 
	get autoShowDragdropMode() 
	{
		return this.getPref(this.domain + 'popup.auto_show.dragdrop.mode');
	},
 
	get autoShowDragdropDelay() 
	{
		var val = this.getPref(this.domain + 'popup.auto_show.dragdrop.delay');
		return Math.max(0, val);
	},
 
	get handleDragdropOnlyOnButton() 
	{
		return this.getPref(this.domain + 'handle_dragdrop_only_on_button');
	},
  
/* elements */ 
	
	get document()
	{
		return this.window.document;
	},
 
	get browser() 
	{
		return this.window.gBrowser;
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
		var value = (box && bar && bar.getAttribute(this.emptyAttribute) != 'true') ? box.value : '' ;
		if (
			value &&
			this.autoFillEnabled &&
			this.textbox.controller.input && // ignore results stored in inactive autocomplete controller (for drag and drop)
			this.getPref(this.domain + 'ignoreAutoFillResult')
			) {
			value = this.textbox.controller.searchString || value;
		}
		return value;
	},
	
	get emptyAttribute() 
	{
		return this.isBrowser ? 'empty' : 'searchCriteria' ;
	},

	get autoFillEnabled() 
	{
		return this.autoFillOriginalState !== undefined ?
				this.autoFillOriginalState :
				this.textbox.completeDefaultIndex;
	},
  
	get popup() 
	{
		return this.document.getElementById('secondsearch_popup');
	},
 
	get popupDummy() 
	{
		return this.document.getElementById('secondsearch_popup_dummy');
	},
 
	get nativeSelectedItem() 
	{
		return null;
	},
 
	evaluateXPath : function SSB_evaluateXPath(aExpression, aContextNode, aType) 
	{
		aExpression  = aExpression || '';
		aContextNode = aContextNode || this.document.documentElement;

		const type       = aType || Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
		const resolver   = {
			lookupNamespaceURI : function(aPrefix)
			{
				return 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
			}
		};
		return (aContextNode.ownerDocument || aContextNode).evaluate(aExpression, aContextNode, resolver, type, null);
	},
  
/* UI */ 
	
	getCurrentItem : function SSB_getCurrentItem(aPopup, aDig) 
	{
		var popup = aPopup || this.popup;
		var active;
		var lastActive = null;
		while (popup)
		{
			active = this.evaluateXPath('child::*[@_moz-menuactive="true"]', popup, Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
			if (!active) return lastActive;
			if (active.localName == 'menuitem')
				return active;
			lastActive = active;
			if (!aDig || !active.firstChild.shown)
				return lastActive;
			popup = active.firstChild;
		}
	},
 
	showSecondSearch : function SSB_showSecondSearch(aReason, aX, aY, aEvent) 
	{
		var popup = this.popup;
		var pos = this.popupPosition;
		if (popup.shown) return;

		popup.shownBy = aReason;
		this.initPopup();

		var bar = this.searchbar;
		if (aReason == this.SHOWN_BY_CONTEXT) {
			this.document.popupNode = this.engineButton;
			if ('openPopupAtScreen' in popup)
				popup.openPopupAtScreen(aX, aY, true, aEvent);
			else
				popup.showPopup(
					bar,
					aX - this.document.documentElement.boxObject.screenX,
					aY - this.document.documentElement.boxObject.screenY,
					'menupopup',
					null,
					null
				);
		}
		else {
			this.showSecondSearchInternal(aEvent);
		}

		var current = this.getCurrentItem(popup);
		if (current) current.removeAttribute('_moz-menuactive');
	},
	canFitPopupToSearchField : true,
	correctingPopupPosition : false,
	correctingPopupPositionTimer : null,
	
	showSecondSearchInternal : function SSB_showSecondSearchInternal(aEvent) 
	{
		if (this.repositionController) {
			this.repositionController.cancel();
		}

		var popup = this.popup;
		var pos = this.popupPosition;
		var bar = this.searchbar;
		var self = this;

		// Don't override document.popupNode, because it blocks the context menu on the content area!
		// this.document.popupNode = bar;

		var anchorNode = this.canFitPopupToSearchField ? bar : this.engineButton ;
		var anchorBox = anchorNode.boxObject;
		var rootBox = this.document.documentElement.boxObject;
		var popupStatus = 'position:'+pos+'\n'+this.getPopupStatus(popup, true);
		if (
			popup[this.kLAST_STATUS] == popupStatus &&
			popup[this.kLAST_X] !== void(0) &&
			popup[this.kLAST_Y] !== void(0) &&
			popup[this.kLAST_ANCHOR_X] == anchorBox.screenX &&
			popup[this.kLAST_ANCHOR_Y] == anchorBox.screenY
			) {
			// Popup must be opened as a context menu,
			// because non-context menu popup hides the caret
			// in the textbox of the search bar.
			// ref: http://mxr.mozilla.org/mozilla-central/ident?i=MustDrawCaret
			//      http://mxr.mozilla.org/mozilla-central/ident?i=IsMenuPopupHidingCaret
			popup.openPopupAtScreen(popup[this.kLAST_X], popup[this.kLAST_Y], true, aEvent);
			return;
		}

		popup[this.kLAST_STATUS] = popupStatus;
		popup[this.kLAST_ANCHOR_X] = anchorBox.screenX;
		popup[this.kLAST_ANCHOR_Y] = anchorBox.screenY;

		this.repositionController = this.createRepositionController();
		this.repositionController.next();
	},
	repositionController : null,
	
	createRepositionController : function SSB_createRepositionController() 
	{
		var pos = this.popupPosition;
		var position = pos == 0 ? 'before_start' : 'after_start';
		var anchorNode = this.canFitPopupToSearchField ? this.searchbar : this.engineButton ;
		var popup = this.popup;
		var dummy = this.popupDummy;

		var delta = 8;
		var anchorBox = anchorNode.boxObject;
		var rootBox = this.document.documentElement.boxObject;

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

				var range = this.owner.document.createRange();
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
  
	kLAST_X        : '__secondsearch__framework__lastX', 
	kLAST_Y        : '__secondsearch__framework__lastY',
	kLAST_ANCHOR_X : '__secondsearch__framework__lastAnchorX',
	kLAST_ANCHOR_Y : '__secondsearch__framework__lastAnchorY',
	kLAST_STATUS   : '__secondsearch__framework__lastStatus',
	getPopupStatus : function SSB_getPopupStatus(aPopupOrItemsArray, aIgnoreOrder)
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
 
	destroyDummy : function SSB_destroyDummy() 
	{
		var popup = this.popupDummy;
		popup.hidePopup();
		var range = this.document.createRange();
		range.selectNodeContents(popup);
		range.deleteContents();
		range.detach();
	},
 
	get popupHeight() 
	{
		return this.popup.childNodes.length;
	},
  
	hideSecondSearch : function SSB_hideSecondSearch(aWithDelay) 
	{
		if (aWithDelay) {
			this.window.setTimeout(function(aSelf) {
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
		this.revertAutoFill();
	},
 
	operateSecondSearch : function SSB_operateSecondSearch(aEvent) 
	{
		this.log('operateSecondSearch');
try{
		if (!this.canOperate(aEvent)) {
			this.log(' => cannot operate.');
			return true;
		}

		var popup = this.popup;
		if (
			popup.shown &&
			(
				aEvent.keyCode == aEvent.DOM_VK_ENTER ||
				aEvent.keyCode == aEvent.DOM_VK_RETURN
			)
			) {
			let bar = this.searchbar;

			let current = this.getCurrentItem(popup, true);
			if (current && current.localName == 'menu') {
				if (current.firstChild.shown)
					current = this.getCurrentItem(current.firstChild, true);
				else
					current = null;
			}
			this.log('  current item: '+current);
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

		switch(aEvent.keyCode)
		{
			case aEvent.DOM_VK_DELETE:
			case aEvent.DOM_VK_BACK_SPACE:
				if (popup.shown) {
					if (!this.searchterm) {
						this.hideSecondSearch();
						aEvent.stopPropagation();
						aEvent.preventDefault();
						return false;
					}
				}
			default:
				let popups = popup.getElementsByTagName('menupopup');
				for (let i = popups.length-1; i > -1; i--)
				{
					popups[i].hidePopup();
				}
				return true;

			case aEvent.DOM_VK_ESCAPE:
				this.hideSecondSearch();
				aEvent.stopPropagation();
				aEvent.preventDefault();
				if (this.autoShowTimer) {
					this.window.clearTimeout(this.autoShowTimer);
					this.autoShowTimer = null;
				}
				return false;


			case aEvent.DOM_VK_UP:
			case aEvent.DOM_VK_DOWN:
				return this.handleUpDownKey(aEvent);

			case aEvent.DOM_VK_RIGHT:
				return this.handleRightKey(aEvent);

			case aEvent.DOM_VK_LEFT:
				return this.handleLeftKey(aEvent);
		}
}
catch(e) {
	dump(e+'\n');
}
	},
	handleUpDownKey : function SSB_handleUpDownKey(aEvent)
	{
		var isUpKey = aEvent.keyCode == aEvent.DOM_VK_UP;
		var popup = this.popup;
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

			let current = isUpKey ? this.getLastItem(popup) : this.getFirstItem(popup) ;
			if (current) {
				current.setAttribute('_moz-menuactive', true);
				this.disableAutoFill();
			}

			aEvent.stopPropagation();
			aEvent.preventDefault();
			return false;
		}
		if (this.autoHideTimer) {
			this.window.clearTimeout(this.autoHideTimer);
			this.autoHideTimer = null;
		}

		let current = this.getCurrentItem(popup, true);
		if (current) {
			current.removeAttribute('_moz-menuactive');
			current = this.getNextOrPrevItem(current, (isUpKey ? -1 : 1 ), current.parentNode != popup);
		}
		else {
			let shifted = aEvent.shiftKey && (this.manualShowArrowKeys & this.ARROWKEYS_SHIFTED);
			current = isUpKey ?
				 this.getLastItem(popup) :
				 ((shifted || this.popupPosition == 1) ? this.getFirstItem(popup) : null );
		}
		if (current) {
			current.setAttribute('_moz-menuactive', true);
			this.disableAutoFill();
		}
		else {
			this.revertAutoFill();
			return true;
		}

		// Autocomplete popup grabs user key inputs, so it must be closed while Second Search handles key events
		try {
			this.textbox.popup.hidePopup();

			// on Firefox 35, "one off search" button having "selected" attribute is unexpectedly detected as the selected engine even if the popup is closed.
			let selectedItem = this.nativeSelectedItem;
			if (selectedItem)
				selectedItem.removeAttribute('selected');
		}
		catch(e) {
		}

		aEvent.stopPropagation();
		aEvent.preventDefault();
		return false;
	},
	handleRightKey : function SSB_handleRightKey(aEvent)
	{
		var popup = this.popup;
		if (!popup.shown)
			return true;

		let current = this.getCurrentItem(popup, true);
		if (!current || current.localName != 'menu')
			return true;

		let subMenuPopup = current.firstChild;
		subMenuPopup.showPopup();
		subMenuPopup.shown = true;
		let currentInSubmenu = this.getCurrentItem(subMenuPopup);
		if (currentInSubmenu)
			currentInSubmenu.removeAttribute('_moz-menuactive');
		if (subMenuPopup.hasChildNodes()) {
			subMenuPopup.firstChild.setAttribute('_moz-menuactive', true);
			this.disableAutoFill();
		}
		else {
			this.revertAutoFill();
		}
		aEvent.stopPropagation();
		aEvent.preventDefault();
		return false;
	},
	handleLeftKey : function SSB_handleLeftKey(aEvent)
	{
		var popup = this.popup;
		if (!popup.shown)
			return true;

		var current = this.getCurrentItem(popup, true);
		if (!current || current.parentNode == popup)
			return true;

		current.removeAttribute('_moz-menuactive');
		current.parentNode.hidePopup();
		current.parentNode.shown = false;
		this.window.setTimeout(function(aMenu, aSelf) { // on Firefox 3, the parent "menu" element lose its focus after the submenu popup was hidden.
			aMenu.setAttribute('_moz-menuactive', true);
			aSelf.disableAutoFill();
		}, 0, current.parentNode.parentNode, this);
		aEvent.stopPropagation();
		aEvent.preventDefault();
		return false;
	},
	
	canOperate : function SSB_canOperate(aEvent) 
	{
		return true;
	},
 
	onOperationEnterPre : function SSB_onOperationEnterPre(aEvent) 
	{
	},
 
	onOperationEnter : function SSB_onOperationEnter(aCurrentItem, aEvent) 
	{
	},
 
	getNextOrPrevItem : function SSB_getNextOrPrevItem(aCurrent, aDir, aCycle) 
	{
		var node;
		try {
			var condition = '(local-name() = "menu" or local-name() = "menuitem") and (not(@collapsed) or not(@collapsed="true")) and (not(@hidden) or not(@hidden="true"))';
			var axis = (aDir > 0) ? 'following-sibling' : 'preceding-sibling' ;
			node = this.evaluateXPath(
				axis+'::*['+condition+'][1]',
				aCurrent,
				Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE
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
 
	getFirstItem : function SSB_getFirstItem(aPopup) 
	{
		return this.getNextOrPrevItem(aPopup.lastChild, 1, true);
	},
 
	getLastItem : function SSB_getLastItem(aPopup) 
	{
		return this.getNextOrPrevItem(aPopup.firstChild, -1, true);
	},
  
	clearTextBox : function SSB_clearTextBox() 
	{
		if (
			!this.textbox.value ||
			this.searchbar.getAttribute(this.emptyAttribute) == 'true'
			)
			return;

		this.textbox.value = '';
		this.initEmptySearchBar();
	},
	
	initEmptySearchBar : function SSB_initEmptySearchBar() 
	{
	},
  
	clearAfterSearch : function SSB_clearAfterSearch() 
	{
		if (!this.canClearAfterSearch ||
			!this.getPref(this.domain + 'clear_after_search'))
			return;

		this.stopClearAfterSearch();

		this.clearAfterSearchTimer = this.window.setTimeout(function(aSelf) {
			aSelf.clearTextBox();
			aSelf.clearAfterSearchTimer = null;
		}, this.clearDelay, this);
	},
	stopClearAfterSearch : function SSB_stopClearAfterSearch()
	{
		if (this.clearAfterSearchTimer)
			this.window.clearTimeout(this.clearAfterSearchTimer);
	},
	clearAfterSearchTimer : null,
	canClearAfterSearch : true,
 
	// because browser.urlbar.autoFill automatically runs search from C++
	// components, we have to disable it to provide custom search behavior.
	disableAutoFill : function SSB_disableAutoFill() 
	{
		if (this.textbox.completeDefaultIndex) {
			if (this.autoFillOriginalState === undefined)
				this.autoFillOriginalState = this.textbox.completeDefaultIndex;
			this.textbox.completeDefaultIndex = false;
		}
	},
 
	revertAutoFill : function SSB_revertAutoFill() 
	{
		if (this.autoFillOriginalState !== undefined) {
			this.textbox.completeDefaultIndex = this.autoFillOriginalState;
			delete this.autoFillOriginalState;
		}
	},
 	 
/* update searchbar */ 
	
	initBar : function SSB_initBar() 
	{
		this.initBarBase();
	},
	
	initBarBase : function SSB_initBarBase() 
	{
		var search = this.searchbar;
		var textbox = this.textbox;
		if (!search || search.secondsearchInitialized || !textbox)
			return false;

		search.secondsearchInitialized = true;

		textbox.addEventListener('input',    this, true);
		textbox.addEventListener('keydown',  this, true);
		textbox.addEventListener('blur',     this, false);
		textbox.addEventListener('focus',    this, true);

		search.addEventListener('dragenter', this, false);
		search.addEventListener('dragover',  this, false);

		this.popup.addEventListener('click',     this, true);
		this.popup.addEventListener('dragenter', this, false);
		this.popup.addEventListener('dragover',  this, false);
		this.popup.addEventListener('dragleave', this, false);
		this.popup.addEventListener('drop',      this, false);

		search.addEventListener('dragleave', this, false);
		search.addEventListener('drop',      this, true);

		textbox.addEventListener('drop', this, true);

		this.window.addEventListener('focus', this.focusEventListener, true);
		this.window.addEventListener('blur',  this.focusEventListener, true);
		this.window.addEventListener('click', this.focusEventListener, true);

		return true;
	},
	initBarWithDelay : function SSB_initBarWithDelay()
	{
		// initialize with delay for other addons modifying "doSearch" method (ex. Tab Mix Plus)
		this.window.setTimeout(function(aSelf) {
			aSelf.initBar();
		}, 100, this);
	},
  
	destroyBar : function SSB_destroyBar(aBar) 
	{
		this.destroyBarBase(aBar);
	},
	
	destroyBarBase : function SSB_destroyBarBase(aBar) 
	{
		var search = this.searchbar;
		var textbox = this.textbox;
		if (!search || !search.secondsearchInitialized || !textbox)
			return false;

		search.secondsearchInitialized = false;

		var textbox = this.textbox;
		textbox.removeEventListener('input',    this, true);
		textbox.removeEventListener('keydown',  this, true);
		textbox.removeEventListener('blur',     this, false);
		textbox.removeEventListener('focus',    this, true);

		search.removeEventListener('dragenter', this, false);
		search.removeEventListener('dragover',  this, false);

		this.popup.removeEventListener('click',     this, true);
		this.popup.removeEventListener('dragenter', this, false);
		this.popup.removeEventListener('dragover',  this, false);
		this.popup.removeEventListener('dragleave', this, false);
		this.popup.removeEventListener('drop',      this, false);

		search.removeEventListener('dragleave', this, false);
		search.removeEventListener('drop',      this, true);

		textbox.removeEventListener('drop', this, true);

		this.window.removeEventListener('focus', this.focusEventListener, true);
		this.window.removeEventListener('blur',  this.focusEventListener, true);
		this.window.removeEventListener('click', this.focusEventListener, true);

		this.focusEventListener.destroy();
		this.focusEventListener = null;

		return true;
	},
   
/* event handlers */ 
	
	handleEvent : function SSB_handleEvent(aEvent) 
	{
		return this.handleEventBase(aEvent);
	},
 
	handleEventBase : function SSB_handleEventBase(aEvent) 
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
				if (!this.active)
					return;
				this.stopClearAfterSearch();
				this.onInput(aEvent);
				break;

			case 'keydown':
				if (!this.active)
					return;
				this.operateSecondSearch(aEvent);
				break;

			case 'blur':
				this.hideSecondSearch();
				break;

			case 'command':
				if (!this.active)
					return;
				this.onCommand(aEvent);
				break;


			case 'dragenter':
			case 'dragover':
			case 'dragleave':
			case 'drop':
				if (!this.active)
					return;
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
					case 'dragenter': return this.searchDNDObserver.onDragEnter(aEvent);
					case 'dragover':  return this.searchDNDObserver.onDragOver(aEvent);
					case 'dragleave': return this.searchDNDObserver.onDragLeave(aEvent);
					case 'drop':      return this.searchDNDObserver.onDrop(aEvent);
				}
				break;

			case 'contextmenu':
				if (!this.active)
					return;
				this.window.setTimeout(function(aSelf, aX, aY) {
					aSelf.showSecondSearch(aSelf.SHOWN_BY_CONTEXT, aX, aY, aEvent);
				}, 0, this, aEvent.screenX, aEvent.screenY);
				aEvent.preventDefault();
				aEvent.stopPropagation();
				break;

			case 'click':
			case 'focus':
				if (!this.active)
					return;
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
 
	onCommand : function SSB_onCommand(aEvent) 
	{
	},
 
	onInput : function SSB_onInput(aEvent) 
	{
		this.revertAutoFill();

		var popup = this.popup;
		if (popup.shown) {
				var current = this.getCurrentItem(popup);
				if (current)
					current.removeAttribute('_moz-menuactive');
		}
		if (this.autoHideTimer) {
			this.window.clearTimeout(this.autoHideTimer);
			this.autoHideTimer = null;
		}

		if (this.searchterm &&
			this.autoShowInput) {
			var delay = this.delay;
			if (delay) {
				if (this.autoShowTimer) this.window.clearTimeout(this.autoShowTimer);
				this.autoShowTimer = this.window.setTimeout(function(aSelf) {
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
	showPopupOnInput : function SSB_showPopupOnInput()
	{
		if (!this.searchterm) return;
		this.showSecondSearch(this.SHOWN_BY_INPUT);
		this.autoHideTimer = this.window.setTimeout(function(aSelf) {
			aSelf.hideSecondSearch();
		}, this.timeout, this);
		this.autoShowTimer = null;
	},
	autoShowTimer : null,
	autoHideTimer : null,
 
	onPopupShowing : function SSB_onPopupShowing(aEvent) 
	{
		aEvent.target.shown = true;

//		if (aEvent.target.popupBoxObject &&
//			'setConsumeRollupEvent' in aEvent.target.popupBoxObject)
//			aEvent.target.popupBoxObject.setConsumeRollupEvent(aEvent.target.popupBoxObject.ROLLUP_NO_CONSUME);

		if (aEvent.target != this.popup) return;

		if (this.correctingPopupPosition) return;
		var popup = this.popup;
		popup.shown = true;
//		this.initPopup(); // do it before popupshowing! (see "showSecondSearch()")
	},
	
	initPopup : function SSB_initPopup() 
	{
		dump('base-popup\n');
	},
  
	onPopupHiding : function SSB_onPopupHiding(aEvent) 
	{
		aEvent.target.shown = false;
		var current = this.getCurrentItem(aEvent.target);
		if (current) current.removeAttribute('_moz-menuactive');
		if (aEvent.target != this.popup)
			return;

		this.revertAutoFill();

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

		this.window.setTimeout(function(aSelf) {
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
	
	destroyPopup : function SSB_destroyPopup() 
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
					if (node.ownerDocument == this.owner.document) {
						while (node.parentNode)
						{
							if (node == this.owner.textbox || node == this.owner.popup)
								return;
							node = node.parentNode;
						}
					}

					this.owner.window.setTimeout(function(aOwner) {
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
	
	onSearchTermDrop : function SSB_onSearchTermDrop(aEvent) 
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
 
	get currentDragSession() 
	{
		return Components.classes['@mozilla.org/widget/dragservice;1']
				.getService(Ci.nsIDragService)
				.getCurrentSession();
	},
 
	getDroppedText : function SSB_getDroppedText(aEvent) 
	{
		return (
				aEvent.dataTransfer.getData('text/unicode') ||
				aEvent.dataTransfer.getData('text/x-moz-text-internal')
				).replace(/[\r\n]/g, '').replace(/[\s]+/g, ' ');
	},
 
	isDragFromTextbox : function SSB_isDragFromTextbox() 
	{
		return this.evaluateXPath(
				'ancestor-or-self::*[local-name()="input"]',
				this.currentDragSession.sourceNode,
				Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE
			).singleNodeValue == this.textbox.inputField
	},
 
	isEventFiredOnTextbox : function SSB_isEventFiredOnTextbox(aEvent) 
	{
		return this.evaluateXPath(
				'ancestor-or-self::*[local-name()="input"]',
				aEvent.originalTarget,
				Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE
			).singleNodeValue == this.textbox.inputField;
	},
 
	isEventFiredOnAutoRepeatButton : function SSB_isEventFiredOnAutoRepeatButton(aEvent) 
	{
		return this.evaluateXPath(
				'ancestor-or-self::*[local-name()="autorepeatbutton"]',
				aEvent.originalTarget,
				Ci.nsIDOMXPathResult.BOOLEAN_TYPE
			).booleanValue;
	},
 
	isEventFiredOnMyPopup : function SSB_isEventFiredOnMyPopup(aEvent) 
	{
		return this.evaluateXPath(
				'ancestor-or-self::*[local-name()="menupopup"][contains(@class, "secondsearch-popup")]',
				aEvent.originalTarget,
				Ci.nsIDOMXPathResult.BOOLEAN_TYPE
			).booleanValue;
	},
 
	createSearchDNDObserver : function SSB_createSearchDNDObserver() 
	{
		return ({

		owner : this,
		showTimer : -1,
		hideTimer : -1,
	
		isDroppableData : function SSSearchDNDObserver_isDroppableData(aEvent) 
		{
			var dt = aEvent.dataTransfer;
			if (
				dt &&
				(
					dt.types.contains('text/unicode') ||
					dt.types.contains('text/plain') ||
					dt.types.contains('text/x-moz-text-internal')
				)
				) {
				dt.effectAllowed = dt.dropEffect = 'copy';
				this.owner.currentDragSession.canDrop = true;
				return true;
			}
			return false;
		},
 
		onDragEnter : function SSSearchDNDObserver_onDragEnter(aEvent) 
		{
			if (
				!this.isDroppableData(aEvent) ||
				this.owner.autoShowDragdropMode != this.owner.DRAGDROP_MODE_DRAGOVER
				)
				return;

			if (aEvent.target.localName == 'menuitem' ||
				aEvent.target.localName == 'menu') {
				aEvent.target.setAttribute('_moz-menuactive', true);
			}

			if (!this.owner.currentDragSession.canDrop)
				return;

			var popup = this.getPopup(aEvent);
			var now = Date.now();

			this.owner.window.setTimeout(function(aSelf) { // do after dragleave
				if (popup.hideTimer) {
					aSelf.owner.window.clearTimeout(popup.hideTimer);
					popup.hideTimer = null;
				}
				aSelf.owner.window.clearTimeout(popup.showTimer);
				if (aEvent.target == aSelf.owner.currentDragSession.sourceNode) return;
				popup.showTimer = aSelf.owner.window.setTimeout(function(aOwner) {
					if (popup == aOwner.popup)
						aOwner.showSecondSearch(aOwner.SHOWN_BY_DRAGOVER);
					else {
						popup.showPopup();
						popup.shown = true;
					}
				}, aSelf.owner.autoShowDragdropDelay, aSelf.owner);
				aSelf.showTimer = now;
			}, 0, this);
		},
 
		onDragLeave : function SSSearchDNDObserver_onDragLeave(aEvent) 
		{
			if (this.owner.autoShowDragdropMode != this.owner.DRAGDROP_MODE_DRAGOVER)
				return;

			if (aEvent.target.localName == 'menuitem' ||
				aEvent.target.localName == 'menu') {
				aEvent.target.removeAttribute('_moz-menuactive');
			}

			var popup = this.getPopup(aEvent);
			var now = Date.now();

			this.owner.window.clearTimeout(popup.hideTimer);
			popup.hideTimer = this.owner.window.setTimeout(function(aSelf) {
				if (aSelf.showTimer > aSelf.hideTimer) return;
				if (popup == aSelf.owner.popup)
					aSelf.owner.hideSecondSearch();
				else {
					popup.hidePopup();
					popup.shown = false;
				}
			}, this.owner.autoShowDragdropDelay, this);
			this.hideTimer = now;
		},
 
		onDragOver : function SSSearchDNDObserver_onDragOver(aEvent) 
		{
			var ss = this.owner;
			if (!this.isDroppableData(aEvent))
				return;

			if (ss.isEventFiredOnAutoRepeatButton(aEvent)) {
				let event = this.owner.document.createEvent('XULCommandEvents');
				event.initCommandEvent('command', true, true, aEvent.view, 0, aEvent.ctrlKey, aEvent.altKey, aEvent.shiftKey, aEvent.metaKey, aEvent);
				aEvent.originalTarget.dispatchEvent(event);
				return;
			}
		},
 
		getPopup : function SSSearchDNDObserver_getPopup(aEvent) 
		{
			var node = aEvent.target;
			if (node.localName == 'menu')
				return node.firstChild;
			else if (node.localName == 'menuitem')
				return node.parentNode;
			return this.owner.popup;
		},
 
		onDrop : function SSSearchDNDObserver_onDrop(aEvent) 
		{
			var ss = this.owner;
			if (
				aEvent.currentTarget == ss.textbox ||
				ss.isEventFiredOnTextbox(aEvent)
				) {
				if (
					ss.autoShowDragdropMode == ss.DRAGDROP_MODE_NONE ||
					(
						ss.handleDragdropOnlyOnButton &&
						ss.isDragFromTextbox()
					)
					) {
					// cancel search behavior but do drop behavior of the textbox
					aEvent.stopPropagation();
				}
				else if (ss.autoShowDragdropMode == ss.DRAGDROP_MODE_DROP) {
					ss.textbox.value = ss.getDroppedText(aEvent);
					ss.showSecondSearch(ss.SHOWN_BY_DROP);
					aEvent.preventDefault();
					aEvent.stopPropagation();
					return; // don't do "search on drop"
				}
				else { // do search
					// cancel drop behavior of the textbox but do search
					aEvent.preventDefault();
				}
				if (aEvent.currentTarget == ss.textbox)
					return;
			}

			var bar = ss.searchbar;
			bar.removeAttribute(ss.emptyAttribute);

			var textbox = ss.textbox;
			textbox.value = ss.getDroppedText(aEvent);
			ss.onSearchTermDrop(aEvent);
			ss.clearAfterSearch();
			this.owner.window.setTimeout(function() {
				ss.hideSecondSearch();
				textbox.blur();
			}, 0);

			aEvent.stopPropagation();
			aEvent.preventDefault();
		},
 
		destroy : function SSSearchDNDObserver_destroy() 
		{
			this.owner = null;
		}
 
		}); 
	},
   
/* prefs */ 
	
	getPref : function SSB_getPref(aKey) 
	{
		return prefs.getPref(aKey);
	},
	setPref : function SSB_setPref(aKey, aNewValue) 
	{
		return prefs.setPref(aKey, aNewValue);
	},
 
	getArrayPref : function SSB_getArrayPref(aKey) 
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
 
	setArrayPref : function SSB_setArrayPref(aKey, aValues) 
	{
		var encoded = aValues.map(function(aValue) {
				return encodeURIComponent(aValue);
			});
		this.setPref(aKey, encoded.join('|'));
		return aValues;
	},
 
	clearPref : function SSB_clearPref(aKey) 
	{
		return prefs.clearPref(aKey);
	},
	addPrefListener : function SSB_addPrefListener(aObserver) 
	{
		return prefs.addPrefListener(aObserver);
	},
	removePrefListener : function SSB_removePrefListener(aObserver) 
	{
		return prefs.removePrefListener(aObserver);
	},

	migratePrefs : function SSB_migratePrefs()
	{
		prefs.getDescendant('secondsearch.').forEach(function(aKey) {
			var newKey = aKey.replace('secondsearch.', this.domain);
			prefs.setPref(newKey, prefs.getPref(aKey));
			prefs.clearPref(aKey);
		}, this);
	},
 
	log : function SSB_log(aMessage)
	{
		if (this.getPref(this.domain + 'debug'))
			dump(aMessage+'\n');
	},
  
/* initializing */ 
	
	init : function SSB_init() 
	{
		this.initBase();
	},
	
	initBase : function SSB_initBase() 
	{
		this.migratePrefs();

		this.initBarWithDelay();

		this.window.removeEventListener('load', this, false);
		this.window.addEventListener('unload', this, false);

		var popup = this.popup;
		popup.addEventListener('dragenter', this, false);
		popup.addEventListener('dragexit', this, false);
		popup.addEventListener('dragover', this, false);
		popup.addEventListener('dragdrop', this, false);
		popup.addEventListener('popupshowing', this, false);
		popup.addEventListener('popuphiding', this, false);

		if (this.popupTypeDragdrop == this.DRAGDROP_MODE_DRAGOVER)
			this.setPref(this.domain + 'popup.type.dragdrop', this.DRAGDROP_MODE_DROP);
	},
  
	destroy : function SSB_destroy() 
	{
		this.destroyBase();
	},
	
	destroyBase : function SSB_destroyBase() 
	{
		this.destroyBar();
		this.window.removeEventListener('unload', this, false);

		var popup = this.popup;
		popup.removeEventListener('dragenter', this, false);
		popup.removeEventListener('dragexit', this, false);
		popup.removeEventListener('dragover', this, false);
		popup.removeEventListener('dragdrop', this, false);
		popup.removeEventListener('popupshowing', this, false);
		popup.removeEventListener('popuphiding', this, false);

		this.searchDNDObserver.destroy();
		this.searchDNDObserver = null;

		this.window.getSecondSearch = null;
	}
   
}; 
  
