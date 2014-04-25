var request = require('request');
var _ = require('lodash');
var merge = require('merge');
var urlJoin = require('url-join');
var Utils = require('./superstatic-utils');

module.exports = function proxy (req, res, next) {
  var utils = new Utils({
    req: req,
    name: 'proxy'
  });
  
  if (utils.skipService()) return next();
  
  var serviceConfig = utils.serviceConfig();
  
  // Skip if there are not child tasks or if this is only 
  // a single proxy. If there is no origin, then skip.
  if (!utils.hasServiceTask(utils.serviceTask())) return next(); 
  
  var config = utils.serviceTaskConfig();
  var url = urlJoin(config.origin, pathWithoutTaskName(utils));
  
  var requestObject = {
    url: url,
    headers: merge(lowerCaseObjectKeys(config.headers), lowerCaseObjectKeys(req.headers))
  };
  
  // Proxy request
  request.get(requestObject).pipe(res);
  
  function pathWithoutTaskName () {
    return _.rest(utils.servicePath().split('/')).join('/');
  }
  
  function lowerCaseObjectKeys (source) {
    var lowerCaseObject = {};
    
    _.each(source, function (val, key) {
      lowerCaseObject[key.toLowerCase()] = val;
    });
    
    return lowerCaseObject;
  };
};