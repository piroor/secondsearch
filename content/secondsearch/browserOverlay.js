var SecondSearchWindowHelper = {
	services : {},

	preInit : function SSWH_preInit()
	{
	},

	initBar : function SSWH_initBar(aService)
	{
		var search = aService.searchbar;
		var textbox = aService.textbox;
		var service = window.SecondSearchWindowHelper.services[aService.name];
		var accessor = 'window.SecondSearchWindowHelper.services.' + aService.name;

		if (search.localName == 'searchbar') { // search bar
			if ('handleSearchCommand' in search && !search.__secondsearch__doSearch) {
				search.__secondsearch__original_doSearch = search.doSearch;
				search.__secondsearch__doSearch = function(...aArgs) {
					try {
					service.readyToSearch('searchbar.doSearch');
					var retVal = search.__secondsearch__original_doSearch(...aArgs);
					}
					catch(e) {
						Components.utils.reportError(e);
					}
					service.searchDone('searchbar.doSearch');
					return retVal;
				};
				search.doSearch = aService.doSearchbarSearch.bind(aService);
				(search._popup || search._textbox.popup).addEventListener('command', aService, true);
			}
		}
		else { // location bar
			if (textbox.onDrop &&
				!textbox.__secondsearch__updated) {
				textbox.__secondsearch__onDrop = textbox.onDrop;
				textbox.onDrop = function(...aArgs) {
					service.droppedURI = null;
					this.__secondsearch__showSecondSearch = false;

					var hasDroppedText = aArgs.length <= 1 ?
							service.getDroppedText(aEvent) :
							aXferData.flavour.contentType == "text/unicode" ;
					if (hasDroppedText &&
						service.autoShowDragdropMode == service.DRAGDROP_MODE_DROP) {
						this.__secondsearch__showSecondSearch = (service.searchbar == this);
					}

					this.__secondsearch__commandHandled = null;
					var retVal = this.__secondsearch__onDrop(...aArgs);

					if (!this.__secondsearch__commandHandled &&
						this.__secondsearch__showSecondSearch) {
						service.showSecondSearch(service.SHOWN_BY_DROP);
					}

					this.__secondsearch__commandHandled = null;
					this.__secondsearch__showSecondSearch = false;
					return retVal;
				};

				textbox.__secondsearch__handleCommand = textbox.handleCommand;
				textbox.handleCommand = function(...aArgs) {
					this.__secondsearch__commandHandled = Date.now();
					if (this.__secondsearch__showSecondSearch) {
						service.droppedURI = this.value;
						return undefined;
					}
					else {
						return this.__secondsearch__handleCommand(...aArgs);
					}
				};

				textbox.__secondsearch__updated = true;
			}
		}
	}
};

(function() {
var { SecondSearchSearchbar, SecondSearchLocationbar } = Cu.import('resource://secondsearch-modules/browser.js', {});

var searchBar = new SecondSearchSearchbar(window);
var locationBar = new SecondSearchLocationbar(window);

// for backward compatibility
window.SecondSearch = searchBar;
// for backward compatibility
window.getSecondSearch = function() {
	return searchBar;
};

window.addEventListener('load', function onLoad() {
	window.removeEventListener('load', onLoad, false);

	window.__secondsearch__original_openUILinkIn = window.openUILinkIn;
	window.openUILinkIn = function(...aArgs) {
		var service = window.SecondSearchWindowHelper.services[searchBar.name];
		if (service.checkToDoSearch(aArgs))
			return;
		return window.__secondsearch__original_openUILinkIn(...aArgs);
	};
}, false);
 
})();
