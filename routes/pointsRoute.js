import express from 'express';

const pointsRoute = express.Router();

pointsRoute.route('/get-points').get((req, res) => {
    // Placeholder for getting points
    res.status(200).json({ message: "Points fetched successfully" });
});

export default pointsRoute;