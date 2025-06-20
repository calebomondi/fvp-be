
// Transaction Analysis Backend Function - Flexible Property Access
export function analyzeTransactions(moralisResponse) {
  const transactions = moralisResponse.result;
  
  // Add safety check
  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions found in response');
  }
  
  const analysis = {
    summary: {
      totalTransactions: transactions.length,
      totalGasFees: 0,
      netFlow: {
        ETH: 0,
        tokens: {}
      },
      dateRange: {
        from: null,
        to: null
      }
    },
    categories: {},
    behaviorAnalysis: {
      impulsiveSpending: [],
      frequentTrading: [],
      unusualActivity: [],
      riskScore: 0
    },
    monthlyBreakdown: {},
    topTokens: {},
    gasFeeAnalysis: {
      total: 0,
      average: 0
    }
  };

  // Helper function to get property value (handles both snake_case and camelCase)
  const getProp = (obj, snakeCase, camelCase) => {
    return obj[snakeCase] !== undefined ? obj[snakeCase] : obj[camelCase];
  };

  // Set initial summary values
  const sortedTransactions = transactions.sort((a, b) => {
    const timeA = new Date(getProp(a, 'block_timestamp', 'blockTimestamp')).getTime();
    const timeB = new Date(getProp(b, 'block_timestamp', 'blockTimestamp')).getTime();
    return timeA - timeB; // Oldest first
  });

  // Set date range using flexible property access
  const firstTimestamp = getProp(sortedTransactions[0], 'block_timestamp', 'blockTimestamp');
  const lastTimestamp = getProp(sortedTransactions[sortedTransactions.length - 1], 'block_timestamp', 'blockTimestamp');
  
  analysis.summary.dateRange.to = firstTimestamp;
  analysis.summary.dateRange.from = lastTimestamp;

  // Analyze each transaction
  sortedTransactions.forEach((tx, index) => {
    const blockTimestamp = getProp(tx, 'block_timestamp', 'blockTimestamp');
    const txDate = new Date(blockTimestamp);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Initialize monthly breakdown
    if (!analysis.monthlyBreakdown[monthKey]) {
      analysis.monthlyBreakdown[monthKey] = {
        transactions: 0,
        gasFees: 0,
        categories: {}
      };
    }

    // Calculate gas fees with flexible property access
    const transactionFee = getProp(tx, 'transaction_fee', 'transactionFee');
    const gasFee = parseFloat(transactionFee) || 0;
    
    analysis.summary.totalGasFees += gasFee;
    analysis.monthlyBreakdown[monthKey].gasFees += gasFee;
    analysis.monthlyBreakdown[monthKey].transactions++;
    
    if (tx.category) {
      analysis.monthlyBreakdown[monthKey].categories[tx.category] = (analysis.monthlyBreakdown[monthKey].categories[tx.category] || 0) + 1;
    }

    // Enhanced transaction object
    const enhancedTx = {
      ...tx,
      timestamp: txDate,
      gasFee: gasFee,
      usdValue: 0,
      category: categorizeTransaction(tx)
    };

    // Categorize transaction
    const category = categorizeTransaction(tx);
    if (!analysis.categories[category]) {
      analysis.categories[category] = { count: 0, transactions: [], totalValue: 0, gasFees: 0 };
    }
    
    analysis.categories[category].count++;
    analysis.categories[category].gasFees += gasFee;

    // Process native transfers with flexible property access
    const nativeTransfers = getProp(tx, 'native_transfers', 'nativeTransfers');
    if (nativeTransfers && nativeTransfers.length > 0) {
      nativeTransfers.forEach(transfer => {
        const valueFormatted = getProp(transfer, 'value_formatted', 'valueFormatted');
        const value = parseFloat(valueFormatted) || 0;
        if (transfer.direction === 'send') {
          analysis.summary.netFlow.ETH -= value;
        } else if (transfer.direction === 'receive') {
          analysis.summary.netFlow.ETH += value;
        }
      });
    }

    // Process ERC20 transfers with flexible property access
    const erc20Transfers = getProp(tx, 'erc20_transfers', 'erc20Transfers');
    if (erc20Transfers && erc20Transfers.length > 0) {
      erc20Transfers.forEach(transfer => {
        const symbol = getProp(transfer, 'token_symbol', 'tokenSymbol');
        const valueFormatted = getProp(transfer, 'value_formatted', 'valueFormatted');
        const value = parseFloat(valueFormatted) || 0;
        
        if (!analysis.summary.netFlow.tokens[symbol]) {
          analysis.summary.netFlow.tokens[symbol] = 0;
        }
        
        if (!analysis.topTokens[symbol]) {
          const tokenName = getProp(transfer, 'token_name', 'tokenName');
          const tokenLogo = getProp(transfer, 'token_logo', 'tokenLogo');
          
          analysis.topTokens[symbol] = {
            symbol: symbol,
            name: tokenName,
            totalVolume: 0,
            transactions: 0,
            logo: tokenLogo
          };
        }
        
        analysis.topTokens[symbol].transactions++;
        analysis.topTokens[symbol].totalVolume += Math.abs(value);
        
        if (tx.category === 'token send') {
          analysis.summary.netFlow.tokens[symbol] -= value;
        } else if (tx.category === 'token receive') {
          analysis.summary.netFlow.tokens[symbol] += value;
        }
      });
    }

    // Behavioral analysis
    analyzeBehavior(enhancedTx, index, transactions, analysis);
  });

  // Calculate gas fee statistics
  const gasFees = sortedTransactions.map(tx => {
    const transactionFee = getProp(tx, 'transaction_fee', 'transactionFee');
    return parseFloat(transactionFee) || 0;
  });
  
  analysis.gasFeeAnalysis.total = analysis.summary.totalGasFees;
  analysis.gasFeeAnalysis.average = analysis.summary.totalGasFees / transactions.length;

  // Calculate overall risk score
  analysis.behaviorAnalysis.riskScore = calculateRiskScore(analysis);

  // Sort top tokens by volume
  analysis.topTokens = Object.values(analysis.topTokens)
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 5);

  return analysis;
}

function categorizeTransaction(tx) {
  return tx.category || 'Uncategorized';
}

function analyzeBehavior(tx, index, allTransactions, analysis) {
  // Helper function for flexible property access
  const getProp = (obj, snakeCase, camelCase) => {
    return obj[snakeCase] !== undefined ? obj[snakeCase] : obj[camelCase];
  };

  const blockTimestamp = getProp(tx, 'block_timestamp', 'blockTimestamp');
  const txTime = new Date(blockTimestamp).getTime();
  
  // Check for rapid successive transactions (within 5 minutes)
  if (index > 0) {
    const prevTx = allTransactions[index - 1];
    const prevBlockTimestamp = getProp(prevTx, 'block_timestamp', 'blockTimestamp');
    const prevTime = new Date(prevBlockTimestamp).getTime();
    const timeDiff = (txTime - prevTime) / (1000 * 60);
    
    if (timeDiff < 10 && timeDiff > 0) {
      analysis.behaviorAnalysis.frequentTrading.push({
        hash: tx.hash,
        summary: tx.summary,
        category: tx.category,
        timestamp: tx.timestamp,
        timeDifference: timeDiff,
        flag: 'Rapid successive transactions',
        severity: timeDiff < 1 ? 'high' : 'medium'
      });
    }
  }
  
  // Check for high gas fee transactions (potential FOMO)
  const transactionFee = getProp(tx, 'transaction_fee', 'transactionFee');
  const gasFee = parseFloat(transactionFee) || 0;
  const avgGasFee = analysis.summary.totalGasFees / (index + 1);
  
  if (gasFee > avgGasFee * 3 && avgGasFee > 0 && (tx.category === 'token swap' || tx.category === 'token send')) {
    analysis.behaviorAnalysis.impulsiveSpending.push({
      hash: tx.hash,
      summary: tx.summary,
      category: tx.category,
      timestamp: tx.timestamp,
      gasFee: gasFee,
      averageGasFee: avgGasFee,
      flag: 'High gas fee paid (possible FOMO)',
      severity: gasFee > avgGasFee * 5 ? 'high' : 'medium'
    });
  }
  
  // Check for unusual transaction patterns
  const erc20Transfers = getProp(tx, 'erc20_transfers', 'erc20Transfers');
  if (tx.category === 'token swap' && erc20Transfers) {
    const swapValue = erc20Transfers.reduce((sum, transfer) => {
      const valueFormatted = getProp(transfer, 'value_formatted', 'valueFormatted');
      return sum + Math.abs(parseFloat(valueFormatted) || 0);
    }, 0);
    
    // Flag small, frequent swaps as potential impulsive behavior
    if (swapValue < 10 && index > 0) {
      const recentSwaps = allTransactions.slice(Math.max(0, index - 5), index)
        .filter(t => t.category === 'token swap').length;
      
      if (recentSwaps >= 2) {
        analysis.behaviorAnalysis.impulsiveSpending.push({
          hash: tx.hash,
          summary: tx.summary,
          category: tx.category,
          timestamp: tx.timestamp,
          gasFee: gasFee,
          averageGasFee: avgGasFee,
          flag: 'Frequent small swaps detected',
          severity: 'medium'
        });
      }
    }
  }
}

function calculateRiskScore(analysis) {
  let score = 0;
  
  // High frequency trading penalty
  score += analysis.behaviorAnalysis.frequentTrading.length * 2;
  
  // Impulsive spending penalty
  score += analysis.behaviorAnalysis.impulsiveSpending.length * 3;
  
  // High gas fee ratio penalty
  const avgGasFee = analysis.gasFeeAnalysis.average;
  if (analysis.gasFeeAnalysis.highest) {
    const highestFee = parseFloat(analysis.gasFeeAnalysis.highest.transaction_fee || analysis.gasFeeAnalysis.highest.transactionFee);
    if (highestFee > avgGasFee * 5) {
      score += 5;
    }
  }
  
  // Normalize to 0-100 scale
  return Math.min(100, score);
}
