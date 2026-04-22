# KYCChain

Decentralized KYC verification platform on Ethereum. Prove your identity once. Verify anywhere. Privacy-preserving — personal data never touches the blockchain.

**Live demo:** https://kyc-chain.vercel.app
**Contract (Sepolia):** [`0xbA5dE6c8d4BF99848E4e338bC12008Bf596f2c0b`](https://sepolia.etherscan.io/address/0xbA5dE6c8d4BF99848E4e338bC12008Bf596f2c0b#code)

---

## What It Does

- **Customers** submit KYC data + a selfie through the browser. Data is hashed client-side — only the hash goes on-chain.
- **Verifiers** review pending submissions through a dedicated dashboard and approve or reject on-chain.
- **Any service** can call `isVerified(walletAddress)` on the smart contract to gate access — getting a yes/no answer with zero personal data revealed.
- After a verifier's decision, raw KYC data is permanently deleted from the database. Only the cryptographic proof remains on-chain.
- Customers can revoke their KYC at any time and re-submit later.

## Why Blockchain

- **Trustless verification.** Any third party can check KYC status without trusting a central authority.
- **Immutable audit trail.** Every submission, approval, rejection, and revocation is a public event on Ethereum.
- **Privacy-preserving.** The blockchain only stores hashes — the actual identity data never goes public.
- **Customer sovereignty.** Users control their own KYC status through their wallet, not through a company.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Smart Contract | Solidity 0.8.24 + OpenZeppelin AccessControl |
| Dev Environment | Hardhat 2.x |
| Network | Ethereum Sepolia Testnet |
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Wallet | MetaMask + ethers.js v6 |
| Selfie Capture | react-webcam |
| Database (temp) | Supabase (Postgres + Storage) |
| Deployment | Vercel + Supabase |

## Project Structure

```
KYCChain/
├── blockchain/           # Solidity contract + Hardhat
│   ├── contracts/KYCChain.sol
│   ├── test/KYCChain.test.ts  (30 passing tests)
│   ├── scripts/deploy.ts
│   └── hardhat.config.ts
│
├── frontend/             # Next.js application
│   ├── src/
│   │   ├── app/                    # Pages + API routes
│   │   ├── components/             # UI grouped by feature
│   │   ├── contexts/WalletContext  # Global wallet state
│   │   └── lib/                    # Helpers, types, config
│   └── package.json
│
├── CODEBASE.md           # Full architecture walkthrough
└── KYCChain-PRD.md       # Product spec
```

## How It Works (Data Flow)

### Customer submits KYC
1. User fills form in browser
2. `keccak256(abi.encode(fields, walletAddress))` computed client-side
3. MetaMask signs `submitKYC(hash)` transaction
4. Transaction mined on Sepolia → `KYCSubmitted` event emitted
5. Raw data + selfie sent to `/api/submissions` → stored temporarily in Supabase

### Verifier approves
1. Verifier opens dashboard → API returns pending submissions (after on-chain role check)
2. Verifier reviews raw data + selfie, clicks Approve
3. MetaMask signs `approveKYC(customerAddress)` → mined on Sepolia
4. Frontend calls `DELETE /api/submissions/[id]` → raw data + selfie permanently deleted

### Service checks verification
```solidity
// From any smart contract
IKYCChain kyc = IKYCChain(KYC_CHAIN_ADDRESS);
require(kyc.isVerified(msg.sender), "KYC required");
```

## Smart Contract Overview

```solidity
submitKYC(bytes32 dataHash)          // anyone — submit hash
revokeKYC()                          // customer — burn own credential
approveKYC(address customer)         // verifier only
rejectKYC(address customer, string)  // verifier only
isVerified(address) → bool           // anyone — public view
getKYCRecord(address) → KYCRecord    // anyone — public view
addVerifier(address)                 // admin only
removeVerifier(address)              // admin only
```

## Running Locally

### Smart contract
```bash
cd blockchain
npm install
cp .env.example .env   # fill in SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY
npx hardhat test       # run tests
npx hardhat run scripts/deploy.ts --network sepolia
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # fill in contract address + Supabase + RPC URL
npm run dev
```

## What's On-Chain vs Off-Chain

| On-chain (permanent) | Off-chain (temporary, deleted after review) |
|----------------------|---------------------------------------------|
| Data hash | Full name |
| Verification status | Date of birth |
| Verifier address | Residential address |
| Timestamps | Government ID type + number |
| Rejection reason | Selfie photo |
| Event logs | — |

## Known Limitations

- **Single verifier approval.** Production would require multi-sig or N-of-M attestations.
- **Plaintext off-chain storage during review.** Would encrypt at rest in production.
- **No on-chain record of who queried `isVerified`.** View functions can't emit events without gas cost.
- **Verifier centralization.** An unavoidable trade-off at the bridge between physical and digital identity.

## License

MIT
