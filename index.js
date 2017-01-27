module.exports = function (sails) {

  return {
    initialize: function(cb) {
      var asParameterizedQuery = this.asParameterizedQuery;
      sails.on('hook:orm:loaded', function() {
        Object.keys(sails.models).forEach(function(key) {
          if (sails.models[key].query) {
            sails.models[key].parameterizedQuery = function(query, parameterIndex) {
              return new Promise(function(resolve, reject) {
                var paramQuery = asParameterizedQuery(query, parameterIndex);
                sails.models[key].query(paramQuery.query, paramQuery.paramArray, function(err, response) {
                  if (err) {
                    return reject(err);
                  } else {
                    return resolve(response);
                  }
                });
              })
            }
          }
        });
        return cb();
      });
    },

    asParameterizedQuery: function(query, parameterIndex) {
      var paramStringArray = query.match(/\?\w+/gi);
      var paramArray = [];
      var parameterizedQuery = query;
      if (paramStringArray && paramStringArray.length) {
        paramStringArray.forEach(function(paramString) {
          var param = parameterIndex[paramString];
          if (!param) {
            throw new Error('No parameter found in index for '+paramString);
          }
          if (param.constructor === Array) {
            paramArray = paramArray.concat(param);
            var replacementString = param.map(function() {
              return '?';
            }).join(',');
            parameterizedQuery = parameterizedQuery.replace(paramString, replacementString);
          } else {
            paramArray.push(parameterIndex[paramString]);
            parameterizedQuery = parameterizedQuery.replace(paramString, '?');
          }
        });
      }

      return {
        query: parameterizedQuery,
        paramArray: paramArray
      }
    }
  };
};
