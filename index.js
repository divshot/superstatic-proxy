var _ = require('lodash');
var request = require('request');
var join = require('join-path');
var stacked = require('stacked');
var bodyParser = require('body-parser');

var DEFAULT_TIMEOUT = 30000;

module.exports = function () {
  return function (req, res, next) {
    
    console.log(req.method, 'PROXY:', 'in service');
    
    if (!req.service || !req.service.config) return next();
    
    console.log(req.method, 'PROXY:', 'has config');
    
    var stack = stacked();
    var requestUrlValues = (req.service.path || req.url).split('/');
    var proxyName = requestUrlValues[2];
    var config = getEndpointConfig(proxyName);
    var endpointUri = _.rest(requestUrlValues, 3).join('/');
    
    console.log(req.method, 'PROXY:', 'parsed config data', config);
    
    if (!config) return next();
    
    console.log(req.method, 'PROXY:', 'has config data. about to set headers');
    
    // Set headers
    _.each(config.headers, function (val, key) {
      req.headers[key.toLowerCase()] =
        (req.headers[key.toLowerCase()] || config.headers[key]);
    });
    
    console.log(req.method, 'PROXY:', 'set headers. about to adjust headers we do not need');
    
    // Set or unset cookies
    if (config.cookies === false) delete req.headers.cookie;
    
    // Set relative path
    req.url = join('/', endpointUri);
    
    // Remove request origin
    delete req.headers.host;
    delete req.headers.origin; // TODO: test this
    delete req.headers.referer; // TODO: test this
    
    console.log(req.method, 'PROXY:', 'headers removed. about to create body parsing middleware');
    
    stack.use(bodyParser.json());
    stack.use(bodyParser.raw());
    stack.use(bodyParser.text());
    stack.use(bodyParser.urlencoded({extended: true}));
    
    console.log(req.method, 'PROXY:', 'middleware created. about to add other main middleware');
    
    stack.use(function (req, res, next) {
      
      console.log(req.method, 'PROXY:', 'about to create options for request');
      
      var options = {
        url: join(config.origin, req.url),
        method: req.method,
        tunnel: true,
        headers: req.headers,
        timeout: (config.timeout)*1000 || DEFAULT_TIMEOUT
      };
      
      if (req.body && Object.keys(req.body).length > 0)  {
        try {
          options.json = JSON.parse(req.body);
        }
        catch (e) {}
      }
      
      if (req.body && !options.json) {
        try {
          options.body = JSON.stringify(req.body);
        }
        catch (e) {
          options.body = req.body
        }
      }
      
      console.log(req.method, 'PROXY:', 'created options for request', options);
      
      request(options).pipe(res);
    });
    
    stack(req, res, next);
    
    function getEndpointConfig (name) {
      return req.service.config[name] || req.service.config[name.toLowerCase()]
    }
  };
  
};