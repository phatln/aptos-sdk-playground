import { AccountAddress, Aptos, SimpleTransaction } from "@aptos-labs/ts-sdk";

export async function buildTx(
  aptos: Aptos,
  senderAddress: string,
  functionName: `${string}::${string}::${string}`,
  functionArgs: any[],
  typeArgs?: any[],
): Promise<SimpleTransaction> {
  return aptos.transaction.build.simple({
    sender: AccountAddress.fromString(senderAddress),
    data: {
      function: functionName,
      functionArguments: functionArgs,
      typeArguments: typeArgs,
    },
  });
}
