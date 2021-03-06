import fs from 'fs';
import path from 'path';
import request from 'request';
import util from 'util';

fs.readFilePromise = util.promisify(fs.readFile);
fs.writeFilePromise = util.promisify(fs.writeFile);

export default
   {
      getFileListingRecursive: function (pathStr, returnArray, onlyFileExtensionsArray)
      {
         if (fs.lstatSync(pathStr).isDirectory())
         {
            var arr = fs.readdirSync(pathStr);
            for (var i = 0; i < arr.length; i++)
            {
               var newPathStr = path.join(pathStr, arr[i]);
               if (fs.lstatSync(newPathStr).isDirectory())
               {
                  this.getFileListingRecursive(newPathStr, returnArray, onlyFileExtensionsArray);
               }
               else
               {
                  if (onlyFileExtensionsArray === undefined)
                     returnArray.push(newPathStr);
                  else
                  {
                     if (onlyFileExtensionsArray.length > 0)
                        for (var o = 0; o < onlyFileExtensionsArray.length; o++)
                        {
                           if (path.extname(newPathStr) === onlyFileExtensionsArray[o])
                              returnArray.push(newPathStr);
                        }
                  }
               }
            }
         }

         return returnArray;
      },

      directoryTree: function (fsPath, extensions, onEachFile)
      {
         var fsName = path.basename(fsPath);
         var item = { fsPath, fsName };
         var stats;

         try { stats = fs.statSync(fsPath); }
         catch (e) { return null; }

         if (stats.isFile())
         {
            const ext = path.extname(fsPath).toLowerCase();

            // Only add files with the provided extensions
            if (extensions && extensions.length && extensions.indexOf(ext) === -1)
               return null;

            //item.size = stats.size;  // File size in bytes
            item.extension = ext;
            item.file = true;

            if (onEachFile)
            {
               onEachFile(item);
            }
         }
         else if (stats.isDirectory())
         {
            try
            {
               item.children = fs.readdirSync(fsPath)
                  .map(child => this.directoryTree(path.join(fsPath, child), extensions, onEachFile))
                  .filter(e => !!e);
               //item.size = item.children.reduce((prev, cur) => prev + cur.size, 0);
               item.directory = true;
               if (onEachFile)
               {
                  onEachFile(item);
               }
            } catch (ex)
            {
               if (ex.code == "EACCES")
                  //User does not have permissions, ignore directory
                  return null;
            }
         } else
         {
            return null; // Or set item.size = 0 for devices, FIFO and sockets ?
         }
         return item;
      },

      getJSONFromFile: async function (file)
      {
         try
         {
            var data = await fs.readFilePromise(file, 'utf-8');

            if (!data || data.trim() === '')
               data = '{}';

            return JSON.parse(data.trim());
         }
         catch (err)
         {
            console.error(err);
         }
      },

      writeJSONToFile: async function (file, obj)
      {
         try
         {
            await fs.writeFilePromise(file, JSON.stringify(obj), 'utf8');
            return obj;
         }
         catch (err)
         {
            console.error(err);
         }
      },

      fileExists: function (filePath)
      {
         try
         {
            return fs.statSync(filePath).isFile();
         } catch (err)
         {
            return false;
         }
      },

      downloadFile: function (fileUrl, savePath, callback)
      {
         request.head(fileUrl, function (err, res, body)
         {
            console.log('downloadFile.content-type:', res.headers['content-type']);
            console.log('downloadFile.content-length:', res.headers['content-length']);

            var r = request(fileUrl).pipe(fs.createWriteStream(savePath));
            r.on('close', callback);
         });
      }
   };