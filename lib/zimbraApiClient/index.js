import SOAPHelper from './soap_helper.js';
import { TaskFolder, Folder, Message, Task, MessageFolder, NewTask } from './models.js';
//import { simpleParser } from 'mailparser';
import pkg from 'mailparser';
const { simpleParser } = pkg;

class ZimbraApiClient
{
   constructor(zimbraUrl, username, password)
   {
      this.username = username;
      this.password = password;
      this.zimbraUrl = zimbraUrl;
      this.internal = new Internal(zimbraUrl, username, password);
   }

   async createTask(taskFolder, newTask)
   {
      try 
      {
         return await this.internal.createTask(taskFolder.id, newTask.name, newTask.content);
      }
      catch (err)
      {
         console.error(err);
         return [];
      }
   }

   async createNote(folder)
   {
      try 
      {
         return await this.internal.createNote(folder.id);
      }
      catch (err)
      {
         console.error(err);
         return [];
      }
   }

   async getTaskLists()
   {
      try 
      {
         return await this.internal.getFolders('/', TaskFolder.view);
      }
      catch (err)
      {
         console.error(err);
         return [];
      }
   }

   async getTasks(taskFolder)
   {
      try
      {
         return await this.internal.search(taskFolder.id, TaskFolder.view);
      }
      catch (err)
      {
         return [];
      }
   }

   async getNoteFolders()
   {
      let folders = [];
      try
      {
         folders.push(await this.internal.getItem('/Notes', MessageFolder.view));
      }
      catch (err) { console.error(err); }
      try
      {
         folders.push(await this.internal.getItem('/Notes@filieth', MessageFolder.view));
      }
      catch (err) { console.error(err); }

      return folders;
   }

   async getNotes(noteFolder)
   {
      try
      {
         return await this.internal.search(noteFolder.id, MessageFolder.view);
      }
      catch (err)
      {
         return [];
      }
   }
}


class Internal
{
   constructor(zimbraUrl, username, password)
   {
      this.username = username;
      this.password = password;
      this.zimbraUrl = zimbraUrl;
      this.soapHelper = new SOAPHelper(zimbraUrl, username, password);
   }

   getFolders(parentPath, view)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var reqObj = { "GetFolderRequest": { "@": { "xmlns": "urn:zimbraMail", "view": view }, "folder": { "@": { "path": parentPath } } } };

         self.soapHelper.doRequest(reqObj, "GetFolderResponse", function (err, resp)
         {
            if (err)
               reject(err && err.message ? new Error(err.message) : new Error(err));

            if (resp && resp.folder && resp.folder.length && resp.folder.length > 0)
            {
               let objArr = [];
               if (resp.folder[0].folder)
               {
                  let folderArr = resp.folder[0].folder;
                  folderArr = folderArr.map(function (obj)
                  {
                     if (view === obj.view)
                        return self.parseFolder(obj);

                     return null;
                  }).filter(obj => obj !== null);

                  objArr.push(...folderArr);
               }
               if (resp.folder[0].link)
               {
                  let folderArr = resp.folder[0].link;
                  folderArr = folderArr.map(function (obj)
                  {
                     if (view === obj.view)
                        return self.parseFolder(obj);

                     return null;
                  }).filter(obj => obj !== null);

                  objArr.push(...folderArr);
               }
               resolve(objArr);
            }

            reject(new Error('response parsing error'));
         });
      });
   }

   getItem(path)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var reqObj = { "GetItemRequest": { "@": { "xmlns": "urn:zimbraMail" }, "item": { "@": { "path": path } } } };

         self.soapHelper.doRequest(reqObj, "GetItemResponse", function (err, resp)
         {
            if (err)
               reject(err && err.message ? new Error(err.message) : new Error(err));

            if (resp)   
            {
               if (resp.folder && resp.folder.length && resp.folder.length > 0)
               {
                  resolve(self.parseFolder(resp.folder[0]));
               }
               else if (resp.link && resp.link.length && resp.link.length > 0)
               {
                  resolve(self.parseFolder(resp.link[0]));
               }
            }

            reject(new Error('response parsing error'));
         });
      });
   }

   getMessage(msgId)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var reqObj = { "GetMsgRequest": { "@": { "xmlns": "urn:zimbraMail" }, "m": { "@": { "id": msgId, "raw": 1 } } } };

         self.soapHelper.doRequest(reqObj, "GetMsgResponse", async function (err, resp)
         {
            if (err)
               reject(err && err.message ? new Error(err.message) : new Error(err));

            if (resp)   
            {
               if (resp.m && resp.m.length && resp.m.length > 0)
               {
                  resolve(resp.m[0]);
               }
            }

            reject(new Error('response parsing error'));
         });
      });
   }

   createTask(folderId, name, content)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var reqObj = {
            "CreateTaskRequest":
            {
               "@": {
                  "xmlns": "urn:zimbraMail"
               },
               "m": {
                  "@": {
                     "l": folderId,
                  },
                  "mp": {
                     "@": {
                        "ct": "multipart/alternative"
                     },
                     "mp": {
                        "@": {
                           "ct": "text/plain"
                        },
                        "content": content
                     }
                  },
                  "inv": {
                     "comp": {
                        "@": {
                           "name": name,
                        }
                     }
                  }
               }
            }
         };

         self.soapHelper.doRequest(reqObj, "CreateTaskResponse", async function (err, resp)
         {
            console.log(err);
            console.log(resp);

            /*if (err)
               reject(err && err.message ? new Error(err.message) : new Error(err));
 
            if (resp)   
            {
               if (resp.m && resp.m.length && resp.m.length > 0)
               {
                  resolve(resp.m[0]);
               }
            }
 
            reject(new Error('response parsing error'));*/
         });
      });
   }

   parseFolder(obj)
   {
      if (obj)
      {
         if (TaskFolder.view === obj.view)
            return new TaskFolder(obj.id, obj.name, obj.absFolderPath, obj.l);
         else if (MessageFolder.view === obj.view)
            return new MessageFolder(obj.id, obj.name, obj.absFolderPath, obj.l, obj.view);
         else
            return new Folder(obj.id, obj.name, obj.absFolderPath, obj.l, obj.view);
      }
   }

   search(pathId, types)
   {
      const self = this;

      return new Promise(function (resolve, reject)
      {
         var reqObj = { "SearchRequest": { "@": { "xmlns": "urn:zimbraMail", "types": types }, "query": "inid:" + pathId } };

         self.soapHelper.doRequest(reqObj, "SearchResponse", async function (err, resp)
         {
            if (err)
               reject(err && err.message ? new Error(err.message) : new Error(err));

            const responseTypes = 'message' === types ? 'm' : types;

            if (resp && resp[responseTypes] && resp[responseTypes].length && resp[responseTypes].length > 0)
            {
               const objArr = resp[responseTypes];

               if (TaskFolder.view === types)
               {
                  resolve(objArr.map(function (x)
                  {
                     return new Task(x.id, x.name, x.status, x.priority, x.percentComplete, new Date(x.d), new Date(x.md * 1000));
                  }));
               }
               else if (MessageFolder.view === types)
               {
                  let dataArr = [];
                  for (const x of objArr)
                  {
                     const msg = await self.getMessage(x.id);
                     if (msg)
                     {
                        try
                        {
                           let parsedMsg = await simpleParser(msg['content']['_content']);
                           dataArr.push(new Message(x.id, x.su, parsedMsg.textAsHtml, new Date(x.d)));
                        }
                        catch (err)
                        {
                           console.error(err);
                        }
                     }
                  }
                  resolve(dataArr);
               }
            }

            reject(new Error('response parsing error'));
         });
      });
   }
}

export { ZimbraApiClient, TaskFolder, Folder, Message, Task, MessageFolder, NewTask };