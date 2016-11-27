/**
 * User configuration
 */
hyp3rarmor = {};
hyp3rarmor.config = {
		
		/**
		 * Required
		 * Defines the token source. This URL is used to fetch the token used 
		 * for authentication, it can be local or remote. 
		 */
		tokenURL : null,

		/**
		 * Required
		 */
		stealthServerURL : null,

		/**
		 * Required 
		 * Available options: "ip" or "dn"
		 */
		defense: null,

		/**
		 * The probe URL used to detect if the client has access to the hidden server
		 * Ex: http://hidden.webapp.com/
		 */
		probeURL: null,

		/**
		 * Define the web architechure, one of ARCH_SPLIT or ARCH_SINGLE
		 * Available optins: single or split
		 */ 
		arch: null,


		/**
		 * Required if using DEFENSE_DN
		 */
		challengeURL: null
}
