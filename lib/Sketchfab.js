'use strict';

var Task = require('./UploadTask');
var fs = require('fs');

function Sketchfab(token) {
    if (token === undefined) {
        throw 'API token is missing. Get your token at https://sketchfab.com/settings/password';
    } else {
        this._token = token;
    }
}

Sketchfab.prototype.upload = function(options, callback) {

    if (options.file) {
        fs.exists(options.file, function onFileCheck(exists) {
            if (exists) {
                var task = new Task(this._token, options);
                callback(null, task);
            } else {
                callback('File not found ' + options.file, null);
            }
        }.bind(this));
    } else {
        callback('No file specified', null);
    }

};

module.exports = Sketchfab;
