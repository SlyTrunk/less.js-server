less.js-server
============
A simple HTTP node.js server for local less.js compilation.

Usage
=====

  // Start Server:
  $ node lessServer.js
  LESS Server running at http://127.0.0.1:8000/

  // Make a request to the server
  $ curl "http://127.0.0.1:8000/?lessFilePath=test.less&cssFilePath=test.css&paths=%2Fcss

  // Magic!