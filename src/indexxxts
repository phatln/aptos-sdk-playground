#!/usr/bin/env node

import { Command } from 'commander';
import { objectCodeUpgrade } from './object_code_upgrade';
import { runPoolOpCLI } from './run_pool_op';

const program = new Command();

program
  .name('aptos-cli')
  .description('CLI tool for Aptos SDK operations')
  .version('1.0.0');

// Object Code Upgrade command
program
  .command('upgrade')
  .description('Perform object code upgrade operation')
  .option('-k, --private-key <key>', 'Private key for signing transactions')
  .option('-n, --network <network>', 'Network to use (testnet, mainnet)', 'testnet')
  .action(async (options) => {
    try {
      console.log('Starting object code upgrade...');
      if (options.privateKey) {
        process.env.PRIVATE_KEY = options.privateKey;
      }
      if (options.network) {
        process.env.NETWORK = options.network;
      }
      await objectCodeUpgrade();
    } catch (error) {
      console.error('Error during upgrade:', error);
      process.exit(1);
    }
  });

// Pool Operations command
const poolCmd = program
  .command('pool')
  .description('Pool operations for CLMM and Stable pools');

// CLMM Pool operations
const clmmCmd = poolCmd
  .command('clmm')
  .description('CLMM pool operations')
  .requiredOption('-a, --address <address>', 'Pool address');

clmmCmd
  .command('reset-init-price')
  .description('Reset initial price')
  .requiredOption('-p, --price <price>', 'New initial price')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('clmm', poolAddr, 'reset-init-price', { price: BigInt(options.price) });
  });

clmmCmd
  .command('init-blacklist')
  .description('Initialize pool blacklist')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('clmm', poolAddr, 'init-blacklist');
  });

clmmCmd
  .command('blacklist-position')
  .description('Blacklist a position')
  .requiredOption('-i, --position-id <id>', 'Position ID to blacklist')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('clmm', poolAddr, 'blacklist-position', { posId: parseInt(options.positionId) });
  });

clmmCmd
  .command('unblacklist-position')
  .description('Unblacklist a position')
  .requiredOption('-i, --position-id <id>', 'Position ID to unblacklist')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('clmm', poolAddr, 'unblacklist-position', { posId: parseInt(options.positionId) });
  });

// Stable Pool operations
const stableCmd = poolCmd
  .command('stable')
  .description('Stable pool operations')
  .requiredOption('-a, --address <address>', 'Pool address');

stableCmd
  .command('ramp-a')
  .description('Ramp A parameter')
  .requiredOption('-a, --future-a <value>', 'Future A value')
  .requiredOption('-t, --future-time <time>', 'Future time')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('stable', poolAddr, 'ramp-a', { 
      futureA: BigInt(options.futureA), 
      futureTime: parseInt(options.futureTime) 
    });
  });

stableCmd
  .command('stop-ramp-a')
  .description('Stop ramping A parameter')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('stable', poolAddr, 'stop-ramp-a');
  });

stableCmd
  .command('set-new-fee')
  .description('Set new fee parameters')
  .requiredOption('-f, --new-fee <fee>', 'New fee value')
  .requiredOption('-m, --multiplier <multiplier>', 'New off-peg fee multiplier')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('stable', poolAddr, 'set-new-fee', { 
      newFee: BigInt(options.newFee), 
      newOffpegFeeMultiplier: BigInt(options.multiplier) 
    });
  });

stableCmd
  .command('init-blacklist')
  .description('Initialize pool blacklist')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('stable', poolAddr, 'init-blacklist');
  });

stableCmd
  .command('blacklist-position')
  .description('Blacklist a position')
  .requiredOption('-i, --position-id <id>', 'Position ID to blacklist')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('stable', poolAddr, 'blacklist-position', { posId: parseInt(options.positionId) });
  });

stableCmd
  .command('unblacklist-position')
  .description('Unblacklist a position')
  .requiredOption('-i, --position-id <id>', 'Position ID to unblacklist')
  .action(async (options, cmd) => {
    const poolAddr = cmd.parent?.opts().address;
    if (!poolAddr) {
      console.error('Pool address is required');
      process.exit(1);
    }
    await runPoolOpCLI('stable', poolAddr, 'unblacklist-position', { posId: parseInt(options.positionId) });
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}