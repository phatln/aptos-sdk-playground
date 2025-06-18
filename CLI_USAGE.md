# Tapp CLI Tool Usage Guide

This guide explains how to use the Aptos CLI tool for performing various operations on the Aptos blockchain.

## Installation

First, install the dependencies and build the project:

```bash
npm install
npm run build
```

## Global Installation (Optional)

To use the CLI globally, you can link it:

```bash
npm link
```

After linking, you can use `tapp` from anywhere.

## Usage

Or if globally linked:

```bash
tapp [command] [options]
```

## Commands

### 2. Pool Operations

Manage CLMM and Stable pool operations.

#### CLMM Pool Operations

**Base command:**
```bash
tapp pool clmm -a <pool-address> <operation> [options]
```

**Available operations:**

##### Reset Initial Price
```bash
tapp pool clmm -a 0x123... reset-init-price -p 1000000
```

##### Initialize Pool Blacklist
```bash
tapp pool clmm -a 0x123... init-blacklist
```

##### Blacklist Position
```bash
tapp pool clmm -a 0x123... blacklist-position -i 42
```

##### Unblacklist Position
```bash
tapp pool clmm -a 0x123... unblacklist-position -i 42
```

#### Stable Pool Operations

**Base command:**
```bash
tapp pool stable -a <pool-address> <operation> [options]
```

**Available operations:**

##### Ramp A Parameter
```bash
tapp pool stable -a 0x123... ramp-a -a 1000 -t 1640995200
```

##### Stop Ramp A
```bash
tapp pool stable -a 0x123... stop-ramp-a
```

##### Set New Fee
```bash
tapp pool stable -a 0x123... set-new-fee -f 3000000 -m 2000000
```

##### Initialize Pool Blacklist
```bash
tapp pool stable -a 0x123... init-blacklist
```

##### Blacklist Position
```bash
tapp pool stable -a 0x123... blacklist-position -i 42
```

##### Unblacklist Position
```bash
tapp pool stable -a 0x123... unblacklist-position -i 42
```
