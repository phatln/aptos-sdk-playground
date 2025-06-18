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

aptos move upgrade-object \
--address-name clmm \  
--object-address 0xb4e7e645da3ff0a42bd5f439959f5e3636fb12324771e95481e47f65c9e4a25d \
--package-dir hooks/clmm \  
--profile hook_deployer \
--named-addresses hook_admin=0xbfd8b6d1b3ff14c6d4351a68d3d225be0c85f59de8d96684eaf6f9a1d6bec693 \
--included-artifacts none --override-size-check

aptos move upgrade-object \
--address-name stable \
--object-address 0x8cf052b8baa2dd6ab5446c18e0ce00a46a052de7c186bce31525abf2769ffcd2 \
--package-dir hooks/stable \
--profile hook_deployer \
--named-addresses hook_admin=0xbfd8b6d1b3ff14c6d4351a68d3d225be0c85f59de8d96684eaf6f9a1d6bec693 \
--included-artifacts none --override-size-check

aptos move upgrade-object \
--address-name views \ 
--object-address 0xd6685a34db479528c68fb388df55409f455320bb1e3c169def95a02b7fd16531 \
--package-dir hooks/views \ 
--profile hook_deployer \
--named-addresses admin=0xbfd8b6d1b3ff14c6d4351a68d3d225be0c85f59de8d96684eaf6f9a1d6bec693,amm=0xb50679342e47b0fde3825a53f76ace077ad2cb8664d748947f1bfd523d33eadc,clmm=0xb4e7e645da3ff0a42bd5f439959f5e3636fb12324771e95481e47f65c9e4a25d,stable=0x8cf052b8baa2dd6ab5446c18e0ce00a46a052de7c186bce31525abf2769ffcd2,tapp=0x442a250cc3661f880d5285448254f801d33779f2cbe1eaeeda8a3e5c27eecd87 \                          
--included-artifacts none --override-size-check

aptos move upgrade-object \
--address-name tapp \
--object-address 0x442a250cc3661f880d5285448254f801d33779f2cbe1eaeeda8a3e5c27eecd87 \
--package-dir . \
--profile hook_deployer \
--named-addresses admin=0xbfd8b6d1b3ff14c6d4351a68d3d225be0c85f59de8d96684eaf6f9a1d6bec693,amm=0xb50679342e47b0fde3825a53f76ace077ad2cb8664d748947f1bfd523d33eadc,clmm=0xb4e7e645da3ff0a42bd5f439959f5e3636fb12324771e95481e47f65c9e4a25d,stable=0x8cf052b8baa2dd6ab5446c18e0ce00a46a052de7c186bce31525abf2769ffcd2 \
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

