import supabase from "../database/supabaseClient.js";

//get token decimals NB:/ Write supabase function to get token decimals and symbol
export const getTokendecimalsNSymbol = async (chainId, tokenAddress) => {
    try {
        //get table name
        const { data: table, error: tableError } = await supabase
            .from("chain")
            .select("name")
            .eq("network_id", chainId);
        
        if (tableError) throw tableError;
        if (table.length === 0) {
            return res.status(404).json({ error: "Chain not found" });
        }

        //get token symbol
        const { data: tokenData, error: tokenError } = await supabase
            .from(table[0].name)
            .select("symbol")
            .eq("address", tokenAddress);
        
        if (tokenError) throw tokenError;
        if (tokenData.length === 0) {
            return res.status(404).json({ error: "Token not found" });
        }

        //get token decimals and address
        const { data: tokenSymbolData, error: tokenSymbolError } = await supabase
            .from(table[0].name)
            .select("symbol")
            .eq("address", address);
        
        if (tokenSymbolError) throw tokenSymbolError;
        if (tokenSymbolData.length === 0) {
            return res.status(404).json({ error: "Token not found" });
        }

        const { data: tokenDecimalsData, error: tokenDecimalsError } = await supabase
            .from("assets")
            .select("decimals")
            .eq("symbol", tokenSymbolData[0].symbol);
        
        if (tokenDecimalsError) throw tokenDecimalsError;
        if (tokenDecimalsData.length === 0) {
            return res.status(404).json({ error: "Token not found" });
        }

        return {
            symbol: tokenSymbolData[0].symbol,
            decimals: tokenDecimalsData[0].decimals,
        };

    } catch (error) {
        
    }
}