var http = require('http');
var https = require('https');

var join = require('join-path');
var httpProxy = require('http-proxy');
var url = require('fast-url-parser');

var PROXY = httpProxy.createProxyServer({
  changeOrigin: true
});
var DEFAULT_TIMEOUT = 30000;

module.exports = function () {
  
  return function (req, res, next) {
    
    if (!req.service || !req.service.config) return next();
    
    var requestUrlValues = (req.service.path || req.url).split('/');
    var proxyName = requestUrlValues[2];
    var config = getEndpointConfig(proxyName);
    
    if (!config || !config.origin) return next();
    
    var endpointUri = requestUrlValues.slice(3).join('/');
    
    // Set headers
    Object.keys(config.headers || {}).forEach(function (key) {
      
      var val = config.headers[key];
      
      req.headers[key.toLowerCase()] =
        (req.headers[key.toLowerCase()] || config.headers[key]);
    });
    
    if (config.cookies === false) delete req.headers.cookie;
    
    // Set relative path
    req.url = join('/', endpointUri);
    
    PROXY.web(req, res, proxyConfig());
    
    function getEndpointConfig (name) {
      
      return req.service.config[name] || req.service.config[name.toLowerCase()]
    }
    
    function proxyConfig () {
      
      // Set up proxy agent
      var proxyAgent = http;
      var _proxyConfig = {
        target: config.origin
        // timeout: config.timeout || DEFAULT_TIMEOUT
      };
      
      try {
        var parsed = url.parse(config.origin);
        agent = (parsed._protocol === 'https') ? https : http;
        _proxyConfig.headers = {
          host: parsed.host
        };
      }
      catch (e) {}
      
      _proxyConfig.agent = agent.globalAgent;
      
      return _proxyConfig;
    }
  };
};