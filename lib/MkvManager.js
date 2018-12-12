var matroska = require('matroska');

var MkvManager =
{
   getMKVInformation: function (mkvUrl)
   {
      return new Promise(function (resolve, reject)
      {
         if ((mkvUrl === undefined || !mkvUrl.endsWith(".mkv")))
         {
            let returnValue = {};
            returnValue[mkvUrl] = { error: 'undefined or no .mkv' };
            resolve(returnValue);
         }

         var decoder = new matroska.Decoder({
            skipTags: {
               SimpleBlock: true,
               Void: true,
               Block: true,
               FileData: true,
               Cluster: true,
               Cues: true,
               Tracks: false
            }
         });

         decoder.parseEbmlIDs(mkvUrl, [0x1654ae6b], function (error, document)
         {
            if (error)
            {
               let returnValue = {};
               returnValue[mkvUrl] = { error: error };
               resolve(returnValue);
            }

            //console.log(document.print());
            var returnValue = {};

            try
            {
               var myObjArr = [];
               var allTracks = document.listChildrenByName("TrackEntry");
               if (allTracks && allTracks.length) for (var i = 0; i < allTracks.length; i++)
               {
                  var track = allTracks[i];
                  var myObj = {};
                  //console.log(mkvUrl);
                  //console.log(track.print());
                  //console.log("---------------------------------------------------------------------------------");
                  var trackType = track.getFirstChildByName("TrackType").getValue();
                  if (trackType === 1)
                  {
                     myObj["type"] = "video";
                     try { myObj["name"] = track.getFirstChildByName("Name").getValue(); } catch (err) { }
                     try { myObj["codecId"] = track.getFirstChildByName("CodecID").getValue(); } catch (err) { }
                  }
                  else if (trackType === 2)
                  {
                     myObj["type"] = "audio";
                     try { myObj["name"] = track.getFirstChildByName("Name").getValue(); } catch (err) { }
                     try { myObj["language"] = track.getFirstChildByName("Language").getValue(); } catch (err) { }
                     try { myObj["codecId"] = track.getFirstChildByName("CodecID").getValue(); } catch (err) { }
                     try { myObj["channels"] = track.getFirstChildByName("Channels").getValue(); } catch (err) { }
                  }
                  else if (trackType === 17)
                  {
                     myObj["type"] = "subtitle";
                     try { myObj["name"] = track.getFirstChildByName("Name").getValue(); } catch (err) { }
                     try { myObj["language"] = track.getFirstChildByName("Language").getValue(); } catch (err) { }
                     try { myObj["codecId"] = track.getFirstChildByName("CodecID").getValue(); } catch (err) { }
                  }

                  if (Object.keys(myObj).length)
                     myObjArr.push(myObj);
               }
               returnValue[mkvUrl] = myObjArr;
               resolve(returnValue);
            }
            catch (err)
            {
               let returnValue = {};
               returnValue[mkvUrl] = { error: err };
               resolve(returnValue);
            }
         });
      });



   }
};


module.exports = MkvManager;
