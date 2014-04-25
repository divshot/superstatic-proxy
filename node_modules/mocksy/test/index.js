var test = require('tape');
var Mocksy = require('../');
var request = require('request');

test('Instantiates Mocksy', function (t) {
  var mocksy = new Mocksy({port: 4321});
  
  t.equal(mocksy.port, 4321, 'sets the port');
  t.ok(mocksy.start, 'start method');
  t.ok(mocksy.stop, 'stop method');
  t.equal(mocksy.started, false, 'server is not started');
  t.equal(mocksy.stopped, true, 'server is stopped');
  t.ok(mocksy.server, 'creates the server');
  
  t.end();
});

test('Starts and stops the server', function (t) {
  var mocksy = new Mocksy({port: 4322});
  
  mocksy.start(function (err) {
    t.notOk(err, 'no error starting server');
    t.ok(mocksy.started, 'server is started');
    t.notOk(mocksy.stopped, 'server is not stopped');
    
    mocksy.start(function () { // test for server already started
      mocksy.stop(function (err) {
        t.equal(mocksy.started, false, 'server is not started');
        t.equal(mocksy.stopped, true, 'server is stopped');
         
        mocksy.stop(function () {
          // test for already stopped server
          t.end();
        });
         
      });
    });
    
  });
});

test('Response values' , function (t) {
  var mocksy = new Mocksy({port: 1337});
  
  mocksy.start(function () {
    
    request({
      url: 'http://localhost:1337',
      method: 'GET',
      withCredentials: true
    }, function (err, response, body) {
      body = JSON.parse(body);
      t.equal(body.method, 'GET', 'method');
      t.equal(body.url, '/', 'url')
      t.deepEqual(body.headers, {
        host: 'localhost:1337', connection: 'keep-alive'
      }, 'headers');
      t.deepEqual(body.body, {}, 'body');
      t.deepEqual(body.files, {}, 'files');
      
      mocksy.stop(function () {
        t.end();
      });
    });
    
  });
});