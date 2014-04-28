var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});

var DEFAULT_TIMEOUT = 3000;


module.exports = function (req, res, next) {
  req.url = req.service.path;
  
  proxy.web(req, res, {
    target: req.service.config.origin
  });
};