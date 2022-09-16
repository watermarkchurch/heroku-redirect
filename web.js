var express = require('express');
var { URL } = require('url');
var pathToRegexp = require('path-to-regexp');
var app = express();

var redirectStatus = parseInt(process.env.REDIRECT_STATUS || 301);
var port = process.env.PORT || 5000;
var baseUrl = new URL(process.env.NEW_BASE_URL)

const RULE_REGEXP = /RULE_(\d+)/

var rules = Object.keys(process.env)
    .map(k => RULE_REGEXP.exec(k))
    .filter((match) => match && match[0])
    .map((match) => ({ ruleName: match[0], number: tryParseInt(match[1]) }))
    .sort(byNumber)
    .map(({ruleName, number}) => {
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
  console.log('Incoming request', requestUrl.toString())

  var requestUrlStr = requestUrl.toString()
  var rule = rules.find((r) => r.pattern.test(requestUrlStr) || r.pattern.test(request.path))
  if (rule) {
    var newUrl = new URL(rule.to)
    if (rule.preserve) {
      newUrl.pathname = newUrl.pathname.replace(/\/$/, '') + request.path
      var ruleSearch = new URLSearchParams(newUrl.search)
      var requestSearch = new URLSearchParams(requestUrl.search)
      newUrl.search = new URLSearchParams({
        ...Object.fromEntries(ruleSearch),
        ...Object.fromEntries(requestSearch)
      }).toString()
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

function tryParseInt(str) {
  try {
    return parseInt(str)
  } catch {
    return
  }
}

function byNumber(a, b) {
  return a.number - b.number
}