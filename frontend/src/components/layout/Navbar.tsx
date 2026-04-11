"use client";

import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
	const { isConnected, isVerifier, isAdmin } = useWallet();

	return (
		<nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-8">
					<Link href="/" className="text-xl font-bold">
						KYCChain
					</Link>
					{isConnected && (
						<div className="hidden md:flex items-center gap-4">
							<Link href="/customer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
								Dashboard
							</Link>
							{isVerifier && (
								<Link href="/verifier" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
									Verifier
								</Link>
							)}
							<Link href="/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
								Verify
							</Link>
						</div>
					)}
					{!isConnected && (
						<Link href="/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Verify
						</Link>
					)}
				</div>
				<div className="flex items-center gap-3">
					{isConnected && isAdmin && (
						<Badge variant="outline" className="text-xs">
							Admin
						</Badge>
					)}
					{isConnected && isVerifier && (
						<Badge variant="outline" className="text-xs">
							Verifier
						</Badge>
					)}
					<ConnectWalletButton />
				</div>
			</div>
		</nav>
	);
}
