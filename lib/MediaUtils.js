export default {
   parseEpisodeId: function (episodeName)
   {
      var regex1 = "[sS][0-9]{1,2}[eE][0-9]{2}"; //s01e01
      var regex2 = "[0-9]{1,2}x[0-9]{2}"; //2x24
      var regex3 = "[sS][0-9]{1,2}[xX][eE][0-9]{2}"; //s01xe01
      var regex4 = "[0-9]{1,2}[0-9]{2}"; //224
      var regex5 = "[0-9]{1,2}\.[0-9]{2}" //1.01

      var returnArr = [];

      var test = episodeName.match(regex1);
      if (test !== null)
      {
         returnArr.push(test[0].toLowerCase());
         var test2 = episodeName.replace(test[0], "").match(regex1);
         if (test2 !== null)
            returnArr.push(test2[0].toLowerCase());
      }
      else
      {
         test = episodeName.match(regex2);
         if (test !== null)
         {
            returnArr.push(test[0].toLowerCase());
            var test2 = episodeName.replace(test[0], "").match(regex2);
            if (test2 !== null)
               returnArr.push(test2[0].toLowerCase());
         }
         else
         {
            test = episodeName.match(regex3);
            if (test !== null)
            {
               returnArr.push(test[0].toLowerCase());
               var test2 = episodeName.replace(test[0], "").match(regex3);
               if (test2 !== null)
                  returnArr.push(test2[0].toLowerCase());
            }
            else
            {
               test = episodeName.match(regex4);
               if (test !== null)
               {
                  returnArr.push(test[0].toLowerCase());
                  var test2 = episodeName.replace(test[0], "").match(regex4);
                  if (test2 !== null)
                     returnArr.push(test2[0].toLowerCase());
               }
               else
               {
                  test = episodeName.match(regex5);
                  if (test !== null)
                  {
                     returnArr.push(test[0].toLowerCase());
                     var test2 = episodeName.replace(test[0], "").match(regex4);
                     if (test2 !== null)
                        returnArr.push(test2[0].toLowerCase());
                  }
               }
            }
         }
      }

      var newReturnArr = [];
      if (returnArr.length > 0)
      {
         for (var i = 0; i < returnArr.length; i++)
         {
            var test = returnArr[i].match("[0-9]{1,2}$");
            if (test !== null)
            {
               var episodeNumberString = test[0];
               var seasonNumberString = returnArr[i].substring(0, returnArr[i].length - episodeNumberString.length);
               var test2 = seasonNumberString.match("[0-9]{1,2}");
               if (test2 !== null)
               {
                  seasonNumberString = test2[0];

                  var episodeNumber = parseFloat(episodeNumberString);
                  var seasonNumber = parseFloat(seasonNumberString);

                  var myEpId = "s" + (seasonNumber < 10 ? "0" : "") + seasonNumber + "e" + (episodeNumber < 10 ? "0" : "") + episodeNumber;
                  newReturnArr.push(myEpId);
               }
            }
         }
      }

      return newReturnArr;
   }
}