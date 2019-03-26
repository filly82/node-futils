
"use strict";

var request = require('request');
var cheerio = require('cheerio');
var js2xmlparser = require('js2xmlparser');

class ZimbraApiClient
{
   constructor(zimbraUrl, username, password)
   {
      this.internal = new Internal(zimbraUrl, username, password);
   }

   getItem(fullPath)
   {
      //return this.internal.internalGetItem(fullPath);

      var soapURL = getUserSoapURL(hostName);
      var getFolderObj = { "GetItemRequest": { "@": { "xmlns": "urn:zimbraMail" }, "item": { "@": { "path": itemPath } } } };
      var req = makeSOAPEnvelope(getFolderObj, authToken);

   }
}

class Internal
{
   ERR_UNKNOWN = "UNKNOWN";
   USER_AGENT = "zmsoap";

   constructor(zimbraUrl, username, password)
   {
      this.username = username;
      this.password = password;
      this.getUserSoapURL = function () 
      {
         const urlparts = /(https?)\:\/\/(.*?):?(\d*)?(\/.*\/?)/gi.exec(zimbraUrl);
         const protocol = urlparts[1];
         const host = urlparts[2];
         const port = urlparts[3] || (protocol === "https" ? 443 : 80);
         //var path = urlparts[4];

         return protocol + "://" + host + ":" + port + "/service/soap";
      }
   }

   getRequest()
   {
      request({
         method: "POST",
         uri: soapURL,
         headers: {
            "Content-Type": "application/soap+xml; charset=utf-8"
         },
         body: req,
         strictSSL: false,
         jar: false,
         timeout: 10000
      },
         function (err, resp, body)
         {
            responseCallback(err, resp, body, "GetItemResponse", cb);
         });
   }

   getUserAuthToken()
   {
      const self = this;

      var soapURL = self.getUserSoapURL();

      var authRequestObject = {
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

      var req = self.makeSOAPEnvelope(authRequestObject, "", undefined);

      return new Promise(function (resolve, reject)
      {
         request({
            method: "POST",
            uri: soapURL,
            headers: {
               "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
         },
            function (err, resp, body)
            {
               if (err != null)
                  reject(new Error(err));
               else
               {
                  self.processResponse(body, function (result)
                  {
                     if (result.err != null)
                        reject(new Error(result.err));
                     else if (result.payload.Body.AuthResponse != null)
                        resolve(result.payload.Body.AuthResponse.authToken[0]._content);
                     else
                        resolve({ "message": "Error: could node parse AuthResponse from Zimbra", "resp": resp, "body": body });
                  });
               }
            });
      });
   }

   makeSOAPEnvelope(requestObject, authToken, session)
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

/*
module.exports =
   {
      getItem: function (hostName, authToken, itemPath, cb)
      {
         var soapURL = getUserSoapURL(hostName);
         var getFolderObj = { "GetItemRequest": { "@": { "xmlns": "urn:zimbraMail" }, "item": { "@": { "path": itemPath } } } };
         var req = makeSOAPEnvelope(getFolderObj, authToken);
         request({
            method: "POST",
            uri: soapURL,
            headers: {
               "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
         },
            function (err, resp, body)
            {
               responseCallback(err, resp, body, "GetItemResponse", cb);
            });
      },

      getDocumentContent: function (hostName, authToken, itemPath, cb)
      {
         var soapURL = "https://" + hostName + ":8443/home/nahid@filan.de" + itemPath + "?auth=co&fmt=native";
         console.log(soapURL);
         request({
            method: "GET",
            uri: soapURL,
            strictSSL: false,
            jar: false,
            timeout: 10000,
            headers: {
               "Cookie": "ZM_AUTH_TOKEN=" + authToken
            }
         },
            function (err, resp, body)
            {
               cb(err, cheerio.load(body).text());
            });
      },

      createDocument: function (hostName, authToken, parentFolderId, filename, content, cb)
      {
         var soapURL = getUserSoapURL(hostName);
         var getFolderObj = { "SaveDocumentRequest": { "@": { "xmlns": "urn:zimbraMail" }, "doc": { "@": { "l": parentFolderId, "name": filename, "ct": "application/x-zimbra-doc", "content": content } } } };
         var req = makeSOAPEnvelope(getFolderObj, authToken);
         request({
            method: "POST",
            uri: soapURL,
            headers: {
               "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
         },
            function (err, resp, body)
            {
               responseCallback(err, resp, body, "SaveDocumentResponse", cb);
            });
      },

      replaceDocument: function (hostName, authToken, itemId, content, cb)
      {
         var soapURL = getUserSoapURL(hostName);
         var getFolderObj = { "SaveDocumentRequest": { "@": { "xmlns": "urn:zimbraMail" }, "doc": { "@": { "id": itemId, "ver": "1", "content": content } } } };
         var req = makeSOAPEnvelope(getFolderObj, authToken);
         request({
            method: "POST",
            uri: soapURL,
            headers: {
               "Content-Type": "application/soap+xml; charset=utf-8"
            },
            body: req,
            strictSSL: false,
            jar: false,
            timeout: 10000
         },
            function (err, resp, body)
            {
               responseCallback(err, resp, body, "SaveDocumentResponse", cb);
            });
      }

   }
*/

/*

FileUtils.getJSONFromFile(Globals.PATH_DATA_JSON_LOGINS).then(function (jsonData)
   {
      const globalMails = jsonData["MAIL_ZIMBRA"];

      ZimbraApiClient.getUserAuthToken("mail.filan.de", Utils.decrypt(globalMails.ACCOUNT), Utils.decrypt(globalMails.PWD), function (error, auth_token)
      {
         if (error)
            console.error(error);

         if (false) ZimbraApiClient.createDocument("mail.filan.de", auth_token, '88273', 'test3.json', 'hallihallo', function (error2, resp2)
         {
            console.log(error2);
            console.log(resp2);
         });

         if (false) ZimbraApiClient.replaceDocument("mail.filan.de", auth_token, '88343', 'hallihallo_update', function (error2, resp2)
         {
            console.log(error2);
            console.log(resp2);
         });

         ZimbraApiClient.getDocumentContent("mail.filan.de", auth_token, '/Briefcase/AppData/nahid/bookmarks.json', function (error1, resp1)
         {
            console.log(error1);
            console.log(resp1);
         });

         if (false) ZimbraApiClient.getItem("mail.filan.de", auth_token, '/Briefcase/AppData/nahid/bookmarks.json', function (error1, resp1)
         {
            console.log(error1);
            console.log(resp1);
         });

      });

   });

*/