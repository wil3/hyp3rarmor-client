(function($){
	var orig_ajax = $.ajax;
	$.ajax = function( url, options2 ){
		console.debug("Overridding ajax " + url);
		hyp3rarmor.authenticate(function(){
			console.info("Authenitcation success!");
			return orig_ajax(url, options2);
		},
		function(){
			console.error("Authentication failure!");
		})
		return jqXHR;
	}
})(jQuery);
