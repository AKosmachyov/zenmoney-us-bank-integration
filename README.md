# zenmoney-us-bank-integration

Sync USA banks balance with https://zenmoney.app/

# Requirement
[NodeJS](https://nodejs.org/en) v22.17 or newer

## Usage

```bash
git clone https://github.com/AKosmachyov/zenmoney-us-bank-integration
cd zenmoney-us-bank-integration
```

### Sign in and download transactions from Zenmoney

```bash
ZEN_USER='username' ZEN_PWD='password' node --experimental-transform-types ./src/main.ts
```

or create environment variables

```bash
cat <<EOF > .env
ZEN_USER="username"
ZEN_PWD="password"
EOF

node --experimental-transform-types --env-file=.env ./src/main.ts
```

## Integration

- PayPal - download QIF format from [link](https://www.paypal.com/reports/dlog)
- Bank of America (BofA) - download any QIF file from [link](https://www.bankofamerica.com) Menu -> Accounts -> scroll to Activity -> Download button
- American Express (Amex) - download CSV from [link](https://global.americanexpress.com/activity) -> Download -> select "csv"
