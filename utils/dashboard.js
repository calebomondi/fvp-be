export const analyzeUserVaults = (userVaults) => {
    
    if (userVaults.length === 0) {
      return { error: "No vaults found for this user" };
    }
    
    // 1. Calculate average lock time (in days) for all assets and by asset type
    const now = new Date();
    const calculateLockDays = (start, end) => {
      const startDate = Math.floor(new Date(start).getTime() / 1000);;
      const endDate = Math.floor(new Date(end).getTime() / 1000);;
      if (endDate <= Math.floor(now.getTime() / 1000)) {
        return 0;
      }
      return Math.ceil((endDate - startDate) / (60 * 60 * 24));
    };
    
    let totalLockDays = 0;
    const assetLockDays = {};
    const assetCounts = {};
    
    userVaults.forEach(vault => {
      const days = calculateLockDays(vault.startDate, vault.endDate);
      totalLockDays += days;
      
      if (!assetLockDays[vault.symbol]) {
        assetLockDays[vault.symbol] = 0;
        assetCounts[vault.symbol] = 0;
      }
      
      assetLockDays[vault.symbol] += days;
      assetCounts[vault.symbol]++;
    });
    
    const avgLockDays = totalLockDays / userVaults.length;
    
    const avgLockDaysByAsset = Object.keys(assetLockDays).map(symbol => ({
      symbol,
      avgDays: assetLockDays[symbol] / assetCounts[symbol]
    }));
    
    // 2. Get unique assets locked
    const uniqueAssets = [...new Set(userVaults.map(vault => vault.asset))].map(address => {
      const vault = userVaults.find(v => v.asset === address);
      return {
        address,
        symbol: vault.symbol,
        name: vault.title ? vault.title.split(" ").pop() : vault.symbol
      };
    });
    
    // 3. Find upcoming unlocks (within 7 days)
    const upcomingUnlocks = userVaults
      .filter(vault => {
        const unlockDate = new Date(vault.endDate);
        const daysUntilUnlock = Math.ceil((unlockDate - now) / (1000 * 60 * 60 * 24));
        return daysUntilUnlock >= 0 && daysUntilUnlock <= 7;
      })
      .map(vault => ({
        id: vault.vault_id,
        title: vault.title,
        asset: vault.symbol,
        unlockDate: vault.endDate,
        daysRemaining: Math.ceil((new Date(vault.endDate) - now) / (1000 * 60 * 60 * 24)),
        amount: vault.unLockAmount > 0 ? vault.unLockAmount : vault.amount
      }));
    
    // 4. Calculate total amount by asset
    const assetTotals = {};
    userVaults.forEach(vault => {
      if (!assetTotals[vault.symbol]) {
        assetTotals[vault.symbol] = {
          symbol: vault.symbol,
          totalAmount: 0,
          decimals: vault.decimals,
          address: vault.asset
        };
      }
      
      // Convert from string to number and handle decimals
      const amount = parseFloat(vault.amount);
      assetTotals[vault.symbol].totalAmount += amount;
    });
    
    let totalValueUSD = 0;
    const assetValues = Object.values(assetTotals).map(asset => {
      const price = 1;
      const valueUSD = asset.totalAmount * price;
      totalValueUSD += valueUSD;
      
      return {
        ...asset,
        valueUSD,
        price
      };
    });
    
    // 6. Count locks by type
    const lockTypeCounts = {
      fixed: userVaults.filter(v => v.vaultType === 'Fixed').length,
      goal: userVaults.filter(v => v.vaultType === 'goal').length,
      scheduled: userVaults.filter(v => v.vaultType === 'schedule').length,
    };
    
    // 7. Additional analysis
    // Calculate lock type distribution by asset
    const lockTypeByAsset = {};
    userVaults.forEach(vault => {
      if (!lockTypeByAsset[vault.symbol]) {
        lockTypeByAsset[vault.symbol] = { Fixed: 0, goal: 0, schedule: 0 };
      }
      lockTypeByAsset[vault.symbol][vault.vaultType]++;
    });
    
    // Monthly locking activity (count of locks started by month)
    const monthlyActivity = {};
    userVaults.forEach(vault => {
      const month = vault.startDate.substring(0, 7); // Format: YYYY-MM
      if (!monthlyActivity[month]) {
        monthlyActivity[month] = 0;
      }
      monthlyActivity[month]++;
    });
    
    // Return the complete analysis
    return {
      totalVaults: userVaults.length,
      avgLockDays,
      avgLockDaysByAsset,
      uniqueAssets,
      upcomingUnlocks,
      assetTotals: Object.values(assetTotals),
      assetValues,
      totalValueUSD,
      lockTypeCounts,
      lockTypeByAsset,
      monthlyActivity: Object.entries(monthlyActivity).map(([month, count]) => ({ month, count })),
      vaults: userVaults // Include the raw vaults for any additional processing on the client
    };
};