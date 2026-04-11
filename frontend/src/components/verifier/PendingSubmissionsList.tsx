"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { KYCSubmission } from "@/lib/types";

interface PendingSubmissionsListProps {
	submissions: KYCSubmission[];
	onReview: (submission: KYCSubmission) => void;
	isLoading: boolean;
}

export function PendingSubmissionsList({ submissions, onReview, isLoading }: PendingSubmissionsListProps) {
	if (isLoading) {
		return (
			<div className="text-center py-8 text-muted-foreground">Loading pending submissions...</div>
		);
	}

	if (submissions.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground border rounded-lg">
				No pending submissions to review.
			</div>
		);
	}

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Wallet</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>ID Type</TableHead>
						<TableHead>Submitted</TableHead>
						<TableHead className="text-right">Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{submissions.map((sub) => (
						<TableRow key={sub.id}>
							<TableCell className="font-mono text-xs">
								{sub.walletAddress.slice(0, 6)}...{sub.walletAddress.slice(-4)}
							</TableCell>
							<TableCell>{sub.fullName}</TableCell>
							<TableCell>
								<Badge variant="outline">{sub.governmentIdType.replace("_", " ")}</Badge>
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{new Date(sub.createdAt).toLocaleDateString()}
							</TableCell>
							<TableCell className="text-right">
								<Button size="sm" onClick={() => onReview(sub)}>
									Review
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
