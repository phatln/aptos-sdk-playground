import { AccountAddress, Serializer, U64 } from "@aptos-labs/ts-sdk";

export function trigger(): Uint8Array[] {
  const args: Uint8Array[] = [];

  const resumeDelaySerializer = new Serializer();
  resumeDelaySerializer.serialize(AccountAddress.fromString("0xfe4e46cfded2a5089885e8a744a5b07a05a8b3b3c1c4309452f470d34f054b1"));
  resumeDelaySerializer.serializeOption<U64>();
  args.push(resumeDelaySerializer.toUint8Array());

  console.log(args);
  return args;
}
