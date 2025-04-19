import express from 'express';
import { scheduledVaultsData } from '../controllers/vaultsController.js';

const vaultsRoute = express.Router();

vaultsRoute.route('/schedule').post(scheduledVaultsData);

export default vaultsRoute;