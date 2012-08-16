#!/usr/bin/env node
/*
 * Generate some documentation from DOX + stupid templating.
 */

// Make `require()` work on HTML too!
require('jinjs').registerExtension(".html");

var fs = require('fs'),
    mkdirp = require('mkdirp'),
    optimist = require('optimist'),
    parser = require('./lib/parser'),
    path = require('path'),
    template = require('./templates/index.html');

/*
 * Read arguments
 */
var argv = optimist
    .usage("$0 --out <outdir> file1.js ...")
    .describe("out", "Dir to write output in")
    .demand(1)
    .demand("out")
    .argv;

/*
 * Create output directory
 */
var staticDir = path.join(argv.out, 'static');
mkdirp(staticDir, function () {
    /*
     * Run each file through DOX and figure out paths.
     */
    var parsedFiles = [];
    argv._.forEach(function (file) {
        // Set up data structures
        var outFile = file
            .replace(/\.js$/, '')
            .replace(/\//g, '_') + '.html';

        // Push out data.
        parsedFiles.push({
            source: file,
            dox: parser(file),
            outFileRelative: outFile,
            outFile: path.join(argv.out, outFile)
        });
    });

    /*
     * Run each file through the template and write it out.
     */
    parsedFiles.forEach(function (file) {
        fs.writeFileSync(file.outFile, template.render({
            docs: file.dox,
            files: parsedFiles,
            title: file.source
        }));
        console.log("✓ Wrote", file.outFile);
    });

    /*
     * Create an index.html, if there's no index.js.
     */
    var indexHtml = true;
    parsedFiles.forEach(function (doc) {
        indexHtml = indexHtml && (doc.source !== 'index.js');
    });
    if (indexHtml) {
        var index = path.join(argv.out, "index.html");
        fs.writeFileSync(index, template.render({
            files: parsedFiles,
            title: "Documentation index"
        }));
        console.log("✓ Wrote", index, "(no index.js to use as entry point)");
    }

    /*
     * Copy static files
     */
    ['prism.css', 'prism.js'].forEach(function (file) {
        var source = path.join(__dirname, 'static', file),
        target = path.join(staticDir, file);

        fs.createReadStream(source)
            .on('end', function() { console.log("✓ Wrote", target); })
            .pipe(fs.createWriteStream(target));
    });
});
