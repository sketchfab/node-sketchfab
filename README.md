# Sketchfab API Client

## Installation

```
$ npm install node-sketchfab --save
```

## API

Run the example:
* Edit `example/upload.js` to add your API token.
* Run: `node example/upload.js`

### Sketchfab( api_token )

Returns a new client for the given API token.

### client.upload( params, callback )

Upload a 3D file. Params is an object containing parameters for upload.

You can pass the following parameters:

* `file` (string): Required. Path of the local file to upload.
* `name` (string): Optional. Name of the model.
* `description` (string): Optional. Description.
* `tags` (string): Optional. Space separated tags.
* `private` (string): Optional, 'true' or 'false'. For PRO accounts only.
* `password` (string): Optional. Password to make the model password protected. For PRO accounts only.

Callback will be invoked with `err` and `result`.
The result will be a `Task` object that emits events:
* `progress`: will report the upload progress (from 0 to 100).
* `success`: when the file is uploaded and processed. Event is passed the URL of the online model.
* `error`: when there is an error. Event is passed an error message.
