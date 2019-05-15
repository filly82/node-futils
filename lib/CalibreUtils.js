const sqlite3 = require("sqlite3").verbose();
const path = require('path');
const Utils = require('./Utils');
const imageDataUri = require('image-data-uri');

class CalibreUtils
{
   constructor(databasePath, booksRootPath)
   {
      this.databasePath = databasePath;
      this.booksRootPath = booksRootPath;

      this._____internal = new Internal(databasePath, booksRootPath);
   }

   getBooks()
   {
      return this._____internal.loadBooks(null);
   }

   getBook(bookId)
   {
      return this._____internal.loadBooks(bookId);
   }
}


class Internal
{
   constructor(databasePath, booksRootPath)
   {
      this.databasePath = databasePath;
      this.booksRootPath = booksRootPath;
   }

   loadBooks(bookId)
   {
      const self = this;

      return new Promise(async function (resolve, reject)
      {
         const dbData = await self.parseDatabase(bookId);
         const resultData = await self.mergeData(dbData);

         if (resultData[1] && Object.keys(resultData[1]).length > 0)
         {
            return Utils.PromiseAllSettled(Object.values(resultData[1])).then(function (theResponses)
            {
               let pictureData = {};
               let c = 0;
               for (const theResponse of theResponses)
               {
                  if (theResponse.value)
                  {
                     let theResponseData = {};
                     theResponseData[Object.keys(resultData[1])[c]] = theResponse.value.match(new RegExp('.{1,' + Math.floor(theResponse.value.length / 5) + '}', 'g'));

                     pictureData = Utils.deepMerge(pictureData, theResponseData);
                  }
                  else if (theResponse.error)
                  {
                     console.log('error');
                     console.log(theResponse.error);
                  }
                  c++;
               }

               return resolve([resultData[0], pictureData]);
            });
         }
         else
            return resolve([resultData[0], null]);

      });
   }

   parseDatabase(bookId)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         const db = new sqlite3.cached.Database(self.databasePath, sqlite3.OPEN_READONLY);

         let data = {};

         return db.parallelize(function ()
         {
            db.all("SELECT id, title, path, strftime('%Y-%m-%dT%H:%M:%S.000+01:00', pubdate) pubdate, strftime('%Y-%m-%dT%H:%M:%S.000+01:00', timestamp) timestamp FROM books " + (bookId != null ? "WHERE id=" + bookId : ""), function (err, rowBook)
            {
               data['books'] = rowBook;
               if (Object.keys(data).length == 6)
                  return resolve(data);
            });

            db.all("SELECT book, format, name, uncompressed_size FROM data " + (bookId != null ? "WHERE book=" + bookId : ""), function (err1, rowFormat)
            {
               data['formats'] = rowFormat;
               if (Object.keys(data).length == 6)
                  return resolve(data);
            });

            db.all("SELECT name, book FROM books_authors_link AS bal JOIN authors ON(author = authors.id) " + (bookId != null ? "WHERE book=" + bookId : ""), function (err1, rowAuthor)
            {
               data['authors'] = rowAuthor;
               if (Object.keys(data).length == 6)
                  return resolve(data);
            });

            db.all("SELECT name, btl.book book FROM books_tags_link AS btl JOIN tags ON(tag = tags.id) " + (bookId != null ? "WHERE btl.book=" + bookId : ""), function (err1, rowTag)
            {
               data['tags'] = rowTag;
               if (Object.keys(data).length == 6)
                  return resolve(data);
            });

            db.all("SELECT book, text FROM comments " + (bookId != null ? "WHERE book=" + bookId : ""), function (err1, rowComment)
            {
               data['comments'] = rowComment;
               if (Object.keys(data).length == 6)
                  return resolve(data);
            });

            db.all("SELECT languages.lang_code lang_code, bll.book book FROM books_languages_link AS bll LEFT JOIN languages ON (languages.id = bll.lang_code) " + (bookId != null ? "WHERE bll.book=" + bookId : ""), function (err1, rowLanguage)
            {
               data['languages'] = rowLanguage;
               if (Object.keys(data).length == 6)
                  return resolve(data);
            });

         });
      });
   }

   mergeData(data)
   {
      const self = this;

      var newData = {};
      var pictureExtractPromises = {};

      var theAuthors = data['authors'];
      var theBooks = data['books'];
      var theComments = data['comments'];
      var theFormats = data['formats'];
      var theLanguages = data['languages'];
      var theTags = data['tags'];

      for (let i = 0; i < theBooks.length; i++)
      {
         newData[theBooks[i]['id']] = theBooks[i];

         if (self.booksRootPath != null)
         {
            const picturePath = path.join(self.booksRootPath, theBooks[i]['path'], 'cover.jpg');
            if (picturePath)
               pictureExtractPromises[theBooks[i]['id']] = imageDataUri.encodeFromFile(picturePath);
         }
      }
      for (let i = 0; i < theFormats.length; i++)
      {
         var formats = newData[theFormats[i]['book']]['f'] || [];
         formats.push(theFormats[i]);
         let bookId = theFormats[i]['book'];
         delete theFormats[i]['book'];

         newData[bookId]['f'] = formats;
      }
      for (let i = 0; i < theAuthors.length; i++)
      {
         var authors = newData[theAuthors[i]['book']]['a'] || [];
         authors.push(theAuthors[i]);
         let bookId = theAuthors[i]['book'];
         delete theAuthors[i]['book'];

         newData[bookId]['a'] = authors;
      }
      for (let i = 0; i < theComments.length; i++)
      {
         var comments = newData[theComments[i]['book']]['c'] || [];
         comments.push(theComments[i]);
         let bookId = theComments[i]['book'];
         delete theComments[i]['book'];

         newData[bookId]['c'] = comments;
      }
      for (let i = 0; i < theLanguages.length; i++)
      {
         var languages = newData[theLanguages[i]['book']]['l'] || [];
         languages.push(theLanguages[i]);
         let bookId = theLanguages[i]['book'];
         delete theLanguages[i]['book'];

         newData[bookId]['l'] = languages;
      }
      for (let i = 0; i < theTags.length; i++)
      {
         var tags = newData[theTags[i]['book']]['t'] || [];
         tags.push(theTags[i]);
         let bookId = theTags[i]['book'];
         delete theTags[i]['book'];

         newData[bookId]['t'] = tags;
      }

      return [newData, pictureExtractPromises];
   }
}

module.exports = CalibreUtils;