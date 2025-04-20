//import hook that fetches earrnings data

export const categorizeRevenue = async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            message: 'Categorize Revenue'
        }
    });
}