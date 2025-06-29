import { LOCKASSET_CONTRACT_ABI } from "../blockchain/core.js";
import { ethers } from "ethers";
import { config } from "dotenv";

config();

// Fetch RPC based on chain ID
const chainRPC = {
    8453: process.env.BASE_RPC_URL,
    84532: process.env.BASE_SEP_RPC_URL,
    4202: process.env.LISK_SEP_RPC_URL
}

// Contract instance
const contractInstance = (chainId, contractAddress) => {
    const rpc = chainRPC[chainId];
    const provider = new ethers.JsonRpcProvider(rpc);
    const contract = new ethers.Contract(contractAddress, LOCKASSET_CONTRACT_ABI, provider);
    return contract;
}

// platform stats
export const getPlatformStats = async (req, res) => {
    const {chainId, contractAddress} = req.query;
    
    // Validate inputs
    if (!chainId || !ethers.isAddress(contractAddress)) {
        return res.status(400).json({ error: "Invalid owner or contract address" });
    }

    //get contract instance
    const contract = contractInstance(chainId, contractAddress);

    try {
        
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}