const { Client } = require('ssh2');

const conn = new Client();

const script = `
echo "=== ALL FILES IN /etc/nginx/sites-enabled ==="
grep -rn "whatzupp" /etc/nginx/

echo "=== DEFAULT / ADSTUDIOX SERVER BLOCKS ==="
cat /etc/nginx/sites-enabled/adstudiox* || true
cat /etc/nginx/sites-enabled/default* || true
`;

conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
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
