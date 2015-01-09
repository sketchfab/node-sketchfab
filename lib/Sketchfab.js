'use strict';

var Task = require('./UploadTask');
var fs = require('fs');
var request = require('request');

function Sketchfab(token) {
    if (token === undefined) {
        throw 'API token is missing. Get your token at https://sketchfab.com/settings/password';
    } else {
        this._token = token;
    }
}

Sketchfab.prototype.upload = function(options, callback) {

    if (options.file) {
        fs.stat(options.file, function onFileCheck(err, stats) {
            if (stats.isFile()) {
                var task = new Task(this._token, options, stats);
                callback(null, task);
            } else {
                callback('File not found ' + options.file, null);
            }
        }.bind(this));
    } else {
        callback('No file specified', null);
    }

};

Sketchfab.prototype._get = function(endpoint, callback) {
    var base = 'https://sketchfab.com/v2';
    var req = request({
        method: 'GET',
        uri: base + endpoint,
        qs: {
            token: this._token
        }
    }, callback);
}

Sketchfab.prototype.me = function(callback) {
    this._get('/users/me', function(err, response, body){
        if (response.statusCode === 200) {
            var data = JSON.parse(body);
            callback(err, data);
        } else {
            var data = JSON.parse(body);
            var errMsg = 'Profile error';
            if (data && data.detail) {
                var errMsg = data.detail;
            }
            callback(errMsg, {});
        }
    });
}

module.exports = Sketchfab;
