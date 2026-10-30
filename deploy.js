const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const envContent = fs.readFileSync('.env.local', 'utf8');

const bashScript = `
set -e
echo "Fixing apt sources..."
find /etc/apt -type f -exec sed -i 's/repos.del.extreme-ix.org/archive.ubuntu.com/g' {} + || true

echo "Updating apt..."
apt-get update > /dev/null
apt-get install -y git curl nginx > /dev/null

echo "Checking Node.js..."
if ! command -v node &> /dev/null
then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
    apt-get install -y nodejs > /dev/null
fi

echo "Installing pm2..."
npm install -g pm2 > /dev/null

echo "Setting up repository..."
mkdir -p /var/www
cd /var/www
if [ -d "whatzupp" ]; then
    cd whatzupp
    git pull origin main
else
    git clone https://github.com/Pentacloud-Consulting/Whatzupp_MCP.git whatzupp
    cd whatzupp
fi

echo "Writing environment variables..."
cat << 'EOF' > .env.production
${envContent.replace(/\$/g, '\\$')}
EOF
cp .env.production .env.local

echo "Installing npm dependencies..."
npm install --legacy-peer-deps

echo "Building project..."
npm run build

echo "Starting pm2..."
pm2 describe whatzupp > /dev/null 2>&1
if [ $? -eq 0 ]; then
    pm2 restart whatzupp
else
    pm2 start npm --name "whatzupp" -- run start -- -p 3055
fi

echo "Configuring Nginx..."
cat << 'EOF' > /etc/nginx/sites-available/whatzupp
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
EOF

ln -sf /etc/nginx/sites-available/whatzupp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "Saving pm2 state..."
pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

echo "Deployment Successful!"
`;

conn.on('ready', () => {
  console.log('SSH Connection Established.');
  conn.exec(bashScript, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
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
