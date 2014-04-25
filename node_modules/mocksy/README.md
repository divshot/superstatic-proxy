# mocksy

Mock Node.js http server for testing. Regurgitates the request object.

## Install

```
npm install mocksy --save-dev
```

## Usage

```javascript
var Mocksy = require('mocksy');
var mocksy = new Mocksy({port: 4321});

// In your test runner

describe('Some http endpoint', function () {
  beforeEach(function (done) {
    mocksy.start(done);
  });
  
  afterEach(function (done) {
    mocksy.stop(done);
  });
  
  it('should just work, right?', function (done) {
    // Do your http requests
  });
});

```

## API

#### new Mocksy([{port: 1337}]);

Create and instance of the mocksy mock server. Optionally pass in the following options

* ` port ` - server port. defaults to *1137* if no port is provided

#### start(callback)

Starts the mocksy mock server. Takes a callback as the only argument.

#### stop(callback)

Stops the mocksy mock server. Takes a callback as the only argument.

## Run Tests

```
npm test
```
