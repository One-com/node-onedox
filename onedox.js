#!/usr/bin/env node
/*
 * Generate some documentation from DOX + stupid templating.
 */

/*global console*/

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
    .alias("o", "out")
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
            outFile: path.join(argv.out, outFile),
            sourceFilename: path.basename(file)
        });
    });

    /* Show a nice tree hierarcy.
     */
    var menuTree = {},
        inspect = require('util').inspect;

    parsedFiles.forEach(function (file) {
        var dirname = path.dirname(file.source);

        if (dirname in menuTree) {
            menuTree[dirname].files.push(file);
        } else {
            menuTree[dirname] = {
                sortKey: dirname,
                files: [file],
                dirname: path.basename(dirname) + "/",
                indent: dirname.split("/").length - 1
            };
        }
    });

    // Flatten and sort based on full path (`sortKey`).
    var menu = [];
    Object.keys(menuTree).sort().forEach(function (key) {
        // Sort file names in folder
        menuTree[key].files.sort(function (a, b) {
            return a.sourceFilename.localeCompare(b.sourceFilename);
        });

        // Push it on the output array
        menu.push(menuTree[key]);
    });

    /*
     * Run each file through the template and write it out.
     */
    parsedFiles.forEach(function (file) {
        fs.writeFileSync(file.outFile, template.render({
            docs: file.dox,
            menu: menu,
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
            menu: menu,
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
            .on('end', function () { console.log("✓ Wrote", target); })
            .pipe(fs.createWriteStream(target));
    });
});
