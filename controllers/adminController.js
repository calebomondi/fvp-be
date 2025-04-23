//import hook that fetches earrnings data
import { earnings } from "../data.js";

export const categorizeRevenue = async (req, res) => {
    //fetch data using hook
    console.log(`Earnings: ${JSON.stringify(earnings)}`);

    res.status(200).json({
        status: 'success',
        data: {
            message: 'Categorize Revenue'
        }
    });
}