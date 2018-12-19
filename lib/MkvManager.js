var matroska = require('matroska');

var MkvManager =
{
   getMKVInformation: function (mkvUrl)
   {
      return new Promise(function (resolve, reject)
      {
         if ((mkvUrl === undefined || !mkvUrl.endsWith(".mkv")))
            resolve({});

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
               resolve({});

            try
            {
               let returnData = {};
               var allTracks = document.listChildrenByName("TrackEntry");
               if (allTracks && allTracks.length) for (var i = 0; i < allTracks.length; i++)
               {
                  var track = allTracks[i];
                  let myObj = {};
                  var trackType = track.getFirstChildByName("TrackType").getValue();
                  if (trackType === 1)
                  {
                     try { myObj["name"] = track.getFirstChildByName("Name").getValue(); } catch (err) { }
                     try { myObj["codecId"] = track.getFirstChildByName("CodecID").getValue(); } catch (err) { }

                     let videos = returnData['video'] || [];
                     videos.push(myObj);
                     returnData['video'] = videos;
                  }
                  else if (trackType === 2)
                  {
                     try { myObj["name"] = track.getFirstChildByName("Name").getValue(); } catch (err) { }
                     try { myObj["language"] = track.getFirstChildByName("Language").getValue(); } catch (err) { }
                     try { myObj["codecId"] = track.getFirstChildByName("CodecID").getValue(); } catch (err) { }
                     try { myObj["channels"] = track.getFirstChildByName("Channels").getValue(); } catch (err) { }

                     let audios = returnData['audio'] || [];
                     audios.push(myObj);
                     returnData['audio'] = audios;
                  }
                  else if (trackType === 17)
                  {
                     try { myObj["name"] = track.getFirstChildByName("Name").getValue(); } catch (err) { }
                     try { myObj["language"] = track.getFirstChildByName("Language").getValue(); } catch (err) { }
                     try { myObj["codecId"] = track.getFirstChildByName("CodecID").getValue(); } catch (err) { }

                     let subtitles = returnData['subtitle'] || [];
                     subtitles.push(myObj);
                     returnData['subtitle'] = subtitles;
                  }
               }

               resolve(returnData);
            }
            catch (err)
            {
               resolve({});
            }
         });
      });



   }
};

module.exports = MkvManager;