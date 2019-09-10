var express = require('express');
var { URL } = require('url')
var app = express();

var redirectStatus = parseInt(process.env.REDIRECT_STATUS || 301);
var port = process.env.PORT || 5000;
var baseUrl = new URL(process.env.NEW_BASE_URL)

Object.keys(process.env).filter(k => /RULE_/.test(k)).forEach(ruleName => {
  const rule = process.env[ruleName]

  const [pattern, to, status] = rule.split(' ').map((s) => s.trim())
  let statusCode
  try {
    statusCode = parseInt(status)
  } catch(ex) {
  }

  app.get(pattern, function(request, response) {
    var newUrl = new URL(to)
    response.redirect(statusCode || 301, newUrl.toString());
  })
})

app.get('*', function(request, response) {
  var newUrl = new URL(request.url, baseUrl)
  response.redirect(redirectStatus, newUrl.toString());
});

app.listen(port, function() {
  console.log("Listening on " + port);
});