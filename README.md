# FVP BACKEND

![Image](https://github.com/user-attachments/assets/15127a40-0f80-4416-a1c7-08f79d5678b4)

## Overview
FVP is a self-custodial financial management tool that allows users to better manage their crypto assets by allowing them to set up virtual vaults for locking the assets. The vaults will unlock when the set conditions are met. This will allow them to curb their impulsive spending behaviour and also to invest in their future by saving up in the locked vaults.

## Technology Stack
- Node.js
- Express.js
- Supabase

## Core Functionality
- Custom calculation logic for platform-specific features
- Smart contract data retrieval

## Getting Started

### Prerequisites
```
Node.js >= v21.0.0
npm >= 10.0.0
```

### Installation
```bash
# Clone the repository
git clone https://github.com/calebomondi/fvp-be

# Navigate to the project directory
cd fvp-be

# Install dependencies
npm install

# Set up environment variables
cp .env
```

### Environment Variables
```
PORT=3000

# Database connection
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Providers API keys
ALCHEMY_API=
MORALIS_API_KEY=

# Chain RPC URLs
BASE_RPC_URL=
BASE_SEP_RPC_URL=
LISK_SEP_RPC_URL=
```

### Running Locally
```bash
# Development mode with hot-reload
npm start
```

## Contributing
We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Submit pull request