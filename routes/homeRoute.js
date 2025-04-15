import express from 'express';

const homeRoute = express.Router();

homeRoute.route('/').get((req, res) => {
  res.status(200).send('Welcome to the FVP backend!');
});

export default homeRoute;