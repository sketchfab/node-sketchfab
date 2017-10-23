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

    options = this.validateOptions(options);

    // Build request
    var headers = {};
    if (auth.type === 'oauth2') {
        headers = {
            Authorization: 'Bearer ' + auth.token
        };
    }

    var timer;
    this._req = request.post(
        {
            url: this._config['BASE_API_URL'] + this._config['UPLOAD_ENDPOINT'],
            headers: headers
        },
        function(err, response, body) {
            var body;
            try {
                body = JSON.parse(response.body);
            } catch (e) {
                this.emit('error', 'Response parsing error');
            }

            if (err) {
                this.emit('error', 'Connection error');
            } else {
                if (timer) {
                    clearInterval(timer);
                }
                if (response.statusCode === 201) {
                    if (body && body.uid) {
                        this.emit('progress', 100);
                        pollStatus.call(this, body.uid);
                    } else {
                        this.emit('error', 'Unknown error');
                    }
                } else {
                    if (body && body.detail) {
                        this.emit('error', body.detail);
                    }
                }
            }
        }.bind(this)
    );

    var formData = this._req.form();
    if (auth.type === 'token') {
        formData.append('token', auth.token);
    }
    formData.append('modelFile', fs.createReadStream(this._file));
    formData.append('name', options.name);
    formData.append('description', options.description);
    formData.append('private', options.private);
    formData.append('password', options.password);
    formData.append('isPublished', options.isPublished);
    formData.append('options', options.options);
    for (var i = 0, l = options.tags.length; i < l; i++) {
        formData.append('tags', options.tags[i]);
    }
    for (var i = 0, l = options.tags.length; i < l; i++) {
        formData.append('categories', options.categories[i]);
    }
    if (options.license) {
        formData.append('license', options.license);
    }

    // Polling sent bytes
    // https://github.com/request/request/issues/941
    timer = setInterval(
        function() {
            var percent = Math.min(
                100,
                this._req.req.connection.bytesWritten / fileStats.size * 100
            );
            this.emit('progress', percent);
        }.bind(this),
        500
    );
}

UploadTask.prototype.validateOptions = function validateOptions(options) {
    var validOptions = _.clone(options);

    var defaults = {
        name: 'Model',
        description: '',
        tags: [],
        categories: [],
        private: 'false',
        password: '',
        license: '',
        isPublished: 'false',
        options: '{}'
    };

    // Use filename as default name
    if (!validOptions.name) {
        var ext = path.extname(validOptions.file);
        validOptions.name = path.basename(validOptions.file, ext);
    }

    validOptions = _.defaults(validOptions, defaults);
    validOptions = _.pick(validOptions, _.keys(defaults));

    if (typeof validOptions.private !== 'string') {
        validOptions.private = (!!validOptions.private).toString();
    }
    if (typeof validOptions.isPublished !== 'string') {
        validOptions.isPublished = (!!validOptions.isPublished).toString();
    }

    if (!_.isArray(validOptions.tags)) {
        validOptions.tags = [];
    }

    if (!_.isArray(validOptions.categories)) {
        validOptions.categories = [];
    }

    if (typeof validOptions.options !== 'string') {
        validOptions.options = JSON.stringify(validOptions.options);
    }

    return validOptions;
};

function pollStatus(uid) {
    var pollUrl = this._config['BASE_API_URL'] + this._config['POLL_ENDPOINT'];
    var url = pollUrl.replace('{uid}', uid) + '?t=' + +new Date();

    request(
        url,
        function onPollResponse(err, response, body) {
            if (err) {
                setTimeout(
                    function pollRetry() {
                        pollStatus.call(this, uid);
                    }.bind(this),
                    this._config['INTERVAL'] * 1000
                );
            }

            var data;
            try {
                data = JSON.parse(body);
            } catch (e) {
                this.emit('error', 'Response parsing error');
            }

            if (data && data.status && data.status.processing) {
                switch (data.status.processing) {
                    case 'SUCCEEDED':
                        var modelUrl = this._config['BASE_SERVER_URL'] + this._config['MODEL_URL'];
                        this.emit('success', modelUrl.replace('{uid}', uid));
                        break;
                    case 'FAILED':
                        this.emit('error', 'Processing failed');
                        break;
                    default:
                        setTimeout(
                            function pollRetry() {
                                pollStatus.call(this, uid);
                            }.bind(this),
                            this._config['INTERVAL'] * 1000
                        );
                }
            } else {
               // In case response has no status
               // (example: {"detail": "Enhance your calm."})
               setTimeout(
                   function pollRetry() {
                       pollStatus.call(this, uid);
                   }.bind(this),
                   this._config['INTERVAL'] * 1000
               );
            }
        }.bind(this)
    );
}

util.inherits(UploadTask, EventEmitter);

module.exports = UploadTask;
