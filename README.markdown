less.js-server
============
A simple HTTP node.js server for local less.js compilation.

We use this extensively during development to compile *.less files into *.css files. We run it as root so that the created files have the correct permissions, and can be written into any of our dev trees.

Our basic flow is:

1. While gathering .css files up to serve, notice if any of the corresponding *.less files have been changed
2. Curl the  http server described in this project (which wraps lessc), with the *.less file path, *.css file path, and a list of encoded include paths.
3. The lessc server does it's thing.
4. The output is written into the specified .css file in the developer file system, ready to be served
5. CSS is bundled up and served
6. Compiled CSS is checked in

N.B. we only do this in development. 

Usage
=====

    // Start Server:
    $ node lessServer.js
    LESS Server running at http://127.0.0.1:8000/

    // Make a request to the server
    $ curl "http://127.0.0.1:8000/?lessFilePath=%2Fhome%2Fbdalziel%2FtestFile.less&cssFilePath=%2Fhome%2Fbdalziel%2FtestFile.css&paths=%2Fhome%2Fbdalziel%2F

    // Magic!
