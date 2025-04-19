import { 
    getDaysInInterval,
    getUnlockStatus,
    getFullUnlockDaysStatus
} from "../utils/scheduled.js";

//get scheduled vaults data
export const scheduledVaultsData = async (req, res) => {
    const { vaultData } = req.body;

    //get days in interval
    const unlockDays = getDaysInInterval(vaultData.startDate, vaultData.endDate, vaultData.unLockDuration);

    //check if can unlock and and amount to unlock
    const checkUnlockStatus = getUnlockStatus(unlockDays, vaultData.unLockAmount, vaultData.unLockedTotal);

    //get full unlock days status
    const unlockDaysStatus = getFullUnlockDaysStatus(unlockDays);

    res.json({ checkUnlockStatus, unlockDaysStatus });
}