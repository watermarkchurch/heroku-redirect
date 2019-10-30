var express = require('express');
var { URL } = require('url');
var pathToRegexp = require('path-to-regexp');
var app = express();

var redirectStatus = parseInt(process.env.REDIRECT_STATUS || 301);
var port = process.env.PORT || 5000;
var baseUrl = new URL(process.env.NEW_BASE_URL)

var rules = Object.keys(process.env).filter(k => /RULE_/.test(k)).map(ruleName => {
  const rule = process.env[ruleName]

  const [pattern, to, status] = rule.split(' ').map((s) => s.trim())
  let statusCode
  try {
    statusCode = parseInt(status)
  } catch(ex) {
  }
  statusCode = statusCode || redirectStatus

  return { pattern: pathToRegexp(pattern), to: new URL(to), status: statusCode, name: ruleName }
})

app.get('*', function(request, response) {
  var requestUrl = new URL(`${request.protocol}://${request.host}${request.path}`)

  requestUrl = requestUrl.toString()
  var rule = rules.find((r) => r.pattern.test(requestUrl) || r.pattern.test(request.path))
  if (rule) {
    var newUrl = new URL(rule.to).toString()
    console.log('Match', rule.name, rule.status, requestUrl, '=>', newUrl)
    response.redirect(rule.status, newUrl);
    return
  }
  

  var newUrl = new URL(request.url, baseUrl).toString()
  console.log('No Match:', redirectStatus, requestUrl, '=>', newUrl)
  response.redirect(redirectStatus, newUrl);
});

app.listen(port, function() {
  console.log("Listening on " + port);
  process.send('listening')
});