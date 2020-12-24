'use strict';

const fs = require('fs');

const Client = require('ssh2-sftp-client');
const sftp = new Client();

sftp.connect({
  host: 'sftphost',
  port: 22,
  username: 'foo',
  privateKey: fs.readFileSync('/opt/code/keys/id_foo'),
}).then(() => {
  return sftp.list('/download');
}).then(data => {
  console.log(data, 'the data info');
}).catch(err => {
  console.log(err, 'catch error');
});
