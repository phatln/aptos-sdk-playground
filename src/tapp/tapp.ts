import { AccountAddress, Deserializer } from "@aptos-labs/ts-sdk";
import { asIntN, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";

export enum HOOK_TYPE {
  V3 = 3,
  STABLE = 4,
}

export class Tapp {
  static createPool(args: `0x${string}`) {
    const bytes = Buffer.from(args.slice(2), 'hex');
    const deser = new Deserializer(bytes);
    const hookType = deser.deserializeU8();
    console.log('hookType', hookType);
    const hookFactory = new HookFactory(hookType, deser);
    hookFactory.createPool();
  }

  static createPoolAddLiquidity(args: `0x${string}`) {
    const bytes = Buffer.from(args.slice(2), 'hex');
    const deser = new Deserializer(bytes);
    const hookType = deser.deserializeU8();
    console.log('hookType', hookType);
    const hookFactory = new HookFactory(hookType, deser);
    hookFactory.createPool();
    hookFactory.addLiquidity()
  }

  static addLiquidity(hookType: HOOK_TYPE, args: `0x${string}`) {
    console.log(args.slice(2));
    const bytes = Buffer.from(args.slice(2), 'hex');
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

  public removeLiquidity(args: `0x${string}`) {

  }

  public swap(args: `0x${string}`) {
    
  }
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
