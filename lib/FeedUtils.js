var feedparser = new require('feedparser')();

module.exports = {
    getFeed: function (url, callback)
    {
        var req = request(url);

        req.on('error', function (error) {
            if (callback) callback([]);
        });

        req.on('response', function (res)
        {
            var stream = this; // `this` is `req`, which is a stream

            if (res.statusCode !== 200) {
                this.emit('error', new Error('Bad status code'));
            }
            else {
                stream.pipe(feedparser);
            }
        });

        feedparser.on('error', function (error) {
            if (callback) callback([]);
        });

        var data = [];
        feedparser.on('readable', function ()
        {
            var stream = this;
            var item;
            while (item = stream.read()) {
                data.push(item);
            }

        });

        feedparser.on('end', function(){
            if (callback) callback(data);
        });
    }
}