import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import * as dotenv from 'dotenv';
import { buildTx, hexToBytes } from './tx-builder';
dotenv.config();

const aptos = new Aptos(new AptosConfig({ network: process.env.NETWORK as Network }));
const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY!),
});

async function run() {
  let arg = [
    [
      "2",
      "2",
      "5",
      "175",
      "254",
      "84",
      "172",
      "118",
      "185",
      "132",
      "230",
      "177",
      "132",
      "27",
      "238",
      "148",
      "236",
      "120",
      "109",
      "133",
      "212",
      "205",
      "188",
      "146",
      "6",
      "10",
      "174",
      "70",
      "236",
      "247",
      "167",
      "160",
      "143",
      "125",
      "34",
      "167",
      "38",
      "15",
      "49",
      "199",
      "0",
      "69",
      "162",
      "81",
      "21",
      "4",
      "67",
      "142",
      "36",
      "33",
      "117",
      "184",
      "75",
      "218",
      "202",
      "226",
      "119",
      "202",
      "212",
      "15",
      "74",
      "4",
      "53",
      "62",
      "136",
      "72",
      "100",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "202",
      "154",
      "59",
      "0",
      "0",
      "0",
      "0",
      "0",
      "228",
      "11",
      "84",
      "2",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0"
    ]
  ];

  // const txn = await buildTx(
  //   aptos,
  //   account,
  //   "0x3771f4c048bb98494d8ae0502a9f7d0326d84eee566d3b8e68e9f733892b35ba::router::create_pool_add_liquidity",
  //   arg,
  // )
  const txn = await buildTx(
    aptos,
    account,
    "0x8a5ef085f2a8eb714c1462392d52371dfef0f97325d140b605e8306fafcf398b::voter::vote",
    [
      "0xe3739ce080c0e938b1e4c12fa90b19546d4706f6ef1632664775d3ff2416bb8c",
      [
        "0x82e0b52f95ae57b35220726a32c3415919389aa5b8baa33a058d7125797535cc",
        "0x4ed8fda291b604491ead0cc9e5232bc1edc1f31d0e0cf343be043d8c792af1a8",
        "0xb5afb711ef141908e5a11c42aae6cb4b08ee4bcf1d5a9961cd882d52b53bd1ec",
        "0x3004b3e808a2ab9e1589d60ebc2f6ac22ed42403764222cf3e91e891d0111545",
        "0x76e7c1ad414f50274b371e51b7a272cf774c7027c2e4433b9f82ab47a6e5527b",
        "0x1527374dcf52dee16b4da3bd0952823e12e5f567939b50cfbc4c3d993b529dca",
        "0x89d046dc4f666741e5845833cb9506893dea4d83a6403885859a3c70c30cecb7",
        "0xd50dc4fe4995f10aaa9f4ecd5acb0f5f3713ac8715b217325c57bd52e623d0f5",
        "0x8f9dd0b94f1c18f96c00dfbff8254f20304f05713bb841d20b203f9446a75b9",
        "0x1967bf3d06eaa967c00d7535aacdc0fba2570820940b42a79ac34b3a7efe7072"
      ],
      [
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "10000"
      ]
    ]
  )

  const simulation = await aptos.transaction.simulate.simple({
    transaction: txn,
    options: {
      estimateGasUnitPrice: true,
      estimateMaxGasAmount: true
    }
  });

  console.log(simulation);

  const senderAuthenticator = aptos.transaction.sign({
    signer: account,
    transaction: txn,
  });
  const submittedTransaction = await aptos.transaction.submit.simple({
    transaction: txn,
    senderAuthenticator,
  });

  const executedTransaction = await aptos.waitForTransaction({ transactionHash: submittedTransaction.hash });

  console.log(executedTransaction.hash);
}

run();
