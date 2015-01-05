'use strict';

var path = require('path');
var Sketchfab = require('../lib/Sketchfab');

var client = new Sketchfab('YOUR_API_TOKEN');

client.upload({
    'file': path.resolve(__dirname, './cube.obj'),
    'private': true
}, function(err, task) {

    if (err) {
        console.log(err);
        return;
    }

    task.on('progress', function(value) {
        console.log('Progress:', value);
    });
    task.on('success', function(url) {
        console.log('Success:', url);
    });
    task.on('error', function(error) {
        console.log('Error:', error);
    });
});
