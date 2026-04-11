"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { KYCSubmission } from "@/lib/types";

interface SubmissionDetailProps {
	submission: KYCSubmission | null;
	isOpen: boolean;
	onClose: () => void;
	onApprove: (submission: KYCSubmission) => Promise<void>;
	onReject: (submission: KYCSubmission, reason: string) => Promise<void>;
	isProcessing: boolean;
}

export function SubmissionDetail({ submission, isOpen, onClose, onApprove, onReject, isProcessing }: SubmissionDetailProps) {
	const [rejectReason, setRejectReason] = useState("");
	const [showRejectInput, setShowRejectInput] = useState(false);

	if (!submission) return null;

	const handleReject = async () => {
		if (!rejectReason.trim()) return;
		await onReject(submission, rejectReason.trim());
		setRejectReason("");
		setShowRejectInput(false);
	};

	const handleClose = () => {
		setShowRejectInput(false);
		setRejectReason("");
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Review KYC Submission</DialogTitle>
					<DialogDescription>
						Wallet: {submission.walletAddress.slice(0, 10)}...{submission.walletAddress.slice(-6)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{submission.selfieUrl && (
						<div className="flex justify-center">
							<img
								src={submission.selfieUrl}
								alt="Applicant selfie"
								className="w-32 h-32 rounded-lg object-cover border"
							/>
						</div>
					)}

					<Separator />

					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<p className="text-muted-foreground">Full Name</p>
							<p className="font-medium">{submission.fullName}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Date of Birth</p>
							<p className="font-medium">{submission.dateOfBirth}</p>
						</div>
						<div className="col-span-2">
							<p className="text-muted-foreground">Residential Address</p>
							<p className="font-medium">{submission.residentialAddress}</p>
						</div>
						<div>
							<p className="text-muted-foreground">ID Type</p>
							<p className="font-medium">{submission.governmentIdType.replace("_", " ")}</p>
						</div>
						<div>
							<p className="text-muted-foreground">ID Number</p>
							<p className="font-medium">{submission.governmentIdNumber}</p>
						</div>
					</div>

					<Separator />

					<div>
						<p className="text-xs text-muted-foreground">On-chain Data Hash</p>
						<p className="font-mono text-xs break-all">{submission.dataHash}</p>
					</div>

					<Separator />

					{showRejectInput ? (
						<div className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="rejectReason">Rejection Reason</Label>
								<Input
									id="rejectReason"
									placeholder="Enter reason for rejection..."
									value={rejectReason}
									onChange={(e) => setRejectReason(e.target.value)}
								/>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => {
										setShowRejectInput(false);
										setRejectReason("");
									}}
									disabled={isProcessing}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={handleReject}
									disabled={!rejectReason.trim() || isProcessing}
									className="flex-1"
								>
									{isProcessing ? "Rejecting..." : "Confirm Reject"}
								</Button>
							</div>
						</div>
					) : (
						<div className="flex gap-2">
							<Button
								variant="destructive"
								onClick={() => setShowRejectInput(true)}
								disabled={isProcessing}
								className="flex-1"
							>
								Reject
							</Button>
							<Button onClick={() => onApprove(submission)} disabled={isProcessing} className="flex-1">
								{isProcessing ? "Approving..." : "Approve"}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
