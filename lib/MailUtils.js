import MailParser from 'mailparser';
import Imap from 'imap';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';

export default {
   folderMessageBodies: {},
   folderParsedMessages: {},
   openInbox: function (imap, folderName, callback)
   {
      imap.openBox(folderName, true, function (err, box)
      {
         if (!err)
         {
            var messageBodies = [];
            try
            {
               var f = imap.seq.fetch('1:*', { bodies: [''] });
               f.on('message', function (msg, seqno)
               {
                  msg.on('body', function (stream, info)
                  {
                     var buffer = '', count = 0;
                     stream.on('data', function (chunk)
                     {
                        count += chunk.length;
                        buffer += chunk.toString('utf8');
                     });
                     stream.once('end', function ()
                     {
                        messageBodies.push(buffer);

                        //if (info.which !== 'TEXT')
                        //console.log('Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                     });
                  });
               });
               f.once('end', function ()
               {
                  fImap.folderMessageBodies[folderName] = messageBodies;
                  callback();
               });
               f.once('error', function (err)
               {
                  console.log(err);
               });
            }
            catch (errr) { }
         } else
            console.log(err);
      });
   },
   openInboxes: function (folderNamesArray, idx, imap, callback)
   {
      if (idx >= folderNamesArray.length)
         return;

      fImap.openInbox(imap, folderNamesArray[idx], function ()
      {
         fImap.parseMessageBodiesSingle(fImap.folderMessageBodies[folderNamesArray[idx]], function (data)
         {
            fImap.folderParsedMessages[folderNamesArray[idx]] = data;
            if (Object.keys(fImap.folderMessageBodies).length < folderNamesArray.length)
            {
               fImap.openInboxes(folderNamesArray, idx + 1, imap, callback);
               return;
            }

            callback(fImap.folderParsedMessages);
         });
      });
   },
   parseMessageBodiesSingle: function (messageBodies, callback)
   {
      var myData = {};
      for (var i = 0; i < messageBodies.length; i++)
      {
         var mailparser = new MailParser({
            streamAttachments: true
         });

         mailparser.on("end", function (mail_object)
         {
            var myTmp = myData[mail_object.messageId];
            if (!myTmp)
               myTmp = {};

            myTmp["from"] = mail_object.from;
            myTmp["date"] = mail_object.date;
            myTmp["subject"] = mail_object.subject;
            myTmp["content"] = mail_object.html ? mail_object.html : (mail_object.text ? mail_object.text.replace(/\n/g, '<br>') : "");

            myData[mail_object.messageId] = myTmp;
         });

         mailparser.on("attachment", function (attachment, mail)
         {
            var fileName = attachment.generatedFileName;
            //var output = fs.createWriteStream(fileNameSave);
            //attachment.stream.pipe(output);

            var myTmp = myData[mail.messageId];
            if (!myTmp)
               myTmp = {};

            var attachmentsHTML = myTmp['attachments'];
            if (!attachmentsHTML)
               attachmentsHTML = "";
            attachmentsHTML += "<hr>Attachments:<br>";
            attachmentsHTML += '<a href="#">\' + fileName + \'</a>';
            myTmp["attachments"] = attachmentsHTML;

            myData[mail.messageId] = myTmp;
         });

         mailparser.write(messageBodies[i]);
         mailparser.end();
      }
      if (mailparser)
         mailparser.on("end", function (mail)
         {
            callback(myData);
         });
      else
         callback(myData);
   },
   getMails: function (account, pwd, hostname, port, tls, imapFolderArray, callback)
   {
      fImap.folderMessageBodies = {};
      fImap.folderParsedMessages = {};

      //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

      var imap = new Imap({
         user: account,
         password: pwd,
         host: hostname,
         port: port,
         tls: tls
      });

      imap.once('ready', function ()
      {
         fImap.openInboxes(imapFolderArray, 0, imap, function (resData)
         {
            imap.end();
            resData['___modifyDate'] = new Date();
            callback(resData);
         });
      });

      imap.connect();
   },
   sendMail: function (senderHost, senderPort, senderUsername, senderPassword, mailOpts, callback)
   {
      var transporter = nodemailer.createTransport(smtpTransport({
         host: senderHost,
         port: senderPort,
         secure: true,
         tls: { rejectUnauthorized: false },
         auth: {
            user: senderUsername,
            pass: senderPassword
         }
      }));

      transporter.sendMail(mailOpts, function (error, info)
      {
         callback(error, info);
      });
   }
};