"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ethers } from "ethers";
import { getContract } from "@/lib/contract";
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX, SEPOLIA_NETWORK_PARAMS } from "@/lib/constants";
import { KYCStatus, type KYCRecord } from "@/lib/types";

interface WalletState {
	address: string | null;
	isConnected: boolean;
	isVerifier: boolean;
	isAdmin: boolean;
	chainId: number | null;
	provider: ethers.BrowserProvider | null;
	signer: ethers.JsonRpcSigner | null;
	contract: ethers.Contract | null;
	kycStatus: KYCStatus;
	kycRecord: KYCRecord | null;
	isLoading: boolean;
	connect: () => Promise<void>;
	disconnect: () => void;
	refreshStatus: () => Promise<void>;
}

const defaultState: WalletState = {
	address: null,
	isConnected: false,
	isVerifier: false,
	isAdmin: false,
	chainId: null,
	provider: null,
	signer: null,
	contract: null,
	kycStatus: KYCStatus.NotSubmitted,
	kycRecord: null,
	isLoading: false,
	connect: async () => {},
	disconnect: () => {},
	refreshStatus: async () => {},
};

const WalletContext = createContext<WalletState>(defaultState);

export function WalletProvider({ children }: { children: ReactNode }) {
	const [address, setAddress] = useState<string | null>(null);
	const [isVerifier, setIsVerifier] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [chainId, setChainId] = useState<number | null>(null);
	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
	const [contract, setContract] = useState<ethers.Contract | null>(null);
	const [kycStatus, setKycStatus] = useState<KYCStatus>(KYCStatus.NotSubmitted);
	const [kycRecord, setKycRecord] = useState<KYCRecord | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const fetchRolesAndStatus = useCallback(async (contractInstance: ethers.Contract, addr: string) => {
		try {
			const [verifierRole, adminRole, record] = await Promise.all([
				contractInstance.isVerifier(addr),
				contractInstance.isAdmin(addr),
				contractInstance.getKYCRecord(addr),
			]);
			setIsVerifier(verifierRole);
			setIsAdmin(adminRole);
			setKycStatus(Number(record.status) as KYCStatus);
			setKycRecord({
				dataHash: record.dataHash,
				status: Number(record.status) as KYCStatus,
				verifier: record.verifier,
				submittedAt: record.submittedAt,
				verifiedAt: record.verifiedAt,
				rejectionReason: record.rejectionReason,
			});
		} catch (error) {
			console.error("Failed to fetch roles/status:", error);
		}
	}, []);

	const switchToSepolia = useCallback(async () => {
		if (!window.ethereum) return;
		try {
			await window.ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
			});
		} catch (switchError: unknown) {
			const err = switchError as { code?: number };
			if (err.code === 4902) {
				await window.ethereum.request({
					method: "wallet_addEthereumChain",
					params: [SEPOLIA_NETWORK_PARAMS],
				});
			}
		}
	}, []);

	const connect = useCallback(async () => {
		if (!window.ethereum) {
			alert("Please install MetaMask to use this application.");
			return;
		}

		setIsLoading(true);
		try {
			const browserProvider = new ethers.BrowserProvider(window.ethereum);
			await browserProvider.send("eth_requestAccounts", []);

			const network = await browserProvider.getNetwork();
			const currentChainId = Number(network.chainId);

			if (currentChainId !== SEPOLIA_CHAIN_ID) {
				await switchToSepolia();
				const updatedProvider = new ethers.BrowserProvider(window.ethereum);
				const updatedSigner = await updatedProvider.getSigner();
				const addr = await updatedSigner.getAddress();
				const contractInstance = getContract(updatedSigner);

				setProvider(updatedProvider);
				setSigner(updatedSigner);
				setAddress(addr);
				setChainId(SEPOLIA_CHAIN_ID);
				setContract(contractInstance);
				await fetchRolesAndStatus(contractInstance, addr);
			} else {
				const signerInstance = await browserProvider.getSigner();
				const addr = await signerInstance.getAddress();
				const contractInstance = getContract(signerInstance);

				setProvider(browserProvider);
				setSigner(signerInstance);
				setAddress(addr);
				setChainId(currentChainId);
				setContract(contractInstance);
				await fetchRolesAndStatus(contractInstance, addr);
			}
		} catch (error) {
			console.error("Failed to connect wallet:", error);
		} finally {
			setIsLoading(false);
		}
	}, [fetchRolesAndStatus, switchToSepolia]);

	const disconnect = useCallback(() => {
		setAddress(null);
		setProvider(null);
		setSigner(null);
		setContract(null);
		setIsVerifier(false);
		setIsAdmin(false);
		setChainId(null);
		setKycStatus(KYCStatus.NotSubmitted);
		setKycRecord(null);
	}, []);

	const refreshStatus = useCallback(async () => {
		if (contract && address) {
			await fetchRolesAndStatus(contract, address);
		}
	}, [contract, address, fetchRolesAndStatus]);

	useEffect(() => {
		if (!window.ethereum) return;

		const handleAccountsChanged = (...args: unknown[]) => {
			const accounts = args[0] as string[];
			if (accounts.length === 0) {
				disconnect();
			} else if (accounts[0] !== address) {
				connect();
			}
		};

		const handleChainChanged = () => {
			connect();
		};

		window.ethereum.on("accountsChanged", handleAccountsChanged);
		window.ethereum.on("chainChanged", handleChainChanged);

		return () => {
			window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
			window.ethereum?.removeListener("chainChanged", handleChainChanged);
		};
	}, [address, connect, disconnect]);

	return (
		<WalletContext.Provider
			value={{
				address,
				isConnected: !!address,
				isVerifier,
				isAdmin,
				chainId,
				provider,
				signer,
				contract,
				kycStatus,
				kycRecord,
				isLoading,
				connect,
				disconnect,
				refreshStatus,
			}}
		>
			{children}
		</WalletContext.Provider>
	);
}

export function useWallet() {
	return useContext(WalletContext);
}
