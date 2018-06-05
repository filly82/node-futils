const readdir = require('readdir-enhanced');
const async = require('async');
const path = require('path');
const axios = require('axios');
const FileUtils = require('./FileUtils');
const urlModule = require('url');
const loki = require('lokijs');
const URL = urlModule.URL;

class CachedRequest
{
    constructor(cachePath, debugOutput)
    {
        //this.db = new loki(path.join(cachePath, 'CachedRequest.json'), {autosave: true, autoload: true, autoloadCallback: this.initDB, verbose: debugOutput});
        this.db = new loki(path.join(cachePath, 'CachedRequest.json'), {throttledSaves: false});
        this.dbCollection = null;
        this.getDebugOutput = function() { return debugOutput; }
    }

    initDatabase()
    {
        if (this.db.getCollection('children') === null) 
            this.dbCollection = this.db.addCollection('children');
        else
			this.dbCollection = this.db.getCollection('children');
    }



    doRequest( { url, duration = '3d', force = false, responseType = 'string', requestHeaders } = {} )
    {
        const self = this;

        return new Promise(function (resolve, reject)
        {
            self.db.loadDatabase({}, function(err) 
            {
                if (err)
                    return reject(err);

                self.initDatabase();
                
                let requestOpts = {'url': url};
                if (requestHeaders)
                    requestOpts['headers'] = requestHeaders;
        
                let doUpdate = false;
                const cachedFileObj = self.dbCollection.findOne({url:url});
                if (cachedFileObj && cachedFileObj !=null && cachedFileObj['duration'] && cachedFileObj['body'] && !force)
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

                return self.doRealRequest(requestOpts).then(function(responseData)
                {
                    return resolve(self.saveCacheFile(url, responseData, duration, responseType, force||doUpdate));
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

    saveCacheFile(url, body, duration, responseType, doUpdate)
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
            {
                let oldDocument = self.dbCollection.findOne({url: url});
                if (oldDocument!=null)
                {
                    oldDocument['body'] = theBodyStringBase64;
                    oldDocument['duration'] = durationDate;
                        self.dbCollection.update(oldDocument);
                }
                else
                    self.dbCollection.insert({'url': url, 'body': theBodyStringBase64, 'duration': durationDate});
            }
            else
                self.dbCollection.insert({'url': url, 'body': theBodyStringBase64, 'duration': durationDate});
                
            self.db.saveDatabase(function(err) 
            {
                if (err) 
                    return reject(err);
                else 
                {
                      if (responseType === 'string')
                          return resolve(Buffer.from(theBodyStringBase64, 'base64').toString('utf8'));
                      else if (responseType === 'base64')
                          return resolve(theBodyStringBase64);
                      else if (responseType === 'buffer')   
                          return resolve(body);
                }
            });
        });
    }
}

module.exports = CachedRequest;