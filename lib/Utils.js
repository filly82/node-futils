const merge = require('deepmerge');

module.exports =
{
   mergeObjects: function (obj1, obj2)
   {
      if (obj1 && obj2 && Object.keys(obj2).length > 0)
      {
         for (var p in obj2)
         {
            if (obj2.hasOwnProperty(p) && typeof obj1[p] !== "undefined")
               this.mergeObjects(obj1[p], obj2[p]);
            else
               obj1[p] = obj2[p];
         }
      }
   },

   PromiseAllSettled: function (promises)
   {
      return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
         state: 'fulfilled',
         value: v,
      }), r => ({
         state: 'rejected',
         reason: r,
      }))));
   },

   PromiseAllSettledObjectArray: function (promises)
   {
      //promises = [{"name":"_name_", "promise": promise}, {"name":"_name2_", "promise": promise}]

      return Promise.all(promises.map(p => Promise.resolve(p['promise']).then(v => ({
         state: 'fulfilled',
         value: v,
         name: p['name']
      }), r => ({
         state: 'rejected',
         reason: r,
         name: p['name']
      }))));
   },

   deepMerge: function (a, b)
   {
      return merge(a, b);
   },

   deepMergeAll: function (arr)
   {
      return merge.all(arr);
   },

   chunkArray: function (myArray, chunk_size)
   {
      var results = [];

      while (myArray.length)
         results.push(myArray.splice(0, chunk_size));

      return results;
   },

   chunkObject: function (myObject, chunk_size)
   {
      let results = [];

      for (const cols = Object.entries(myObject); cols.length;)
         results.push(cols.splice(0, chunk_size).reduce((o, [k, v]) => (o[k] = v, o), {}));

      return results;
   }
}