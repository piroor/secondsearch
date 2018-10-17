# History

 - master/HEAD
   * Support Firefox's search engines. (You need to activate the feature manually on Firefox 63 and later.)
   * The keyboard shortcut is now deassignable by hitting the Escape key on its input field.
   * Drop support for Firefox 59 and older.
 - 2.1.9 (2018.5.30)
   * Add ability to switch color scheme to Dark theme.
   * Encode search terms before send.
 - 2.1.8 (2018.5.15)
   * Ignore keyboard events while composition via IME.
 - 2.1.7 (2018.5.14)
   * Handle keyrepeat of arrow keys to select search engines.
 - 2.1.6 (2018.3.7)
   * Clear focus of search engine by hovering on the search field. This makes it easy to search pasted text by the default search engine.
   * Restore last input of the search field when a search action is aborted and the panel is reopened.
 - 2.1.5 (2018.2.11)
   * Allow to unfocus from all search engines by keyboard operation.
   * Keyboard shortcut is now customizable on Firefox 60 and later.
 - 2.1.4 (2018.2.9)
   * Synchronize configurations via Firefox Sync.
   * Reformat keys of localized messages matching to the [spec](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/i18n/Locale-Specific_Message_reference#Member_details).
 - 2.1.3 (2018.2.8)
   * Clear focus on search engine by starting input.
   * Clear last search term with delay.
 - 2.1.2 (2017.11.30)
   * Search results for actions with accel key (Ctrl or ⌘) is now configurable where to be opened in.
   * When the search field is filled by selected text in the current tab, the "Search" button is automatically shown like for pasted text.
   * Selection text in any input field is now detected correctly.
   * Add an option to deactivate "auto fill with selection text" behavior.
 - 2.1.1 (2017.11.27)
   * Expand search field to fill the width of the popup. (regression)
   * Use white icon for the toolbar button on the "Dark" theme.
   * Recycle `about:privatebrowsing` tab as a blank tab on a private browsing window.
 - 2.1.0 (2017.11.24)
   * Add margin around UI to match Photon design.
   * Search with Google by default correctly.
   * "Search" button is available after copy and paste.
   * Add ability to keep popup open after search. Moreover, if you do search with Ctrl or Command key, the popup is always kept open.
 - 2.0.1 (2017.11.21)
   * Use background and foreground color same to Photon. This is required to avoid ghost rendering with missing background color on some environment. (I confirmed on Windows 10.)
 - 2.0.0 (2017.11.21)
   * Rebuilt on WebExtensions, as a custom search field addon for bookmarks with keyword.
 - 1.0.2016020401
   * Works correctly for search engines with some missing information (ex. favicon).
 - 1.0.2016020301
   * Works correctly on clean environment.
 - 1.0.2016012701
   * Don't detect newly opened tabs as search result tabs, after a search with virtual search engines (form keyworded bookmarks).
 - 1.0.2016012601
   * Better compatibility with recent Tree Style Tab.
   * Don't detect newly opened tabs as search result tabs correctly, when any unknown exception raised while doing search.
 - 1.0.2015122401
   * Drop support for Firefox 37 and older versions.
   * Works correctly even if there is only the location bar with activated "UnifiedComplete" feautre on Firefox 43 and later.
   * The default search engine with POST method works correctly.
   * Save chosen engine to the list of recently used engines for one-off search.
   * Made synchronous API free around the Places SQLite database.
   * The cache of bookmarks with smart keywords are now saved into a JSON file instead of a preference.
   * Detect smart keywords of bookmarks correctly on Firefox 39 and later.
 - 0.9.2015020901
   * Move focus to Second Search's popup menu by the up arrow key correctly, on Linux. (regression)
 - 0.9.2015020801
   * Made `eval()`-free.
   * Better compatibility with new Web search UI on Firefox 35 (and later).
 - 0.8.2014120202
   * Search by the default engine works correctly.
     (On Firefox 33, unexpected engine was used, and Firefox 34 couldn't do search.)
 - 0.8.2014120201
   * Works on Nightly 37.0a1.
   * Drop support for Firefox 30 and older versions
   * Works correctly on the multi-process mode (E10S).
   * Most implementations are migrated to JavaScript code modules.
   * Works correctly on Firefox 34 and later (after [bug 1088660: the "one for search" feature](https://bugzilla.mozilla.org/show_bug.cgi?id=1088660).)
   * Better compatibility with the [Private Tab](https://addons.mozilla.org/firefox/addon/private-tab/) addon.
 - 0.7.2014050501
   * Works correctly after overflow/underflow the toolbar, on Australis.
   * Works on both location bar and search bar if one of them is in the menu panel, on Australis.
 - 0.7.2014050201
   * Works on Nightly 32.0a1.
   * Modified: "jar" archive is no longer included.
 - 0.7.2012122901
   * Works on Nightly 20.0a1.
   * Fixed: Clear the search term after search correctly, when it is searched by an engine in the popup.
   * Modified: Clear the search term after search by default. (You can disable this feature by the configuration dialog.)
 - 0.7.2012101401
   * Fixed: Now works at the location bar correctly on Firefox 17 and later.
   * Fixed: Search the typed term in the location bar even if "browser.urlbar.autoFill" is "true".
 - 0.7.2012031101
   * Update for Firefox 13.0a1.
   * Drop support for Firefox older than 10.
   * Drop support for Thunderbird.
   * Fixed: Show the caret in the search bar during the list of search engines is shown.
   * Fixed: Scroll the list of search engines automatically during dragging on scroll buttons in the popup.
   * Improved: Make compatible with [Tab Utilities](https://addons.mozilla.org/firefox/addon/tab-utilities/).
   * Improved: Make compatible with [Searchbar Autosizer](https://addons.mozilla.org/firefox/addon/searchbar-autosizer/).
   * Improved: Make compatible with [Tab Control](https://addons.mozilla.org/firefox/addon/tab-control/).
   * Improved: Make compatible with [SearchLoad Options](https://addons.mozilla.org/firefox/addon/searchload-options/).
   * Add Swedish locale (translated by Mikael Hiort af Ornäs)
 - 0.6.2011052802
   * Improved: Left-click and middle-click on the magnifier button in the search bar now work as you customized in Second Search configuration.
 - 0.6.2011052801
   * Fixed: "Reuse blank tab" option didn't work for search results from the default engine.
   * Fixed: The context menu on the content area was unexpectedly blocked.
 - 0.6.2011051101
   * Fixed: Alt key didn't invert the behavior for the focus of opened tab (foreground/background), about search results from specified engine.
   * Modified: The default behavior of opened tabs is now initialized based on the preference "browser.tabs.loadInBackground" (for tabs opened by "target" attribute), instead of "browser.tabs.loadInBackground" (for tabs opened by middle click). If you want to change the current behavior directly, go to "about:config" and change the value of the preference "secondsearch.loadInBackground".
 - 0.6.2010120901
   * Works on Minefield 4.0b8pre.
   * Drop support for Firefox 3.0 and older versions.
 - 0.5.2009091201
   * Fixed: Odd behavior of a radio button in the configuration dialog disappeared.
   * Fixed: Search results are correctly loaded into new tab even if Tab Mix Plus is installed.
 - 0.5.2009050801
   * Fixed: Works correctly even if there is engine which has no favicon.
   * Fixed: Bookmarklets ("javascript:" bookmarks) are always loaded into the current tab.
   * Some internal operations are brushed up.
 - 0.5.2008111401
   * Fixed: It works correctly after you do "search" when the popup was going to be showing.
   * Modified: "by ..." disappeared from the popup.
   * Updated: hu-HU locale is updated by Mikes Kaszmán István.
 - 0.5.2008101401
   * Improved: Shift-Up/Down keys shows the Second Search popup, so, you can use Up/Down keys to select autocomplete item.
   * Improved: Escape key always closes the Second Search popup.
   * Fixed: Popup menu is re-positioned silently.
   * Fixed: Dropping text onto the menu item which is same to the current engine works correctly.
   * Fixed: Popup is correctly shown while dragging on the engine button even if drag-and-drop operation is allowed in the search box.
   * Updated: Works on Minefield 3.1b2pre.
   * Updated: Hungarian locale is updated. (by Mikes Kaszmán István)
 - 0.5.2008091601
   * Fixed: "Choose the engine from popup after dropped" works correctly.
 - 0.5.2008091501
   * Fixed: Popups work correctly. In the previous version, popups possibly disappeared after searching.
   * Fixed: "Allow drag-and-drop of text in the textbox" works correctly.
 - 0.5.2008090201
   * Fixed: Freezing on finding favicons for smart keywords disappeared.
   * Updated: Hungarian locale is updated. (by Mikes Kaszmán István)
 - 0.5.2008090101
   * Improved: Second Search works on the location bar if there is no search bar.
   * Improved: Second Search shows its popup while dragging, for Firefox 3 on Mac OS X.
   * Fixed: The cursor doesn't disappear on Firefox 3.
   * Fixed: Items for smart keywords are correctly updated.
   * Fixed: Conflict with some third-pirty's themes disappeared.
   * Firefox 1.5 support dropped.
 - 0.4.2008052301
   * Fixed: Delayed popups work fine in Firefox 3 on Windows.
 - 0.4.2008042801
   * Fixed: Works on the latest Trunk.
 - 0.4.2008021501
   * Fixed: Auto-popup on the search bar while dragging works correctly on Linux.
 - 0.4.2008021201
   * Improved: Works on Minefield. (Firefox 3 beta3)
   * Improved: Works on Thunderbird 2.
   * Fixed: Works correctly even if there is search engine without icon.
 - 0.3.2007120601
   * Improved: Combination with the [Split Browser](http://piro.sakura.ne.jp/xul/_splitbrowser.html.html) is improved.
 - 0.3.2007110501
   * Fixed: Toolbar customizing works correctly.
 - 0.3.2007090301
   * Fixed: The search term is cleared correctly after the search is done by an engine from the popup which is shown by text-drop.
   * Modified: The default engine is listed in the popup and popuphidden event doesn't start search, for the popup which is shown by text-drop.
 - 0.3.2007061801
   * Modified: In Mac OS X, the popup cannot be shown when a string is dragged to the search bar. So, the option is disabled permanently in Mac.
   * Updated. Hungarian locale is updated.
 - 0.3.2007052402
   * Imrpvoed: A new option to change the delay to clear search bar is available.
   * Improved: The search term isn't cleared if it is changed after search.
   * Modified: The delay to clear search bar is changed.
   * Modified: Configuration dialog is restructured.
 - 0.3.2007052401
   * Fixed: Text in the search bar are cleared after a delay.
   * Fixed: Correctly searches by the engine selected from the popup even if it has no keyword.
 - 0.3.2007052201
   * Updated: Hungarian locale is updated. (by Mikes Kaszmán István)
 - 0.3.2007052101
   * Added: Hungarian locale is available. (by Mikes Kaszmán István)
 - 0.3.2007052001
   * Improved: Options to open search results in new tabs and focus it immidiately are available.
 - 0.3.2007051401
   * Modified: Popup for the engine button is shown like as a context menu.
 - 0.3.2007051201
   * Modified: The list of engines recently used is automatically filled if there are less history.
   * Modified: The Japanese name is modified.
 - 0.3.2007051101
   * Improved: Context menu on the engine button in the search bar becomes the Second Search popup.
   * Improved: Each type of popup for the context menu on the engine button or for dorag-and-drop can be customized.
   * Improved: New tab opened from the search bar is stay background as the default preference of Firefox 2.
   * Fixed: Search term is cleared correctly for the middle-click on the "Search" button.
   * Fixed: The popup for text input is shown after the delay correctly.
   * Fixed: Infinity multiplying keywords disappeared.
   * Modified: The number of the engines recently used is grown.
   * Modified: The popup for text input is shown after a delay.
 - 0.3.2007050701
   * Improved: Popups can be shown with a delay when you input text into the search bar. (Go to "about:config" and set the delay to  `secondsearch.popup.auto_show.delay`  in milliseconds.)
 - 0.3.2007050202
   * Fixed: Popup menu for drag-over is shown correctly in Linux.
 - 0.3.2007050201
   * Improved: For drag-over on the search bar, the popup is shown and you can search by the choosen engine directly with drag-and-drop to the popup item. (Solution for [Bug 274432](https://bugzilla.mozilla.org/show_bug.cgi?id=274432))
   * Improved: A new option to allow drag-and-drop texts in the textbox. With this preference, you can start to search directly by drag-and-drop to the button (engine icon) in the search bar.
 - 0.2.2007050201
   * Fixed: The last item of the popup can be focused by the up key.
   * Fixed: Smart keywords are parsed as search engines correctly.
   * Fixed: Rebuilding the cache of smart keywords works correctly.
   * Fixed: English locale is corrected.
 - 0.2.2007050101
   * Fixed: The search bar is cleared automatically after doing search without the popup.
   * Fixed: The popup is shown correctly even if there is a popup for the suggest feature.
   * Fixed: The name of the current engine is shown correctly after the search bar is cleared automatically.
   * Improved: Middle-click on the popup opens the search result to a new tab.
 - 0.2.2007032902
   * Fixed: Popups are closed automatically after any element is clicked by user.
 - 0.2.2007032901
   * Improved: A new option to clear search bar after doing search is available.
   * Fixed: Popups are closed automatically after the window lost its focus.
 - 0.2.2007032401
   * Fixed: Popups kept wrongly shown disappeared. (maybe)
 - 0.2.2007010201
   * Improved: Popup can be shown below the search bar. (but it doesn't work with auto-complete and suggest)
   * Improved: Popup can be hidden for drag-and-drop to the search bar.
   * Fixed: Initializing operation of smart keywords is optimized for environments which have no keyword.
 - 0.2.2006122201
   * Improved: Automatic showing of the popup can be disabled.
   * Fixed: "Rebuild the list of smart keywords" button works correctly.
   * Fixed: Broken recent-used search engines after you select a smart-keyword engine has disappeared.
   * Fixed: Icons for smart-keyword items are correctly shown.
 - 0.2.2006122102
   * Fixed: The size of the configuration dialog made flexible.
 - 0.2.2006122101
   * Improved: Configuration dialog is available. (for Firefox 1.5 or later)
   * Improved: All of recently used engines are shown if the setting of the number of items for recent engines has a nevative value.
   * Improved: Smart keywords are available like as search engines. (available only for Firefox builds without Places)
   * Improved: All of engines can be shown instead of the recent engines. (pref name "secondsearch.popup.type", value: 0 means "default", 1 is "show all engines", and 2 is "show all engines in reversed order".
 - 0.1.2006121901
   * Fixed: Wrong position of the popup is corrected.
 - 0.1.2006121801
   * Improved: When you drop terms to the search bar, Second Search popup will appear. If you select no engine, the term will be searched by the default engine.
 - 0.1.2006121602
   * Improved: Second Search change the engine of the search bar to the selected engine if there is no term in the bar. (If you want this extension never to change the state of the search bar, change "secondsearch.switch.blank_input" to "false" by "about:config".)
 - 0.1.2006121601
   * Fixed: Conflict with Tab Mix Plus on Firefox 2 disappeared.
 - 0.1.2006121502
   * Fixed: Uninstalled engines disappeared from the recent engines correctly.
   * Improved: Recent used engines disappeared from the "Search by" submenu.
 - 0.1.2006121501
   * Released.
