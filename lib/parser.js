/*
 * The document parser
 */

var dox = require('dox')
    fs = require('fs');

function parse(filename) {
    var fileData = fs.readFileSync(filename, 'utf-8'),
        output = undefined;

    try {
        output = dox.parseComments(fileData);
    } catch (e) {
        output = [{description:{full:""},code:fileData}];
    }

    return output;
}

module.exports = parse;
