import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import homeRoute from './routes/homeRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
}));
app.use(express.json());

//routes
app.use('/', homeRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})