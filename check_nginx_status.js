const { Client } = require('ssh2');
const conn = new Client();
const bashScript = `
curl -I -H "Host: whatzupp.com" http://localhost
`;
conn.on('ready', () => {
  conn.exec(bashScript, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => conn.end())
          .on('data', data => process.stdout.write(data))
          .stderr.on('data', data => process.stderr.write(data));
  });
}).connect({
  host: '31.97.207.239', port: 22, username: 'root', password: 'Pentacloud@2026', readyTimeout: 60000
});
