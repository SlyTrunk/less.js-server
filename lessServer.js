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
 *  - curl http://127.0.0.1:8000/?lessFilePath={urlencoded file path}&cssFilePath={urlencoded file path}&paths={comma delimited urlencoded directories}
 *
 * lessFilePath is the full path to the local LESS file to be compiled.
 * The output of the compilation is saved to "cssFilePath".
 *
 * The corresponding CSS file should exist already to prevent root creating a file
 * in your local file system (i.e. it should only modify).
 */
http.createServer(function (req, res) {
        handleCompileLessFileRequest (req, res);
    }).listen(port, ip);
console.log('LESS Server running at http://' + ip + ':' + port + '/');

function handleCompileLessFileRequest (req, res) {

    var lessFilePath = getLessFilePathFromRequest(req);
    var cssFilePath  = getCssFilePathFromRequest(req);
    var paths        = getPathsFromRequest(req);

    console.log("LESS File: " + lessFilePath);
    console.log("CSS File:  " + cssFilePath);

    fs.readFile(lessFilePath, 'utf8', function (err, lessFileContents) {
            if (err) {
                less.writeError(err);
                return reqErr(res, err, "LESS FILE READ ERROR: Line " + err.line + ', ' + err.message + '. File: ' + lessFilePath);
            }
            compileLessFile(res, lessFileContents, lessFilePath, cssFilePath, paths);
        });
}

/*
 * Delegates to less.js to compile the requested file.
 * exceptions are caught and the request is closed following apropriate messaging
 */
function compileLessFile(res, data, lessFilePath, cssFilePath, paths) {

    var parser = new(less.Parser)({
            // Need to make this smarter
            paths: paths.split(','),
            filename: lessFilePath
        });

    // Awaiting 1.2.1 for removal of process.exit: https://github.com/cloudhead/less.js/issues/561
    parser.parse(data, function (err, tree) {
            if (err) {
                less.writeError(err);
                return reqErr(res, err, "LESS PARSER ERROR: Line " + err.line + ', ' + err.message + '. File: ' + lessFilePath);
            }
            writeCompiledOutputToCssFile(res, cssFilePath, tree);
        });
}

/*
 * Will write the CSS held within the tree to the file at the given path
 */
function writeCompiledOutputToCssFile (res, path, tree) {
    try {

        try {
            var css = tree.toCSS();
        } catch (err) {
            less.writeError(err);
            return reqErr(res, err, "TREE TO CSS ERROR: " + err.message);
        }

        fd = fs.openSync(path, "w");
        fs.writeSync(fd, css, 0, "utf8");

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("LESS compilation Success! \n");
    } catch (err) {
        less.writeError(err);
        return reqErr(res, err, "FILE WRITE ERROR: " + err.message);
    }
}

function getCssFilePathFromRequest (req) {
    var parsedUrl = require('url').parse(req.url, true);
    if (parsedUrl.query.cssFilePath) {
        var filePath =  parsedUrl.query.cssFilePath;
        return filePath;
    }
    return '';
}

function getLessFilePathFromRequest (req) {
    var parsedUrl = require('url').parse(req.url, true);
    if (parsedUrl.query.lessFilePath) {
        var filePath =  parsedUrl.query.lessFilePath;
        return filePath;
    }
    return '';
}

function getPathsFromRequest (req) {

    var parsedUrl = require('url').parse(req.url, true);
    if (parsedUrl.query.paths) {
        var pathsString = parsedUrl.query.paths;
        return pathsString;
    }
    return '';
}

/*
 * Prints to the response buffer and log.
 * Terminates the response - error.
 */
function reqErr(res, err, msg) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end("[" + new Date() + "] " + msg + "\n");
    console.log(msg);
    return;
}
