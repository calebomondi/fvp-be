import express from 'express';
import { categorizeRevenue } from '../controllers/adminController.js';

const adminRouter = express.Router();

adminRouter.route('/categorize-revenue').get(categorizeRevenue);

export default adminRouter;