import express from 'express';
import { earnPoints, breakVault, getPoints, earnPointOnAddition } from '../controllers/pointsController.js';

const pointsRoute = express.Router();

pointsRoute.route('/earn-points').post(earnPoints);
pointsRoute.route('/break-vault').post(breakVault);
pointsRoute.route('/get-points').get(getPoints);
pointsRoute.route('/earn-point-on-addition').post(earnPointOnAddition);

export default pointsRoute;