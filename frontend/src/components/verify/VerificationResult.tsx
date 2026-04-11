"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KYCStatus, KYC_STATUS_LABELS } from "@/lib/types";
import { ethers } from "ethers";

interface VerificationResultProps {
	address: string;
	status: KYCStatus;
	verifier: string;
	verifiedAt: bigint;
	submittedAt: bigint;
}

function formatTimestamp(ts: bigint): string {
	if (ts === 0n) return "N/A";
	return new Date(Number(ts) * 1000).toLocaleString();
}

function getStatusBadgeVariant(status: KYCStatus): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case KYCStatus.Verified:
			return "default";
		case KYCStatus.Pending:
			return "outline";
		case KYCStatus.Rejected:
			return "destructive";
		default:
			return "secondary";
	}
}

export function VerificationResult({ address, status, verifier, verifiedAt, submittedAt }: VerificationResultProps) {
	const isVerified = status === KYCStatus.Verified;

	return (
		<Card className={isVerified ? "border-green-500/50" : ""}>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span className="text-lg">Verification Result</span>
					<Badge variant={getStatusBadgeVariant(status)} className={isVerified ? "bg-green-600" : ""}>
						{KYC_STATUS_LABELS[status]}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<p className="text-sm text-muted-foreground">Wallet Address</p>
					<p className="font-mono text-sm break-all">{address}</p>
				</div>

				{status !== KYCStatus.NotSubmitted && (
					<>
						<Separator />
						<div>
							<p className="text-sm text-muted-foreground">Submitted At</p>
							<p className="text-sm">{formatTimestamp(submittedAt)}</p>
						</div>
					</>
				)}

				{isVerified && (
					<>
						<div>
							<p className="text-sm text-muted-foreground">Verified By</p>
							<p className="font-mono text-sm break-all">
								{verifier === ethers.ZeroAddress ? "N/A" : verifier}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Verified At</p>
							<p className="text-sm">{formatTimestamp(verifiedAt)}</p>
						</div>
					</>
				)}

				{status === KYCStatus.NotSubmitted && (
					<p className="text-sm text-muted-foreground">No KYC record found for this address.</p>
				)}
			</CardContent>
		</Card>
	);
}
