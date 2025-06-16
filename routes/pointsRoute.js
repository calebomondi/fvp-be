import express from 'express';
import { earnPoints, breakVault, getPoints } from '../controllers/pointsController.js';

const pointsRoute = express.Router();

pointsRoute.route('/earn-points').post(earnPoints);
pointsRoute.route('/break-vault').post(breakVault);
pointsRoute.route('/get-points').get(getPoints);

export default pointsRoute;