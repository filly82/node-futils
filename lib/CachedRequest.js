const request = require('request-promise-native');
var NeDB = require('nedb');

class CachedRequest
{
   constructor(cacheFilePath, debugOutput)
   {
      this.db = new NeDB({ filename: cacheFilePath, autoload: true });

      this.getDebugOutput = function () { return debugOutput; }
   }

   doRequest({ url, duration = '3d', force = false, responseType = 'string', requestHeaders } = {})
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         self.db.findOne({ url: url }, function (err, cachedFileObj) 
         {
            let doUpdate = false;
            if (cachedFileObj && cachedFileObj !== null && cachedFileObj['duration'] && cachedFileObj['body'] && !force)
            {
               var isValid = new Date() <= (new Date(cachedFileObj['duration']));
               if (isValid)
               {
                  if (self.getDebugOutput())
                     console.log('FROM.CACHE: ' + url);

                  let additionalInformationString = cachedFileObj['additionalInformation'];
                  const additionalInformation = additionalInformationString && additionalInformationString !== '' ? JSON.parse(additionalInformationString) : {};

                  if (responseType === 'string')
                     return resolve([Buffer.from(cachedFileObj['body'], 'base64').toString('utf8'), additionalInformation]);
                  else if (responseType === 'base64')
                     return resolve([cachedFileObj['body'], additionalInformation]);
                  else if (responseType === 'buffer')
                     return resolve([Buffer.from(cachedFileObj['body'], 'base64'), additionalInformation]);
               }
               else
                  doUpdate = true;
            }

            let requestOpts = { 'url': url };
            if (requestHeaders)
               requestOpts['headers'] = requestHeaders;

            return self.doRealRequest(requestOpts).then(function (response)
            {
               return resolve(self.cacheDocument(url, response, duration, responseType, force || doUpdate));
            }).catch(function (responseError)
            {
               return reject(responseError);
            });
         });
      });
   }

   async doRealRequest(requestOpts)
   {
      console.log('FROM.REQUEST: ' + requestOpts.url + ' --> ' + (JSON.stringify(requestOpts)));
      requestOpts['encoding'] = null;
      requestOpts['resolveWithFullResponse'] = true;

      const response = await request(requestOpts);

      if (response.statusCode >= 200 && response.statusCode <= 299)
         return response;
      else
         throw new Error('RESPONSE.STATUS.NOT.200-299');
   }

   cacheDocument(url, response, duration, responseType, doUpdate)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var durationDate = new Date();
         var _unit = duration.substring(duration.length - 1);
         var _duration = parseInt(duration.substring(0, duration.indexOf(_unit)));

         if ('w' === _unit) durationDate.setDate(durationDate.getDate() + (7 * _duration));
         else if ('d' === _unit) durationDate.setDate(durationDate.getDate() + _duration);
         else if ('h' === _unit) durationDate.setHours(durationDate.getHours() + _duration);
         else if ('m' === _unit) durationDate.setMinutes(durationDate.getMinutes() + _duration);
         else durationDate.setDate(durationDate.getDate() + 1);

         const body = response.body;
         const additionalInformation = { 'requestUri': response.request && response.request.uri ? response.request.uri : {} };
         const theBodyStringBase64 = Buffer.from(body, 'binary').toString('base64');

         if (doUpdate)
            self.db.update({ url: url }, { 'url': url, 'body': theBodyStringBase64, 'duration': durationDate, 'additionalInformation': JSON.stringify(additionalInformation) }, {});
         else
            self.db.insert({ 'url': url, 'body': theBodyStringBase64, 'duration': durationDate, 'additionalInformation': JSON.stringify(additionalInformation) });

         if (responseType === 'string')
            resolve([Buffer.from(theBodyStringBase64, 'base64').toString('utf8'), additionalInformation]);
         else if (responseType === 'base64')
            resolve([theBodyStringBase64, additionalInformation]);
         else if (responseType === 'buffer')
            resolve([body, additionalInformation]);
      });
   }
}

const moduleInternal = {

}

module.exports = CachedRequest;