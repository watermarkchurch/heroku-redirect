
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

This app redirects all requests to new domains based on a set of rules configured
in environment variables.  You can have as many rules as you want.  Rules
are processed in lexical order, the first matching rule is used.

## Configuration

To redirect all requests to www.example.com:

```bash
$ heroku config:add RULE_1="* https://www.example.com"

$ curl -I https://heroku-redirect.herokuapp.com/test
HTTP/1.1 302 Found
Server: Cowboy
Connection: keep-alive
X-Powered-By: Express
Location: https://www.example.com
```

To use an alternative HTTP status code, add it to the rule.  The default is 302
temporary redirect.
```
$ heroku config:add RULE_1="* https://www.example.com 301"

$ curl -I https://heroku-redirect.herokuapp.com/test
HTTP/1.1 301 Moved Permanently
Server: Cowboy
Connection: keep-alive
X-Powered-By: Express
Location: https://www.example.com
```

To preserve path and query info, set the "preserve" option

```
$ heroku config:add RULE_1="* https://www.example.com 302 preserve"

$ curl -I https://heroku-redirect.herokuapp.com/test
HTTP/1.1 302 Found
Server: Cowboy
Connection: keep-alive
X-Powered-By: Express
Location: https://www.example.com/test
```

To differentiate by host (or even by path criteria) set multiple rules.

```
$ heroku config:add RULE_1="https://www.my-old-site.com https://www.my-new-site.com/legacy 301 preserve"
$ heroku config:add RULE_999="* https://www.example.com"

$ curl -I https://heroku-redirect.herokuapp.com/test
HTTP/1.1 301 Moved Permanently
Server: Cowboy
Connection: keep-alive
X-Powered-By: Express
Location: https://www.my-new-site.com/legacy/test

$ curl -I https://heroku-redirect.herokuapp.com/test
HTTP/1.1 302 Found
Server: Cowboy
Connection: keep-alive
X-Powered-By: Express
Location: https://www.example.com
```

Matching is done using the [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) library.  The first
matching rule in lexical order is used.
