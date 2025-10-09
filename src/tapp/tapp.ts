import { AccountAddress, Deserializer, Serializer, U64 } from "@aptos-labs/ts-sdk";
import { asIntN, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";

export enum HOOK_TYPE {
  V3 = 3,
  STABLE = 4,
}

export type PoolPositionInput = {
  pool_addr: AccountAddress | `0x${string}` | string;
  position_idxes: Array<number | bigint>;
};

export class TappDeserializer {
  static hexStringToBytes(args: `0x${string}`) {
    return Buffer.from(args.slice(2), 'hex');
  }

  static arrayToBytes(args: number[]): Uint8Array {
    return Buffer.from(args) as Uint8Array;
  }

  static serializegetBatchPositions(input: PoolPositionInput[]): Uint8Array {
    const serializer = new Serializer();
    serializer.serializeU64(BigInt(input.length));
    input.forEach(({ pool_addr, position_idxes }) => {
      const poolAddress = pool_addr instanceof AccountAddress ? pool_addr : AccountAddress.fromString(pool_addr);
      serializer.serialize(poolAddress);
      const positions = position_idxes.map((idx) => new U64(idx));
      serializer.serializeVector(positions);
    });
    return serializer.toUint8Array();
  }

  static getBatchPositions(bytes: Uint8Array) {
    const deser = new Deserializer(bytes);
    const poolNum = deser.deserializeU64();
    console.log('poolNum', poolNum);
    
    for (let index = 0; index < poolNum; index++) {
      const poolAddr = deser.deserialize(AccountAddress);
      const positionIdxs = deser.deserializeVector(U64)
      console.log('poolA', poolAddr);
      console.log('positionIdxs', positionIdxs);
    }
  }

  static createPool(bytes: Uint8Array) {
    const deser = new Deserializer(bytes);
    const hookType = deser.deserializeU8();
    console.log('hookType', hookType);
    const hookFactory = new HookFactory(hookType, deser);
    hookFactory.createPool();
  }

  static createPoolAddLiquidity(bytes: Uint8Array) {
    const deser = new Deserializer(bytes);
    const hookType = deser.deserializeU8();
    console.log('hookType', hookType);
    const hookFactory = new HookFactory(hookType, deser);
    hookFactory.createPool();
    hookFactory.addLiquidity()
  }

  static addLiquidity(hookType: HOOK_TYPE, bytes: Uint8Array) {
    const deser = new Deserializer(bytes);
    const poolAddr = deser.deserialize(AccountAddress);
    console.log('poolAddr', poolAddr.toString());
    const positionAddr = deser.deserializeOption(AccountAddress);
    console.log('positionAddr', positionAddr?.toString());
    switch (hookType) {
      case HOOK_TYPE.V3:
        const pool = new PoolV3(deser);
        pool.addLiquidity();
        break;

      default:
        break;
    }
  }

  static removeLiquidity(bytes: Uint8Array) { }

  static swap(bytes: Uint8Array) { }
}

export class HookFactory {
  hookType: HOOK_TYPE;
  deser: Deserializer;

  constructor(hType: HOOK_TYPE, deser: Deserializer) {
    this.hookType = hType;
    this.deser = deser;
  }

  public createPool() {
    const assets = this.deser.deserializeVector(AccountAddress);
    console.log('assets', assets.map((a) => a.toString()));
    const fee = this.deser.deserializeU64();
    console.log('fee', fee);

    switch (this.hookType) {
      case HOOK_TYPE.V3:
        const pool = new PoolV3(this.deser);
        pool.createPool();
        break;

      default:
        break;
    }
  }

  public addLiquidity() {
    switch (this.hookType) {
      case HOOK_TYPE.V3:
        const pool = new PoolV3(this.deser);
        pool.addLiquidity();
        break;

      default:
        break;
    }
  }
}

export class PoolV3 {
  deser: Deserializer;

  constructor(deser: Deserializer) {
    this.deser = deser;
  }

  public createPool() {
    const sqrtPrice = this.deser.deserializeU128()
    console.log('sqrtPrice', sqrtPrice);
  }

  public addLiquidity() {
    const amount_a = this.deser.deserializeU64();
    const amount_b = this.deser.deserializeU64();
    const fix_amount_a = this.deser.deserializeBool();
    const lower_tick_idx = this.deser.deserializeU64();
    const upper_tick_idx = this.deser.deserializeU64();

    console.log('amount_a', amount_a);
    console.log('amount_b', amount_b);
    console.log('fix_amount_a', fix_amount_a);
    const lower_tick = asIntN(lower_tick_idx);
    const upper_tick = asIntN(upper_tick_idx);
    console.log(`lower_tick ${lower_tick} p=${TickMath.tickIndexToSqrtPriceX64(lower_tick)}`);
    console.log(`upper_tick ${upper_tick} p=${TickMath.tickIndexToSqrtPriceX64(upper_tick)}`);
  }
}
