const path = require('path');
const axios = require('axios');
var NeDB = require('nedb');

class CachedRequest
{
    constructor(cachePath, debugOutput)
    {
        this.db = new NeDB({ filename: path.join(cachePath, 'CachedRequest.json'), autoload: true });

        this.getDebugOutput = function() { return debugOutput; }
    }

    doRequest( { url, duration = '3d', force = false, responseType = 'string', requestHeaders } = {} )
    {
        const self = this;

        return new Promise(function (resolve, reject)
        {
            self.db.findOne({url:url}, function (err, cachedFileObj) 
            {
                let doUpdate = false;
                if (cachedFileObj && cachedFileObj !==null && cachedFileObj['duration'] && cachedFileObj['body'] && !force)
                {
                    var isValid = new Date() <= (new Date(cachedFileObj['duration']));
                    if (isValid)
                    {
                        if (self.getDebugOutput())
                            console.log('FROM.CACHE: '+url);
    
                        if (responseType === 'string')
                            return resolve(Buffer.from(cachedFileObj['body'], 'base64').toString('utf8'));
                        else if (responseType === 'base64')
                            return resolve(cachedFileObj['body']);
                        else if (responseType === 'buffer')   
                            return resolve(Buffer.from(cachedFileObj['body'], 'base64')); 
                    }
                    else
                        doUpdate = true;
                }

                let requestOpts = {'url': url};
                if (requestHeaders)
                    requestOpts['headers'] = requestHeaders;
        
                return self.doRealRequest(requestOpts).then(function(responseData)
                {
                    return resolve(self.cacheDocument(url, responseData, duration, responseType, force||doUpdate));
                }).catch(function(responseError)
                {
                    return reject(responseError);
                });
            });
        });
    }

    async doRealRequest(requestOpts)
    {
        console.log('FROM.REQUEST: '+requestOpts.url + ' --> '+(JSON.stringify(requestOpts)));
        requestOpts['responseType'] = 'arraybuffer';

        const response = await axios(requestOpts);

        if (response.status >= 200 && response.status <= 299)
            return response.data;
        else
            throw new Error('RESPONSE.STATUS.NOT.200-299');
    }

    cacheDocument(url, body, duration, responseType, doUpdate)
    {
        const self = this;

        return new Promise(function(resolve, reject)
        {
            var durationDate = new Date();
            var _unit = duration.substring(duration.length-1);
            var _duration = parseInt(duration.substring(0, duration.indexOf(_unit)));
    
            if ('w' === _unit) durationDate.setDate(durationDate.getDate() + (7*_duration));
            else if ('d' === _unit) durationDate.setDate(durationDate.getDate() + _duration);
            else if ('h' === _unit) durationDate.setHours(durationDate.getHours() + _duration);
            else if ('m' === _unit) durationDate.setMinutes(durationDate.getMinutes() + _duration);
            else durationDate.setDate(durationDate.getDate() + 1);
    
            const theBodyStringBase64 = Buffer.from(body, 'binary').toString('base64');
    
            if (doUpdate)
                self.db.update({url: url}, {'url': url, 'body': theBodyStringBase64, 'duration': durationDate}, {});
            else
                self.db.insert({'url': url, 'body': theBodyStringBase64, 'duration': durationDate});

            if (responseType === 'string')
                resolve(Buffer.from(theBodyStringBase64, 'base64').toString('utf8'));
            else if (responseType === 'base64')
                resolve(theBodyStringBase64);
            else if (responseType === 'buffer')   
                resolve(body);                
        });
    }
}

module.exports = CachedRequest;