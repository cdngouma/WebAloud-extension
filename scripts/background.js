var browser = browser || chrome;

// activate widget
browser.browserAction.onClicked.addListener(function(tab){
	if(tab){
		browser.tabs.executeScript(tab.id, {file:'scripts/content.js'}, function(results){
			if(browser.runtime.lastError || !results || !results.length){
				return;
			}
			
			if(results[0] === true){
				browser.tabs.sendMessage(tab.id, {from:'wba-background', query:'show-widget'});
			}
			
			else{
				browser.tabs.insertCSS(tab.id, {file:'widget.css'});
			}
		});
	}
});

chrome.contextMenus.create({
	id:'wba_read_select',
	title:'Read aloud selected text',
	type:'normal',
	contexts:['selection']
});

browser.contextMenus.onClicked.addListener(function(info, tabs){
	if(tabs){
		browser.tabs.sendMessage(tabs.id, {query:'read-selected'}, function(response){
			if(response.err){
				alert("Speech Synthesis is missing");
			}
		});
	}
});