# Deploying SafeSpace to Huawei Cloud ECS

Target: one small ECS instance (Ubuntu 22.04+, 1 vCPU / 2 GB is plenty) running Node
behind nginx. Also satisfies the "hosted on Huawei Cloud" part of the pitch.

**Why ECS suits this app:** it's a normal VM with a real disk, so `server/data.json`
survives restarts and redeploys. On serverless hosts the filesystem is ephemeral and
every deploy would wipe registrations, XP and the consent audit trail.

---

## 0. What you need first

| | Why |
|---|---|
| A Huawei Cloud **ECS instance** with a public EIP | the server |
| A **domain name** pointed at that EIP | Vapi only calls back over **HTTPS**, and Let's Encrypt needs a real hostname — an IP alone won't do |
| Security group: inbound **22, 80, 443** | SSH + web. **Do not open 3000** — nginx proxies to it locally |

---

## 1. Prepare the instance

```sh
ssh root@YOUR_EIP

# Node 22 LTS. The app uses --env-file-if-exists, so Node 20.12+ is the floor.
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs nginx git
node -v          # expect v22.x

# Run as an unprivileged user, not root.
adduser --system --group --home /opt/safespace safespace
```

## 2. Get the code

```sh
git clone https://github.com/sy-afk/HUAWEI_2026.git /opt/safespace
cd /opt/safespace
npm ci --omit=dev || npm install --omit=dev
npm run build              # builds the React app into dist/
chown -R safespace:safespace /opt/safespace
```

## 3. Configure

```sh
cp .env.example .env
nano .env
```

**Production values — these matter:**

```ini
# MUST be absent/false in production. They enable a fixed bypass code and a route
# that writes real drill results. The server warns loudly at startup if either is on.
ALLOW_DEV_VERIFY=
ENABLE_DEMO_ROUTES=

PUBLIC_URL=https://YOUR_DOMAIN        # no trailing slash
VAPI_WEBHOOK_SECRET=<openssl rand -hex 32>

VAPI_API_KEY=...
VAPI_PHONE_NUMBER_ID=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=...
TWILIO_SMS_FROM=+1...

# Optional — email drills refuse with 503 until all three are set.
OPENAI_API_KEY=
GOOGLE_SCRIPT_URL=
GOOGLE_SCRIPT_SECRET=
```

```sh
chown safespace:safespace .env && chmod 600 .env
```

## 4. Run it as a service

```sh
cp deploy/safespace.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now safespace
systemctl status safespace          # expect active (running)
curl localhost:3000/api/health      # {"ok":true,...}
```

Logs: `journalctl -u safespace -f`

## 5. TLS + nginx

```sh
cp deploy/nginx.conf /etc/nginx/conf.d/safespace.conf
sed -i 's/YOUR_DOMAIN/your.actual.domain/g' /etc/nginx/conf.d/safespace.conf
nginx -t && systemctl reload nginx

apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your.actual.domain     # auto-renews via systemd timer
```

Verify: `curl https://your.actual.domain/api/health`

## 6. Point Vapi at the webhook

In Vapi, set the server URL to `https://your.actual.domain/api/webhooks/vapi` and the
secret header `x-vapi-secret` to the same value as `VAPI_WEBHOOK_SECRET`.

The backend also sends that URL per-call, so once `PUBLIC_URL` is set, real call
outcomes flow back into XP automatically — no tunnel needed.

---

## Redeploying

```sh
cd /opt/safespace && git pull && npm install --omit=dev && npm run build
systemctl restart safespace
```

`server/data.json` is untouched by this — users, XP and consent records persist.

---

## Post-deploy checklist

```sh
curl https://YOUR_DOMAIN/api/health                  # 200
curl https://YOUR_DOMAIN/api/family                  # no "phone"/"email" anywhere
curl -X POST https://YOUR_DOMAIN/api/drills/fire     # 401 (auth required)
curl -X POST https://YOUR_DOMAIN/api/drills/simulate # 404 (demo route absent)
curl -X POST https://YOUR_DOMAIN/api/webhooks/vapi   # 401 (needs the secret)
journalctl -u safespace | grep '\[verify\]'          # expect mode=twilio
curl -I http://YOUR_DOMAIN                           # 301 -> https
```

If `/api/drills/simulate` returns anything but 404, or the log says `mode=dev`, then a
dev flag is set in production — fix that before anyone else gets the URL.

## Known limits

- **Single instance only.** The JSON store does unsynchronised read-modify-write; running
  two instances behind a load balancer will lose updates. Move to Postgres first.
- **Sessions never expire** — a token is valid until `data.json` is reset.
- Back up `server/data.json` if the consent audit trail matters:
  `cp server/data.json /var/backups/safespace-$(date +%F).json`
