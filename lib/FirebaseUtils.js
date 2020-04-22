const admin = require("firebase-admin");

class FirebaseUtils
{
   constructor(databaseURL, serviceAccountFilePath)
   {
      const firebaseAdmin = !admin.apps.length ? admin.initializeApp({
         credential: admin.credential.cert(serviceAccountFilePath),
         databaseURL: databaseURL
      }) : admin.app();

      this.realtimeDb = firebaseAdmin.database();
      this.firestore = firebaseAdmin.firestore();
   }

   async realtimeDbGet(dbPath)
   {
      try
      {
         return (await this.realtimeDb.ref(dbPath).once('value')).val();
      }
      catch (err)
      {
         console.error(err);
      }

      return null;
   }

   async realtimeDbSet(dbPath, data)
   {
      try
      {
         this.realtimeDb.ref(dbPath).set(data);
         console.log('FirebaseAdmin.set.success("' + dbPath + '") = ' + new Date());
      }
      catch (err)
      {
         console.log('FirebaseAdmin.set.error("' + dbPath + '") = ' + new Date());
         console.error(err);
      }
   }

   async realtimeDbUpdate(dbPath, data)
   {
      try
      {
         this.realtimeDb.ref(dbPath).update(data);
         console.log('FirebaseAdmin.update.success("' + dbPath + '") = ' + new Date());
      }
      catch (err)
      {
         console.log('FirebaseAdmin.update.error("' + dbPath + '") = ' + new Date());
         console.error(err);
      }
   }

   async realtimeDbRemove(dbPath)
   {
      try
      {
         this.realtimeDb.ref(dbPath).remove();
         console.log('FirebaseAdmin.remove.success("' + dbPath + '") = ' + new Date());
      }
      catch (err)
      {
         console.log('FirebaseAdmin.remove.error("' + dbPath + '") = ' + new Date());
         console.error(err);
      }
   }

   getFirestore()
   {
      return this.firestore;
   }
}

module.exports = FirebaseUtils;