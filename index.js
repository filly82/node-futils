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


    mergeObjects: function (obj1, obj2)
    {
        if (obj1 && obj2 && Object.keys(obj2).length>0)
        {
            //iterate over all the properties in the object which is being consumed
            for (var p in obj2)
            {
                // Property in destination object set; update its value.
                if (obj2.hasOwnProperty(p) && typeof obj1[p] !== "undefined")
                {
                    this.mergeObjects(obj1[p], obj2[p]);
                } else
                {
                    //We don't have that level in the heirarchy so add it
                    obj1[p] = obj2[p];
                }
            }
        }
    }
};