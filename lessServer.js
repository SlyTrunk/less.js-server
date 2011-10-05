var fs   = require('fs');   // File System: http://nodejs.org/docs/v0.3.1/api/fs.html
var http = require('http'); // Http:        http://nodejs.org/docs/v0.3.1/api/http.html
var less = require('less'); // LESS:        http://lesscss.org/#-client-side-usage

// Server Config
var ip   = "127.0.0.1";
var port = 8000;


/*
 * @brief A local HTTP sever listening for LESS file compilation requests.
 *
 * Requests take the form of:
 *  - curl http://127.0.0.1:8000/home/bdalziel/dev/test/trunk/css/test.less
 *
 * The request path (req.url) is the path to the local LESS file to be compiled.
 * The output of the compilation is saved to a file within the same directory, and 
 * and same file root, with the .css extension.
 * E.g. '/test/foo.less' => '/test/foo.css'
 *
 * The corresponding CSS file should exist already to prevent root creating a file
 * in your local file system (i.e. it should only modify).
 */
http.createServer(function (req, res) {
        handleCompileLessFileRequest (req, res);
    }).listen(port, ip);
console.log('LESS Server running at http://' + ip + ':' + port + '/');


function handleCompileLessFileRequest (req, res) {
    var lessFilePath = getFilePathFromRequest(req);
    fs.readFile(lessFilePath, 'utf8', function(err, data) {
            try {
                if (err) { throw err; }
                compileLessFile(res, data, lessFilePath);
            } catch (err) {
                reqErr(res, err, "FILE READ ERROR: " + err.message);
                return;
            }
        });
}

/*
 * Delegates to less.js to compile the requested file.
 * exceptions are caught and the request is closed following apropriate messaging
 *
 * Currently, @include references must be within the same directory
 */
function compileLessFile(res, data, lessFilePath) {
    var parser = new(less.Parser)({
            // Need to make this smarter
            paths: [lessFilePath.substring(0, lessFilePath.lastIndexOf("/"))],
            filename: lessFilePath
        });
    parser.parse(data, function (err, tree) {
            try {
                if (err) { throw err; }
                var compiledData = tree.toCSS();
                writeCompiledOutputToCssFile(res, lessFilePath.replace(".less", ".css"), compiledData);
            } catch (err) {
                reqErr(res, err, "LESS PARSER ERROR: Line " + err.line + ', ' + err.message + '. File: ' + lessFilePath);
                // Also pretty print
                less.writeError(err);
                return;
            }
        });
}

/*
 * Will write the compiled CSS to the corresponding foo.css file
 * within the same dir
 */
function writeCompiledOutputToCssFile (res, path, content) {
    fs.writeFile(path, content, function (err) {
            try {
                if (err) { throw err; }
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("LESS compilation Success! \n");
            } catch (err) {
                reqErr(res, err, "FILE WRITE ERROR: " + err.message);
                return;
            }
        });
}

function getFilePathFromRequest (req) {
    return req.url;
}

/*
 * Prints to the response buffer and console.
 * Terminates the response - error.
 */
function reqErr(res, err, msg) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end(msg + "\n");
    console.log(msg);
    return;
}
