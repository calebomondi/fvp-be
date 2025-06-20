import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Moralis from 'moralis';

// Importing routes
import homeRoute from './routes/homeRoute.js';
import tokenRoute from './routes/tokensRoute.js';
import vaultsRoute from './routes/vaultsRoute.js';
import adminRouter from './routes/adminRoute.js';
import histRoute from './routes/transacHistRoute.js';
import pointsRoute from './routes/pointsRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

//  Middleware
app.use(cors({
    origin: ["http://localhost:5173","https://fvp-fe.vercel.app", "https://fvp.finance"],
}));
app.use(express.json());

//  Routes
app.use('/api/tokens', tokenRoute);
app.use('/api/vaults', vaultsRoute);
app.use('/api/admin', adminRouter);
app.use('/api/transactions', histRoute);
app.use('/api/points', pointsRoute);
app.use('/', homeRoute);

const startServer = async () => {
    try {
      // Initialize Moralis
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      console.log("Moralis initialized successfully.");

      // Start the Express server after Moralis is initialized
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Error starting server:", error);
      process.exit(1); 
    }
}

// Start the server
startServer()