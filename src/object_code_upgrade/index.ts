import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey, Deserializer, generateTransactionPayload, generateRawTransaction, SimpleTransaction, MoveVector, HexInput, AccountAddress } from "@aptos-labs/ts-sdk";
import payload from "./payload.json";
import dotenv from "dotenv";
dotenv.config();

export const objectCodeUpgrade = async () => {
  // Example private key (replace with your actual private key string)
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

  // Initialize the Aptos client
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);

  // Create a private key instance
  const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);

  // Derive the account from the private key
  const account = await Account.fromPrivateKey({ privateKey });
  console.log("Initialized account:", account.accountAddress.toString());

  console.log(payload.args.map((arg: any) => arg.value));

  const metadataBytes = payload.args[0].value as HexInput;
  const bytecode = payload.args[1].value as HexInput[]
  const totalByteCode = bytecode.map((_bytecode) => MoveVector.U8(_bytecode));
  const tx = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: "0x1::object_code_deployment::upgrade",
      functionArguments: [
        MoveVector.U8(metadataBytes),
        new MoveVector(totalByteCode),
        AccountAddress.fromString("0x383fb101dc7028fe9553f3472943c74dc3f07fc27c3c1b1184caeeeb76db2fc5")
      ],
    }
  });

  const [userTransactionResponse] = await aptos.transaction.simulate.simple({
    signerPublicKey: account.publicKey,
    transaction: tx,
  });
  console.log(userTransactionResponse);

  if (!userTransactionResponse.success) {
    console.error("Transaction simulation failed:", userTransactionResponse.vm_status);
    return;
  }

  const senderAuthenticator = aptos.transaction.sign({
    signer: account,
    transaction: tx,
  });

  const committedTransaction = await aptos.transaction.submit.simple({
    transaction: tx,
    senderAuthenticator,
  });

  const executedTransaction = await aptos.waitForTransaction({ transactionHash: committedTransaction.hash });
  if (!executedTransaction.success) {
    console.error("Transaction execution failed:", executedTransaction.vm_status);
    return;
  }

  console.log("Transaction executed successfully:", executedTransaction);
};