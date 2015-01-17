'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var _ = require('lodash');


function UploadTask(auth, config, options, fileStats) {

    if (!options.file) {
        throw 'Missing file';
    }

    this._createdAt = new Date();
    this._file = options.file;
    this._config = config;

    // Defaults
    var defaults = {
        'description': '',
        'tags': '',
        'private': 'false',
        'password': ''
    };
    if (!options.name) {
        var ext = path.extname(options.file);
        options.name = path.basename(options.file, ext);
    }

    // Default/filter params
    options = _.defaults(options, defaults);
    options = _.pick(options, ['name', 'description', 'tags', 'private', 'password']);
    options['private'] = options['private'].toString();

    // Build request
    var formData = {
        'source': 'node-sketchfab',
        'name': options.name,
        'description': options.description,
        'tags': options.tags,
        'private': options.private,
        'password': options.password,
        'modelFile': fs.createReadStream(this._file)
    };

    var headers = {};

    if (auth.type === "token") {
        formData.token = auth.token;
    } else if ( auth.type === "oauth2" ) {
        headers = {
            'Authorization': 'Bearer ' + auth.token
        };
    }

    var timer;
    this._req = request.post({
        url: this._config['BASE_API_URL'] + this._config['UPLOAD_ENDPOINT'],
        formData: formData,
        headers: headers
    }, function(err, response, body) {
        if (err) {
            this.emit('error', 'Connection error');
        } else {
            if (timer) {
                clearInterval(timer);
            }
            if (response.statusCode === 201) {
                var data = JSON.parse(body);
                if (data && data.uid) {
                    this.emit('progress', 100);
                    pollStatus.call(this, data.uid);
                } else {
                    this.emit('error', 'Unknown error');
                }
            }

            if (response.statusCode === 401) {
                this.emit('error', 'Unauthorized. Please check your API token.');
            }
        }
    }.bind(this));

    // Polling sent bytes
    // https://github.com/request/request/issues/941
    timer = setInterval(function() {
        var percent = Math.min(100, this._req.req.connection.bytesWritten / fileStats.size * 100);
        this.emit('progress', percent);
    }.bind(this), 500);
}

function pollStatus(uid) {
    var pollUrl = this._config['BASE_API_URL'] + this._config['POLL_ENDPOINT'];
    var url = pollUrl.replace('{uid}', uid) + '?t=' + (+new Date());

    request(url, function onPollResponse(err, response, body) {
        if (err) {
            setTimeout(function pollRetry() {
                pollStatus.call(this, uid);
            }.bind(this), this._config['INTERVAL'] * 1000);
        }

        var data = JSON.parse(body);
        if (data && data.processing) {
            switch (data.processing) {
                case 'SUCCEEDED':
                    var modelUrl = this._config['BASE_SERVER_URL'] + this._config['MODEL_URL'];
                    this.emit('success', modelUrl.replace('{uid}', uid));
                    break;
                case 'FAILED':
                    this.emit('error', 'Processing failed');
                    break;
                default:
                    setTimeout(function pollRetry() {
                        pollStatus.call(this, uid);
                    }.bind(this), this._config['INTERVAL'] * 1000);
            }
        }
    }.bind(this));
}

util.inherits(UploadTask, EventEmitter);

module.exports = UploadTask;
