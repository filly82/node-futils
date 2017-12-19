/**
 * Created by Filly on 18.07.2017.
 */
'use strict';

module.exports = {

    calDavUtils: require('./lib/CalDavUtils'),
    feedUtils: require('./lib/FeedUtils'),
    fileUtils: require('./lib/FileUtils'),
    formatUtils: require('./lib/FormatUtils'),
    mailUtils: require('./lib/MailUtils'),
    mkvManager: require('./lib/MkvManager'),
    stringUtils: require('./lib/StringUtils'),
    mediaUtils: require('./lib/MediaUtils'),


    mergeObjects: function (obj1, obj2)
    {
        if (obj1 && obj2 && Object.keys(obj2).length>0)
        {
            for (var p in obj2)
            {
                if (obj2.hasOwnProperty(p) && typeof obj1[p] !== "undefined")
                    this.mergeObjects(obj1[p], obj2[p]);
                else
                    obj1[p] = obj2[p];
            }
        }
    }
};