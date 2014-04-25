var path = require('path');
var find = require('lodash.find');

function Utils (options) {
  this.req = options.req;
  this._name = options.name;
}

Utils.prototype.serviceName = function () {
  return this._name;
};

Utils.prototype.serviceConfig = function () {
  return (this.req.config) ? this.req.config[this._name] : undefined;
};

Utils.prototype.requestingService = function () {
  return this.req.url.indexOf('/__/' + this._name) > -1;
};

Utils.prototype.skipService = function () {
  var skipService = false;
  
  if (!this.requestingService()) skipService = true;
  if (!this.serviceConfig()) skipService = true;
  
  return skipService;
};

// TODO: rename this
Utils.prototype.serviceTask = function () {
  return this.servicePath().split('/')[0];
};

Utils.prototype.hasServiceTask = function (task) {
  return this.serviceConfig().hasOwnProperty(task);
};

Utils.prototype.serviceTaskConfig = function () {
  var serviceConfig = this.serviceConfig();
  var serviceConfigKeys = Object.keys(this.serviceConfig());
  var serviceTask = this.serviceTask().toLowerCase();
  var name = find(serviceConfigKeys, function (key) {
    return serviceTask === key.toLowerCase();
  });
  
  return serviceConfig[name];
};

Utils.prototype.servicePath = function () {
  var pathRegexp = new RegExp('^\/__\/' + this._name + '\/');
  return this.req.url.replace(pathRegexp, '');
};

module.exports = Utils;