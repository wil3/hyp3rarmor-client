# Hyp3rArmor Client
The Hyp3rArmor JavaScript client is hosted on a *visible* server, separate from the
server hosting the web application. This visible server replaces the network visible footprint of the hidden web application server running the  [Hyp3rArmor server](https://github.com/wil3/hyp3rarmor-server).
Please refer to the [project parent](https://github.com/wil3/hyp3rarmor) for more details and supporting software.


## Warning

This code is in active development. It is not recommended to use in production
at this time.


# Configuration

Client configuration  is defined in `src/hyp3rarmor-config.js` and must match
the  [Hyp3rArmor server configuration](https://github.com/wil3/hyp3rarmor-server/blob/master/conf/hyp3rarmor.yaml).

# Installation
Installation is different depending on the web server architecture. 
A websites page content can be generated dynamically by a server (e.g. template
engines found in PHP, and 
Python Django). We refer to this as a *single* server architecture.  

Alternatively, a websites page content can be updated dynamically via AJAX
requests to a back-end server. 
In this architecture the static content (i.e. HTML, CSS, JavaScript) and back-end server are hosted on separate servers (e.g. found
commonly in [single-page
applications](https://en.wikipedia.org/wiki/Single-page_application)). We refer
to this as a *split* server architecture.   

## Split Server Architecture
Simply add the following `script` tags to each HTML file.  

```javascript
	<script type="text/javascript" src="path/to/hyp3rarmor-config.js"></script>
	<script type="text/javascript" src="path/to/hyp3rarmor.js"></script>
```
## Single Server Architecture 

Additional modifications to the visible server must be  made due to the
requested resource not existing on the visible server. 

1. Set `index.html`  as the  root document of the web server.
2. Modify the server  configuration to perform URL rewrite to always serve `index.html`. An
   example for Nginx can be found in `server/nginx/sample.com`.
3. Apply the following JavaScript block to all files hosted on the  [hidden server](https://github.com/wil3/hyp3rarmor-server) to change the [origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) thus allowing the JavaScript hosted on the visible server to modify the DOM served by the hidden server.  

```javascript
		<script type="text/javascript">
		document.domain = 'company.com'
		</script>
```
