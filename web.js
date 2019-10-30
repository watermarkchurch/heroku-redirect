var express = require('express');
var { URL } = require('url');
var pathToRegexp = require('path-to-regexp');
var app = express();

var redirectStatus = parseInt(process.env.REDIRECT_STATUS || 301);
var port = process.env.PORT || 5000;
var baseUrl = new URL(process.env.NEW_BASE_URL)

var rules = Object.keys(process.env).filter(k => /RULE_/.test(k)).map(ruleName => {
  const rule = process.env[ruleName]

  const [pattern, to, status, preserve] = rule.split(' ').map((s) => s.trim())
  let statusCode
  try {
    statusCode = parseInt(status)
  } catch(ex) {
  }
  statusCode = statusCode || redirectStatus

  return {
    pattern: pathToRegexp(pattern),
    to,
    preserve: preserve && preserve.toLowerCase() == 'preserve',
    status: statusCode,
    name: ruleName
  }
})

app.get('*', function(request, response) {
  var requestUrl = new URL(request.url, `${request.protocol}://${request.hostname}`)

  var requestUrlStr = requestUrl.toString()
  var rule = rules.find((r) => r.pattern.test(requestUrlStr) || r.pattern.test(request.path))
  if (rule) {
    var newUrl = new URL(rule.to)
    if (rule.preserve) {
      newUrl.pathname = newUrl.pathname + request.path
      newUrl.search = requestUrl.search
    }
    console.log('Match', rule.name, rule.status, requestUrlStr, '=>', newUrl.toString())
    response.redirect(rule.status, newUrl.toString());
    return
  }
  

  var newUrl = new URL(request.url, baseUrl).toString()
  console.log('No Match:', redirectStatus, requestUrlStr, '=>', newUrl)
  response.redirect(redirectStatus, newUrl);
});

app.listen(port, function() {
  console.log("Listening on " + port);
  if (process.send) {
    process.send('listening')
  }
});