const { Client } = require('ssh2');

const conn = new Client();

const nginxConfig = `
server {
    listen 80;
    listen [::]:80;
    server_name whatzupp.com www.whatzupp.com 31.97.207.239;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name whatzupp.com www.whatzupp.com;

    ssl_certificate /etc/letsencrypt/live/whatzupp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whatzupp.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

const fixScript = `
echo "Writing Nginx configuration for whatzupp..."
cat << 'EOF' > /etc/nginx/sites-available/whatzupp
${nginxConfig}
EOF

ln -sf /etc/nginx/sites-available/whatzupp /etc/nginx/sites-enabled/whatzupp

echo "Testing Nginx syntax..."
nginx -t

echo "Restarting Nginx..."
systemctl restart nginx

echo "Nginx configuration updated and restarted successfully!"
`;

conn.on('ready', () => {
  conn.exec(fixScript, (err, stream) => {
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
