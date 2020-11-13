"use strict";
const js2xmlparser = require('js2xmlparser');
const ResponseProcessor = require('./response_processor');
var request = require('request');
var url = require('url');

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

         self.doInternalRequest(self.buildSOAPEnvelope(reqObj, authToken.authToken[0]._content, undefined), respKey, cb);
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

      self.doInternalRequest(self.buildSOAPEnvelope(reqObj, "", undefined), "AuthResponse", cb);
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

module.exports = SOAPHelper;