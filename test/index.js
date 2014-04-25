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
    },
    timeout: 30
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
  
  it('proxies a request with the requested method', function (done) {
    request(app)
      .post('/__/proxy/api/users.json')
      .expect(200)
      .expect(function (data) {
        expect(data.res.body.method).to.equal('POST');
      })
      .end(done);
  });
  
  it('skips middleware if proxy is not defined', function (done) {
    var app = connect()
      .use(proxy);
    
    request(app)
      .get('/__/proxy/api/users.json')
      .expect(404)
      .end(done);
  });
  
  it('passes through the headers', function (done) {
    request(app)
      .get('/__/proxy/api/users.json')
      .expect(200)
      .expect(function (data) {
        expect(data.res.body.headers['accept']).to.equal('application/json');
      })
      .end(done);
  });
  
  it('overrides the config headers with any headers sent in the ajax request', function (done) {
    request(app)
      .get('/__/proxy/api/users.json')
      .set('Accept', 'text/html')
      .expect(200)
      .expect(function (data) {
        expect(data.res.body.headers['accept']).to.equal('text/html');
      })
      .end(done);
  });
  
  it('configures request body pass through');
  it('configures cookie pass through');
  
  it('configures request timeout', function (done) {
    var domain = require('domain');
    var d = domain.create();
    var app = connect()
      .use(clone(configSetup))
      .use(function (req, res, next) {
        req.config.proxy.api.timeout = 0.001;
        next();
      })
      .use(proxy);
    
    d.run(function () {
      request(app)
        .get('/__/proxy/api/users.json')
        .end(function () {
          throw new Error('Timeout not set or did not timeout');
        });
    });
    
    d.on('error', function (err) {
      if (err.code === 'ECONNRESET') done();
      if (err.message === 'Timeout not set or did not timeout') throw new Error(err.message);
    });
  });
  
  it('configures http basic auth credentials');
  
});