export default {
   getUrlQuery: function (windowLocationHref)
   {
      var vars = [], hash;
      var hashes = windowLocationHref.slice(windowLocationHref.indexOf('?') + 1).split('&');
      for (var i = 0; i < hashes.length; i++)
      {
         hash = hashes[i].split('=');
         vars.push(hash[0]);
         vars[hash[0]] = hash[1];
      }
      return vars;
   },

   cleanString: function (stringRaw)
   {
      return stringRaw.replace(/[ \f\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/g, ' ').replace(/ ?[\n\r][\n\r ]*/g, '\n').replace(/^\n|\n$/g, '');
   },

   lengthInBytes: function (s)
   {
      return ~-encodeURI(s).split(/%..|./).length;
   },

}