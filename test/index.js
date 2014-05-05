var PORT = 9999;

var proxy = require('../index.js');
var expect = require('expect.js');
var request = require('supertest');
var connect = require('connect');
var Mocksy = require('mocksy');
var clone = require('deap').clone;
var cookieParser = require('cookie-parser');
var server = new Mocksy({port: PORT});

var proxySettings = {
  api: {
    origin: "http://localhost:" + PORT,
    headers: {
      'Accept': 'application/json'
    },
    timeout: 30,
    cookies: true
  }
};

var configSetup = function (req, res, next) {
  req.service = {
    config: clone(proxySettings)
  };
  
  req.service.path = req.url.replace('/__', '');
  next();
};

describe('Superstatic Proxy', function () {
  var app;
  
  beforeEach(function (done) {
    app = connect()
      .use(clone(configSetup))
      .use(proxy());
      
    server.start(done);
  });
  
  afterEach(function (done) {
    server.stop(done);
  });
  
  it('skips middleware if config is not defined', function (done) {
    var app = connect()
      .use(proxy());
    
    request(app)
      .get('/__/proxy/api/users.json')
      .expect(404)
      .end(done);
  });
  
  it('skips the middleware if the endpiont name is not in the configuration', function (done) {
    var app = connect()
      .use(clone(configSetup))
      .use(proxy());
    
    request(app)
      .get('/__/proxy/not/users.json')
      .expect(404)
      .end(done);
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
  
  it('proxies a request, ignoring the proxy name case', function (done) {
    request(app)
      .post('/__/proxy/Api/users.json')
      .expect(200)
      .expect(function (data) {
        expect(data.res.body.method).to.equal('POST');
      })
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
  
  it('ignores headers in config if there are not any', function (done) {
    var app = connect()
      .use(configSetup)
      .use(function (req, res, next) {
        delete req.service.config.headers;
        next();
      })
      .use(proxy());
      
    request(app)
      .get('/__/proxy/api/users.json')
      .expect(200)
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
  
  it('configures request body pass through', function (done) {
    request(app)
      .post('/__/proxy/api/users.json')
      .send({key: 'value'})
      .expect(200)
      .expect(function (data) {
        expect(data.res.body.body).to.eql({key: 'value'});
      })
      .end(done);
  });
  
  it('strips the cookies if config cookies equal false', function (done) {
    var app = connect()
      .use(configSetup)
      .use(function (req, res, next) {
        req.service.config.api.cookies = false;
        next();
      })
      .use(cookieParser())
      .use(cookieSetter)
      .use(proxy());
      
    var agent = request.agent(app);
    
    agent
      .get('/set-cookie')
      .end(function () {
        setTimeout(function () {
          agent
            .get('/__/proxy/api/users.json')
            .expect(function (data) {
              expect(data.res.body.headers.cookie).to.equal(undefined);
            })
            .end(done);
        }, 0);
      });
    
    function cookieSetter (req, res, next) {
      if (req.url === '/set-cookie') {
        res.writeHead(200, [
          ['Set-Cookie', 'cookie1=test1; Path=/'],
          ['Set-Cookie', 'cookie2=test2; Path=/']
        ]);
        return res.end();
      }
      next();
    }
  });
  
  it('configures cookie pass through', function (done) {
    var app = connect()
      .use(configSetup)
      .use(cookieParser())
      .use(cookieSetter)
      .use(proxy());
      
    var agent = request.agent(app);
    
    agent
      .get('/set-cookie')
      .end(function () {
        setTimeout(function () {
          agent
            .get('/__/proxy/api/users.json')
            .expect(function (data) {
              expect(data.res.body.headers.cookie).to.eql('cookie1=test1;cookie2=test2');
            })
            .end(done);
        }, 0);
      });
    
    function cookieSetter (req, res, next) {
      if (req.url === '/set-cookie') {
        res.writeHead(200, [
          ['Set-Cookie', 'cookie1=test1; Path=/'],
          ['Set-Cookie', 'cookie2=test2; Path=/']
        ]);
        return res.end();
      }
      next();
    }
  });
  
  it('configures request timeout', function (done) {
    var domain = require('domain');
    var d = domain.create();
    var app = connect()
      .use(clone(configSetup))
      .use(function (req, res, next) {
        req.service.config.api.timeout = 0.001;
        next();
      })
      .use(proxy());
    
    d.run(function () {
      request(app)
        .get('/__/proxy/api/users.json')
        .end(function (err, data) {
          if (err.code === 'ECONNRESET') return;
          throw new Error('Timeout not set or did not timeout');
        });
    });
    
    d.on('error', function (err) {
      if (err.code === 'ECONNRESET') done();
      if (err.message === 'Timeout not set or did not timeout') throw new Error(err.message);
    });
  });
  
});