export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const SEPOLIA_NETWORK_PARAMS = {
	chainId: SEPOLIA_CHAIN_ID_HEX,
	chainName: "Sepolia Testnet",
	nativeCurrency: { name: "SepoliaETH", symbol: "SEP", decimals: 18 },
	rpcUrls: ["https://rpc.sepolia.org"],
	blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
