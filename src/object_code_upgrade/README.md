# Upgrade code object

## Build

```
aptos move build-publish-payload --package-dir hooks/amm --json-output-file ./payload.json --included-artifacts none --named-addresses hook_admin=<HOOK_ADMIN>,amm=<OBJECT_CODE_ADDR> --sender-account <SENDER_ACCOUNT>
```

- `HOOK_ADMIN`: the admin of amm hooks
- `OBJECT_CODE_ADDR`: the object contains upgrading code
- `SENDER_ACCOUNT`: who performs upgrade
