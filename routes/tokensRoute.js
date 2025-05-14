import express from 'express';
import { 
    valueTrends,
    checkSlippage,
    getTokenData,
    getChainData,
    getSymbol,
    supportedTokens
} from '../controllers/tokenController.js';

const tokenRouter = express.Router();

tokenRouter.route('/value-trends').post(valueTrends);
tokenRouter.route('/slippage').get(checkSlippage);
tokenRouter.route('/token-data').get(getTokenData);
tokenRouter.route('/chain-data').get(getChainData);
tokenRouter.route('/get-symbol').get(getSymbol);
tokenRouter.route('/supported-tokens').get(supportedTokens);

export default tokenRouter;