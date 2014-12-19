'use strict';

var util = require('util');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var request = require('superagent');
var _ = require('lodash');

var UPLOAD_URL = 'https://api.sketchfab.com/v2/models';
var POLL_URL = 'https://api.sketchfab.com/v2/models/{uid}/status';
var MODEL_URL = 'https://sketchfab.com/models/{uid}';
var INTERVAL = 1;
//@TODO: add timeout

function UploadTask(token, options) {

    if (!options.file) {
        throw 'Missing file';
    }

    this._createdAt = new Date();
    this._file = options.file;

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
    this._req = request.post(UPLOAD_URL);
    this._req.field('source', 'node-sketchfab');

    this._req.field('token', token);
    this._req.field('name', options['name']);
    this._req.field('description', options['description']);
    this._req.field('tags', options['tags']);
    this._req.field('private', options['private']);
    this._req.field('password', options['password']);
    this._req.attach('modelFile', this._file);

    this._req.on('error', function onUploadError() {
        this.emit('error', 'Connection error');
    }.bind(this));

    this._req.end(function onUploadResponse(res) {

        if (res.statusCode === 201) {
            if (res && res.body && res.body.uid) {
                this.emit('progress', 100);
                pollStatus.call(this, res.body.uid);
            } else {
                this.emit('error', 'Unknown error');
            }
        }

        if (res.statusCode === 401) {
            this.emit('error', 'Unauthorized. Please check your API token.');
        }

    }.bind(this));
}

function pollStatus(uid) {
    var url = POLL_URL.replace('{uid}', uid) + '?t=' + (+new Date());
    request
        .get(url)
        .set('Accept', 'application/json')
        .end(function onPollResponse(res) {
            if (res && res.body && res.body.processing) {
                switch (res.body.processing) {
                    case 'SUCCEEDED':
                        this.emit('success', MODEL_URL.replace('{uid}', uid));
                        break;
                    case 'FAILED':
                        this.emit('error', 'Processing failed');
                        break;
                    default:
                        setTimeout(function pollRetry() {
                            pollStatus.call(this, uid);
                        }.bind(this), INTERVAL * 1000);
                }
            }
        }.bind(this));
}

util.inherits(UploadTask, EventEmitter);

module.exports = UploadTask;
