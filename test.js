var CachedRequest = require('./lib/CachedRequest');
var cachedRequest = new CachedRequest('./test', true);


if (true) cachedRequest.doRequest({'url': 'https://www.fiddddddddddddddddddddddddddddlan.de', 'duration': '3d', 'force': true}).then(function(responseData)
{
    console.log(responseData);
    //console.log(Buffer.from(responseData, 'base64').toString('utf8'));
    console.log('ENDE')
}).catch(function(myError){
    console.log('myError')
});

if (false) cachedRequest.doRequest({'url': 'https://image.tmdb.org/t/p/w185/fkdFJb8ctne7C5pkoTQLpGM7Y01.jpg', 'duration': '3d', 'responseType': 'base64'}).then(function(responseData)
{
    //console.log(responseData);
    //console.log(Buffer.from(responseData, 'base64').toString('binary'));
    console.log(responseData);
    //var imageDataUri = require('image-data-uri');
    //console.log(imageDataUri.encode( responseData, 'image/jpeg'));
}).catch(function(myError){
    console.log('myError')
});