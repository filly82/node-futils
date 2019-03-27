
"use strict";

var request = require('request');
var cheerio = require('cheerio');
const url = require('url');
var js2xmlparser = require('js2xmlparser');

class ZimbraApiClient
{
   constructor(zimbraUrl, username, password)
   {
      this.username = username;
      this.password = password;
      this.zimbraUrl = zimbraUrl;
      this.internal = new Internal(zimbraUrl, username, password);
   }

   async getJSONData(fullPath)
   {
      return this.getRAWData(fullPath).then(response =>
      {
         try 
         {
            let theResponse;
            const $body = cheerio.load(response);
            const $realBody = $body('body');
            if ($realBody.find('div#froot').length > 0)
               theResponse = $realBody.find('div#froot').html();
            else
               theResponse = $realBody.html();

            return JSON.parse(cheerio.load(theResponse).text());
         }
         catch (err)
         {
            throw new Error(err);
         }
      }).catch((err) =>
      {
         throw new Error(err);
      });

   }

   getRAWData(fullPath)
   {
      return this.internal.getDocumentContent(fullPath);
   }

   setJSONData(fullPath, content)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         const fullPathPartsArr = fullPath.split('/');
         const filename = fullPathPartsArr[fullPathPartsArr.length - 1];
         if (filename.indexOf('.') <= 0)
            return reject({ 'message': 'doc "' + fullPath + '" is no file' });

         const parentpath = fullPath.replace('/' + filename, '');

         self.internal.getItem(fullPath).then(response =>
         {
            if (response && response.doc && response.doc.length && response.doc[0] && response.doc[0].id && response.doc[0].ver)
            {
               self.internal.replaceDocument(response.doc[0].id, response.doc[0].ver, content).then(response2 =>
               {
                  return resolve({ 'type': 'replaceDocument', 'response': response2 });
               }).catch((err) => { return reject(err); });
            }
            else
            {
               return reject({ 'message': 'doc "' + fullPath + '" does not exist' });
            }
         }).catch((err) => 
         {
            self.internal.getItem(parentpath).then(response =>
            {
               if (response && response.folder && response.folder.length && response.folder[0] && response.folder[0].id)
               {
                  self.internal.createDocument(response.folder[0].id, filename, content).then(response2 =>
                  {
                     return resolve({ 'type': 'createDocument', 'response': response2 });
                  }).catch((err0) => { return reject(err0); });
               }
               else
                  return reject({ 'message': 'folder "' + parentpath + '" does not exist' });

            }).catch((err1) => { return reject(err1); });
         });
      });
   }
}

class Internal
{
   constructor(zimbraUrl, username, password)
   {
      this.username = username;
      this.password = password;
      this.zimbraUrl = zimbraUrl;
      this.soapHelper = new SOAPHelper(zimbraUrl, username, password);
   }

   getItem(fullPath)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var reqObj = { "GetItemRequest": { "@": { "xmlns": "urn:zimbraMail" }, "item": { "@": { "path": fullPath } } } };

         self.soapHelper.doRequest(reqObj, "GetItemResponse", function (err, resp)
         {
            if (err)
               reject(err && err.message ? new Error(err.message) : new Error(err));

            resolve(resp);
         });
      });
   }

   createDocument(parentFolderId, filename, content)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var reqObj = { "SaveDocumentRequest": { "@": { "xmlns": "urn:zimbraMail" }, "doc": { "@": { "l": parentFolderId, "name": filename, "ct": "application/x-zimbra-doc", "content": "<div id=\"froot\">" + content + "</div>" } } } };

         self.soapHelper.doRequest(reqObj, "SaveDocumentResponse", function (err, resp)
         {
            if (err)
               reject(err && err.message ? new Error(err.message) : new Error(err));

            resolve(resp);
         });
      });
   }

   replaceDocument(docId, currentVersion, newContent)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var reqObj = { "SaveDocumentRequest": { "@": { "xmlns": "urn:zimbraMail" }, "doc": { "@": { "id": docId, "ver": currentVersion, "content": "<div id=\"froot\">" + newContent + "</div>" } } } };

         self.soapHelper.doRequest(reqObj, "SaveDocumentResponse", function (err, resp)
         {
            if (err)
               reject(err && err.message ? new Error(err.message) : new Error(err));

            resolve(resp);
         });
      });
   }

   getDocumentContent(fullPath)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         self.soapHelper.getUserAuthToken(function (err, authToken)
         {
            if (err)
               return reject(err && err.message ? new Error(err.message) : new Error(err));

            request({
               method: "GET",
               uri: self.zimbraUrl + "/home/" + self.username + fullPath + "?auth=co&fmt=native",
               strictSSL: false,
               jar: false,
               timeout: 10000,
               headers: {
                  "Cookie": "ZM_AUTH_TOKEN=" + authToken.authToken[0]._content
               }
            },
               function (err1, resp, body)
               {
                  if (err1)
                     return reject(err1 && err1.message ? new Error(err1.message) : new Error(err1));

                  resolve(body);
               });
         });
      });
   }
}

class SOAPHelper
{
   constructor(zimbraUrl, username, password)
   {
      this.USER_AGENT = "zmsoap";
      this.username = username;
      this.password = password;
      this.zimbraUrl = zimbraUrl;
      this.getUserSoapURL = function () 
      {
         const urlObj = url.parse(zimbraUrl);
         const protocol = urlObj.protocol;
         const host = urlObj.hostname;
         const port = urlObj.port;

         return protocol + "//" + host + ":" + port + "/service/soap";
      }
   }

   doRequest(reqObj, respKey, cb)
   {
      const self = this;

      self.getUserAuthToken(function (err, authToken)
      {
         if (err)
            return console.error(err);

         self.doInternalRequest(new SOAPHelper().buildSOAPEnvelope(reqObj, authToken.authToken[0]._content, undefined), respKey, cb);
      });
   }

   doInternalRequest(soapObj, respKey, cb)
   {
      const self = this;

      request({
         method: "POST",
         uri: self.getUserSoapURL(self.zimbraUrl),
         headers: {
            "Content-Type": "application/soap+xml; charset=utf-8"
         },
         body: soapObj,
         strictSSL: false,
         jar: false,
         timeout: 10000
      },
         function (err, resp, body)
         {
            new ResponseProcessor().responseCallback(err, resp, body, respKey, cb);
         });
   }

   getUserAuthToken(cb)
   {
      const self = this;

      var reqObj = {
         "AuthRequest": {
            "@": {
               "xmlns": "urn:zimbraAccount"
            },
            account: {
               "@": {
                  "by": "name"
               },
               "#": self.username
            },
            password: self.password
         }
      };

      self.doInternalRequest(new SOAPHelper().buildSOAPEnvelope(reqObj, "", undefined), "AuthResponse", cb);
   }

   buildSOAPEnvelope(requestObject, authToken, session)
   {
      const self = this;

      var soapReq = {
         "@": {
            "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope"
         },
         "soap:Header": {
            "context": {
               "@": {
                  "xmlns": "urn:zimbra"
               },
               "authToken": authToken,
               "userAgent": {
                  "@": {
                     "name": self.USER_AGENT
                  }
               },

               "format": {
                  "@": {
                     "xmlns": "",
                     "type": "js"
                  }
               }
            }
         },
         "soap:Body": requestObject
      };

      if (!session)
         soapReq["soap:Header"].context.nosession = "";
      else
         soapReq["soap:Header"].context.session = "";

      return js2xmlparser.parse("soap:Envelope", soapReq);
   }
}

class ResponseProcessor
{
   constructor()
   {
      this.ERR_UNKNOWN = "UNKNOWN";
   }

   responseCallback(err, resp, body, respName, cb)
   {
      const self = this;

      if (err)
         cb(err, null);
      else
      {
         self.processResponse(body, function (result)
         {
            if (result.err)
               cb(result.err, null);
            else if (result.payload.Body[respName])
               cb(null, result.payload.Body[respName]);
            else
               cb({ "message": "Error: could node parse response from Zimbra. Expecting " + respName, "resp": resp, "body": body }, null);
         });
      }
   }

   processJSONResponse(respJSON, cb)
   {
      const self = this;

      var errcode = self.ERR_UNKNOWN;
      if (respJSON && respJSON.Body && respJSON.Body.Fault)
      {
         if (respJSON.Body.Fault.Detail != null && respJSON.Body.Fault.Detail.Error != null && respJSON.Body.Fault.Detail.Error.Code != null)
            errcode = respJSON.Body.Fault.Detail.Error.Code;
         else if (respJSON.Body.Fault && respJSON.Body.Fault.Detail && respJSON.Body.Fault.Detail.Error && respJSON.Body.Fault.Detail.Error.Code)
            errcode = respJSON.Body.Fault.Detail.Error.Code;

         cb({ err: { "message": respJSON.Body.Fault.Reason.Text, "body": respJSON, code: errcode }, payload: null });
      }
      else
         cb({ err: null, payload: respJSON, code: errcode });
   }

   processXMLResponse(body, cb)
   {
      const self = this;

      var errcode = self.ERR_UNKNOWN;

      var parser = require('xml2js');

      parser.parseString(body, {
         tagNameProcessors: [parser.processors.stripPrefix],
         normalize: true,
         explicitArray: false
      }, function (err, result)
         {
            if (err)
            {
               cb({
                  err: {
                     "message": "Error: could node parse response XML from Zimbra ",
                     "body": body,
                     code: errcode
                  }, payload: null
               });
            } else
            {
               if (result && result.Envelope)
                  self.processJSONResponse(result.Envelope, cb);
               else
               {
                  cb({
                     err: {
                        "message": "Error: unexpected response format received from Zimbra ",
                        "body": body,
                        code: errcode
                     }, payload: null
                  });
               }
            }
         });
   }

   processBadJSONResponse(body, cb)
   {
      const self = this;

      try
      {
         const jsonic = require('jsonic');
         const respJSON = jsonic(body);
         if (respJSON != null)
            self.processJSONResponse(respJSON, cb);
         else
            self.processXMLResponse(body, cb);
      }
      catch (ex)
      {
         self.processXMLResponse(body, cb);
      }
   }

   processResponse(body, cb)
   {
      const self = this;

      try
      {
         var respJSON = JSON.parse(body);
         if (respJSON != null)
            self.processJSONResponse(respJSON, cb);
         else
            self.processBadJSONResponse(body, cb);
      }
      catch (ex)
      {
         self.processBadJSONResponse(body, cb);
      }
   }
}

module.exports = ZimbraApiClient;