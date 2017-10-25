# Sketchfab API Client

Upload 3D models to [Sketchfab](https://sketchfab.com/), the place to publish, share and discover 3D content online, in VR and AR.

## Installation

```
$ npm install sketchfab --save
```

## API

Run the example:
* Edit `example/upload.js` to add your API token.
* Run: `node example/upload.js`

### Sketchfab(auth)

Returns a new client for the given authentication object.
The API supports two authentication methods.

Authentication with [oAuth2](https://sketchfab.com/developers/oauth):

```
{
    type: 'oauth2',
    token: 'YOUR_ACCESS_TOKEN'
}
```

Authentication with an [API Token](https://sketchfab.com/settings/password):

```
{
    type: 'token',
    token: 'YOUR_API_TOKEN'
}
```

### client.upload( params, callback )

Upload a 3D file. Params is an object containing parameters for upload.

You can pass the following parameters:

* `file` (string): Required. Path of the local file to upload.
* `name` (string): Optional. Name of the model.
* `description` (string): Optional. Description.
* `tags` (array): Optional. Array containing slugs of tags.
* `categories` (array): Optional. Array containing slugs of categories.
* `license` (string): Optional. Set model as downloadable with given license slug.
* `isPublished` (boolean): Optional. False to upload as draft (default). True to publish immediately.
* `private` (boolean): Optional. False to make public (default). True to make private. For PRO accounts only.
* `password` (string): Optional. Password to make the model password protected. For PRO accounts only.
* `options` (object): Optional. Scene options (shading, background, orientation).

Callback will be passed (`err`,`result`).
The result will be a `Task` object that emits events:
* `progress`: will report the upload progress (from 0 to 100).
* `success`: when the file is uploaded and processed. Event is passed the URL of the online model.
* `error`: when there is an error. Event is passed an error message.

### client.me(callback)

Get profile information for current account.
Callback will be passed (`err`, `data`).
