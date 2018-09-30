var browser = browser || chrome;
var has_contextMenu = true;

var settings = {
	autoLang:true,
	pace:true
}

browser.contextMenus.onClicked.addListener(function(info, tabs){
	if(tabs){
		browser.tabs.sendMessage(tabs.id, {query:'read-selected'}, function(response){
			if(response.err){
				alert("Speech Synthesis is missing");
			}
		});
	}
});

function createContextMenu(){
	browser.contextMenus.create({
		id:'wld_read_select',
		title:'Read aloud selected text',
		type:'normal',
		contexts:['selection']
	});
	has_contextMenu = true;
}

// turn on widget
browser.browserAction.onClicked.addListener(function(tab){
	alert("clicked");
	if(tab){
		browser.tabs.sendMessage(tab.id, {query:'activate-widget'}, function(response){
			if(response.err){
				alert("Speech Synthesis is missing");
			}
		});
	}
});

function getSettings(){
	return settings;
}

function updateAutoLang(b){
	this.settings.autoLang = b;
}

function togglePace(){
	this.settings.pace = !this.settings.pace;
}

function onError(error){
	console.error(`Error: ${error}`);
}