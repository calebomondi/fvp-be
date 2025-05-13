import express from 'express';
import { 
    valueTrends,
    checkSlippage,
    getTokenData,
    chainData
} from '../controllers/tokenController.js';

const tokenRouter = express.Router();

tokenRouter.route('/value-trends').post(valueTrends);
tokenRouter.route('/slippage').get(checkSlippage);
tokenRouter.route('/token-data').get(getTokenData);
tokenRouter.route('/chain-data').get(chainData);

export default tokenRouter;