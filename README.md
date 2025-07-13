# zenmoney-us-bank-integration

Sync USA banks balance with https://zenmoney.app/

```bash
ZEN_USER='username' ZEN_PWD='password' node ./src/main.js
```

or

```bash 
cat <<EOF > .env
ZEN_USER="username"
ZEN_PWD="password"
EOF

node --env-file=.env ./src/main.js
```