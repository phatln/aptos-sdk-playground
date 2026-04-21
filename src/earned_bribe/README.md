# Earned Bribe Script

`src/earned_bribe/main.ts` reads token addresses from `src/earned_bribe/locks.json` and queries the Aptos view function:

```move
0x296a63c4074a1e7475e394db6a5b099755481f9c16d2c19237f82cc80d0e2486::bribe_voting_reward::earned(address, address, address) -> u64
```

For each token address in `locks.json`, the script calls:

- `pool_addr`: `0xb5afb711ef141908e5a11c42aae6cb4b08ee4bcf1d5a9961cd882d52b53bd1ec`
- `reward_addr`: `0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b`
- `token_addr`: the key from `locks.json`

The `locks.json` file is expected to be a JSON object where:

- each key is a token address
- each value is the lock amount for that token

Example:

```json
{
  "0xabc...": 12345,
  "0xdef...": 67890
}
```

## Behavior

- If you pass a tx version, the script queries the view at that exact ledger version.
- If you do not pass a tx version, the script fetches the latest ledger version from the Aptos SDK and uses that value.
- Token addresses are normalized to full 32-byte Aptos addresses before querying.
- Results are written to `src/earned_bribe/earned-<tx_version>.json`.

## How To Run

Use `npx ts-node` directly:

```bash
npx ts-node src/earned_bribe/main.ts
```

Run with an explicit tx version:

```bash
npx ts-node src/earned_bribe/main.ts 4412918076
```

## Environment

Optional environment variables:

- `NETWORK` or `APTOS_NETWORK`: Aptos network to use. Defaults to `mainnet`.
- `API_KEY` or `APTOS_API_KEY`: API key passed to the Aptos client if available.

## Output

The output JSON includes:

- network
- source `locks.json` path
- hardcoded `pool_addr`
- hardcoded `reward_addr`
- view function id
- tx version used
- latest ledger version when auto-resolved
- one result per token, including:
  - `token_addr`
  - `lock_amount`
  - `earned`, or
  - `error` if the view call failed for that token
