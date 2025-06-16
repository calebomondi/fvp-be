import express from 'express';
import { earnPoints, breakVault } from '../controllers/pointsController.js';

const pointsRoute = express.Router();

pointsRoute.route('/earn-points').post(earnPoints);
pointsRoute.route('/break-vault').post(breakVault);

export default pointsRoute;