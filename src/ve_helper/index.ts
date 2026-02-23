import { AccountAddress, Serializer } from "@aptos-labs/ts-sdk";

export const createMigrationArgs = () => {
  const ser = new Serializer();
  ser.serializeU64(1);
  ser.serializeVector([
    AccountAddress.from(""),
  ]);
}