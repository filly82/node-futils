module.exports = {
    formatBytes: function (bytes)
    {
        if (bytes < 1024)
            return bytes + " Bytes";
        else if (bytes < 1048576)
            return(bytes / 1024).toFixed(2) + " KB";
        else if (bytes < 1073741824)
            return(bytes / 1048576).toFixed(2) + " MB";
        else
            return(bytes / 1073741824).toFixed(2) + " GB";
    },

    formatDate: function(jsDate, patternKey)
    {
        if (!patternKey)
            patternKey = "datetime";

        var str_date = jsDate.getDay() + "." + (jsDate.getMonth()+1) + "." + jsDate.getFullYear();
        var str_time = jsDate.getHours() + ":" + jsDate.getMinutes();

        if (patternKey === 'datetime')
            return str_date + " " + str_time;
        else if (patternKey === 'date')
            return str_date;
        else
            return str_date;
    }
}