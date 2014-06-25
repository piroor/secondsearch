pref("secondsearch.popup.auto_show", true);
// 1 = up/down, 2 = Shift-up/down
pref("secondsearch.popup.manual_show.arrowKeys", 3);
pref("secondsearch.popup.auto_show.delay", 200);
// 0 = nothing, 1 = on dragover, 2 = on drop (old)
pref("secondsearch.popup.auto_show.dragdrop.mode", 1);
pref("secondsearch.popup.auto_show.dragdrop.delay", 350);
pref("secondsearch.popup.position",     0); // 0 = above, 1 = below
pref("secondsearch.popup.type",         0); // 0 = recent used, 1 = all, 2 = all (reversed)
pref("secondsearch.popup.type.context",  1); // -1 = default
pref("secondsearch.popup.type.dragdrop", -1); // -1 = default
pref("secondsearch.recentengines.num",  5);
pref("secondsearch.switch.blank_input", true);
pref("secondsearch.keyword.show",       true);
pref("secondsearch.clear_after_search", true);
pref("secondsearch.clear_after_search.delay", 10000);
pref("secondsearch.reuse_blank_tab",    true);
pref("secondsearch.timeout",            5000);
pref("secondsearch.override.locationBar", true);
pref("secondsearch.ignoreAutoFillResult", true);

pref("secondsearch.keyword.updating", false);

//pref("secondsearch.loadInBackground", false);

// for compatibility with Private Tab
// https://addons.mozilla.org/firefox/addon/private-tab/
pref("secondsearch.openPrivateTab", false);

pref("secondsearch.handle_dragdrop_only_on_button", false);
