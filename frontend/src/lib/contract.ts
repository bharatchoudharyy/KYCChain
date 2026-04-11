import { ethers } from "ethers";
import KYCChainABI from "@/abi/KYCChain.json";
import { CONTRACT_ADDRESS, SEPOLIA_RPC_URL } from "./constants";

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
	return new ethers.Contract(CONTRACT_ADDRESS, KYCChainABI.abi, signerOrProvider);
}

export function getReadOnlyContract(): ethers.Contract {
	const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
	return new ethers.Contract(CONTRACT_ADDRESS, KYCChainABI.abi, provider);
}

export { KYCChainABI };
