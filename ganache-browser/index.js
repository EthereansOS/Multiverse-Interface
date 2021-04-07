var fs = require('fs');
var path = require('path');

var sourceFileName = path.resolve(__dirname, 'tmp.js');

try {
    fs.unlinkSync(sourceFileName);
} catch(e) {
}

var destFileName = path.resolve(__dirname, 'dist', 'ganache.min.js');

try {
    fs.unlinkSync(destFileName);
} catch(e) {
}

function end(e) {
    try {
        fs.unlinkSync(sourceFileName);
    } catch(e) {
    }
    e && console.error(e);
    process.exit(0);
}

function onBrowserifyComplete(browsered) {
    var error;
    try {
        browsered = browsered.split('n.options.db_path?t(null,n.options.db_path):d.dir(t)').join('t(null,n.options.db_path)');
        browsered = require('uglify-js').minify(browsered).code;
        fs.writeFileSync(destFileName, browsered);
    } catch(e) {
        error = e;
    }
    end(error);
}

fs.writeFileSync(sourceFileName, 'global.MemDOWN=require("memdown");global.Ganache=require("ganache-core");');

var chunks = [];
var stream = require('browserify')().add(sourceFileName).bundle();
stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
stream.on('error', end);
stream.on('end', () => onBrowserifyComplete(Buffer.concat(chunks).toString('utf8')));