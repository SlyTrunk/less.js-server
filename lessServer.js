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

console.log("\n====================================================================");
console.log('| Created by Ben Dalziel: https://github.com/SlyTrunk/less.js-server');
console.log('| LESS Server running at http://' + ip + ':' + port + '/');
console.log('| node.js version: "' + process.version + '"');
console.log('| LESS version: "' + less.version + '"');
console.log('===================================================================');

function handleCompileLessFileRequest (req, res) {

    var lessFilePath = getLessFilePathFromRequest(req);
    var cssFilePath  = getCssFilePathFromRequest(req);
    var paths        = getPathsFromRequest(req);
    var compileToFile = (cssFilePath != '');

    console.log("LESS File:  " + lessFilePath);
    console.log("CSS File:   " + cssFilePath);

    // First read the LESS file
    fs.readFile(lessFilePath, 'utf8', function (err, lessFileContents) {
        if (err) {
            less.writeError(err);
            return reqErr(res, err, "LESS FILE READ ERROR: Line " + err.line + ', ' + err.message + '. File: ' + lessFilePath);
        }
        compileLessFile(res, lessFileContents, lessFilePath, cssFilePath, paths, compileToFile);
    });
}

/*
 * Delegates to less.js to compile the requested file.
 * exceptions are caught and the request is closed following apropriate messaging
 */
function compileLessFile(res, lessFileContents, lessFilePath, cssFilePath, paths, compileToFile) {

    // Compile the content of the Less file
    less.render( lessFileContents, 
                 { paths: paths.split(',') }, 
                 function(compilationError, compiledCssOutput) {
                     if (compilationError) {
                         // Log Paths to help with debuggin - often an issue with include precedence
                         console.log("PATHS (in order of precedence)): \n" + paths.split(',').join("\n"));
                         less.writeError(compilationError);
                         return reqErr(res, compilationError, "LESS PARSER ERROR: Line " + compilationError.line + ', ' + compilationError.message + '. File: ' + lessFilePath);
                     }
                     if (compileToFile) {
                         writeCompiledOutputToCssFile(res, compiledCssOutput, cssFilePath);
                     }
                 } );
}

/*
 * Will write the CSS held within the tree to the file at the given path
 */
function writeCompiledOutputToCssFile (res, css, path) {
    try {
        fd = fs.openSync(path, "w");
        fs.writeSync(fd, css, 0, "utf8");
        fs.closeSync(fd);

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

function getCompileToFileFromRequest (req) {

    var toFile = true;

    var parsedUrl = require('url').parse(req.url, true);
    if (parsedUrl.query.toFile) {
        toFile = (parsedUrl.query.toFile == 'true');
    }
    return toFile;
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
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end("[" + new Date() + "] " + msg + "\n");
    console.log(msg);
    return;
}
