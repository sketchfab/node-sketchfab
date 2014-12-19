'use strict';

var util = require('util');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var request = require('superagent');
var _ = require('lodash');

var UPLOAD_URL = 'https://api.sketchfab.com/v2/models';
var POLL_URL   = 'https://api.sketchfab.com/v2/models/{uid}/status';
var MODEL_URL  = 'https://sketchfab.com/models/{uid}';
var INTERVAL = 1;
//@TODO: add timeout

function UploadTask( token, options ) {

    if ( !options.file ) {
        throw 'Missing file';
    }

    var file = options.file;

    var defaults = {
        'description': '',
        'tags': '',
        'private': 'false',
        'password': ''
    };

    // Default name
    var ext = path.extname( options.file );
    var defaultName = 'My model';
    if ( !options.name ) {
        options.name = path.basename( options.file, ext);
    }

    // Other default options
    options = _.defaults( options, defaults );
    options = _.pick( options, ['name', 'description', 'tags', 'private', 'password']);
    options['private'] = options['private'].toString();

    var self = this;
    var req = request.post(UPLOAD_URL);

    req.field('token', token);
    req.field('name', options['name']);
    req.field('description', options['description']);
    req.field('tags', options['tags']);
    req.field('private', options['private']);
    req.field('password', options['password']);

    req.attach( 'modelFile', file );
    req.end( function( res ) {

        if (res.statusCode === 201) {
            if ( res && res.body && res.body.uid ) {
                this.emit('progress', 100);
                pollStatus.call( this, res.body.uid );
            } else {
                this.emit('error', 'Unknown error');
            }
        }

        if (res.statusCode === 401) {
            this.emit('error', 'Unauthorized. Please check your API token.');
        }

    }.bind(this) );
}

function pollStatus( uid ) {
    var url = POLL_URL.replace('{uid}', uid) + '?t=' + (+new Date());
    request
        .get( url )
        .set('Accept', 'application/json')
        .end(function( res ){
            if (res && res.body && res.body.processing) {
                switch (res.body.processing) {
                    case 'SUCCEEDED':
                        this.emit('success', MODEL_URL.replace('{uid}', uid));
                        break;
                    case 'FAILED':
                        this.emit('error', 'Processing failed');
                        break;
                    default:
                        setTimeout( function(){
                            pollStatus.call( this, uid );
                        }.bind(this), INTERVAL * 1000);
                }
            }
        }.bind(this));
}

util.inherits(UploadTask, EventEmitter);

module.exports = UploadTask;
