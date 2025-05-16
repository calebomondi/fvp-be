/**
 * @description: This file contains the functions that perform operation for the scheduledVault controller.
 */

export function getDaysInInterval(startDate, endDate, interval) {
    let days = [];
    const secondsInDay = 86400; // 24 * 60 * 60
    const every = interval * secondsInDay;
    const startOn = startDate + every;

    for(let start = startOn ; start < endDate; start += every) {
        days.push(start);
    }

    return days;
}

export function getUnlockStatus(unlockDays, unlockAmount, unLockedTotal) {
    //sum of dates to unlock
    const daysNum = unlockDays.length;
    console.log(`length of unlockDays: ${daysNum}`);
    //total amount to unlock
    const totalAmount = unlockAmount * daysNum;

    //get now in timestamp in seconds
    const now = Math.floor(Date.now() / 1000);

    let canUnlockNow = false;

    //unlock periods that have passed
    let days = 0;

    //amount unlocked within that period
    let expectedUnlockedAmount = 0;

    //get the number of days that have passed and the expected amount unlocked
    for(let i = 0; i < daysNum; i++) {
        if(unlockDays[0] > now) {
            break
        }
        days++;
        expectedUnlockedAmount = unlockAmount * days;
        if(unlockDays[i] <= now && now <= unlockDays[i + 1]) {
            //check if current time is within unlock window
            if(now <= unlockDays[i] + 86400) {
                canUnlockNow = true;
            }

            break;
        }
    }

    //amount to unlock
    let amountToUnlock = 0;

    if(unLockedTotal === expectedUnlockedAmount) {
        console.log(`Can unlock: ${unlockAmount}`);
        amountToUnlock = unlockAmount;
    } else {
        console.log(`Can unlock: ${expectedUnlockedAmount - unLockedTotal}`);
        amountToUnlock = expectedUnlockedAmount - unLockedTotal;
    }

    return { canUnlockNow, amountToUnlock };
}

export function getFullUnlockDaysStatus(unlockDays) {
    //sum of dates to unlock
    const daysNum = unlockDays.length;

    //get now in timestamp in seconds
    const now = Math.floor(Date.now() / 1000);

    //array of detailed list
    let days = []

    let status = ''

    for(let i = 0; i < daysNum; i++) {
        if(unlockDays[i] <= now && now <= unlockDays[i] + 86400) {
            status = 'current'
        } else if(unlockDays[i] + 86400 < now) {
            status = 'past'
        } else {
            status = 'future'
        }

        days.push({ date: unlockDays[i], status });
    }

    return days;
}