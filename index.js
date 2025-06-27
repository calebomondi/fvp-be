import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Moralis from 'moralis';
import session from "express-session";

// Importing routes
import homeRoute from './routes/homeRoute.js';
import tokenRoute from './routes/tokensRoute.js';
import vaultsRoute from './routes/vaultsRoute.js';
import adminRouter from './routes/adminRoute.js';
import histRoute from './routes/transacHistRoute.js';
import pointsRoute from './routes/pointsRoute.js';
import twitterRoutes from "./routes/twitterRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SESSION_SECRET = process.env.SESSION_SECRET

//  Middleware
app.use(
  cors({
    origin: ["http://localhost:5173","https://fvp-fe.vercel.app", "https://fvp.finance"],
    credentials: true,
  }),
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
    secure: false, // set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

//  Routes
app.use('/api/tokens', tokenRoute);
app.use('/api/vaults', vaultsRoute);
app.use('/api/admin', adminRouter);
app.use('/api/transactions', histRoute);
app.use('/api/points', pointsRoute);
app.use("/api/twitter", twitterRoutes);
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