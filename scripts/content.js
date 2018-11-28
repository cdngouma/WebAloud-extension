// Wrapping in a function to not leak/modify variables if the script
// was already inserted before.
(function () {
	// check if content script was already executed
	if (window.hasRun === true)
		return true;		// will be automatically passed back to excecuteScript in background
	window.hasRun = true;

	// main code

	console.log('content.js');

	var isPDF = false;
	var state = true;
	var synth = window.speechSynthesis;
	var autoLang = true;
	var paragraphsReading = false;		// read paragraphs and headers
	var voices = [];
	var currentVoice;
	var currentRate = 1;

	var _queue = [];		// queue for text portions to be read
	// HTML code to be injected
	var logoHTML = "<a href=\"https://github.com/cdngouma/WebAloud-extension\" class=\"wba-logo\" target=\"blank\"></a>";
	var controlsHTML = "<div id=\"wba-controls\" class=\"form-inline\"> <!-- controls --> <div title=\"Previous\" id=\"wba-prev\" class=\"_spacing wba-btn\"><svg class=\"wba-ic wba-ic-prev\"></svg></div> <div title=\"Play\" id=\"wba-play\" class=\"_spacing wba-btn\"><svg class=\"wba-ic wba-ic-play\"></svg></div> <div title=\"Pause\" id=\"wba-pause\" class=\"_spacing wba-btn\" style=\"display: none;\"><svg class=\"wba-ic wba-ic-pause\"></svg></div> <div title=\"Stop\" id=\"wba-stop\" class=\"_spacing wba-btn\"><svg class=\"wba-ic wba-ic-stop\"></svg></div> <div title=\"Next\" id=\"wba-next\" class=\"_spacing wba-btn\"><svg class=\"wba-ic wba-ic-next\"></svg></div> <div title=\"Settings\" id=\"wba-settings-btn\" class=\"_spacing\"></div> <div title=\"Close\" id=\"wba-close\"><svg class=\"wba-ic wba-ic-close\"></svg></div> </div>";
	var settingsHTML = "<div id=\"wba-settings\" class=\"form-inline\" style=\"display: none;\"> <p class=\"_spacing\">Speed</p> <div class=\"wba-range-control _spacing\"> <input id=\"wba-inputRange\" type=\"range\" min=\"0.25\" max=\"1.5\" step=\".25\" value=\"1\" data-thumbwidth=\"12\"> <output id=\"wba-rangeval\">1x</output> </div> <p class=\"_spacing\">Voice</p> <select id=\"wba-voicelist\" class=\"wba-select _spacing\" onmousedown=\"if(this.options.length>8){this.size=8;}\" onchange='this.size=0;' onblur=\"this.size=0;\"></select> <label class=\"wba-container _spacing\"> Enable language auto detection <input id=\"wba-autodetect\" type=\"checkbox\"> <span class=\"wba-checkmark\"></span> </label> <label class=\"wba-container _spacing\"> Enable section reading <input id=\"wba-paragReading\" type=\"checkbox\"> <span class=\"wba-checkmark\"></span> </label> </div>";

	var browser = browser || chrome;

	activateWidget();

	/** BROWSER MESSAGES **/

	browser.runtime.onMessage.addListener(function(message){
		if(message.from === 'wba-background'){
			if(message.query === 'show-widget'){
				showWidget();
			}
		}
	});

	/** FUNCTIONS **/

	function showWidget(){
		if (document.getElementById('wba-widget') !== null) {
			$('body').addClass('wba-lower');
			$('#wba-widget').show('slide');
			return;
		}
	}

	function activateWidget() {
		console.log('activating widget');

		var div = document.createElement('div');
		$(div).html(logoHTML + controlsHTML + settingsHTML);
		div.id = 'wba-widget';

		document.documentElement.appendChild(div);
		$('body').addClass('wba-lower');

		$('.wba-logo').css('background-image', 'url(' + browser.extension.getURL('res/icon48.png') + ')');
		$('.wba-ic-play').css('background', 'url(' + browser.extension.getURL('res/ic_play.svg') + ')');
		$('.wba-ic-pause').css('background', 'url(' + browser.extension.getURL('res/ic_pause.svg') + ')');
		$('.wba-ic-stop').css('background', 'url(' + browser.extension.getURL('res/ic_stop.svg') + ')');
		$('.wba-ic-next').css('background', 'url(' + browser.extension.getURL('res/ic_next.svg') + ')');
		$('.wba-ic-prev').css('background', 'url(' + browser.extension.getURL('res/ic_back.svg') + ')');
		$('.wba-ic-close').css('background', 'url(' + browser.extension.getURL('res/ic_times-black.svg') + ')');

		$('#wba-paragReading').prop('checked', paragraphsReading);
		$('#wba-autodetect').prop('checked', autoLang);
		$('#wba-voicelist').prop('disabled', autoLang);

		console.log(window.speechSynthesis.onvoiceschanged);
		console.log(window.speechSynthesis.onvoiceschanged === undefined);

		if (synth.onvoiceschanged !== undefined) {
			synth.onvoiceschanged = populateVoiceList;
			checkPageUrl();
		}
	}

	// check if page is pdf
	function checkPageUrl() {
		var pageUrl = window.location.href;
		var prev = $('.wba-ic-prev').parent();
		var next = $('.wba-ic-next').parent();

		if (!pageUrl.match(RegExp(".pdf"))) {
			isPDF = false;
			prev.addClass('wba-disabled');
			next.addClass('wba-disabled');
		} else {
			isPDF = true;
			prev.removeClass('wba-disabled');
			next.removeClass('wba-disabled');
			console.log($('embed'));
			var embed = document.getElementById('plugin');
			var con = embed.contentDocument;
			console.log(embed);
			console.log(con);
		}
	}

	// add voices
	function firstToUpperCase(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	function populateVoiceList() {
		if (typeof speechSynthesis === 'undefined')
			return;

		console.log("populating list...");

		var newVoices = synth.getVoices();

		if (newVoices.length === voices.length)
			return;

		voices = newVoices;

		for (i = 0; i < voices.length; i++) {
			var option = document.createElement('option');
			// extract only language from name then set first char to uppercase.
			// Google french --> French
			let name = (voices[i].name).split(RegExp("Google"));
			let lang = "";

			if (name.length > 1)
				lang = firstToUpperCase(name[1].trim());
			else
				lang = firstToUpperCase(name[0].trim());

			option.textContent = lang;

			if (voices[i].default) {
				option.textContent += ' -- Default';
			}

			document.getElementById("wba-voicelist").appendChild(option);
		}

		// set default voice
		currentVoice = voices[0];
		$('#wba-settings-btn').html(firstToUpperCase((currentVoice.lang).split("-")[0]));

		synthPopulated = true;

		console.log("done...\n" + voices.length + " voices found");
	}

	/** TODO: implement butter algotithm for more smoothness between each chunk of text **/
	/**		  split text at nearest punctuation **/
	// chunk text in parts of max length 
	function getTextParts(str) {
		//  var str = window.getSelection().toString();
		const MAX = 200; // max number of characters read (except for default);
		var limit = currentVoice.default ? 2456 : MAX; // 2456 estimated limit for default voice

		if (str < limit) return [str];

		var texts = [];

		var beg = 0; // starting index
		for (let pos = limit - 1; pos < str.length; pos++) {
			for (let i = pos; i > beg; i--) {
				if (str.charAt(i) === ' ') {
					let s = str.slice(beg, pos);
					texts.push(s);
					str = str.slice(pos, str.length);
					beg = 0;
					pos = limit - 1;
					break;
				}
				pos--;
				i--;
			}
		}

		if (str.length > 0)
			texts.push(str);

		return texts;
	}

	/** TODO: Fix bug: when pause button is clicked, the reading starts from the beginning **/
	function play(voice, texts) {
		voice = currentVoice;
		// array of text for testing purpose
		texts = ["part one", "next part", "third part", "near end", "close", "end"];

		if (texts === undefined)
			return;

		if (synth.paused) {
			synth.resume();
			return;
		}

		if (synth.speaking)
			synth.cancel();

		$('#wba-pause').show();
		$('#wba-play').hide();

		_queue = texts;

		console.log("speaking: " + _queue[0]);
		var utterance = new SpeechSynthesisUtterance(_queue[0]);
		utterance.voice = voice;
		utterance.lang = voice.lang;
		utterance.rate = currentRate;

		synth.speak(utterance);
		_queue.shift();

		utterance.onend = function (event) {

			if (_queue.length > 0) {
				utterance.text = _queue[0];
				console.log('speaking: ' + utterance.text);
				synth.speak(utterance);
				_queue.shift();
			} else {
				$('#wba-pause').hide();
				$('#wba-play').show();
			}
		}

		utterance.onpause = function (event) {
			$('#wba-pause').hide();
			$('#wba-play').show();
		}

		utterance.onerror = function (event) {
			console.log(event);
		}

	}

	function pause() {
		synth.pause();
	}

	function stop() {
		$('#wba-play').show();
		$('#wba-pause').hide();
		console.log('stopped');
		synth.cancel();
		_queue = [];
	}

	/** PDF MANIPULATION **/
	function nextPage() {

	}

	function previousPage() {

	}


	/** HANDLE EVENTS **/

	// hide settings box when swicthing tab
	$(window).blur(function () {
		$('#wba-settings').hide('fade');
	});

	$(document).mouseup(function (e) {
		// close settings window when focus out
		var container = $('#wba-settings');
		if (!container.is(e.target) && container.has(e.target).length === 0) {
			container.hide('fade');
		}
	});

	var prevBorder = "";
	var prevTarget;
	$(document).mouseover(function(e){
		// highlight sections
		var target = $(e.target);

		if(paragraphsReading){
			if(prevTarget) prevTarget.css('border', prevBorder);

			prevBorder = target.css('border');

			if($('#wba-widget').has(target).length === 0)
				target.css('border', '1px solid red');

			prevTarget = target;
		}
	});

	$('#wba-settings-btn').on('click', function () {
		console.log('wba-settings-btn clicked');
		if ($('#wba-settings').is(':visible')) {
			$('#wba-settings').hide('fade');
		} else {
			$('#wba-settings').show('fade');
		}
	});

	// update range output
	$('#wba-inputRange').on('input', function () {

		var control = $(this),
			controlMin = control.attr('min'),
			controlMax = control.attr('max'),
			controlVal = control.val(),
			controlThumbWidth = control.data('thumbwidth');

		var range = controlMax - controlMin;

		var position = ((controlVal - controlMin) / range) * 100;
		var positionOffset = Math.round(controlThumbWidth * position / 100) - (controlThumbWidth / 2);
		var output = control.next('output');

		output.css('left', 'calc(' + position + '% - ' + positionOffset + 'px)').text(controlVal + 'x');
		// update current rate
		currentRate = controlVal;

	});

	$('#wba-voicelist').change(function () {
		let i = $(this).prop('selectedIndex');
		// update current voice
		currentVoice = voices[i];
		$('#wba-settings-btn').html(firstToUpperCase((currentVoice.lang).split("-")[0]));
	});

	$('#wba-paragReading').change(function(event){
		paragraphsReading = $(this).is(':checked');
	});

	$('#wba-autodetect').change(function(event){
		$('#wba-voicelist').prop('disabled', $(this).is(':checked'));
		autoLang = $(this).is(':checked');
	});

	$('#wba-play').on('click', play);
	$('#wba-pause').on('click', pause);
	$('#wba-stop').on('click', stop);
	$('#wba-next').on('click', nextPage);
	$('#wba-prev').on('click', previousPage);

	$('#wba-close').on('click', function (event) {
		$('#wba-widget').hide('slide');
		$('body').removeClass('wba-lower');
	});

})();