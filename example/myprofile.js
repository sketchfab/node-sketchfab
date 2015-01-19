'use strict';

var Sketchfab = require('../lib/Sketchfab');

var client = new Sketchfab({
    type: 'token',
    token: 'YOUR_API_TOKEN'
});

client.me(function(err, data){
    console.log(data);
});
