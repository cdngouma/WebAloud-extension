var browser = browser || chrome;
var background = browser.extension.getBackgroundPage();

function initializePopup(){
	var status = background.getUpdatedPopup();

	if(status.state){
		$('#_switch').prop('checked', true);
		$('#settings_div').prop('display', 'inline-block');
		$('#settings_div').slideDown();
	}
	else{
		$('#_switch').prop('checked', false);
		$('#settings_div').prop('display', 'none');
		$('#settings_div').slideUp();
	}

	$('#auto_box').prop('checked', status.autoLang);
	$('#voiceSelect').prop('disabled', status.autoLang);
}

function listenForAction(){	
	$('#_switch').change(function(){
		if($(this).is(':checked'))
			$('#settings_div').slideDown();
		else
			$('#settings_div').slideUp();
		background.updateState($(this).is(':checked'));
	});

	$('#auto_box').change(function(){
		background.updateAutoLang($(this).is(':checked'));
		$('#voiceSelect').prop('disabled', $(this).is(':checked'));
	});

	$('#voiceSelect').change(function(){
		background.setVoiceIndex({index:$('option:selected', this).attr('voice-index')});
	});
};

function populateVoiceList() {
  	if(typeof speechSynthesis === 'undefined') {
    	return;
  	}

	voices = speechSynthesis.getVoices();

	for(i=0; i < voices.length ; i++) {
	  	var option = document.createElement('option');
    	option.textContent = voices[i].name;
    	
    	if(voices[i].default) {
    		option.textContent += ' -- Default';
    	}

    	option.setAttribute('voice-index', i);
    	document.getElementById("voiceSelect").appendChild(option);
  	}	
}

if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}
initializePopup();
listenForAction();