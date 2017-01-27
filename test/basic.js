var Sails = require('sails').Sails;
var assert = require('assert');

describe('Basic tests ::', function() {

  // Var to hold a running sails app instance
  var sails;

  // Before running any tests, attempt to lift Sails
  before(function (done) {

    // Hook will timeout in 10 seconds
    this.timeout(11000);

    // Attempt to lift sails
    Sails().lift({
      hooks: {
        // Load the hook
        "parameterized-query": require('../index'),
        // Skip grunt (unless your hook uses it)
        "grunt": false
      },
      log: {level: "error"}
    },function (err, _sails) {
      if (err) return done(err);
      sails = _sails;
      return done();
    });
  });

  // After tests are complete, lower Sails
  after(function (done) {

    // Lower Sails (if it successfully lifted)
    if (sails) {
      return sails.lower(done);
    }
    // Otherwise just return
    return done();
  });

  // Test that Sails can lift with the hook in place
  it ('sails does not crash', function() {
    return true;
  });

  it ('query without any parameters to escape', function(done) {
    var result = sails.hooks['parameterized-query'].asParameterizedQuery('SELECT * FROM table', {});
    assert.strictEqual(result.query, 'SELECT * FROM table', 'query is equal');
    assert.deepEqual(result.paramArray, [], 'params are equal');
    done();
  });

  it ('query with single parameter to escape', function(done) {
    var result = sails.hooks['parameterized-query'].asParameterizedQuery('SELECT * FROM table WHERE id = ?id', {'?id':7});
    assert.strictEqual(result.query, 'SELECT * FROM table WHERE id = ?', 'query is equal');
    assert.deepEqual(result.paramArray, [7], 'params are equal');
    done();
  });

  it ('query with multiple use of same parameter', function(done) {
    var query = 'SELECT * FROM table WHERE id = ?id AND name = ?name OR foreign_id = ?id';
    var paramIndex = {'?id':7, '?name': 'john'};
    var result = sails.hooks['parameterized-query'].asParameterizedQuery(query, paramIndex);
    assert.strictEqual(result.query, 'SELECT * FROM table WHERE id = ? AND name = ? OR foreign_id = ?', 'query is equal');
    assert.deepEqual(result.paramArray, [7,'john',7], 'params are equal');
    done();
  });

  it ('query with parameter array', function(done) {
    var query = 'SELECT * FROM table WHERE id IN (?id)';
    var paramIndex = {'?id':[7,9,13]};
    var result = sails.hooks['parameterized-query'].asParameterizedQuery(query, paramIndex);
    assert.strictEqual(result.query, 'SELECT * FROM table WHERE id IN (?,?,?)', 'query is equal');
    assert.deepEqual(result.paramArray, [7,9,13], 'params are equal');
    done();
  });

  it ('query with parameter missing from param index', function(done) {
    var query = 'SELECT * FROM table WHERE id IN (?id) AND name = ?name';
    var paramIndex = {'?id':[7,9,13]};
    try {
      var result = sails.hooks['parameterized-query'].asParameterizedQuery(query, paramIndex);
    } catch (e) {
      assert.strictEqual(e.message, 'No parameter found in index for ?name', 'error message is equal');
      done();
    }
  });

});
