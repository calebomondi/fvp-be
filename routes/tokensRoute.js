import express from 'express';
import { 
    valueTrends,
    checkSlippageOrGain
} from '../controllers/tokenController.js';

const tokenRouter = express.Router();

tokenRouter.route('/value-trends').post(valueTrends);
tokenRouter.route('/slippage').get(checkSlippageOrGain);

export default tokenRouter;