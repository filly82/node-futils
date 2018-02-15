const readdir = require('readdir-enhanced');
const async = require('async');
const path = require('path');
const axios = require('axios');
const FileUtils = require('./FileUtils');
const urlModule = require('url');
const URL = urlModule.URL;

class CachedRequest
{
    constructor(cachePath, debugOuput)
    {
        let _cachePath = cachePath;
        let _debugOutput = debugOuput;
        let _cachedRequestInternal = new CachedRequestInternal(_cachePath, _debugOutput);

        this.getCachePath = function() { return _cachePath; }
        this.getDebugOutput = function() { return _debugOutput; }
        this.getCachedRequestInternal = function() { return _cachedRequestInternal; }
    }

    async doRequest(url, opts)
    {
        if (!opts) opts = {};

        const optsForce = 'true' === opts['force'];
        const optsDuration = opts['duration'];
        let requestOpts = {'url': url};
        if (opts['request.headers'])
            requestOpts['headers'] = opts['request.headers'];

        let doRealRequest_filename = undefined;
        try
        {
            const cachedFileObj = await this.getCachedRequestInternal().findCacheFile(url);
            if (cachedFileObj && cachedFileObj['duration'] && cachedFileObj['body'] && cachedFileObj['filename'] && !optsForce)
            {
                var isValid = new Date() <= (new Date(cachedFileObj['duration']));
                if (isValid)
                {
                    if (this.getDebugOutput())
                        console.log('FROM.CACHE: '+url);

                    return new Buffer(cachedFileObj['body'], 'base64').toString('utf8');
                }
                else
                    doRealRequest_filename = cachedFileObj['filename'];
            }
            else
                doRealRequest_filename = '';
        }
        catch (err)
        {
            if ('NOT.FOUND' === err.message)
                doRealRequest_filename = '';
            else
            {
                console.log('doCachedRequest.err:');
                console.log(err);
            }
        }

        if (doRealRequest_filename !== undefined)
            return await this.getCachedRequestInternal().saveCacheFile(url, await this.getCachedRequestInternal().doRealRequest(requestOpts), optsDuration, doRealRequest_filename);
    }
}

class CachedRequestInternal
{
    constructor(cachePath, debugOuput)
    {
        this.cachePath = cachePath;
        this.debugOuput = debugOuput;
    }

    async getAllCacheFiles()
    {
        return await readdir.async(this.cachePath,
        {
            deep: false,
            filter: function(stats)
            {
                return stats.isFile();
            }
        });
    }

    async findCacheFile(url)
    {
        const cachePath = this.cachePath;
        const files = await this.getAllCacheFiles();

        if (files.length <=0)
            throw new Error('NOT.FOUND');

        // TODO
        // eventuell cachen und beim ersten Durchlauf mappen zwischen url und jsonObj
        // auch gut, damit wir zum Schluss nicht nocheinmal getJSONFromFile machen müssen, was sowieso schwachsinnig ist

        return new Promise(function(resolve, reject)
        {
            async.detectLimit(files, 5, function(filePath, callback)
                {
                    FileUtils.getJSONFromFile(path.join(cachePath, filePath)).then(function(jsonObj)
                    {
                        if (jsonObj && jsonObj['url'] && url === jsonObj['url'])
                            callback(null, true);
                        else
                            callback(null, false);
                    });
                },
                function(err, result)
                {
                    if (!result)
                        return reject(new Error('NOT.FOUND'));

                    FileUtils.getJSONFromFile(path.join(cachePath, result)).then(function(jsonObj)
                    {
                        jsonObj['filename'] = result;
                        resolve(jsonObj);
                    });
                });
        });
    }

    async doRealRequest(requestOpts)
    {
        console.log('FROM.REQUEST: '+requestOpts.url + ' --> '+(JSON.stringify(requestOpts)));

        const response = await axios(requestOpts);

        if (response.status >= 200 && response.status <= 299)
            return response.data;
        else
            throw new Error('RESPONSE.STATUS.NOT.200-299');
    }

    async saveCacheFile(url, body, duration, filename)
    {
        if  (!duration)
            duration = '3d';

        var durationDate = new Date();
        var _unit = duration.substring(duration.length-1);
        var _duration = parseInt(duration.substring(0, duration.indexOf(_unit)));

        if ('w' === _unit)
            durationDate.setDate(durationDate.getDate() + (7*_duration));
        else if ('d' === _unit)
            durationDate.setDate(durationDate.getDate() + _duration);
        else if ('h' === _unit)
            durationDate.setHours(durationDate.getHours() + _duration);
        else if ('m' === _unit)
            durationDate.setMinutes(durationDate.getMinutes() + _duration);
        else
            durationDate.setDate(durationDate.getDate() + 1);

        const urlObj = new URL(url);

        // cacheFile überschreiben oder nicht
        if (!filename || filename === '')
            filename = (this.getNanoSecTime())+'_'+urlModule.domainToUnicode(urlObj.hostname)+'.json';

        // body (Original) in String umwandeln
        let theBodyString = body;
        if (!(typeof theBodyString === 'string' || theBodyString instanceof String))
            theBodyString = JSON.stringify(theBodyString);

        // body (String) base64-codieren
        const theBodyStringBase64 = new Buffer(theBodyString).toString('base64');

        // speichern natürlich als base64
        await FileUtils.writeJSONToFile(path.join(this.cachePath, filename), {'url': url, 'body': theBodyStringBase64, 'duration': durationDate});

        // return IMMER string
        return theBodyString;
    }

    getNanoSecTime()
    {
        var hrTime = process.hrtime();
        return hrTime[0] * 1000000000 + hrTime[1];
    }
}

module.exports = CachedRequest;