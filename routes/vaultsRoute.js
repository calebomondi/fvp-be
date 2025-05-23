import express from 'express';
import { 
    scheduledVaultsData,
    getUserVaults,
    getVaultTransactions,
    dashboardAnalysis
} from '../controllers/vaultsController.js';

const vaultsRoute = express.Router();

vaultsRoute.route('/scheduled').post(scheduledVaultsData);
vaultsRoute.route('/get-user-vaults').get(getUserVaults);
vaultsRoute.route('/get-vault-transactions').get(getVaultTransactions);
vaultsRoute.route('/dashboard').post(dashboardAnalysis)

export default vaultsRoute;