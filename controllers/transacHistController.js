import Moralis from "moralis";
import { ethers, toBeHex } from "ethers";
import { analyzeTransactions } from "../utils/transacHistory.js";
import { transacHist } from "../data.js";

export const getTransacHist = async (req, res) => {
    const { chain, address } = req.body;

    // Validate input
    if (!chain || !address || !ethers.isAddress(address)) {
        return res.status(400).json({ message: "Empty or Invalid Inputs!" });
    }

    // get dates in between period
    // const to_date = new Date();
    // const from_date = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    let response = {}
    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            /*/ Fetch transaction history using Moralis
            response = await Moralis.EvmApi.wallets.getWalletHistory({
                "chain": toBeHex(chain),
                "order": "DESC",
                //"fromDate": from_date,
                //"toDate": to_date,
                "address": address
            });

            // Check if the response contains results
            if (!response || !response.result || response.result.length === 0) {
                return res.status(404).json({ message: "No transaction history found for the given address and period." });
            }*/
            const response = transacHist
            const analysis = analyzeTransactions(response);
            res.status(200).json(analysis);

            // If successful, break out of the retry loop
            break;
        } catch (error) {
            console.error("Error fetching transaction history:", error);

            // Check if it's a network error that might benefit from a retry
            if (error.code === 'C0006' || error.cause?.code === 'ECONNRESET' || error.cause?.code === 'ECONNABORTED') {
                retries++;
                const delay = Math.pow(2, retries) * 1000;
                console.log(`Retrying in ${delay / 1000} seconds... (Attempt ${retries}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Not a retryable error, re-throw or handle differently
                return res.status(500).json({
                    error: "Failed to fetch transaction history",
                    message: error.message || "Unknown error",
                    code: error.code || "UNKNOWN"
                });
            }
        }
    }

    if (!response.result && retries === MAX_RETRIES) {
        // If all retries failed and no response was obtained
        return res.status(500).json({
            error: "Failed to fetch transaction history after multiple attempts.",
            message: "Network issues or API limitations prevented the request from completing.",
            code: "MAX_RETRIES_EXCEEDED"
        });
    }

};
