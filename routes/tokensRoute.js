import express from 'express';

const tokenRouter = express.Router();

tokenRouter.route('/').get((req, res) => {
    res.status(200).json({ message: 'Tokens route is working!' });
});

export default tokenRouter;