# SOLspace MVP Deployment Guide for SONIC Mainnet (6-7 Day Timeline)

## Executive Summary

This guide outlines a focused strategy to deploy the SOLspace MVP on SONIC mainnet within 6-7 days. We're prioritizing four core components:

1. Viral content detection system
2. Automatic NFT minting with tier upgrades
3. Creator notifications
4. Simple onboarding for non-crypto users

## Day-by-Day Action Plan

### Day 1: Setup & Core Architecture

#### Technical Setup
- Set up SONIC mainnet development environment
- Update RPC URLs in all services to point to SONIC: `https://rpc.mainnet-alpha.sonic.game`
- Set up deployment pipeline for rapid iterations
- Create testnet accounts and fund them using the faucet: `https://faucet.sonic.game/#/`

#### Core Components Modification
- Simplify the viral detection algorithm to focus only on basic engagement metrics
- Reduce the tier system to the essentials (focus on the three defined tiers)
- Strip down smart contracts to include only critical functionality

#### Team Allocation
- Frontend Team: Focus on wallet integration and claim interface
- Backend Team: Focus on viral detection and NFT minting
- Smart Contract Team: Port and optimize contracts for SONIC

### Day 2: Smart Contract Implementation

#### Contract Development
- Implement the NFT minting contract using Metaplex Token Metadata standard
- Deploy to SONIC testnet using our existing Solana code, just changing RPC URLs
- Implement the tier upgrade functionality
- Create simple admin functions for testing and emergency fixes

```rust
// Example contract structure for MVP
#[program]
pub mod solspace_mvp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Basic initialization
        Ok(())
    }

    pub fn mint_viral_nft(
        ctx: Context<MintNFT>,
        content_uri: String,
        content_id: String,
        author_id: String,
        tier: u8
    ) -> Result<()> {
        // Minimal minting logic
        Ok(())
    }

    pub fn upgrade_tier(
        ctx: Context<UpgradeTier>,
        new_tier: u8,
        new_metrics: String,
    ) -> Result<()> {
        // Simple tier upgrade
        Ok(())
    }
}
```

#### Integration Testing
- Test contract functions on testnet
- Verify metadata structure works with Metaplex standards
- Ensure tier upgrades function correctly

### Day 3: Viral Detection & Backend

#### Viral Detection System
- Focus on Twitter API integration only (most mature in our codebase)
- Simplify rate limiting to avoid API threshold issues
- Implement basic engagement velocity tracking (likes/hour, retweets/hour)
- Create a prioritization queue for detected viral content

```typescript
// Simplified viral detection logic
const isViral = (post) => {
  const tier1Threshold = 1000; // likes
  const tier1Velocity = 100;   // likes/hour
  const postAge = (Date.now() - new Date(post.created_at).getTime()) / 3600000; // hours
  const velocity = post.like_count / Math.max(1, postAge);
  
  return post.like_count >= tier1Threshold || velocity >= tier1Velocity;
};
```

#### Backend Services
- Implement simplified notification system (Twitter DM or email)
- Create metadata generation service for NFTs
- Set up scheduled jobs for monitoring viral content and upgrading tiers

### Day 4: Frontend Essential Components

#### User Interface Development
- Focus on three key screens:
  1. Claim page for creators
  2. NFT view page
  3. Simple dashboard for monitoring

- Integrate Sonic Wallet Adapter for wallet connections
- Create simplified onboarding flow for non-crypto users

#### Key UI Components
- Wallet connection button with clear instructions
- Step-by-step claim process with progress indicators
- Visual representation of NFT tiers and benefits
- Simple explanation of the value proposition

```typescript
// Example wallet connection component
const ConnectWalletButton = () => {
  const { connected, publicKey, select, connect, connecting } = useWallet();
  
  return (
    <div className="connect-wallet-container">
      {!connected ? (
        <Button
          onClick={select}
          loading={connecting}
          className="gradient-button"
        >
          Connect Wallet
        </Button>
      ) : (
        <div className="wallet-connected">
          Connected: {publicKey.toString().substring(0, 6)}...
        </div>
      )}
      <p className="helper-text">
        New to crypto? No problem - we'll help you create a wallet during the claim process.
      </p>
    </div>
  );
};
```

### Day 5: Integration & First End-to-End Test

#### System Integration
- Connect viral detection to NFT minting service
- Integrate notification system with backend
- Connect frontend to backend APIs
- Complete wallet integration with claim process

#### Testing
- End-to-end testing of the minimal flow:
  1. Detect viral content
  2. Mint NFT
  3. Send notification
  4. Creator claims NFT

- Fix critical issues and refine UI details
- Test with non-crypto users for onboarding friction

### Day 6: Migration to Mainnet & Optimization

#### Mainnet Deployment
- Deploy contracts to SONIC mainnet
- Update all configs to point to mainnet
- Fund operating accounts for initial minting
- Setup monitoring for all critical services

#### Optimization
- Optimize gas usage for contract calls
- Fine-tune API polling frequencies
- Improve error handling for critical paths
- Enhance loading states and feedback mechanisms

#### Security
- Review permissions on all contracts
- Ensure admin functions are properly secured
- Set up alerts for unusual activity
- Document emergency procedures

### Day 7: Final Testing & Launch Preparation

#### Final Validation
- Test the system with real viral content
- Verify tier upgrades over time
- Confirm notification delivery
- Test claim process with various wallets

#### Launch Preparation
- Create documentation for users and team
- Prepare announcement materials
- Set up support channels
- Brief team on common issues and solutions

#### Performance Review
- Monitor system performance
- Be ready for quick fixes if needed
- Document any technical debt for post-hackathon fixes

## Technical Implementation Details

### 1. Viral Detection System (Simplified)

```typescript
// src/services/SimpleViralDetector.ts
import { TwitterApi } from "twitter-api-v2";

export class SimpleViralDetector {
  private twitterClient: TwitterApi;
  
  constructor(apiKey: string) {
    this.twitterClient = new TwitterApi(apiKey);
  }
  
  async checkForViralPosts(): Promise<any[]> {
    try {
      // Simplified search for viral content
      const results = await this.twitterClient.v2.search(
        'min_faves:1000 -is:retweet lang:en', 
        {
          'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
          max_results: 100,
        }
      );
      
      // Process results and filter viral posts
      const viralPosts = [];
      for (const tweet of results.data) {
        const metrics = tweet.public_metrics;
        const tier = this.determineTier(metrics, new Date(tweet.created_at));
        
        if (tier > 0) {
          viralPosts.push({
            id: tweet.id,
            content: tweet.text,
            authorId: tweet.author_id,
            metrics,
            tier,
            timestamp: tweet.created_at
          });
        }
      }
      
      return viralPosts;
    } catch (error) {
      console.error("Error detecting viral posts:", error);
      return [];
    }
  }
  
  private determineTier(metrics: any, createdAt: Date): number {
    // Calculate hours since creation
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const likeVelocity = metrics.like_count / Math.max(1, hoursOld);
    
    // Tier 3 (Viral)
    if (metrics.like_count >= 5000 || likeVelocity >= 500) {
      return 3;
    }
    
    // Tier 2 (Trending)
    if (metrics.like_count >= 2500 || likeVelocity >= 250) {
      return 2;
    }
    
    // Tier 1 (Rising)
    if (metrics.like_count >= 1000 || likeVelocity >= 100) {
      return 1;
    }
    
    return 0; // Not viral
  }
}
```

### 2. NFT Minting & Tier Updates

```rust
// Simplified Anchor program for NFT minting and upgrading
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use mpl_token_metadata::{
    ID as MetadataID,
    instruction as token_instruction,
};

#[program]
pub mod solspace_mvp {
    use super::*;

    pub fn mint_viral_nft(
        ctx: Context<MintNFT>,
        metadata_uri: String,
        content_id: String,
        author_id: String,
        tier: u8,
    ) -> Result<()> {
        // Create mint account
        let viral_post = &mut ctx.accounts.viral_post;
        viral_post.content_id = content_id;
        viral_post.author_id = author_id;
        viral_post.tier = tier;
        viral_post.created_at = Clock::get()?.unix_timestamp;
        viral_post.metadata_uri = metadata_uri;
        viral_post.claimed = false;
        
        // Create the NFT with Metaplex
        let name = match tier {
            1 => "Rising Content",
            2 => "Trending Content",
            3 => "Viral Content",
            _ => "Content NFT",
        };
        
        // Create metadata instruction
        // ... (simplified for brevity)
        
        Ok(())
    }

    pub fn upgrade_tier(
        ctx: Context<UpgradeTier>,
        new_tier: u8,
        new_metadata_uri: String,
    ) -> Result<()> {
        let viral_post = &mut ctx.accounts.viral_post;
        
        // Only upgrade to higher tiers
        require!(new_tier > viral_post.tier, ErrorCode::InvalidTierUpgrade);
        
        // Update tier
        viral_post.tier = new_tier;
        viral_post.metadata_uri = new_metadata_uri;
        
        // Update metadata with Metaplex
        // ... (simplified for brevity)
        
        Ok(())
    }
    
    pub fn claim_nft(
        ctx: Context<ClaimNFT>,
        verification_code: String,
    ) -> Result<()> {
        let viral_post = &mut ctx.accounts.viral_post;
        
        // Verify this is the rightful owner
        // In MVP, we'll do basic verification, later enhance with OAuth
        
        viral_post.claimed = true;
        viral_post.claimed_at = Clock::get()?.unix_timestamp;
        viral_post.owner = ctx.accounts.claimer.key();
        
        Ok(())
    }
}
```

### 3. Creator Notification System

```typescript
// src/services/NotificationService.ts
import { TwitterApi } from "twitter-api-v2";

export class NotificationService {
  private twitterClient: TwitterApi;
  
  constructor(apiKey: string) {
    this.twitterClient = new TwitterApi(apiKey);
  }
  
  async notifyCreator(
    authorId: string, 
    nftAddress: string,
    tier: number
  ): Promise<boolean> {
    try {
      const tierNames = ["", "Rising", "Trending", "Viral"];
      const message = `
🎉 Congratulations! Your post has gone ${tierNames[tier]}!

We've preserved it as an NFT on the blockchain, giving you true ownership of your viral content.

Claim your NFT here: https://solspace.app/claim/${nftAddress}

No crypto experience needed - we'll guide you through the process!
`;
      
      await this.twitterClient.v2.sendDmToParticipant(authorId, {
        text: message,
      });
      
      return true;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }
  
  async notifyTierUpgrade(
    authorId: string,
    nftAddress: string,
    oldTier: number,
    newTier: number
  ): Promise<boolean> {
    try {
      const tierNames = ["", "Rising", "Trending", "Viral"];
      const message = `
🚀 Your content is gaining momentum!

Your ${tierNames[oldTier]} post has been upgraded to ${tierNames[newTier]}!

This increases its value and visibility. View your NFT: https://solspace.app/nft/${nftAddress}
`;
      
      await this.twitterClient.v2.sendDmToParticipant(authorId, {
        text: message,
      });
      
      return true;
    } catch (error) {
      console.error("Error sending tier upgrade notification:", error);
      return false;
    }
  }
}
```

### 4. Simple Onboarding UI Components

```tsx
// src/components/onboarding/SimpleClaimProcess.tsx
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

enum ClaimStep {
  CONNECT_WALLET,
  VERIFY_IDENTITY,
  CLAIM_NFT,
  SUCCESS
}

const SimpleClaimProcess = ({ nftAddress }) => {
  const { connected } = useWallet();
  const [currentStep, setCurrentStep] = useState<ClaimStep>(
    connected ? ClaimStep.VERIFY_IDENTITY : ClaimStep.CONNECT_WALLET
  );
  const [verificationCode, setVerificationCode] = useState('');
  
  // Effect to move to next step when wallet connects
  useEffect(() => {
    if (connected && currentStep === ClaimStep.CONNECT_WALLET) {
      setCurrentStep(ClaimStep.VERIFY_IDENTITY);
    }
  }, [connected, currentStep]);
  
  const handleVerify = async () => {
    // Simple verification for MVP
    // TODO: Implement proper verification via Twitter OAuth
    setCurrentStep(ClaimStep.CLAIM_NFT);
  };
  
  const handleClaim = async () => {
    try {
      // Call claim function on smart contract
      // ...
      setCurrentStep(ClaimStep.SUCCESS);
    } catch (error) {
      console.error("Error claiming NFT:", error);
      // Show error message
    }
  };
  
  return (
    <div className="claim-container">
      <h2>Claim Your Viral Content NFT</h2>
      
      {/* Progress indicator */}
      <div className="step-indicator">
        {[ClaimStep.CONNECT_WALLET, ClaimStep.VERIFY_IDENTITY, 
          ClaimStep.CLAIM_NFT, ClaimStep.SUCCESS].map((step, index) => (
          <div 
            key={index}
            className={`step ${currentStep >= step ? 'active' : ''} 
                       ${currentStep > step ? 'completed' : ''}`}
          >
            Step {index + 1}
          </div>
        ))}
      </div>
      
      {/* Step content */}
      <div className="step-content">
        {currentStep === ClaimStep.CONNECT_WALLET && (
          <div className="connect-wallet-step">
            <p>Connect your wallet to claim your NFT</p>
            <p className="helper-text">
              New to crypto? Don't worry! Click the button below and follow the instructions to create a wallet.
            </p>
            <WalletMultiButton />
          </div>
        )}
        
        {currentStep === ClaimStep.VERIFY_IDENTITY && (
          <div className="verify-step">
            <p>Verify you're the creator of this content</p>
            <p className="helper-text">
              For the MVP, enter any verification code. In production, we'll use Twitter OAuth.
            </p>
            <input
              type="text"
              placeholder="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <button 
              className="primary-button"
              onClick={handleVerify}
            >
              Verify Identity
            </button>
          </div>
        )}
        
        {currentStep === ClaimStep.CLAIM_NFT && (
          <div className="claim-step">
            <p>You're verified! Claim your NFT now</p>
            <div className="nft-preview">
              {/* NFT preview content */}
            </div>
            <button 
              className="primary-button"
              onClick={handleClaim}
            >
              Claim NFT
            </button>
          </div>
        )}
        
        {currentStep === ClaimStep.SUCCESS && (
          <div className="success-step">
            <div className="success-icon">🎉</div>
            <h3>Congratulations!</h3>
            <p>Your viral content NFT has been claimed and is now in your wallet</p>
            <button className="secondary-button">
              View in Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleClaimProcess;
```

## Critical Integration Points

### 1. SONIC RPC URL Integration

Update all connection configurations to use SONIC's mainnet RPC:

```typescript
// src/config/connection.ts
export const SONIC_RPC_ENDPOINT = 'https://rpc.mainnet-alpha.sonic.game';

export const getConnection = () => {
  return new Connection(SONIC_RPC_ENDPOINT);
}
```

### 2. Wallet Adapter Configuration

```tsx
// src/App.tsx or equivalent entry point
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { BackpackWalletAdapter, NightlyWalletAdapter, OKXWalletAdapter, BitKeepWalletAdapter } from '@solana/wallet-adapter-wallets';

// Only include wallets that work with SONIC
const wallets = [
  new BackpackWalletAdapter(),
  new NightlyWalletAdapter(),
  new OKXWalletAdapter(),
  new BitKeepWalletAdapter()
];

const App = () => {
  return (
    <ConnectionProvider endpoint={SONIC_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* App content */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
```

### 3. Metaplex Integration for NFTs

```typescript
// src/services/MetaplexService.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

export class MetaplexService {
  private connection: Connection;
  private metaplex: Metaplex;
  
  constructor(endpoint: string) {
    this.connection = new Connection(endpoint);
    this.metaplex = Metaplex.make(this.connection);
  }
  
  async fetchNFTMetadata(mintAddress: string) {
    try {
      const mint = new PublicKey(mintAddress);
      const nft = await this.metaplex.nfts().findByMint({ mintAddress: mint });
      return nft;
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      return null;
    }
  }
  
  // Other Metaplex functions as needed
}
```

## Critical Path Focus Areas

### 1. Minimal Smart Contract Implementation
- Focus only on mint, upgrade, and claim functions
- Remove any non-essential admin or utility functions
- Use simplest data structures possible

### 2. Viral Detection Simplification
- Implement only basic threshold detection
- Skip complex analytics or engagement predictions
- Focus on reliable content identification

### 3. Frontend Essentials
- Build only the claim flow and minimal NFT display
- Use standard components from UI libraries when possible
- Focus on clear instructions for non-crypto users

### 4. Testing Priorities
- Test the complete claim flow on multiple devices
- Verify contract functions execute properly
- Test with non-technical users for feedback

## Technical Debt to Address Post-Hackathon

Document these items for post-hackathon improvement:

1. Enhanced engagement metrics and analysis
2. Better rate limiting and API management
3. More robust error handling and recovery
4. Expanded admin tools and dashboards
5. Comprehensive analytics for creators
6. Additional platform integrations beyond Twitter
7. Enhanced security for the verification process

## Conclusions

By focusing on the core MVP functionality and leveraging SONIC's compatibility with Solana code, we can deploy a working prototype within 6-7 days. The key is to prioritize the user experience of the claim process while ensuring the backend viral detection and NFT minting work reliably.

After the hackathon, we can systematically address the technical debt and expand the platform's capabilities based on user feedback and our original vision.

Remember: For the hackathon, it's better to have a flawless simple demo than a buggy complex one.
