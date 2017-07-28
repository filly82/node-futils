var request = require('request');
var Iconv  = require('iconv-lite');
var FeedParser = require('feedparser');

module.exports = {
    getFeed: function (url, callback)
    {
       FeedUtils.fetch(url, callback);
    }
}

var FeedUtils =
{
    fetch: function(feedUrl, done)
    {
        var req = request(feedUrl, {timeout: 10000, pool: false});
        req.setMaxListeners(50);
        req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
        req.setHeader('accept', 'text/html,application/xhtml+xml');
        var feedparser = new FeedParser();

        req.on('error', done);

        req.on('response', function(res)
        {
            if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

            var charset = FeedUtils.getParams(res.headers['content-type'] || '').charset;
            res = FeedUtils.maybeTranslate(res, charset);
            res.pipe(feedparser);

        });

        feedparser.on('error', done);
        feedparser.on('end', function(err){
            "use strict";
            if (!err)
                done(data);
        });
        var data = [];
        feedparser.on('readable', function()
        {
            var post;
            while (post = this.read())
            {
                //console.log(JSON.stringify(post, ' ', 4));
                data.push(post);
            }

        });

    },

    getParams: function(str)
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
            catch(err)
            {
                res.emit('error', err);
            }
        }

        return res;

    }
}