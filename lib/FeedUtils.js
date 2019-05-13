const request = require('request');
const Iconv = require('iconv-lite');
const FeedParser = require('feedparser');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const CachedRequest = require('./CachedRequest');
var cachedRequest = new CachedRequest(null, false);
var stringToStream = require('string-to-stream');
module.exports = {
   getFeed: function (url)
   {
      return new Promise(function (resolve, reject)
      {
         FeedUtils.fetch(url, function (responseData)
         {
            resolve(responseData);
         });
      });
   }
}

var FeedUtils =
{
   fetch: function (feedUrl, done)
   {

      return cachedRequest.doRequest({ url: feedUrl, duration: '1h' }).then(function (responseData)
      {
         var feedparser = new FeedParser();

         stringToStream(responseData[0]).pipe(feedparser);

         feedparser.on('error', done);
         feedparser.on('end', function (err)
         {
            "use strict";
            if (!err)
               done(data);
         });
         var data = [];
         feedparser.on('readable', function ()
         {
            var post;
            while (post = this.read())
            {
               var dataSimple = {};
               dataSimple['title'] = post.title;
               dataSimple['link'] = post.link;
               dataSimple['summary'] = post.summary;
               dataSimple['description'] = post.description;
               dataSimple['date'] = post.date;
               dataSimple['pubdate'] = post.pubdate;
               dataSimple['author'] = post.author;
               dataSimple['image'] = post.image;
               data.push(dataSimple);
            }
         });
      });
   },

   getParams: function (str)
   {
      var params = str.split(';').reduce(function (params, param)
      {
         var parts = param.split('=').map(function (part) { return part.trim(); });

         if (parts.length === 2)
            params[parts[0]] = parts[1];

         return params;

      }, {});

      return params;
   },

   maybeTranslate: function (res, charset)
   {
      var iconv;
      if (!iconv && charset && !/utf-*8/i.test(charset))
      {
         try
         {
            //iconv = new Iconv(charset, 'utf-8');
            iconv = Iconv.decodeStream(charset);
            //iconv.on('error', done);

            res = res.pipe(iconv);
         }
         catch (err)
         {
            res.emit('error', err);
         }
      }

      return res;

   }
}