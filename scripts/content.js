console.log("content.js loaded");

var widgetHTML = "<!-- logo --> <div class=\"_spacing\" > <a href=\"https://github.com/cdngouma/WebAloud-extension\" class=\"_wba-logo\" target=\"blank\"></a> </div> <!-- select lang --> <div class=\"_divider\"></div> <div> <button title=\"Select language\" id=\"min-voiceSelect\" type=\"button\" class=\"_spacing wba-btn\" style=\"font-weight: bold;\"></button> </div> <div class=\"_divider\"></div> <!-- controls --> <div id=\"controls_div\"> <div class=\"_spacing\"> <button id=\"wba_play\" type=\"button\" class=\"_CtrlBtn wba-btn\"><i class=\"fa fa-play\"></i></button> </div> <div class=\"_spacing\"> <button id=\"wba_pause\" type=\"button\" class=\"_CtrlBtn wba-btn\"><i class=\"fa fa-pause\"></i></button> </div> <div class=\"_spacing\"> <button id=\"wba_stop\" type=\"button\" class=\"_CtrlBtn wba-btn\"><i class=\"fa fa-stop\"></i></button> </div> </div> <div class=\"_divider\"></div> <!-- close button --> <div class=\"_spacing\"> <button title=\"Close\" id=\"wba-close\" type=\"button\" class=\"wba-btn\" style=\"background-color: #f7f7f7;\"><i class=\"fa fa-times\"></i></button> </div> </div>";
var settingPopupHTML = "<a class=\"_wba-logo\" target=\"blank\" style=\"float: right;\"></a> <h6>Setup voice</h6> <div clas=\"form-inline\" style=\"margin-top: 10px;\"> <label class=\"custom-control custom-checkbox\"> <input id=\"wba-autodetect\" type=\"checkbox\" class=\"custom-control-input\"> <span class=\"custom-control-description\">auto-detect</span> <span class=\"custom-control-indicator\"></span> </label> <label class=\"custom-control custom-checkbox\"> <input id=\"wba-learnerpace\" type=\"checkbox\" class=\"custom-control-input\"> <span class=\"custom-control-description\">Learner rate (slower)</span> <span class=\"custom-control-indicator\"></span> </label> </div> <div class=\"form-inline\"> <select id=\"voiceSelect\" disabled='false' class=\"form-control\" style=\"width: 200px; height: 35px; font-size: 13px;\"></select> <button id=\"save-lang\" class=\"btn ls-btn\" type=\"button\">Save</button> </div> <a href=\"https://github.com/cdngouma/WebAloud-extension/issues\" target=\"blank\" class=\"fa fa-github\"><span>Help and Feedback</span></a>";

// main content script
var browser = browser || chrome;
var synth =  window.speechSynthesis;
var synthPopulated = false;
var state = false;

var autoLang = true;
var learnerPace = false;
var voices = [];
var currentVoice;
var currentPace = 1;	// default pace (native). 0.40 for learner

// var testText = "Helloooooo world!";

browser.runtime.onMessage.addListener(function(request, sender, sendResponse){

	if(request.query === 'read-selected'){
		if(!readSelectedText())
			sendResponse({err:true});
	}
	else if(request.query === 'activate-widget'){
		console.log("call made");
		if(!activateWidget())
			sendResponse({err:true});
	}
});

function firstToUpperCase(str){
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function readSelectedText(){
	let texts = getText();
	console.log(texts);

	if(!window.speechSynthesis)
		return; // false;

	if(autoLang){
		browser.i18n.detectLanguage(text[0], function(langInfo){
			for(a of langInfo.languages){
				if(a.percentage == 100){
					lang = a.language;
					break;
				}
			}

			let voice = matchVoice(lang);
			if(voice)
				play(matchVoice(lang), texts);
			else
				alert("Sorry! This language is not supported");
		});
	}
	else{
		play(currentVoice, texts);
	}

	return; // true;
}

function getText(){
	var str = window.getSelection().toString();
//	console.log("length:"+str.length);
	const MAX = 193;		// max number of characters read (except for default);
	var limit = currentVoice.default ? 2456 : MAX;		// 2456 estimated limit for default voice

	if(str < limit) return [str];

	var arr = [];

	var beg = 0;		// starting index
	for(let pos = limit-1; pos < str.length; pos++){
		for(let i=pos; i > beg; i--){
			if(str.charAt(i) === ' '){
				let s = str.slice(beg, pos);
				arr.push(s);
				str = str.slice(pos, str.length);
				beg = 0;
				pos = limit-1;
				break;
			}
			pos--;
			i--; 
		}
	}

	if(str.length > 0)
		arr.push(str);

	return arr;
}

function matchVoice(lang){
	for(v of voices){
		if(v.lang.includes(lang)){
			return v;
		}
	}
	return undefined; //returns default
}

function play(voice, text){
	if(synth.speaking) synth.cancel();

	console.log(voice);
	// TODO: make switching between utterances smoother
	// Currently makes unexpected pauses
	for(x of text){
		var utterance = new SpeechSynthesisUtterance(x);
		utterance.voice = voice;
		utterance.lang = voice.lang;
		utterance.rate = currentPace;
		synth.speak(utterance);
	}

	console.log("finished playing");
}

// Js for main widget

function enableEventListeners(){
	$('#min-voiceSelect').click(selectVoice);

	$('#wba_play').click(function(){

	});

	$('#wba_pause').click(function(){

	});

	$('#wba_stop').click(function(){
		if(synth.speaking) synth.cancel();
	});

	$('#wba_widget').click(function(){
		$('#wba_widget').hide('slide', {direction: 'right'}, 250);
	});

	//popup

	$('#save-lang').click(function (event){
		if($('#lang-selector').prop('display') !== 'none'){
			$('#wba_widget').show('slide', {direction:'right'}, 500);
			$('#lang-selector').hide();

			let i = $('#voiceSelect').prop('selectedIndex');
			currentVoice = voices[i];
		
			$('#min-voiceSelect').html(firstToUpperCase((currentVoice.lang).split("-")[0]));
		}
	});

	$('#wba-autodetect').change(function(event){
		autoLang = !autoLang;
		$('#voiceSelect').prop('disabled', autoLang);
	});

	$('#wba-learnerpace').change(function(event){
		learnerPace = !learnerPace;
	});
}

function selectVoice(event) {
	console.log($('#wba_widget'));

	if($('#wba_widget').prop('display') !== 'none'){
		$('#wba_widget').hide('slide', {direction: 'right'}, 500);
		$('#lang-selector').show();
	}
}

// Js for select lang window



// populate voices

function activateWidget(){
	if(typeof speechSynthesis === 'undefined')
		return;

	console.log("activating widget");

/*	var style = document.createElement('link');
	style.rel = 'stylesheet';
	style.type = 'text/css';
	style.href = chrome.extension.getURL('widget.css');
	(document.head||document.documentElement).appendChild(style);*/

//	(document.head).append('<link rel="stylesheet" href="style/widget.css">');
//	(document.body).append('<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.0/jquery-ui.min.js"></script>');

	var body = document.body;
	var elem = document.createElement('div');
	elem.innerHTML = widgetHTML;
	elem.id = "wba_widget";
	body.insertBefore(elem, body.firstChild);

	console.log(elem);

	elem = document.createElement('div');
	elem.innerHTML = settingPopupHTML;
	elem.id = "lang-selector";
	body.appendChild(elem);

	$('._wba-logo').prop('background-image', "url("+chrome.extension.getURL('res/icon38.png')+")");

	console.log($('._wba-logo').prop('background-image'));

	$('#wba_widget').show('slide', {direction:'right'}, 500);	
	$('#wba-learnerpace').prop('checked', learnerPace);
	$('#wba-autodetect').prop('checked', autoLang);

	console.log($('#wba_widget'));

	console.log($('#wba-close'));

	if (speechSynthesis.onvoiceschanged !== undefined) {
		console.log("populate?");
  		speechSynthesis.onvoiceschanged = populateVoiceList();
  	}

  	enableEventListeners();
}

function populateVoiceList() {
  	if(typeof speechSynthesis === 'undefined') {
  		console.log("no SS");
  		console.log(typeof speechSynthesis);
    	return;
  	}

  	console.log("populating list");

	voices = synth.getVoices();

	if(synthPopulated)
		return;

	for(i=0; i < voices.length ; i++) {
	  	var option = document.createElement('option');
	  	// extract only language from name then set first char to uppercase.
	  	// Google french --> French
	  	let name = (voices[i].name).split(RegExp("Google"));
	  	let lang = "";
	  	if(name.length > 1)
	  		lang = firstToUpperCase(name[1].trim());
	  	else
	  		lang = firstToUpperCase(name[0].trim());
	  	option.textContent = lang;
    	
    	if(voices[i].default) {
    		option.textContent += ' -- Default';
    	}

    	document.getElementById("voiceSelect").appendChild(option);
  	}

  	// set default voice
  	currentVoice = voices[0];
  	$('#min-voiceSelect').html(firstToUpperCase((currentVoice.lang).split("-")[0]));

  	synthPopulated = true;

  	console.log("done...[" + voices.length + "] voices");
}