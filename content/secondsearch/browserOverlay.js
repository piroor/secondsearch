var SecondSearchWindowHelper = {
	services : {},

	preInit : function SSWH_preInit()
	{
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

	initBar : function SSWH_initBar(aService)
	{
		var search = aService.searchbar;
		var textbox = aService.textbox;
		var accessor = 'window.SecondSearchWindowHelper.services.' + aService.name;

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
					'$& ' + accessor + '.readyToSearch();'
				).replace(
					/(\}\)?)$/,
					accessor + '.searchDone(); $1'
				));
				search.__secondsearch__doSearch = search.doSearch;
				search.doSearch = aService.doSearchbarSearch.bind(aService);
				search._popup.addEventListener('command', aService, true);
			}

			// old Tab Mix Plus, only Firefox 2?
			if ('handleSearchCommand' in search &&
				'TMP_SearchLoadURL' in window && !window.__secondsearch__TMP_SearchLoadURL) {
				window.__secondsearch__TMP_SearchLoadURL = window.TMP_SearchLoadURL;
				eval('window.TMP_SearchLoadURL = '+window.TMP_SearchLoadURL.toSource().replace(
					'var submission = searchbar.currentEngine',
					'var overrideEngine = null;' +
					'if (' + accessor + '.selectedEngine) {' +
					'  overrideEngine = ' + accessor + '.getSearchEngineFromName(' + accessor + '.selectedEngine.name);' +
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
					'  var ss = ' + accessor + ';' +
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
		var subject = window.SecondSearchWindowHelper.services[searchBar.name];
		if (subject.checkToDoSearch.apply(subject, aArgs))
			return;
		return window.__secondsearch__original_openUILinkIn.apply(this, aArgs);
	};
}, false);
 
})();
