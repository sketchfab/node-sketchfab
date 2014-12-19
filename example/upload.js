'use strict';

var path = require('path');
var Sketchfab = require('../lib/Sketchfab');

var skfb = new Sketchfab('YOUR_API_TOKEN');

var task = skfb.upload({
    'file': path.resolve(__dirname, './cube.obj')
}, function( err, task){
    task.on('progress', function( value ){
        console.log('Progress:', value);
    });
    task.on('success', function( url ){
        console.log('Success:', url);
    });
    task.on('error', function( error ){
        console.log('Error:', error);
    });
});
