"use strict";

var https = require("https");
var xmldoc = require('xmldoc');

var fCalDav = {

    doRequest: function (url, user, pass, start, end, xmlAlternative, requestMethod, callback)
    {
        var urlparts = /(https?)\:\/\/(.*?):?(\d*)?(\/.*\/?)/gi.exec(url);
        var protocol = urlparts[1];
        var host = urlparts[2];
        var port = urlparts[3] || (protocol === "https" ? 443 : 80);
        var path = urlparts[4];
        var endTimeRange = (end) ? ' end="' + end + '"' : "";

        var xml = '<?xml version="1.0" encoding="utf-8" ?>\n' +
            '<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">\n' +
            '  <D:prop>\n' +
            '    <C:calendar-data/>\n' +
            '  </D:prop>\n' +
            '  <C:filter>\n' +
            '    <C:comp-filter name="VCALENDAR">\n' +
            '      <C:comp-filter name="VEVENT">\n' +
            '        <C:time-range start="' + start + '"' + endTimeRange + '/>\n' +
            '      </C:comp-filter>\n' +
            '    </C:comp-filter>\n' +
            '  </C:filter>\n' +
            '</C:calendar-query>';
        if (xmlAlternative)
            xml = xmlAlternative;

        var options = {
            rejectUnauthorized: false,
            hostname: host,
            port: port,
            path: path,
            method: requestMethod,
            headers: {
                "Content-type": "text/xml",
                "Content-Length": xml.length,
                "User-Agent": "calDavClient",
                "Connection": "close",
                "Depth": "1"
            }
        };

        if (user && pass) {
            var userpass = new Buffer(user + ":" + pass).toString('base64');
            options.headers["Authorization"] = "Basic " + userpass;
        }

        var req = https.request(options, function (res) {
            var s = "";
            res.on('data', function (chunk) {
                s += chunk;
            });

            req.on('close', function () {
                if (callback)
                    callback(s);
            });
        });

        req.end(xml);

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });
    },

    getTasks:  function (url, user, pass, start, end, cb)
    {
        this.doRequest(url, user, pass, start, end, "", "GET", function (responseString)
        {
            var myData = {};
            var responseJSON;
            try {
                responseJSON = JSON.parse(responseString);
            }
            catch (err) {

            }
            if (responseJSON)
            {
                var objTask = responseJSON["task"];
                if (objTask)
                    for (var i = 0; i < objTask.length; i++)
                    {
                        var objTaskElem = objTask[i];
                        if (objTaskElem)
                        {
                            var objTaskElem1 = objTaskElem["inv"];
                            if (objTaskElem1)
                                for (var j = 0; j < objTaskElem1.length; j++)
                                {
                                    var objTaskElem2 = objTaskElem1[j];
                                    var objTaskElem3 = objTaskElem2["comp"];
                                    if (objTaskElem3)
                                        for (var k = 0; k < objTaskElem3.length; k++)
                                        {
                                            var objTaskElem4 = objTaskElem3[k];
                                            if (objTaskElem4)
                                            {
                                                var __status = objTaskElem4["status"];
                                                if (__status && __status === "COMP") continue; // Status=Abgeschlossen

                                                var __name = objTaskElem4["name"];
                                                var __desc = "";

                                                var objDesc = objTaskElem4["desc"];
                                                if (objDesc)
                                                    for (var m = 0; m < objDesc.length; m++)
                                                    {
                                                        var objDesc1 = objDesc[m];
                                                        if (objDesc1)
                                                        {
                                                            __desc += objDesc1["_content"];
                                                            if (__desc === "\n")
                                                                __desc = "";
                                                        }
                                                    }

                                                var thisData = {"content": __desc};
                                                myData[__name] = thisData;
                                            }
                                        }
                                }
                        }
                    }
            }
            cb(myData);
        });
    },

    getEvents: function (url, user, pass, start, end, cb)
    {
        this.doRequest(url, user, pass, start, end, undefined, "REPORT", function (responseString)
        {
            var reslist = [];
            try {
                var xmlDoc = new xmldoc.XmlDocument(responseString);
                xmlDoc.eachChild(function (child, index, array) {

                    if ("D:response" === child.name)
                    {
                        child.eachChild(function (child2, index2, array2) {
                            if ("D:propstat" === child2.name)
                            {
                                child2.eachChild(function (child3, index3, array3) {
                                    if ("D:prop" === child3.name)
                                    {
                                        child3.eachChild(function (child4, index4, array4) {
                                            if ("C:calendar-data" === child4.name)
                                            {
                                                //console.log(child4.name+"="+JSON.stringify(child4));
                                                //console.log(child4.val);
                                                var ics = child4.val;
                                                var evs = ics.match(/BEGIN:VEVENT[\s\S]*END:VEVENT/gi);
                                                for (var x in evs) {
                                                    var evobj = {};
                                                    var evstr = evs[x];
                                                    evstr = evstr.split("\n");
                                                    for (var y in evstr) {
                                                        var evpropstr = evstr[y];
                                                        if (evpropstr.match(/BEGIN:|END:/gi)) {
                                                            continue;
                                                        }
                                                        var sp = evpropstr.split(":");
                                                        var key = sp[0];
                                                        var val = sp[1];
                                                        if (key && val) {
                                                            evobj[key] = val;
                                                        }

                                                    }
                                                    reslist.push(evobj);
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

                cb(reslist);
            } catch (e) {
                console.log("Error parsing response: " + e)
            }
        });
    }
};

module.exports = fCalDav;