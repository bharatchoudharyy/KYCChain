"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KYCStatus, KYC_STATUS_LABELS } from "@/lib/types";
import type { KYCRecord } from "@/lib/types";

interface SubmissionStatusProps {
	record: KYCRecord;
}

function formatTimestamp(ts: bigint): string {
	if (ts === 0n) return "N/A";
	return new Date(Number(ts) * 1000).toLocaleString();
}

function getStatusColor(status: KYCStatus): string {
	switch (status) {
		case KYCStatus.Verified:
			return "bg-green-600";
		case KYCStatus.Pending:
			return "bg-yellow-600";
		case KYCStatus.Rejected:
			return "bg-red-600";
		case KYCStatus.Revoked:
			return "bg-gray-600";
		default:
			return "";
	}
}

export function SubmissionStatus({ record }: SubmissionStatusProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Your KYC Status</span>
					<Badge className={getStatusColor(record.status)}>{KYC_STATUS_LABELS[record.status]}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div>
					<p className="text-sm text-muted-foreground">Submitted At</p>
					<p className="text-sm">{formatTimestamp(record.submittedAt)}</p>
				</div>

				{record.status === KYCStatus.Verified && (
					<>
						<div>
							<p className="text-sm text-muted-foreground">Verified By</p>
							<p className="font-mono text-sm break-all">{record.verifier}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Verified At</p>
							<p className="text-sm">{formatTimestamp(record.verifiedAt)}</p>
						</div>
					</>
				)}

				{record.status === KYCStatus.Rejected && record.rejectionReason && (
					<div>
						<p className="text-sm text-muted-foreground">Rejection Reason</p>
						<p className="text-sm text-destructive">{record.rejectionReason}</p>
					</div>
				)}

				{record.status === KYCStatus.Pending && (
					<p className="text-sm text-muted-foreground">
						Your submission is being reviewed by a verifier. This usually takes a few minutes.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
