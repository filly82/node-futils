export default class ResponseProcessor
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