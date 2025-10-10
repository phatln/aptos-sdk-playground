import { Aptos, AptosConfig, MoveOption, Network } from "@aptos-labs/ts-sdk";

const MODULE_ADDRESS =
  "0x377534417723c724a69d561020cde7501d1cdf1ea2c962e554dee8166d3c14f5"; // publisher of views::tapp_views on testnet

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

function parseArgs() {
  const [, , hookTypeArg = "none", offsetArg = "0", countArg = "10"] = process.argv;

  const hookType =
    hookTypeArg.toLowerCase() === "none"
      ? MoveOption.U8()
      : MoveOption.U8(Number.parseInt(hookTypeArg, 10));

  const offset = BigInt(offsetArg);
  const count = BigInt(countArg);

  return { hookType, offset, count };
}

async function main() {
  const { hookType, offset, count } = parseArgs();
  console.log(hookType.bcsToBytes());

  const [metas] = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::tapp_views::get_pool_metas_paginated`,
      typeArguments: [],
      functionArguments: [hookType, offset, count],
    },
  });

  console.dir(metas, { depth: null });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
