const path = require('path');
const NeDB = require('nedb');

class FStorageManager
{
    constructor(cacheFileName)
    {
        //this.istErreichbar = "";
        //this.istErreichbarFunction = function() {  }

        this.internal = new Internal(cacheFileName);
    }

    get(queryObj)
    {
        return this.internal.internalGet(queryObj);
    }

    insert(queryObj, obj)
    {
        return this.internal.internalInsert(queryObj, obj);
    }

    remove(queryObj)
    {
        return this.internal.internalRemove(queryObj);
    }

    update(queryObj, obj)
    {
        return this.internal.internalUpdate(queryObj, obj);
    }
}

class Internal
{
    constructor(cacheFileName)
    {
        this.db = new NeDB({ filename: cacheFileName, autoload: true });
    }

    internalGet(queryObj)
    {
        const self = this;

        return new Promise(function(resolve, reject)
        {
            self.db.find(queryObj, function (err, docs) 
            {
                console.log('internalGet(queryObj="'+JSON.stringify(queryObj)+'")');
                console.log('docs:');
                console.log(docs);
                if (err !== null)
                    reject(new Error(err));
                else
                    resolve(docs);
            });
        });
    }

    internalInsert(queryObj, obj)
    {
        return this.internalUpdate(queryObj, obj); // schon gewollt so
    }

    internalUpdate(queryObj, obj)
    {
        const self = this;

        return new Promise(function(resolve, reject)
        {
            self.db.update(queryObj, obj, {upsert:true}, function (err, numReplaced) 
            {
                console.log('internalUpdate(queryObj="'+JSON.stringify(queryObj)+'", obj="'+JSON.stringify(obj)+'")');
                console.log('numReplaced:'+numReplaced);
                if (err !== null)
                    reject(new Error(err));
                else
                    resolve(numReplaced);
            });
        });
    }

    internalRemove(queryObj)
    {
        const self = this;

        return new Promise(function(resolve, reject)
        {
            self.db.remove(queryObj, obj, {}, function (err, numRemoved) 
            {
                console.log('internalRemove(queryObj="'+JSON.stringify(queryObj)+'")');
                console.log('numRemoved:'+numRemoved);
                if (err !== null)
                    reject(new Error(err));
                else
                    resolve(numRemoved);
            });
        });
    }
}

module.exports = FStorageManager;