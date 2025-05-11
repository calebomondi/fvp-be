import { formatUnits } from "ethers";
import { 
    getAssetPrices
} from "../utils/assetprices.js";

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

