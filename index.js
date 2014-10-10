var _ = require('lodash');
var request = require('request');
var join = require('join-path');
var stacked = require('stacked');
var bodyParser = require('body-parser');

var DEFAULT_TIMEOUT = 30000;

module.exports = function () {
  return function (req, res, next) {
    if (!req.service || !req.service.config) return next();
    
    var stack = stacked();
    var requestUrlValues = (req.service.path || req.url).split('/');
    var proxyName = requestUrlValues[2];
    var config = getEndpointConfig(proxyName);
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
    req.url = join('/', endpointUri);
    
    // Remove request origin
    delete req.headers.host;
    delete req.headers.origin; // TODO: test this
    delete req.headers.referer; // TODO: test this
    
    stack.use(bodyParser.json());
    stack.use(bodyParser.raw());
    stack.use(bodyParser.text());
    stack.use(bodyParser.urlencoded({extended: true}));
    stack.use(function (req, res, next) {
      
      var options = {
        url: join(config.origin, req.url),
        method: req.method,
        tunnel: true,
        headers: req.headers,
        timeout: (config.timeout)*1000 || DEFAULT_TIMEOUT
      };
      
      if (req.body && Object.keys(req.body).length > 0)  {
        try {
          var body = JSON.parse(req.body);
          options.json = true;
        }
        catch (e) {}
        
        options.body = JSON.stringify(req.body);
      }
      
      request(options).pipe(res);
    });
    
    stack(req, res, next);
    
    function getEndpointConfig (name) {
      return req.service.config[name] || req.service.config[name.toLowerCase()]
    }
  };
  
};