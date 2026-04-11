"use client";

import { useWallet } from "@/contexts/WalletContext";
import { KYCStatus } from "@/lib/types";
import { KYCForm } from "@/components/customer/KYCForm";
import { SubmissionStatus } from "@/components/customer/SubmissionStatus";
import { RevokeButton } from "@/components/customer/RevokeButton";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomerPage() {
	const { isConnected, kycStatus, kycRecord } = useWallet();

	if (!isConnected) {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-12">
				<Card>
					<CardHeader>
						<CardTitle>Connect Your Wallet</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground">
							Connect your MetaMask wallet to submit or check your KYC status.
						</p>
						<ConnectWalletButton />
					</CardContent>
				</Card>
			</div>
		);
	}

	const canSubmit =
		kycStatus === KYCStatus.NotSubmitted ||
		kycStatus === KYCStatus.Rejected ||
		kycStatus === KYCStatus.Revoked;

	return (
		<div className="container mx-auto max-w-2xl px-4 py-12">
			<div className="space-y-2 mb-8">
				<h1 className="text-3xl font-bold">Customer Dashboard</h1>
				<p className="text-muted-foreground">Submit and manage your KYC verification.</p>
			</div>

			<div className="space-y-6">
				{kycRecord && kycStatus !== KYCStatus.NotSubmitted && (
					<SubmissionStatus record={kycRecord} />
				)}

				{kycStatus === KYCStatus.Verified && (
					<div className="flex justify-end">
						<RevokeButton />
					</div>
				)}

				{canSubmit && <KYCForm />}
			</div>
		</div>
	);
}
