import { 
    getDaysInInterval,
    getUnlockStatus,
    getFullUnlockDaysStatus
} from "../utils/scheduled.js";
import { LOCKASSET_CONTRACT_ABI } from "../blockchain/core.js";
import { ethers } from "ethers";
import { getTokendecimalsNSymbol } from "../utils/tokens.js";
import { analyzeUserVaults } from "../utils/dashboard.js";
import { config } from "dotenv";

config();

//get scheduled vaults data
export const scheduledVaultsData = async (req, res) => {
    const { vaultData } = req.body;
    
    //convert to seconds
    const endDate = Math.floor(new Date(vaultData.endDate).getTime() / 1000)
    const startDate = Math.floor(new Date(vaultData.startDate).getTime() / 1000)

    //get days in interval
    const unlockDays = getDaysInInterval(startDate, endDate, vaultData.unLockDuration);

    //check if can unlock and and amount to unlock
    const checkUnlockStatus = getUnlockStatus(unlockDays, Number(vaultData.unLockAmount), Number(vaultData.unLockedTotal));

    //get full unlock days status
    const unlockDaysStatus = getFullUnlockDaysStatus(unlockDays);

    res.json({ checkUnlockStatus, unlockDaysStatus });
}

//contract instance
const contractInstance = (chainId, contractAddress) => {
    const rpc = chainId === 8453 ? process.env.BASE_RPC_URL : process.env.BASE_SEP_RPC_URL;
    console.log("RPC URL:", rpc, "chainId: ", chainId);
    const provider = new ethers.JsonRpcProvider(rpc);
    const contract = new ethers.Contract(contractAddress, LOCKASSET_CONTRACT_ABI, provider);
    return contract;
}

function formatTimestampToISO(timestamp) {
    // Convert uint32 timestamp (seconds) to milliseconds
    const date = new Date(Number(timestamp) * 1000);
    // Get ISO string and remove 'Z', then append '.174' for milliseconds
    const isoString = date.toISOString().replace("Z", "").replace(/\.\d{3}/, ".174");
    return isoString;
}

//get user vaults
export const getUserVaults = async (req, res) => {
    const {owner, chainId, contractAddress} = req.query;

    // Validate inputs
    if (!ethers.isAddress(owner) || !ethers.isAddress(contractAddress)) {
        return res.status(400).json({ error: "Invalid owner or contract address" });
    }

    //get contract instance
    const contract = contractInstance(chainId, contractAddress);

    //get user vaults
    try {
        // Get the total number of vaults
        const vaultCount = await contract.getUserVaultCount(owner);
        const vaultCountNum = Number(vaultCount);

        // Fetch all vaults
        const vaults = [];
        const decimalsCache = new Map(); // Cache decimals for each asset
        const symbolsCache = new Map(); // Cache symbols for each asset

        for (let vaultId = 0; vaultId < vaultCountNum; vaultId++) {
            const vaultData = await contract.getUserVaultByIndex(owner, vaultId);

            // Fetch decimals for the ERC-20 token (if asset is not zero address and not native)
            let decimals = 18; 
            let symbol = "ETH";

            if (!vaultData.native) {
                console.log("vaultData.asset: ", vaultData.asset)
                if (decimalsCache.has(vaultData.asset) && symbolsCache.has(vaultData.asset)) {
                    symbol = symbolsCache.get(vaultData.asset);
                    decimals = decimalsCache.get(vaultData.asset);
                    console.log("decimals: ", decimals, "symbol: ", symbol)
                } else {
                    const assetData = await getTokendecimalsNSymbol(chainId, vaultData.asset);
                    if(assetData) {
                        decimals = assetData.decimals;
                        symbol = assetData.symbol;
                        decimalsCache.set(vaultData.asset, decimals);
                        symbolsCache.set(vaultData.asset, assetData.symbol);
                    }                     
                }
            }

            // Format the vault data
            const formattedVault = {
                vaultId: vaultId,
                owner: vaultData.owner,
                asset: vaultData.asset,
                symbol: vaultData.native ? "ETH" : symbolsCache.get(vaultData.asset) || symbol,
                decimals: vaultData.native ? 18 : decimals,
                native: vaultData.native,
                amount: ethers.formatUnits(vaultData.amount, decimals),
                unLockedTotal: ethers.formatUnits(vaultData.unLockedTotal, decimals),
                startDate: formatTimestampToISO(vaultData.startDate),
                endDate: formatTimestampToISO(vaultData.endDate),
                vaultType: vaultData.vaultType,
                neededSlip: Number(vaultData.neededSlip),
                unLockDuration: Number(vaultData.unLockDuration),
                unLockAmount: ethers.formatUnits(vaultData.unLockAmount, decimals),
                unLockGoal: vaultData.unLockGoal.toString(),
                title: vaultData.title,
                emergency: vaultData.emergency,
            };

            vaults.push(formattedVault);
        }

        res.json(vaults);
    } catch (error) {
        console.error("Error fetching user vaults:", error);
        res.status(500).json({ error: "Failed to fetch user vaults" });
    }

}

//get vault transactions
export const getVaultTransactions = async (req, res) => {
    const {owner, chainId, contractAddress, decimals, vaultId} = req.query;

    console.log("getVaultTransactions: ", owner, chainId, contractAddress, decimals, vaultId)

    // Validate inputs
    if (!ethers.isAddress(owner) || !ethers.isAddress(contractAddress)) {
        return res.status(400).json({ error: "Invalid owner or contract address" });
    }

    //get contract instance
    const contract = contractInstance(chainId, contractAddress);

    try {
        // Fetch transactions
        const transactions = await contract.getUserTransactions(owner, Number(vaultId));


        // Format transactions
        const formattedTransactions = transactions.map((tx, index) => ({
            depositor: tx.depositor,
            amount: ethers.formatUnits(tx.amount, Number(decimals)),
            withdrawn: tx.withdrawn,
            timestamp: formatTimestampToISO(tx.timestamp),
        }));

        console.log("formattedTransactions: ", JSON.stringify(formattedTransactions, null, 2))

        res.json(formattedTransactions);
    } catch (error) {
        console.error("Error fetching vault transactions:", error);
        res.status(500).json({ error: "Failed to fetch vault transactions" });
    }
}

//dashboard analysis
export const dashboardAnalysis = async (req, res) => {
    const { userVaults } = req.body;

    if (!userVaults || userVaults.length === 0) {
        return res.status(400).json({ error: "No vaults found for this user" });
    }

    const analysisResults = analyzeUserVaults(userVaults);
    res.json(analysisResults);
}