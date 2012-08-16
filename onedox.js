#!/usr/bin/env node
/*
 * Generate some documentation from DOX + stupid templating.
 *
 * TODO:
 *  - Strip common directory prefixes, ex. remove `lib/` from all entries
 */

// Make `require()` work on HTML too!
require('jinjs').registerExtension(".html");

var dox = require('dox'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    optimist = require('optimist'),
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
    var files = [];
    argv._.forEach(function (file) {
        // Set up data structures
        var outFile = file.replace(/\.js$/, '').replace(/\//g, '_') + '.html';
        var data = {
            source: file,
            dox: undefined,
            outFile: path.join(argv.out, outFile)
        };

        // Work with the file
        var fileData = fs.readFileSync(file, 'utf-8');
        try {
            data.dox = dox.parseComments(fileData);
        } catch (e) {
            data.dox = [{description:{full:""},code:fileData}];
        }

        files.push(data);
    });

    /*
     * Run each file through the template and write it out.
     */
    files.forEach(function (file) {
        fs.writeFileSync(file.outFile, template.render({
            docs: file.dox,
            title: file.source
        }));
        console.log("✓ Wrote", file.outFile);
    });

    /*
     * Create an index.html, if there's no index.js.
     */
    var indexHtml = true;
    files.forEach(function (doc) {
        indexHtml = indexHtml && (doc.source !== 'index.js');
    });
    if (indexHtml) {
        var index = path.join(argv.out, "index.html");
        fs.writeFileSync(index, template.render({
            docs: [],
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
