var http = require('http');
var formidable = require('formidable');

var Mocksy = function (options) {
  this.port = options.port || 1337;
  this.started = false;
  this.stopped = true;
  this.server = http.createServer(function (req, res) {
    var form = new formidable.IncomingForm();
    
    form.parse(req, function(err, fields, files) {
     res.writeHead(200, {'Content-Type': 'application/json'});
       res.end(JSON.stringify({
         headers: req.headers,
         url: req.url,
         method: req.method,
         body: fields,
         files: files,
         withCredentials: req.withCredentials
       }));
    });
  });
};

Mocksy.prototype.start = function (callback) {
  var self = this;
  
  if (this.started) {
    return callback();
  }
  
  this.server.listen(this.port, function (err) {
    if (!err) {
      self.started = true;
      self.stopped = false;
    }
    
    callback(err);
  });
};

Mocksy.prototype.stop = function (callback) {
  var self = this;
  
  if (this.stopped) {
    return callback();
  }
  
  this.server.close(function (err) {
    if (!err) {
      self.started = false;
      self.stopped = true;
    }
    
    callback(err);
  });
};

module.exports = Mocksy;