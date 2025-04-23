//import hook that fetches earrnings data
import { earnings } from "../data.js";

export const categorizeRevenue = async (req, res) => {
    const { startDate, endDate } = req.query;
    
    //fetch data using hook
    console.log(`Earnings: ${JSON.stringify(earnings)}`);

    // Categorize revenue based on asset type
    const categorizedRevenue = earnings.reduce((acc, earning) => {
        // Check if the earning falls within the specified date range
        if(earning.timestamp >= startDate && earning.timestamp <= endDate) {
            //categorize by asset type and sum the amounts
            acc[earning.asset] = (acc[earning.asset] || 0) + earning.amount;
        }
        return acc;
    }, {});

    res.status(200).json({
        status: 'success',
        revenue: categorizedRevenue
    });
}