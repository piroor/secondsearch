function SecondSearchMail() 
{
}
SecondSearchMail.prototype = {
	 
/* elements */ 
	
	get searchbar() 
	{
		return document.getElementById('searchInput');
	},
 
	get textbox() 
	{
		return document.getElementById('searchInput');
	},
  
/* UI */ 
	 
	initEmptySearchBar : function() 
	{
		if ('setSearchCriteriaText' in this.textbox)
			this.textbox.setSearchCriteriaText();
	},
 
	initPopup : function() 
	{
		var nodes = this.popup.getElementsByAttribute('checked', 'true');
		if (nodes.length)
			nodes[0].removeAttribute('checked');

		nodes = this.popup.getElementsByAttribute('value', this.searchbar.searchMode);
		if (nodes.length)
			nodes[0].setAttribute('checked', true);
	},
  
/* update searchbar */ 
	 
	initBar : function() 
	{
		if (!this.initBarBase()) return;

		var search = this.searchbar;
		var textbox = this.textbox;

		var popup = this.popup;
		if (popup.hasChildNodes()) return;

		var source = document.getElementById('quick-search-menupopup');
		var items = source.childNodes;
		for (var i = 0, maxi = items.length; i < maxi; i++)
		{
			if (items[i].getAttribute('type') != 'radio') break;
			popup.appendChild(items[i].cloneNode(true));
			popup.lastChild.setAttribute('name', 'secondsearch-popup-radiogroup');
		}
	},
  
/* event handlers */ 
	 
	onSearchTermDrop : function(aEvent) 
	{
		if (aEvent.target.localName == 'menuitem') {
			if (this.searchterm) this.searchbar.clearButtonHidden = false;
			changeQuickSearchMode(aEvent.target);
		}
	},
 	
	onOperationEnter : function(aCurrentItem, aEvent) 
	{
		changeQuickSearchMode(aCurrentItem);
	},
  
/* initializing */ 
	 
	init : function() 
	{
		this.initBase();

		window.__secondsearch__CustomizeMailToolbar = window.CustomizeMailToolbar;
		window.CustomizeMailToolbar = function(aId) {
			window.getSecondSearch().destroyBar();
			window.__secondsearch__CustomizeMailToolbar.call(window, aId);
		};

		var toolbox = document.getElementById('mail-toolbox');
		if (toolbox.customizeDone) {
			toolbox.__secondsearch__customizeDone = toolbox.customizeDone;
			toolbox.customizeDone = function(aChanged) {
				this.__secondsearch__customizeDone(aChanged);
				window.getSecondSearch().initBarWithDelay();
			};
		}
		if ('MailToolboxCustomizeDone' in window) {
			window.__secondsearch__MailToolboxCustomizeDone = window.MailToolboxCustomizeDone;
			window.MailToolboxCustomizeDone = function(aChanged) {
				window.__secondsearch__MailToolboxCustomizeDone.apply(window, arguments);
				window.getSecondSearch().initBarWithDelay();
			};
		}
	}
  
}; 
  
SecondSearchMail.prototype.__proto__ = SecondSearchBase.prototype; 
var SecondSearch = new SecondSearchMail();

window.addEventListener('load', SecondSearch, false);
 
