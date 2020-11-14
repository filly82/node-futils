class Folder
{
   constructor(id, name, absFolderPath, parentId, view)
   {
      this.id = id;
      this.name = name;
      this.absFolderPath = absFolderPath;
      this.parentId = parentId;
      this.view = view;
   }
}

class TaskFolder extends Folder
{
   static view = 'task';

   constructor(id, name, absFolderPath, parentId)
   {
      super(id, name, absFolderPath, parentId, TaskFolder.view);
   }
}

class MessageFolder extends Folder
{
   static view = 'message';

   constructor(id, name, absFolderPath, parentId)
   {
      super(id, name, absFolderPath, parentId, MessageFolder.view);
   }
}

class Message
{
   constructor(id, name, content, createDate)
   {
      this.id = id;
      this.name = name;
      this.content = content;
      this.createDate = createDate;
   }
}

class Task
{
   constructor(id, name, status, priority, percentComplete, createDate, modifyDate)
   {
      this.id = id;
      this.name = name;
      this.status = status;
      this.priority = priority;
      this.percentComplete = percentComplete;
      this.createDate = createDate;
      this.modifyDate = modifyDate;
   }
}

class NewTask
{
   constructor(name, content)
   {
      this.name = name;
      this.content = content;
   }
}

export { Folder, Message, TaskFolder, MessageFolder, Task, NewTask }