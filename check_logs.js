const { Client } = require('ssh2');

const conn = new Client();

const bashScript = `
echo "=== PM2 STATUS ==="
pm2 status
echo "=== PM2 LOGS ==="
pm2 logs whatzupp --lines 50 --nostream
echo "=== PORT LISTENING ==="
netstat -tulpn | grep LISTEN
`;

conn.on('ready', () => {
  conn.exec(bashScript, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '31.97.207.239',
  port: 22,
  username: 'root',
  password: 'Pentacloud@2026',
  readyTimeout: 60000
});
