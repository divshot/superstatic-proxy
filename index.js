var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});

var DEFAULT_TIMEOUT = 3000;

module.exports = function (req, res, next) {
  if (!req.service || !req.service.config) return next();
  
  var config = req.service.config;
  
  // Set relative path
  req.url = req.service.path || req.url; // TODO: test this "OR"
  
  // Set headers
  Object.keys(config.headers).forEach(function (key) {
    req.headers[key.toLowerCase()] = req.headers[key.toLowerCase()] || req.service.config.headers[key];
  });
  
  // Set or unset cookies
  if (config.cookies === false) delete req.headers.cookie;
  
  // Send proxy
  proxy.web(req, res, {
    target: config.origin,
    timeout: config.timeout || DEFAULT_TIMEOUT
  });
};