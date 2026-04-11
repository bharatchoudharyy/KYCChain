"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { PendingSubmissionsList } from "@/components/verifier/PendingSubmissionsList";
import { SubmissionDetail } from "@/components/verifier/SubmissionDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { KYCSubmission } from "@/lib/types";
import { toast } from "sonner";

export default function VerifierPage() {
	const { isConnected, isVerifier, address, contract } = useWallet();
	const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const fetchSubmissions = useCallback(async () => {
		if (!address) return;
		setIsLoading(true);
		try {
			const res = await fetch("/api/submissions?status=pending", {
				headers: { "x-wallet-address": address },
			});
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setSubmissions(data.submissions || []);
		} catch (error) {
			console.error("Failed to fetch submissions:", error);
			toast.error("Failed to load pending submissions");
		} finally {
			setIsLoading(false);
		}
	}, [address]);

	useEffect(() => {
		if (isConnected && isVerifier) {
			fetchSubmissions();
		}
	}, [isConnected, isVerifier, fetchSubmissions]);

	const handleApprove = async (submission: KYCSubmission) => {
		if (!contract || !address) return;
		setIsProcessing(true);
		try {
			toast.info("Approving KYC on-chain...");
			const tx = await contract.approveKYC(submission.walletAddress);
			toast.info("Waiting for confirmation...");
			await tx.wait();

			await fetch(`/api/submissions/${submission.id}`, {
				method: "DELETE",
				headers: { "x-wallet-address": address },
			});

			toast.success(`KYC approved for ${submission.fullName}`);
			setSelectedSubmission(null);
			await fetchSubmissions();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Approval failed";
			toast.error(message);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleReject = async (submission: KYCSubmission, reason: string) => {
		if (!contract || !address) return;
		setIsProcessing(true);
		try {
			toast.info("Rejecting KYC on-chain...");
			const tx = await contract.rejectKYC(submission.walletAddress, reason);
			toast.info("Waiting for confirmation...");
			await tx.wait();

			await fetch(`/api/submissions/${submission.id}`, {
				method: "DELETE",
				headers: { "x-wallet-address": address },
			});

			toast.success(`KYC rejected for ${submission.fullName}`);
			setSelectedSubmission(null);
			await fetchSubmissions();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Rejection failed";
			toast.error(message);
		} finally {
			setIsProcessing(false);
		}
	};

	if (!isConnected) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-12">
				<Card>
					<CardHeader>
						<CardTitle>Connect Your Wallet</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground">Connect your verifier wallet to access the dashboard.</p>
						<ConnectWalletButton />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!isVerifier) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-12">
				<Card>
					<CardHeader>
						<CardTitle>Access Denied</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							This dashboard is for authorized verifiers only. Your connected wallet does not have the verifier role.
						</p>
						<p className="font-mono text-sm mt-2 text-muted-foreground">{address}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-12">
			<div className="flex items-center justify-between mb-8">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold">Verifier Dashboard</h1>
					<p className="text-muted-foreground">Review and process pending KYC submissions.</p>
				</div>
				<Button variant="outline" onClick={fetchSubmissions} disabled={isLoading}>
					{isLoading ? "Refreshing..." : "Refresh"}
				</Button>
			</div>

			<PendingSubmissionsList
				submissions={submissions}
				onReview={setSelectedSubmission}
				isLoading={isLoading}
			/>

			<SubmissionDetail
				submission={selectedSubmission}
				isOpen={!!selectedSubmission}
				onClose={() => setSelectedSubmission(null)}
				onApprove={handleApprove}
				onReject={handleReject}
				isProcessing={isProcessing}
			/>
		</div>
	);
}
