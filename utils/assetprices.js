/**
 * @description This file contains the functions that fetch asset prices prices controller.
 * @module utils/assetprices
 * @requires axios
 * @requires dotenv
 */
import axios from "axios"
import { config } from "dotenv"

config();

//fetch hostrical asset price from alchemy api
const historicalAssetPrice = async (symbol, timestamp) => {
    try {
        const response = await axios.post(
            `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_API}/tokens/historical`,
            {
                symbol: symbol,
                startTime: timestamp,
                endTime: timestamp + 86400,
                interval: '1d',
                withMarketData: false
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    
        return response.data;
    } catch (error) {
        console.error("Error fetching historical asset price:", error);
        throw new Error("Failed to fetch historical asset price"); 
    }
}

//fetch current asset price from alchemy api
const currentAssetPrice = async (symbol) => {
    try {
        const response = await axios.get(
            `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_API}/tokens/by-symbol`,
            {
                headers: {
                    "Content-Type": "application/json"
                },
                params: {
                    symbols: symbol
                }
            }
        );
    
        return response.data;
    } catch (error) {
        console.error("Error fetching current asset price:", error);
        throw new Error("Failed to fetch current asset price"); 
    }
}

//get the specific prices from the data
export const getAssetPrices = async (symbol, timestamp) => {
    try {
        // Fetch historical asset price
        const historicalPriceData = await historicalAssetPrice(symbol, timestamp);
        const historicalPrice = historicalPriceData.data[0].value;
        
        // Fetch current asset price
        const currentPriceData = await currentAssetPrice(symbol);
        const currentPrice = currentPriceData.data[0].prices[0].value;

        return { historicalPrice, currentPrice };
    } catch (error) {
        console.error("Error fetching asset prices:", error);
        throw new Error("Failed to fetch asset prices");
    }
}
