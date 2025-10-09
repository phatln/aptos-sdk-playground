import { HOOK_TYPE, TappDeserializer } from "./tapp";

export function run() {
  // const stable = new Stable("0x82e0b52f95ae57b35220726a32c3415919389aa5b8baa33a058d7125797535cc");

  // TappDeserializer.createPoolAddLiquidity(
  //   TappDeserializer.hexStringToBytes("0x03023a175f8830099392ee858774be6b0f2f0e8c3212992c8366df17aa31054f4695c5ad4b024a7500877b1429835a45ad3df20d60fd59ea265463784ab68b29d730b80b00000000000080f02bb3e8db720b00000000000000001af2052a01000000c0d8a7000000000001443bf9ffffffffffbcc4060000000000")
  // );

  // TappDeserializer.addLiquidity(
  //   HOOK_TYPE.V3,
  //   TappDeserializer.hexStringToBytes("0x0b94fde47c7263fc8d25ceb3178f07e9c73a567e10a36cb0a922014f540f9ac00000ca9a3b000000007a101a000000000001880fffffffffffffdc15ffffffffffff")
  // )

  const a = TappDeserializer.serializegetBatchPositions([
    {
      pool_addr: "0x259bfb3a089623c01a40bfa9658830bccd0be69775f60932ac8881c9bebab1e5",
      position_idxes: [0, 1, 2]
    }
  ]);
  console.log(a.toString());
  
  TappDeserializer.getBatchPositions(a);
}