import express from 'express';
import { claimPoints, breakVault } from '../controllers/pointsController.js';

const pointsRoute = express.Router();

pointsRoute.route('/claim-points').post(claimPoints);
pointsRoute.route('/redeem-points/:vault_id').post(breakVault);

export default pointsRoute;