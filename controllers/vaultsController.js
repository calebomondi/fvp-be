import { 
    getDaysInInterval,
    getUnlockStatus,
    getFullUnlockDaysStatus
} from "../utils/scheduled.js";
import { LOCKASSET_CONTRACT_ABI, ERC20_ABI } from "../blockchain/core.js";
import { ethers } from "ethers";
import { getTokendecimalsNSymbol } from "../utils/tokens.js";
import { analyzeUserVaults } from "../utils/dashboard.js";
import { config } from "dotenv";
import supabase from "../database/supabaseClient.js";

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

//calculate goals
export const calculateGoals = async (req, res) => {
    const { currentAmount, goalAmount, endDate } = req.body;

    // remaining amount to reach goal
    const remainingAmount = goalAmount - currentAmount;

    // endDate to timestamp in seconds
    const timestampEndDate = new Date(endDate).getTime() / 1000;

    // Calculate the time remaining until the goal end date
    const currentDate = Math.floor(Date.now() / 1000); // Current time in seconds
    const toEndDateInSeconds = timestampEndDate - currentDate;
    const daysToEndDate = Math.floor(toEndDateInSeconds / (60 * 60 * 24)); // Convert seconds to days
    const weeksToEndDate = Math.floor(daysToEndDate / 7); // Convert days to weeks
    const monthsToEndDate = Math.floor(daysToEndDate / 28); // Convert days to months

    // Simple linear calculation for demonstration
    const progress = (currentAmount / goalAmount) * 100;

    // amount to be saving to reach goal
    const amountToSaveDaily = remainingAmount / daysToEndDate;
    const amountToSaveWeekly = remainingAmount / weeksToEndDate;
    const amountToSaveMonthly = remainingAmount / monthsToEndDate;

    res.json({
        remainingAmount,
        daysToEndDate,
        weeksToEndDate,
        monthsToEndDate,
        progress: Math.ceil(progress),
        amountToSaveDaily: Math.ceil(amountToSaveDaily),
        amountToSaveWeekly: Math.ceil(amountToSaveWeekly),
        amountToSaveMonthly: Math.ceil(amountToSaveMonthly)
    });

}

const chainRPC = {
    8453: process.env.BASE_RPC_URL,
    84532: process.env.BASE_SEP_RPC_URL
}

//contract instance
const contractInstance = (chainId, contractAddress) => {
    const rpc = chainRPC[chainId];
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

//get vault details
export const getVaultID = async (owner, chainId, contractAddress) => {
    // Validate inputs
    if (!ethers.isAddress(owner)) {
        return "Invalid owner address";
    }
    if (!ethers.isAddress(contractAddress)) {
        return "Invalid contract address";
    }

    //get contract instance
    const contract = contractInstance(chainId, contractAddress);

    //get user vaults
    try {
        // Get the total number of vaults
        const vaultCount = await contract.getUserVaultCount(owner);
        const vaultCountNum = Number(vaultCount);

        //fetch latest vault
        const latestVault = await contract.getUserVaultByIndex(owner, vaultCountNum - 1);
        if (!latestVault) {
            return "No vaults found for this user";
        }
        
        // Return the latest vault ID
        return vaultCountNum - 1;

    } catch (error) {
        console.error("Error fetching user vaults:", error);
        return { error: `Failed to fetch user vaults: ${error.message}`};  
    }
}

//get vault transactions
export const getVaultTransactions = async (req, res) => {
    const {owner, chainId, contractAddress, decimals, vaultId} = req.query;

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

// get token addresses
const getTokenAddresses = async (chainId) => {
    console.log(`id: ${chainId}`)
    try {
        //get table name
        const { data: table, error: tableError } = await supabase
            .from("chain")
            .select("name")
            .eq("network_id", chainId);
        
        if (tableError) throw tableError;
        if (table.length === 0) {
            return res.status(404).json({ error: "Chain not found" });
        }

        //get token addresses
        const { data: tokens, error: tokenError } = await supabase
            .from(table[0].name)
            .select("address");

        if (tokenError) throw tokenError;
        if (tokens.length === 0) {
            return res.status(404).json({ error: "No supported tokens found" });
        }

        return tokens.map(token => token.address);

    } catch (error) {
        console.error("Error fetching token addresses:", error);
        res.status(500).json(error);
    }
}

// get user token balances
export const getUserTokenBalances = async (req, res) => {
    const {owner, chainId} = req.query;

    const addresses = await getTokenAddresses(chainId);
    if (!addresses || addresses.length === 0) {
        return res.status(404).json({ error: "No token addresses found for this chain" });
    }

    try {
        const balances = await Promise.all(addresses.map(async (address) => {
            const contract = new ethers.Contract(address, ERC20_ABI, new ethers.JsonRpcProvider(chainRPC[chainId]));
            const balance = await contract.balanceOf(owner);
            const decimals = await contract.decimals();
            const symbol = await contract.symbol();
            return {
                balance: ethers.formatUnits(balance, decimals),
                symbol
            };
        }));

        res.json(balances);
    } catch (error) {
        console.error("Error fetching vault transactions:", error);
        res.status(500).json({ error: "Failed to fetch vault transactions", error });
    }
}