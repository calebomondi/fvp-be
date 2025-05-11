import express from 'express';
import { 
    scheduledVaultsData,
} from '../controllers/vaultsController.js';

const vaultsRoute = express.Router();

vaultsRoute.route('/scheduled').post(scheduledVaultsData);

export default vaultsRoute;