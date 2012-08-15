#!/usr/bin/env node
/*
 * Generate some documentation from DOX + stupid templating.
 *
 * TODO:
 *  - Check the output directory exists (or create it)
 *  - Strip common directory prefixes, ex. remove `lib/` from all entries
 */

// Make `require()` work on HTML too!
require('jinjs').registerExtension(".html");

var dox = require('dox'),
    fs = require('fs'),
    optimist = require('optimist'),
    path = require('path'),
    template = require('./templates/index.html');

var argv = optimist
    .usage("$0 --out <outdir> file1.js ...")
    .describe("out", "Dir to write output in")
    .demand(1)
    .demand("out")
    .argv;

/*
 * Read files and DOX them.
 */
var files = [],
    linkList = {};

/*
 * Run each file through DOX and figure out paths.
 */
argv._.forEach(function (file) {
    try {
        var docs = dox.parseComments(fs.readFileSync(file, 'utf-8'));
    } catch (e) {
        console.error("✗ Couldn't parse", file);
        return;
    }

    var outFile = file.replace(/\.js$/, '').replace(/\//g, '_') + '.html';
    linkList[file] = outFile;
    files.push({
        source: file,
        dox: docs,
        outFile: path.join(argv.out, outFile)
    });
});

/*
 * Run each file through the template and write it out.
 */
files.forEach(function (file) {
    fs.writeFileSync(file.outFile, template.render({
        docs: file.dox,
        menu: linkList,
        title: file.source
    }));
    console.log("✓ Wrote", file.outFile);
});

/*
 * Create an index.html, if there's no index.js.
 */
if (!('index.js' in linkList)) {
    var index = path.join(argv.out, "index.html");
    fs.writeFileSync(index, template.render({
        docs: [],
        menu: linkList,
        title: "Documentation index"
    }));
    console.log("✓ Wrote", index, "(no index.js to use as entry point)");
}
