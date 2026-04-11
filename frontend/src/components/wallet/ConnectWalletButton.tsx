"use client";

import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";

export function ConnectWalletButton() {
	const { address, isConnected, isLoading, connect, disconnect } = useWallet();

	if (isLoading) {
		return (
			<Button variant="outline" disabled>
				Connecting...
			</Button>
		);
	}

	if (isConnected && address) {
		return (
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground font-mono">
					{address.slice(0, 6)}...{address.slice(-4)}
				</span>
				<Button variant="outline" size="sm" onClick={disconnect}>
					Disconnect
				</Button>
			</div>
		);
	}

	return <Button onClick={connect}>Connect Wallet</Button>;
}
