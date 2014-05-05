var path = require('path');
var httpProxy = require('http-proxy');
var _ = require('lodash');
var proxy = httpProxy.createProxyServer({});
var DEFAULT_TIMEOUT = 3000;

module.exports = function () {
  return function (req, res, next) {
    if (!req.service || !req.service.config) return next();
    
    var requestUrlValues = (req.service.path || req.url).split('/');
    var proxyName = requestUrlValues[2];
    var config = getEndpointConfig(proxyName); // TODO: this should be case-insensitive
    var endpointUri = _.rest(requestUrlValues, 3).join('/');
    
    if (!config) return next();
    
    // Set headers
    _.each(config.headers, function (val, key) {
      req.headers[key.toLowerCase()] =
        (req.headers[key.toLowerCase()] || config.headers[key]);
    });
    
    // Set or unset cookies
    if (config.cookies === false) delete req.headers.cookie;
    
    // Set relative path
    req.url = path.join('/', endpointUri);
    
    // Send proxy
    proxy.web(req, res, {
      target: config.origin,
      timeout: config.timeout || DEFAULT_TIMEOUT
    });
    
    function getEndpointConfig (name) {
      return req.service.config[name] || req.service.config[name.toLowerCase()]
    }
  };
  
};