"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link
			href={href}
			className={cn(
				"text-sm transition-colors",
				isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
			)}
		>
			{children}
		</Link>
	);
}

export function Navbar() {
	const { isConnected, isVerifier } = useWallet();

	return (
		<nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-8">
					<Link href="/" className="text-xl font-bold">
						KYCChain
					</Link>
					<div className="hidden md:flex items-center gap-4">
						{isConnected && !isVerifier && (
							<NavLink href="/customer">My KYC</NavLink>
						)}
						{isConnected && isVerifier && (
							<NavLink href="/verifier">Review KYC</NavLink>
						)}
						<NavLink href="/verify">Verify Address</NavLink>
					</div>
				</div>
				<div className="flex items-center gap-3">
					{isConnected && isVerifier && (
						<Badge variant="outline" className="text-xs border-green-600 text-green-500">
							Verifier
						</Badge>
					)}
					{isConnected && !isVerifier && (
						<Badge variant="outline" className="text-xs">
							Customer
						</Badge>
					)}
					<ConnectWalletButton />
				</div>
			</div>
		</nav>
	);
}
