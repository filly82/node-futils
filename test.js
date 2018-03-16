var CachedRequest = require('./lib/CachedRequest');
var cachedRequest = new CachedRequest('./test', true);


cachedRequest.doRequest('http://www.google.de', {'duration': '3d'}).then(function(responseData)
{
    console.log(responseData);
    console.log(Buffer.from(responseData, 'base64').toString('utf8'));
});

cachedRequest.doRequest('https://image.tmdb.org/t/p/w185/fkdFJb8ctne7C5pkoTQLpGM7Y01.jpg', {'duration': '3d', 'binary': 'true'}).then(function(responseData)
{
    console.log(responseData);
    console.log(Buffer.from(responseData, 'base64').toString('binary'));
});