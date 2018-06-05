var CachedRequest = require('./lib/CachedRequest');
var cachedRequest = new CachedRequest('./test', true);

let promises = [];
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=12', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=13', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=14', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=15', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=16', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=17', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=18', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=19', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=10', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=111', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=122', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=133', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=144', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=155', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=166', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=177', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=188', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=199', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1111', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1222', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1333', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1444', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1555', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1666', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1777', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1888', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=1999', 'duration': '3d'}));

promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=2', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=22', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=23', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=24', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=25', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=26', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=27', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=28', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=29', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=20', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=211', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=222', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=233', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=244', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=255', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=266', 'duration': '3d'}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=277', 'duration': '3d', 'force': true}));
promises.push(cachedRequest.doRequest({'url': 'https://www.filan.de?a=288', 'duration': '3d'}));

if(!Promise.allSettled) 
{
    Promise.allSettled = function (promises) 
    {
        return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
            state: 'fulfilled',
            value: v,
        }), r => ({
            state: 'rejected',
            reason: r,
        }))));
    };
}

Promise.allSettled(promises).then(function(theResponse)
{
    console.log(theResponse.length);
});

if (false) cachedRequest.doRequest({'url': 'https://www.fiddddddddddddddddddddddddddddlan.de', 'duration': '3d', 'force': true}).then(function(responseData)
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