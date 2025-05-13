import express from 'express';
import { 
    valueTrends,
    checkSlippage,
    getTokenData,
    getChainData,
    getSymbol
} from '../controllers/tokenController.js';

const tokenRouter = express.Router();

tokenRouter.route('/value-trends').post(valueTrends);
tokenRouter.route('/slippage').get(checkSlippage);
tokenRouter.route('/token-data').get(getTokenData);
tokenRouter.route('/chain-data').get(getChainData);
tokenRouter.route('/get-symbol').get(getSymbol);

export default tokenRouter;