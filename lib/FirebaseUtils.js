import admin from 'firebase-admin';
export default class FirebaseUtils
{
   constructor(databaseURL, storageBucket, serviceAccountFilePath, appName)
   {
      let firebaseAdmin = undefined;
      if (admin.apps.length)
      {
         for (const existingApp of admin.apps)
         {
            if (existingApp.name === appName)
            {
               firebaseAdmin = existingApp;
               break;
            }
         }
      }
      if (!firebaseAdmin)
      {
         firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(serviceAccountFilePath),
            databaseURL: databaseURL,
            storageBucket: storageBucket
         }, appName);
      }

      this.databaseURL = databaseURL;
      this.realtimeDb = firebaseAdmin.database();
      this.firestore = firebaseAdmin.firestore();
      this.storage = firebaseAdmin.storage();
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
         console.log('FirebaseAdmin(' + this.databaseURL + ').set.success("' + dbPath + '") = ' + new Date());
      }
      catch (err)
      {
         console.log('FirebaseAdmin(' + this.databaseURL + ').set.error("' + dbPath + '") = ' + new Date());
         console.error(err);
      }
   }

   async realtimeDbUpdate(dbPath, data)
   {
      try
      {
         this.realtimeDb.ref(dbPath).update(data);
         console.log('FirebaseAdmin(' + this.databaseURL + ').update.success("' + dbPath + '") = ' + new Date());
      }
      catch (err)
      {
         console.log('FirebaseAdmin(' + this.databaseURL + ').update.error("' + dbPath + '") = ' + new Date());
         console.error(err);
      }
   }

   async realtimeDbRemove(dbPath)
   {
      try
      {
         this.realtimeDb.ref(dbPath).remove();
         console.log('FirebaseAdmin(' + this.databaseURL + ').remove.success("' + dbPath + '") = ' + new Date());
      }
      catch (err)
      {
         console.log('FirebaseAdmin(' + this.databaseURL + ').remove.error("' + dbPath + '") = ' + new Date());
         console.error(err);
      }
   }

   getFirestore()
   {
      return this.firestore;
   }

   getStorage()
   {
      return this.storage;
   }
}