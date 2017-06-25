'use strict';

var path = require('path');
var Sketchfab = require('../lib/Sketchfab');

var client = new Sketchfab({
    type: 'token',
    token: 'YOUR_API_TOKEN'
});

client.upload(
    {
        file: path.resolve(__dirname, './cube.obj'),
        private: true,
        isPublished: false,
        description: 'This is a cube',
        tags: ['test', 'cube'],
        categories: ['architecture', 'science-technology'],
        options: {
            shading: 'shadeless',
            background: {
                color: '#1caad9'
            },
            orientation: {
                axis: [0, 0, 1],
                angle: 45
            }
        }
    },
    function(err, task) {
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
    }
);
