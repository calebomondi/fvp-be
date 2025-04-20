import express from 'express';
import { 
    valueTrends,
    checkSlippage
} from '../controllers/tokenController.js';

const tokenRouter = express.Router();

tokenRouter.route('/value-trends').post(valueTrends);
tokenRouter.route('/slippage').post(checkSlippage);

export default tokenRouter;