const admin = require("firebase-admin");

class FirebaseUtils
{
   constructor(databaseURL, serviceAccountFilePath)
   {
      this.firebaseAdmin = !admin.apps.length ? admin.initializeApp({
         credential: admin.credential.cert(serviceAccountFilePath),
         databaseURL: databaseURL
      }) : admin.app();

      this.realtimeDb = this.firebaseAdmin.database();
      this.firestore = this.firebaseAdmin.firestore();
   }

   realtimeDbSave(dbPath, data, callbackOnSuccess)
   {
      const self = this;

      if (data)
      {
         const nowDate = new Date();
         self.realtimeDb.ref(dbPath).set(data, (error) =>
         {
            if (error)
               console.log('FirebaseAdmin.save.error("' + dbPath + ' -> ' + Object.keys(data).length + '") = ' + new Date());
            else
            {
               console.log('FirebaseAdmin.save.success("' + dbPath + ' -> ' + Object.keys(data).length + '") = ' + new Date());
               if (callbackOnSuccess)
               {
                  console.log('... calling callbackOnSuccess');
                  callbackOnSuccess();
               }
            }
         });
      }
   }

   realtimeDbDelete(dbPath, callbackOnSuccess)
   {
      const self = this;

      self.realtimeDb.ref(dbPath).remove().then(function ()
      {
         console.log('FirebaseAdmin.delete.success("' + dbPath + '") = ' + new Date());
         if (callbackOnSuccess)
         {
            console.log('... calling callbackOnSuccess');
            callbackOnSuccess();
         }
      })
         .catch(function (error)
         {
            console.log('FirebaseAdmin.delete.error("' + dbPath + '") = ' + new Date());
         });
   }

   getRealtimeDb()
   {
      return this.realtimeDb;
   }

   getFirestore()
   {
      return this.firestore;
   }

}

module.exports = FirebaseUtils;