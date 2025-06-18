import { Serializer } from "@aptos-labs/ts-sdk";

class CLMM {
  private poolAddr: string;
  private readonly OP_CLMM_RESET_INIT_PRICE: number = 0xa0;
  private readonly OP_INITIALIZE_POOL_BLACKLIST: number = 0xa1;
  private readonly OP_BLACKLIST_POSITION: number = 0xa2;
  private readonly OP_UNBLACKLIST_POSITION: number = 0xa3;

  constructor(poolAddr: string) {
    this.poolAddr = poolAddr;
  }

  async resetInitPrice(initPrice: bigint) {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_CLMM_RESET_INIT_PRICE);
    serializer.serializeU128(initPrice);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} reset_init_price`);
    console.log(`args: `, data);
  }

  async initializePoolBlacklist() {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_INITIALIZE_POOL_BLACKLIST);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} initialize_pool_blacklist`);
    console.log(`args: `, data);
  }

  async blacklistPosition(posId: number) {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_BLACKLIST_POSITION);
    serializer.serializeU64(posId);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} blacklist_position`);
    console.log(`args: `, data);
  }

  async unblacklistPosition(posId: number) {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_UNBLACKLIST_POSITION);
    serializer.serializeU64(posId);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} unblacklist_position`);
    console.log(`args: `, data);
  }
}

class Stable {
  private poolAddr: string;
  private readonly OP_STABLE_RAMP_A: number = 0xa0;
  private readonly OP_STABLE_STOP_RAMP_A: number = 0xa1;
  private readonly OP_STABLE_SET_NEW_FEE: number = 0xa2;
  private readonly OP_INITIALIZE_POOL_BLACKLIST: number = 0xa3;
  private readonly OP_BLACKLIST_POSITION: number = 0xa4;
  private readonly OP_UNBLACKLIST_POSITION: number = 0xa5;

  constructor(poolAddr: string) {
    this.poolAddr = poolAddr;
  }

  async rampA(future_a: bigint, future_time: number) {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_STABLE_RAMP_A);
    serializer.serializeU256(future_a);
    serializer.serializeU64(future_time);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} ramp_a`);
    console.log(`args: `, data);
  }

  async stopRampA() {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_STABLE_STOP_RAMP_A);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} stop_ramp_a`);
    console.log(`args: `, data);
  }

  async setNewFee(newFee: bigint, newOffpegFeeMultiplier: bigint) {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_STABLE_SET_NEW_FEE);
    serializer.serializeU256(newFee);
    serializer.serializeU256(newOffpegFeeMultiplier);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} set_new_fee`);
    console.log(`args: `, data);
  }

  async initializePoolBlacklist() {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_INITIALIZE_POOL_BLACKLIST);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} initialize_pool_blacklist`);
    console.log(`args: `, data);
  }

  async blacklistPosition(posId: number) {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_BLACKLIST_POSITION);
    serializer.serializeU64(posId);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} blacklist_position`);
    console.log(`args: `, data);
  }

  async unblacklistPosition(posId: number) {
    const serializer = new Serializer();
    serializer.serializeU8(this.OP_UNBLACKLIST_POSITION);
    serializer.serializeU64(posId);
    const data = serializer.toUint8Array();
    console.log(`run_pool_op: ${this.poolAddr} unblacklist_position`);
    console.log(`args: `, data);
  }
}

export const runPoolOp = async () => {
  console.log("runPoolOp");
};

export const runPoolOpCLI = async (
  poolType: 'clmm' | 'stable',
  poolAddr: string,
  operation: string,
  params?: any
) => {
  try {
    if (poolType === 'clmm') {
      const clmm = new CLMM(poolAddr);
      
      switch (operation) {
        case 'reset-init-price':
          if (!params?.price) throw new Error('Price parameter is required');
          await clmm.resetInitPrice(params.price);
          break;
        case 'init-blacklist':
          await clmm.initializePoolBlacklist();
          break;
        case 'blacklist-position':
          if (!params?.posId) throw new Error('Position ID parameter is required');
          await clmm.blacklistPosition(params.posId);
          break;
        case 'unblacklist-position':
          if (!params?.posId) throw new Error('Position ID parameter is required');
          await clmm.unblacklistPosition(params.posId);
          break;
        default:
          throw new Error(`Unknown CLMM operation: ${operation}`);
      }
    } else if (poolType === 'stable') {
      const stable = new Stable(poolAddr);
      
      switch (operation) {
        case 'ramp-a':
          if (!params?.futureA || !params?.futureTime) {
            throw new Error('Future A and future time parameters are required');
          }
          await stable.rampA(params.futureA, params.futureTime);
          break;
        case 'stop-ramp-a':
          await stable.stopRampA();
          break;
        case 'set-new-fee':
          if (!params?.newFee || !params?.newOffpegFeeMultiplier) {
            throw new Error('New fee and multiplier parameters are required');
          }
          await stable.setNewFee(params.newFee, params.newOffpegFeeMultiplier);
          break;
        case 'init-blacklist':
          await stable.initializePoolBlacklist();
          break;
        case 'blacklist-position':
          if (!params?.posId) throw new Error('Position ID parameter is required');
          await stable.blacklistPosition(params.posId);
          break;
        case 'unblacklist-position':
          if (!params?.posId) throw new Error('Position ID parameter is required');
          await stable.unblacklistPosition(params.posId);
          break;
        default:
          throw new Error(`Unknown Stable operation: ${operation}`);
      }
    } else {
      throw new Error(`Unknown pool type: ${poolType}`);
    }
  } catch (error) {
    console.error('Error executing pool operation:', error);
    process.exit(1);
  }
};