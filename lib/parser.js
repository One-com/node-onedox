/*
 * The document parser
 */

var dox = require('dox')
    fs = require('fs');

/*
 * Parse the file given by `filename`.
 *
 * Firstly, block-comments containing `global foobar` and `jshint ...` will be
 * removed. Then the document is parsed by `dox`. If that fails (dox doesn't
 * understand files without comments!), a simple dox-response is emulated by
 * including the entire file in one go.
 */
function parse(filename) {
    var fileData = fs.readFileSync(filename, 'utf-8'),
        output = undefined;

    // Remove jshint/global - lines
    fileData = fileData
        .split("\n")
        .filter(function (line) {
            return !line.match(/^\s*\/\*(global|jshint).*\*\/$/);
        })
        .join("\n");

    // Try parsing the data using dox
    try {
        output = dox.parseComments(fileData);
    } catch (e) {
        // No? Then fake the output data
        output = [{description:{full:""},code:fileData}];
    }

    return output;
}

module.exports = parse;
