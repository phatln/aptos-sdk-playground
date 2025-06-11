# Upgrade code object

## Upgrade using CLI

```
aptos move upgrade-object \
--address-name amm \
--object-address <OBJECT_CODE_ADDR> \
--package-dir hooks/amm \
--profile hook_deployer \
--named-addresses hook_admin=<CURRENT_ADMIN_ADDR> \
--included-artifacts none --override-size-check

aptos move upgrade-object \
--address-name amm \
--object-address 0xb50679342e47b0fde3825a53f76ace077ad2cb8664d748947f1bfd523d33eadc \
--package-dir hooks/amm \
--profile hook_deployer \
--named-addresses hook_admin=0xbfd8b6d1b3ff14c6d4351a68d3d225be0c85f59de8d96684eaf6f9a1d6bec693 \
--included-artifacts none --override-size-check
```

## Upgrade using JSON payload
### Build

```
aptos move build-publish-payload --package-dir hooks/amm --json-output-file ./payload.json --included-artifacts none --named-addresses hook_admin=<HOOK_ADMIN>,amm=<OBJECT_CODE_ADDR> --sender-account <SENDER_ACCOUNT>
```

- `HOOK_ADMIN`: the admin of amm hooks
- `OBJECT_CODE_ADDR`: the object contains upgrading code
- `SENDER_ACCOUNT`: who performs upgrade

