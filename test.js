var CachedRequest = require('./lib/CachedRequest');
var cachedRequest = new CachedRequest('./test', true);


if (false) cachedRequest.doRequest({'url': 'https://www.filan.de', 'duration': '3d'}).then(function(responseData)
{
    console.log(responseData);
    //console.log(Buffer.from(responseData, 'base64').toString('utf8'));
});

if (true) cachedRequest.doRequest({'url': 'https://image.tmdb.org/t/p/w185/fkdFJb8ctne7C5pkoTQLpGM7Y01.jpg', 'duration': '3d', 'responseType': 'base64'}).then(function(responseData)
{
    //console.log(responseData);
    //console.log(Buffer.from(responseData, 'base64').toString('binary'));
    console.log(responseData);
    //var imageDataUri = require('image-data-uri');
    //console.log(imageDataUri.encode( responseData, 'image/jpeg'));
});