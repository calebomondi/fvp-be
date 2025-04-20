/**
 * @description: This file contains functions that calculate the fee for a given amount and fee rate.
 */

export function calculateFee(amount, feeRate) {
    const fee = amount * feeRate / 1000;
    const totalAmount = amount + fee;
    return { fee, totalAmount };
}

export function calculateEmergencyFee(amount, feeRate) {
    const toDeduct =  amount * feeRate / 1000;
    return toDeduct;
}