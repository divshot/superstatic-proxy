var PORT = 9999;

var proxy = require('../index.js');
var expect = require('expect.js');
var request = require('supertest');
var connect = require('connect');
var Mocksy = require('mocksy');
var clone = require('deap').clone;
var server = new Mocksy({port: PORT});

var proxySettings = {
  "api": {
    "origin": "http://localhost:" + PORT,
    headers: {
      'Accept': 'application/json'
    }
  }
};

var configSetup = function (req, res, next) {
  req.config = {
    proxy: proxySettings
  };
  next();
};

describe('Superstatic Proxy', function () {
  var app;
  
  beforeEach(function (done) {
    app = connect()
      .use(clone(configSetup))
      .use(proxy);
      
    server.start(done);
  });
  
  afterEach(function (done) {
    server.stop(done);
  });
  
  it('proxies a request', function (done) {
    request(app)
      .get('/__/proxy/api/users.json')
      .expect(200)
      .expect(function (data) {
        expect(data.res.body.url).to.equal('/users.json');
      })
      .end(done);
  });
  
  it('skips middleware if proxy is not defined');
  
  it('passes through the headers', function (done) {
    request(app)
      .get('/__/proxy/api/users.json')
      .expect(200)
      .expect(function (data) {
        expect(data.res.body.headers['accept']).to.equal('application/json');
      })
      .end(done);
  });
  
  it.only('overrides the config headers with any headers sent in the ajax request', function (done) {
    request(app)
      .get('/__/proxy/api/users.json')
      .set('Accept', 'text/html')
      .expect(200)
      .expect(function (data) {
        expect(data.res.body.headers['accept']).to.equal('text/html');
      })
      .end(done);
  });
  
  it('passes through http basic auth credentials');
  
});