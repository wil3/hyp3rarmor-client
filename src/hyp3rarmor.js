var hyp3rarmor = (function(my){

	/**
	 * The image used to check if there is connectivity to the stealth server and verify 
	 * IP address has been authenticated
	 */
	var elPoll = null,
		retries = 0,
		expireTimeInSeconds = 0, 
		activeToken = null,
		lease_time = 0;

	var challengeUI = {};

	/**
	 * Defence for bots knowledge of only IP addresses
	 * @const {string} 
 	 */
	my.DEFENSE_IP = "ip",

	/**
	 * Defence for  bots knowledge of the targets domain name (DN)
	 * as well as the IP addresses
	 * @const {string} 
 	 */
	my.DEFENSE_DN = "dn";


	/**
	 * The web architechure is split, meaning there is a server handling static
 	 * content, and an API server. Choose this for single-page applications 
	 * @const {string}
	 */
	my.ARCH_SPLIT = "split";

	/**
	 * If the web architechure is hosted on a single server.
	 * @const {string}
	 */
	my.ARCH_SINGLE = "single";

	ENCRYPT_PREFIX = "token=";
	ENCRYPT_DELIMITER = ",";
	CSS_PREFIX = "hyp3rarmor-";
	/**
	 * Optional
	 * If the knocks fail, the amount of time before trying again, in milliseconds
	 */
	timeout = 500;

	/**
	 * Optional
	 * The number of tries to probe the hidden server to check if the client has been 
	 * granted access.  If negative, will keep trying forever
	 */
	maxRetries = 3;


	/**
	 * In order to determine if we have been whitelisted after we knock on 
	 * the specified ports we request a cross site resource (eg: image) and see 
	 * if it loads, if so we have been whitelisted
	 */
	function _createVerifyingElement(){
		elPoll = $(document.createElement("img"));
		elPoll.css("width", "1px");
		elPoll.css("height", "1px");
		elPoll.css("position", "absolute");
		elPoll.css("left", "-1000px");
		$("body").append(elPoll);
}
/**
	 * Verify that we have been autheniticated by polling for a resource
	 * on the server
	 */
 	function  verify(onSucces, onFailure){
		var server_url = hyp3rarmor.config.stealthServerURL; 
		if (hyp3rarmor.config.server_port != null){
				server_url += ":" + hyp3rarmor.config.server_port
		}	
		var d = new Date();
		var timestamp = d.getTime();
		/*
		 * The following code will try and load the favicon off screen, 
		 * if it can then we can reach the server
		 */
		// This should wait a bit then try and verify again
		elPoll.error(function(){
		  console.error("Authentication failed...waiting then trying again...")
		  //Wait then restart
		  onFailure();
		})
		.load(function(){
			onSuccess();
		})
		//To prevent cache hits
		.attr('src', server_url + "/" + hyp3rarmor.config.favicon + "?_=" + timestamp);
			

	}

	function getRelativePath(){
		return location.href.replace(location.origin, "")
	}

	/**
	 * @param name
	 * @param value 
	 * @param ttl in seconds
	 */
	function setCookie(cname, cvalue, ttl) {
		var d = new Date();
		d.setTime(d.getTime() + (ttl*1000));
		var expires = "expires="+d.toUTCString();
		document.cookie = name + "=" + value + ";" + expires + ";path=/";
	}

	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}






	/** Define all of the callback used **/

	/**
	 * This callback is called when a single knock has been sent
	 * @callback knockSentCallback
	 */


	/**
	 * This callback is called when all of the knocks comprising of the
	 * token have been sent
	 * @callback tokenSentCallback
	 */


	/**
	 * @callback URLExistsCallback
	 * @param {boolean} reachable - True if the URL is reachable, false otherwise
	 */


	/**
	 * This callback is called when the token is received from the provider
	 *
	 * @callback tokenReceivedCallback
	 * @param {string or number[]} token - If using domain name bot defense this will 
	 * be an encrypted string, otherwise an array of the ports
	 * @param {number} expire - The time in seconds when this token will exipire
	 */




	/**
	 * Build a single URL knock
	 *
	 * @param {number} port - Destination port number
	 * @return {string} Full URL 
	 */
	function buildKnockURL(port){
		return hyp3rarmor.config.stealthServerURL + ":" + port + "?" + (new Date()).getTime();
	}

	/**
	 * Knock of the given port
	 *
	 * @param {number} port - The port number to knock on 
	 * @param {knockSentCallback} sentCallback - The callback to use after knock is sent
	 */
	function knock(port, sentCallback){
		var url = buildKnockURL(port);
		var xhr = new XMLHttpRequest();
			//In milliseconds
			xhr.timeout = 1  
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function () {
			//If sent has been called, we are going to fail either way
			if(xhr.readyState > XMLHttpRequest.OPENED) {
				sentCallback(port);
			} 
		};
		xhr.send();
	}


	/**
	 * Send the token 
	 *
	 * @param {number[]} ports - The ports consisting of the token 
	 * @param {tokenSentCallback} onSent - Called after all knocks have been sent
	 */
	function sendKnocks(ports, onSent){
		var sent = 0;
		for (var i = 0; i < ports.length; i++){
			knock(ports[i], function(port){
				sent++;
				if (sent == ports.length){
					onSent()
				}
			});
		}	
	}


	/**
	 * Check if we can reach the URL
	 *
	 * @param {string} url - URL we are checking to see if reachable
	 * @param {URLExistsCallback} callback - Callback to tell if URL reachable 
	 */
	// TODO Need to see if this works with images
	// There is an issue with the hidden server having to enable CORS for the 
	// visible server domain
	function resourceReachable(url, callback) {
		var http = new XMLHttpRequest();
		http.open('HEAD', url);
		http.onreadystatechange = function() {
			if (this.readyState == this.DONE) {
				callback(this.status == 200);
			}
		};
		http.send();
	}

	/**
	 * Determine if the client has been granted access to the server
	 * by periodically probing for a resource
	 */
	function confirmAccess(onSuccess, onFailure){
		
		resourceReachable(hyp3rarmor.config.probeURL, function(reachable){
			if (reachable){
				console.log("URL reachable, authentication confirmed");
				onSuccess();
			} else {
				//wait a second then try again
				if (retries >= maxRetries){
					console.log("Failed to authenticate, max retries met");
					retries = 0;
					onFailure();
				} else {
					//Try again
					  retries++;
					  setTimeout(function(){
							confirmAccess(onSuccess, onFailure);
					}, timeout)
				}
			} 
		}); 

	}
	/**
	 * Query the provider for the token
	 *
	 * @param {tokenReceivedCallback} callback
	 */
	function getToken(callback){
		var xhr = new XMLHttpRequest(),
			method = "GET";

		url = hyp3rarmor.config.tokenURL +  "?" + (new Date()).getTime()
		xhr.open(method, url , true);
		xhr.onreadystatechange = function () {
				if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
					var data = JSON.parse(xhr.responseText);
					callback(data.token, data.expire, data.ttl);
				}
			};
		xhr.send();
	}


	/**
	 * Perform a single authenitication if needed. We can continually call this
	 * function without worrying about to many network requests, it will only 
	 * query for it when needed.
	 * @param {successCallback} onSuccess - The callback that handles a successful authentication
	 */
	my.authenticate = function(onSuccess, onFailure){
		var currentTimeInSeconds = (new Date).getTime() / 1000;
		var timeTillExpire = expireTimeInSeconds - currentTimeInSeconds;
		if (timeTillExpire <= 0){
			getToken(function(token, expireTime){
				activeToken = token;
				expireTimeInSeconds = expireTime; 
				if (hyp3rarmor.config.defense == my.DEFENSE_DN){
					showChallenge();
				} else {
					sendKnocks(token, function(){
							confirmAccess(function(){
								onSuccess();
							},
							function(){
								//Confirm access failure
								// TODO restart
							});
					});//end send knocks
				}

			});
		} else {
			console.debug("Token still valid, not renewing");
			onSuccess()
		}

	}

	function autoAuthenticateCallback(){
		my.autoAuthenticate()
	}
	/**
	 * Use when wanting to keep the session always authenticated. 
	 * Required from parent frame when in proxy mode.
	 */
	// TODO What is going to happen if this is called multiple times but 
	// we currently have a challenge displayed?
	my.autoAuthenticate = function(onSuccess, onFailure){

		function auth(){
			my.authenticate(
				function(){
					onSuccess();
					my.autoAuthenticate();
				}, 
				function(){
					onFailure();
					my.autoAuthenticate()
			});
		}

		//First check if we have a current expire time
		var renew_time 
		if (expireTimeInSeconds > 0) {
			var currenTimeInSeconds = (new Date).getTime() / 1000;
			//Renew halfway through
			renew_time = ((expireTimeInSeconds - (lease_time/2.0)) - currenTimeInSeconds) * 1000;
			if (renew_time > 0){
				setTimeout(function(){
					auth();
				}, renew_time)
			} else {
				auth();
			}
		} else {
			//First time authenticating
			auth();
		}
	}
	function authenticationCallback (){
		console.info("Authenitcation success!");
		if (firstLoad){
		
			var firstLocation;
			var iframe = $("#stealth_server");
			var iframeSrc = shield.config.stealthServerURL + getRelativePath();
			console.info("Iframe source " + iframeSrc)
			iframe.attr('src', iframeSrc)
			//Only do this after weve authenticated, then keep it in auto mode
			iframe.load(function(){
				console.log("Iframe loaded");

				
				//Update parent with title of child
				var title = $(this).contents().find("title").text()
				$(document).contents().find("title").text(title);

				var loc = $(this).contents().get(0).location;
				q = loc.href.replace(loc.origin, "")
				console.info(loc.href)
				console.info(loc.origin)	
				console.info("Iframe loaded "+ q)
				//history.pushState({page: title}, title, currentLocation)

				var iframeBody = $(this).contents().find('body');
				iframeBody.click(function(ev){
					console.info(ev.target);
					//ev.stopImmediatePropagation();
					//window.location = ev.target.href
				});

				//Set up  auto authentication

			});

		}
	}

	function decrypt(secret){
			var secret = sjcl.codec.base64.fromBits(
			
			var token = new fernet.Token({
				secret: new fernet.Secret(secret),
				token: activeToken,
				ttl: 0
			})
			
		return token.decode(); 

	}
	function isTokenValid(plaintext){
		return plaintext.substring(0, ENCRYPT_PREFIX.length) == ENCRYPT_PREFIX;
	}
	function buildChallenge(){

		window.onload = function(){
			var wrapper = document.createElement("div");
			wrapper.className = CSS_PREFIX + "modal";

			var content = document.createElement("div");
			content.className = CSS_PREFIX + "modal-content";
			wrapper.appendChild(content);

			var challengeContainer = document.createElement("div");
			var captcha = document.createElement("img");
			challengeContainer.appendChild(captcha);
			content.appendChild(challengeContainer);


			var timerContainer = document.createElement("div");
			content.appendChild(timerContainer);

			var errorContainer = document.createElement("div");
			
			var answerInput = document.createElement("input");
			answerInput.placeholder = "Challenge answer";
			answerInput.type = "input";
			content.appendChild(answerInput);

			var submitButton = document.createElement("input");
			submitButton.value = "Submit";
			submitButton.type = "button";
			submitButton.onclick = function(){
				plaintext = decrypt(answerInput.value)
				if (isTokenValid(plaintext)){
						portStrings = plaintext.substring(ENCRYPT_PREFIX.length).split(ENCRYPT_DELIMITER);
						token = [];	
						for (var i = 0; i < portStrings.length; i++){
							token.push(parseInt(i));
						}
						// FIXME we now have events disjoint when there is human 
						// intervention required. What is going to happen when multiple 
						// AJAX requests are made
						sendKnocks(token, function(){
								confirmAccess(function(){
									//onSuccess();
								},
								function(){
									//Confirm access failure
									// TODO restart
								});
						});//end send knocks

				} else {
					//The user may have mistyped the captcha
					errorContainer.innerHTML = "Incorrect answer, please try again";
				}

			}
			content.appendChild(submitButton);

		
			document.body.appendChild(wrapper);		

			challengeUI.timerContainer = timerContainer;
			challengeUI.wrapper = wrapper;
			challengeUI.captcha = captcha;

		}

	}	


	function showChallenge(){
		if (expireTimeInSeconds < 0){
			console.error("Expiration time can't be negative, maybe token has expired");
			return;
		}
		challengeUI.captcha.src = hyp3rarmor.config.challengeURL + "?" + (new Date()).getTime();
		challengeUI.wrapper.style.display = "block";
		var currentTimeInSeconds = (new Date).getTime() / 1000;
		var timeLeft = expireTimeInSeconds - currentTimeInSeconds;
		var timer = Math.floor(timeLeft);
		setInterval(function(){
			challengeUI.timerContainer.innerHTML =  timer + "s";
			timer--;
			if (timer < 0){
				clearInterval(this);
			}
		}, 1000); 

	}



	function isConfigValid(){
		var error = false;
		if (hyp3rarmor.config.tokenURL == null){
			console.error("tokenURL is required");
			error = true;
		}
		if (hyp3rarmor.config.stealthServerURL == null){
			console.error("stealthServerURL is required");
			error = true;
		}
		if (hyp3rarmor.config.defense == null){
			console.error("defense is required");
			error = true;
		}

	  return !error;
	}

	/**
	 * Initialize an instance of Hyp3rArmor
	 * @param {dict} options - The configuration to initiate the defense
	 */
	my.init = function init(options){
		
		if (isConfigValid()){
			console.debug("Configuration valid, boostrapping defense");
			if (hyp3rarmor.config.defense == my.DEFENSE_DN){
				buildChallenge();
			}
			if (hyp3rarmor.config.arch == my.ARCH_SINGLE){
				//Have to use automatic authentication
				//document.domain = 

			}
		}

	}



	return my;

}(hyp3rarmor || {}));
hyp3rarmor.init();
