"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function RevokeButton() {
	const { contract, refreshStatus } = useWallet();
	const [isRevoking, setIsRevoking] = useState(false);

	const handleRevoke = async () => {
		if (!contract) return;

		const confirmed = window.confirm(
			"Are you sure you want to revoke your KYC? This will remove your verified status. You can re-submit later."
		);
		if (!confirmed) return;

		setIsRevoking(true);
		try {
			const tx = await contract.revokeKYC();
			toast.info("Revoking KYC... waiting for confirmation");
			await tx.wait();
			toast.success("KYC revoked successfully");
			await refreshStatus();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Failed to revoke KYC";
			toast.error(message);
		} finally {
			setIsRevoking(false);
		}
	};

	return (
		<Button variant="destructive" onClick={handleRevoke} disabled={isRevoking}>
			{isRevoking ? "Revoking..." : "Revoke KYC"}
		</Button>
	);
}
