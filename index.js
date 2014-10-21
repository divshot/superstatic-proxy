var _ = require('lodash');
var join = require('join-path');
var httpProxy = require('http-proxy');

var DEFAULT_TIMEOUT = 30000;

module.exports = function () {
  
  
  return function (req, res, next) {
    
    if (!req.service || !req.service.config) return next();
    
    var proxy = httpProxy.createProxyServer();
    var requestUrlValues = (req.service.path || req.url).split('/');
    var proxyName = requestUrlValues[2];
    var config = getEndpointConfig(proxyName);
    
    if (!config) return next();
    
    var endpointUri = _.rest(requestUrlValues, 3).join('/');
    
    // Set headers
    _.each(config.headers, function (val, key) {
      
      req.headers[key.toLowerCase()] =
        (req.headers[key.toLowerCase()] || config.headers[key]);
    });
    
    if (config.cookies === false) delete req.headers.cookie;
    
    // Set relative path
    req.url = join('/', endpointUri);
    
    // Remove request origin
    delete req.headers.host;
    delete req.headers.origin; // TODO: test this
    delete req.headers.referer; // TODO: test this
    
    proxy.web(req, res, {
      target: config.origin,
      timeout: config.timeout || DEFAULT_TIMEOUT
    });
    
    function getEndpointConfig (name) {
      return req.service.config[name] || req.service.config[name.toLowerCase()]
    }
  };
  
};