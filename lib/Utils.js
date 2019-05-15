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

      deepMerge: function (a, b)
      {
         // If neither is an object, return one of them:
         if (Object(a) !== a && Object(b) !== b) return b || a;
         // Replace remaining primitive by empty object/array
         if (Object(a) !== a) a = Array.isArray(b) ? [] : {};
         if (Object(b) !== b) b = Array.isArray(a) ? [] : {};
         // Treat arrays differently:
         if (Array.isArray(a) && Array.isArray(b))
         {
            // Merging arrays is interpreted as concatenation of their deep clones:
            return [...a.map(v => this.deepMerge(v)), ...b.map(v => this.deepMerge(v))];
         } else
         {
            // Get the keys that exist in either object
            var keys = new Set([...Object.keys(a), ...Object.keys(b)]);
            // Recurse and assign to new object
            return Object.assign({}, ...Array.from(keys,
               key => ({ [key]: this.deepMerge(a[key], b[key]) })));
         }
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