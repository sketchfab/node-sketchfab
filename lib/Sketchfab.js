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

    var self = this;

    if ( options.file ) {
        fs.exists( options.file, function() {
            var task = new Task( self._token, options );
            callback( null, task );
        });
    } else {
        callback( 'Unknown file', null );
    }

};

module.exports = Sketchfab;
