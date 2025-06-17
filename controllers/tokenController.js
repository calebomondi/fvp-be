import { formatUnits } from "ethers";
import supabase from "../database/supabaseClient.js";
import {
    getAssetPrices
} from "../utils/assetprices.js"

//calculate the value trends of the asset
export const valueTrends = async (req, res) => {
    const { symbol, decimals, vaultData } = req.body;

    try {
        //format amount
        const amount = Number(formatUnits(vaultData.amount.toString(), decimals));

        //get asset prices
        const { historicalPrice, currentPrice } = await getAssetPrices(symbol, vaultData.startDate);

        console.log("Historical Price:", historicalPrice);
        console.log("Current Price:", currentPrice);

        //calculate the value trends
        const valueThen = amount * Number(historicalPrice);
        const valueNow = amount * Number(currentPrice);
        const change = valueNow - valueThen;
        const percentageChange = ((change / valueThen) * 100).toFixed(2);
        
        console.log("Value Trends:", { valueThen, valueNow, change, percentageChange });

        res.status(200).json({ then: valueThen.toFixed(2), now: valueNow.toFixed(2), change: change.toFixed(2), percent: percentageChange });

    } catch (error) {
        console.error("Error fetching price trends:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

//check the slippage of the asset to unlock
export const checkSlippage = async (req, res) => {
    const {percentageChange, neededSlip} = req.body;
    const canUnlock = percentageChange <= neededSlip ? true : false;

    res.status(200).json({ canUnlock });

}

//get supported tokens
export const supportedTokens = async (req, res) => {
    const { chainId } = req.query;

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

        //get supported tokens
        const { data: tokens, error: tokenError } = await supabase
            .from(table[0].name)
            .select("symbol, aave");

        if (tokenError) throw tokenError;
        if (tokens.length === 0) {
            return res.status(404).json({ error: "No supported tokens found" });
        }

        res.status(200).json(tokens);

    } catch (error) {
        console.error("Error fetching supported tokens:", error);
        res.status(500).json(error);
    }
}

//get the symbol of the asset from address
export const getSymbol = async (req, res) => {
    const { address, chainId } = req.query;

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

        //get token symbol
        const { data: tokenData, error: tokenError } = await supabase
            .from(table[0].name)
            .select("symbol")
            .eq("address", address);

        if (tokenError) throw tokenError;
        if (tokenData.length === 0) {
            return res.status(404).json({ error: "Token not found" });
        }

        res.status(200).json({ symbol: tokenData[0].symbol });

    } catch (error) {
        console.error("Error fetching Symbol:", error);
        res.status(500).json(error);
    }
}

//get deployment address and aave addresses
export const getChainData = async (req, res) => {
    const {chainId} = req.query;

    try {
        //get table name
        const { data: table, error: tableError } = await supabase
            .from("chain")
            .select("pool_address, dataprovider, lockasset")
            .eq("network_id", chainId);
        
        if (tableError) throw tableError;
        if (table.length === 0) {
            return res.status(404).json({ error: "Chain not found" });
        }

        res.status(200).json({
            poolAddress: table[0].pool_address,
            dataProvider: table[0].dataprovider,
            lockAsset: table[0].lockasset
        });
    } catch (error) {
        console.error("Error fetching chain data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

//get the token data
export const getTokenData = async (req, res) => {
    const { symbol, chainId } = req.query;
    if (!symbol || !chainId) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

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

        //get token decimals and address
        const tokenAddress = supabase
            .from(table[0].name)
            .select("address")
            .eq("symbol", symbol);

        const tokenDecimals = supabase
            .from("assets")
            .select("decimals")
            .eq("symbol", symbol);

        const [
            { data: tokenAddressData, error: tokenAddressError },
            { data: tokenDecimalsData, error: tokenDecimalsError }
        ] = await Promise.all([tokenAddress, tokenDecimals]);

        if (tokenAddressError) throw tokenAddressError;
        if (tokenDecimalsError) throw tokenDecimalsError;
        if (tokenAddressData.length === 0 || tokenDecimalsData.length === 0) {
            return res.status(404).json({ error: "Token not found" });
        }

        const tokenData = {
            address: tokenAddressData[0].address,
            decimals: tokenDecimalsData[0].decimals
        };

        console.log("Token Data:", tokenData);
        res.status(200).json(tokenData);

    } catch (error) {
        console.error("Error fetching price trends:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
