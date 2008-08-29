function init() {
	if (!('preferencePanes' in document.documentElement)) {
		document.getElementById('prefpane-general').setAttribute('hidden', true);
		document.getElementById('prefpane-advanced').setAttribute('hidden', true);
		document.documentElement.appendChild(document.createElement('description'));
		document.documentElement.lastChild.appendChild(document.createTextNode(document.documentElement.getAttribute('disabledmessage')));
		document.documentElement.lastChild.setAttribute('flex', 1);
		document.documentElement.lastChild.setAttribute('style', 'width:30em;');
		document.documentElement.appendChild(document.createElement('button'));
	}
	else {
		document.getElementById('prefpane-general').removeAttribute('hidden');
		document.getElementById('prefpane-advanced').removeAttribute('hidden');
	}
}


function updateTabRadio() {
	var tab = document.getElementById('browser.search.openintab');
	var bg  = document.getElementById('secondsearch.loadInBackground');
	var radiogroup = document.getElementById('secondsearch.tab-radiogroup');
	radiogroup.value =
		(tab.value && bg.value) ? 2 :
		(tab.value) ? 1 :
		0 ;
//	radiogroup.selectedItem = radiogroup.getElementsByAttribute('value', radiogroup.value);
}

function onUpdateTabRadio() {
	var tab = document.getElementById('browser.search.openintab');
	var bg  = document.getElementById('secondsearch.loadInBackground');
	var radiogroup = document.getElementById('secondsearch.tab-radiogroup');
	tab.value = parseInt(radiogroup.value) > 0;
	bg.value = radiogroup.value == 2;
}



function setTextValue(aID, aValue)
{
	var node = document.getElementById(aID);
	node.value = aValue;
	var event = document.createEvent('UIEvents');
	event.initUIEvent('input', true, false, window, 0);
	node.dispatchEvent(event);
}