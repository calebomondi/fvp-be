import express from 'express'
import { getTransacHist } from '../controllers/transacHistController.js'

const histRoute = express.Router()

histRoute.route('/history').post(getTransacHist)

export default histRoute;