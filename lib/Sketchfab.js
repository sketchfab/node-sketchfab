'use strict';

var Task = require('./UploadTask');
var fs = require('fs');
var request = require('request');
var _ = require('lodash');

// auth = {
//     type: 'token' or 'oauth2',
//     token: the access token
// }

var CONFIG = {
    BASE_API_URL: 'https://api.sketchfab.com',
    BASE_SERVER_URL: 'https://sketchfab.com',
    UPLOAD_ENDPOINT: '/v3/models',
    POLL_ENDPOINT: '/v3/models/{uid}',
    ME_ENDPOINT: '/v3/me',
    MODEL_URL: '/models/{uid}',
    INTERVAL: 5
    //@TODO: add timeout
};

function Sketchfab(auth, config) {
    if (auth === undefined) {
        throw 'No authentication method provided.';
    } else {
        this._auth = auth;
    }

    this._config = _.defaults(config || {}, CONFIG);
}

Sketchfab.prototype.upload = function(options, callback) {
    if (options.file) {
        fs.stat(
            options.file,
            function onFileCheck(err, stats) {
                if (stats.isFile()) {
                    var task = new Task(this._auth, this._config, options, stats);
                    callback(null, task);
                } else {
                    callback('File not found ' + options.file, null);
                }
            }.bind(this)
        );
    } else {
        callback('No file specified', null);
    }
};

Sketchfab.prototype._get = function(endpoint, callback) {
    var req;

    if (this._auth.type === 'token') {
        req = request(
            {
                method: 'GET',
                uri: this._config['BASE_API_URL'] + endpoint,
                qs: {
                    token: this._auth.token
                }
            },
            callback
        );
    } else if (this._auth.type === 'oauth2') {
        req = request(
            {
                method: 'GET',
                uri: this._config['BASE_API_URL'] + endpoint,
                headers: {
                    Authorization: 'Bearer ' + this._auth.token
                }
            },
            callback
        );
    }
};

Sketchfab.prototype.me = function(callback) {
    this._get(CONFIG.ME_ENDPOINT, function(err, response, body) {
        var parsedBody;
        try {
            parsedBody = JSON.parse(body);
        } catch (e) {
            callback('Response parsing error', {});
            return;
        }

        if (response.statusCode === 200) {
            callback(null, parsedBody);
        } else {
            callback(parsedBody, {});
        }
    });
};

module.exports = Sketchfab;
