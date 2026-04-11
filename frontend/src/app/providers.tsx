"use client";

import { WalletProvider } from "@/contexts/WalletContext";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
	return (
		<WalletProvider>
			<Navbar />
			<main className="flex-1">{children}</main>
			<Toaster richColors position="bottom-right" />
		</WalletProvider>
	);
}
