var express = require('express');
var { URL } = require('url')
var app = express();

var port = process.env.PORT || 5000;
var baseUrl = new URL(process.env.NEW_BASE_URL)

app.get('*', function(request, response) {
  var newUrl = new URL(request.url, baseUrl)
  response.redirect(301, newUrl.toString());
});

app.listen(port, function() {
  console.log("Listening on " + port);
});