# SOLess Swap - Liquidity Pools Backend with Sonic Integration

## Implementation Overview

SOLess Swap implements a hybrid backend architecture for liquidity pools, supporting both Solana L1 and Sonic's HyperGrid infrastructure. The system leverages multiple components:

1. **SolessPool Program**: Custom smart contract compatible with both Solana and Sonic SVM
2. **Openbook Integration**: Market orders and DEX functionality
3. **Octane Service**: Transaction relay and gasless transactions on Solana
4. **Sonic HSSN Integration**: Grid-based execution and gasless transactions on HyperGrid

## Core Backend Components

### 1. SolessPool Program

Located in `lib/soless_pools/src/lib.rs`, this Anchor-based program handles core AMM functionality and is designed to work on both Solana and Sonic SVM:

```rust
#[program]
pub mod soless_pools {
    // Core functions
    pub fn initialize_pool(ctx: Context<InitializePool>, fee: u64) -> Result<()>
    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount_a: u64, amount_b: u64) -> Result<()>
    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, amount: u64) -> Result<()>
    pub fn swap(ctx: Context<Swap>, amount_in: u64, minimum_amount_out: u64) -> Result<()>
}
```

Key capabilities:
- Platform-agnostic pool initialization with configurable fee parameter
- Liquidity addition/removal with tracking of LP positions
- Token swapping with minimum output guarantees (slippage protection)
- Account structures for tracking pool state across both platforms

The implementation is compatible with Sonic SVM since Sonic maintains all the characteristics of Solana VM (parallelism, security, speed) while supporting execution on the HyperGrid infrastructure.

### 2. TypeScript SDK with Platform Adapters

The extended SDK in `lib/soless_pools/index.ts` provides platform-agnostic access to liquidity pool functionality:

```typescript
export class SolessPoolsWrapper {
  constructor(programId: string, provider: Provider, platformAdapter: PlatformAdapter) {
    this.program = new Program(IDL, new PublicKey(programId), provider);
    this.platformAdapter = platformAdapter;
  }

  // Core methods - work on both platforms
  async initializePool(tokenAAccount: PublicKey, tokenBAccount: PublicKey, fee: number): Promise<string>
  async addLiquidity(poolAddress: string, amountA: number, amountB: number): Promise<string>
  async removeLiquidity(poolAddress: string, amount: number): Promise<string>
  async swap(poolAddress: string, amountIn: number, minimumAmountOut: number): Promise<string>
}

// Platform-specific adapters
export interface PlatformAdapter {
  submitTransaction(transaction: Transaction): Promise<string>;
  getPoolData(poolAddress: string): Promise<PoolData>;
}

export class SolanaAdapter implements PlatformAdapter {
  // Solana-specific implementation
}

export class SonicAdapter implements PlatformAdapter {
  private readonly gridId: string;
  
  constructor(connection: Connection, gridId: string) {
    this.connection = connection;
    this.gridId = gridId;
  }
  
  // Sonic-specific implementation
}
```

The SDK now includes:
- Platform-agnostic transaction building
- Platform-specific adapters for Solana and Sonic
- Transaction routing based on platform selection or automatic optimization

### 3. Gas Fee Handling for Multiple Platforms

#### Solana: Octane Integration

The `lib/octane/index.ts` provides a relay service for gasless transactions on Solana:

```typescript
export class OctaneWrapper {
  async getTokenAccounts(owner: PublicKey): Promise<{ [mint: string]: PublicKey }>
  async relayTransaction(transaction: Transaction, feePayer: PublicKey, feeToken: PublicKey): Promise<string>
}
```

#### Sonic: HSSN Integration

New integration with Sonic's HyperGrid Shared State Network in `lib/sonic/index.ts`:

```typescript
export class SonicHSSNWrapper {
  constructor(gridId: string, endpoint: string) {
    this.gridId = gridId;
    this.endpoint = endpoint;
  }
  
  // Connect to Grid nodes
  async connectToGrid(): Promise<void>
  
  // Convert user token to grid token (gSOL/hSOL)
  async convertTokenForGas(userToken: PublicKey, amount: BN): Promise<{ gridToken: PublicKey, convertedAmount: BN }>
  
  // Submit transaction to Grid
  async submitTransaction(transaction: Transaction, gasToken: PublicKey): Promise<string>
  
  // Get appropriate grid for transaction
  getGridForTransaction(transaction: Transaction): string
}
```

This new component:
- Connects to Sonic's Grid infrastructure
- Converts user-selected tokens to the appropriate grid token (gSOL/hSOL)
- Applies SOLess burn mechanics during conversion
- Submits transactions to the correct grid
- Tracks transaction completion

### 4. Unified Gas Fee Manager

A new unified gas fee manager handles gas payments across both platforms:

```typescript
export class GasFeeManager {
  constructor(
    private readonly octaneWrapper: OctaneWrapper,
    private readonly sonicWrapper: SonicHSSNWrapper,
    private readonly tokenConverter: TokenConverter
  ) {}
  
  async handleGasFee(
    platform: 'solana' | 'sonic',
    transaction: Transaction,
    userToken: PublicKey,
    amount: BN
  ): Promise<string> {
    if (platform === 'solana') {
      // Use Octane for Solana transactions
      return this.octaneWrapper.relayTransaction(
        transaction,
        this.feePayer,
        userToken
      );
    } else {
      // Use Sonic HSSN for Grid transactions
      // Convert user token to appropriate grid token
      const { gridToken, convertedAmount } = await this.sonicWrapper.convertTokenForGas(
        userToken,
        amount
      );
      
      // Apply SOLess burn mechanism
      await this.tokenConverter.burn(gridToken, convertedAmount.mul(new BN(5)).div(new BN(100))); // 5% burn
      
      // Submit to appropriate grid
      return this.sonicWrapper.submitTransaction(transaction, gridToken);
    }
  }
}
```

### 5. Transaction Routing System

A new component routes transactions to the optimal platform:

```typescript
export class TransactionRouter {
  constructor(
    private readonly solanaAdapter: SolanaAdapter,
    private readonly sonicAdapter: SonicAdapter,
    private readonly gasFeeManager: GasFeeManager
  ) {}
  
  async routeTransaction(
    transaction: Transaction,
    gasToken: PublicKey,
    preferredPlatform?: 'solana' | 'sonic'
  ): Promise<string> {
    // Determine platform if not specified
    const platform = preferredPlatform || await this.determineBestPlatform(transaction, gasToken);
    
    // Process transaction on appropriate platform
    return this.gasFeeManager.handleGasFee(platform, transaction, gasToken, await this.estimateFee(transaction));
  }
  
  private async determineBestPlatform(transaction: Transaction, gasToken: PublicKey): Promise<'solana' | 'sonic'> {
    // Calculate fees on both platforms
    const solanaFee = await this.solanaAdapter.estimateFee(transaction);
    const sonicFee = await this.sonicAdapter.estimateFee(transaction);
    
    // Choose based on lower fee, network congestion, or other factors
    return sonicFee < solanaFee ? 'sonic' : 'solana';
  }
}
```

### 6. Openbook Integration for Order Book Support

The `lib/openbook/index.ts` file continues to provide integration with Openbook DEX for additional liquidity, now updated to support both platforms:

```typescript
export class OpenbookWrapper {
  constructor(programId: string, platformAdapter: PlatformAdapter) {
    this.dex = new OpenbookDEX(programId);
    this.platformAdapter = platformAdapter;
  }
  
  getProgramId(): string
  
  createPlaceOrderInstruction(
    market: string,
    // ... other parameters
  ): Uint8Array
  
  async submitOrder(
    orderInstruction: Uint8Array, 
    gasToken: PublicKey,
    platform: 'solana' | 'sonic' = 'sonic'
  ): Promise<string>
}
```

## Architecture Relationships with Sonic Integration

The backend implements a unified model supporting both platforms:

1. **Automated Market Maker (AMM)**: Through SolessPool program with x*y=k formula
2. **Order Book**: Through Openbook integration for limit orders
3. **Platform-Specific Execution**:
   - Solana L1: Direct or through Octane
   - Sonic HyperGrid: Through HSSN with grid-appropriate tokens

## Technical Implementation Details

### Cross-Platform Pool Mechanics

The SolessPool program implements:
- Constant product formula (`x * y = k`) based on token amounts
- Fee collection on swaps
- LP token issuance tracking ownership share
- Platform-agnostic logic for core pool mechanics

### Multi-Platform Transaction Flow

1. User interacts with UI (selecting pools, adding liquidity)
2. Frontend calls TypeScript SDK methods
3. SDK builds platform-agnostic transactions
4. Transaction router determines optimal platform
5. Platform-specific adapters handle submission:
   - **For Solana**: Either direct or through Octane
   - **For Sonic**: Through HSSN with appropriate grid tokens
6. Transaction confirmation and UI update

### Dual-Burn Program Implementation

The Dual-Burn program operates across both platforms:
- Fee distribution logic in the SolessPool program remains consistent
- Automated token burning operates on both platforms
- Additional burn mechanics during token conversion for Sonic gas fees
- LP reward enhancement based on burn activity

## Integration with Sonic's HSSN Gas Fee Mechanism

The integration leverages Sonic's gas fee infrastructure:

1. **Token Conversion**: SOLess converts any user token to the appropriate grid token (gSOL/hSOL)
2. **Grid Selection**: Transactions are routed to the appropriate grid based on type and congestion
3. **Fee Calculation**: Gas fees are calculated based on HSSN's multi-layer approach
4. **Enhanced Burning**: Additional burning mechanics are applied during conversion
5. **Bill Tracking**: Transaction bills are forwarded and executed through the HSSN

This integration adds value by:
- Supporting any token for gas payment (not just grid-native tokens)
- Applying SOLess burn mechanics to reduce token supply
- Providing a unified interface for transactions across platforms
- Supporting cross-grid compatibility for seamless operation

## Frontend Integration

The frontend components connect to this dual-platform backend through:
1. The updated SolessPoolsWrapper with platform adapters
2. The GasFeeManager for unified gas payment handling
3. The TransactionRouter for intelligent platform selection
4. Platform-specific status and fee information in the UI

The UI has been enhanced to:
- Indicate which platform is processing transactions
- Show estimated gas fees on both platforms
- Allow power users to select preferred platforms
- Display platform-specific transaction status

## Conclusion

SOLess Swap now implements a unified liquidity pool system that operates seamlessly on both Solana L1 and Sonic's HyperGrid infrastructure. This hybrid approach maintains the system's AMM and order book capabilities while leveraging the performance benefits of HyperGrid's scaling solution. The integration preserves SOLess Swap's unique value proposition of allowing any token for gas payments while adding cross-platform flexibility and enhanced performance.
