"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { computeKYCHash } from "@/lib/hash";
import { GOV_ID_TYPES, type KYCFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelfieCapture } from "./SelfieCapture";
import { toast } from "sonner";

export function KYCForm() {
	const { contract, address, refreshStatus } = useWallet();
	const [formData, setFormData] = useState<KYCFormData>({
		fullName: "",
		dateOfBirth: "",
		residentialAddress: "",
		governmentIdType: "",
		governmentIdNumber: "",
	});
	const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
	const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [step, setStep] = useState<"form" | "selfie" | "confirm">("form");

	const updateField = (field: keyof KYCFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const isFormValid =
		formData.fullName.trim() &&
		formData.dateOfBirth &&
		formData.residentialAddress.trim() &&
		formData.governmentIdType &&
		formData.governmentIdNumber.trim();

	const handleSubmit = async () => {
		if (!contract || !address || !selfieBlob) return;

		setIsSubmitting(true);
		try {
			// Step 1: Compute hash
			const dataHash = computeKYCHash(formData, address);
			toast.info("Submitting KYC hash to blockchain...");

			// Step 2: Submit hash on-chain
			const tx = await contract.submitKYC(dataHash);
			toast.info("Waiting for transaction confirmation...");
			await tx.wait();
			toast.success("On-chain submission confirmed!");

			// Step 3: Send raw data to API
			toast.info("Uploading details for review...");
			const body = new FormData();
			body.append("walletAddress", address);
			body.append("fullName", formData.fullName);
			body.append("dateOfBirth", formData.dateOfBirth);
			body.append("residentialAddress", formData.residentialAddress);
			body.append("governmentIdType", formData.governmentIdType);
			body.append("governmentIdNumber", formData.governmentIdNumber);
			body.append("dataHash", dataHash);
			body.append("selfie", selfieBlob, "selfie.jpg");

			const res = await fetch("/api/submissions", { method: "POST", body });
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed to upload submission");
			}

			toast.success("KYC submitted successfully! Awaiting verifier review.");
			await refreshStatus();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Submission failed";
			if (message.includes("user rejected") || message.includes("denied")) {
				toast.error("Transaction was rejected");
			} else {
				toast.error(message);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Submit KYC</CardTitle>
				<CardDescription>
					Your data is hashed locally and only the hash is stored on-chain. Raw data is temporarily stored for
					verifier review and deleted after a decision is made.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{step === "form" && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="fullName">Full Name</Label>
							<Input
								id="fullName"
								placeholder="Enter your full name"
								value={formData.fullName}
								onChange={(e) => updateField("fullName", e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="dateOfBirth">Date of Birth</Label>
							<Input
								id="dateOfBirth"
								type="date"
								value={formData.dateOfBirth}
								onChange={(e) => updateField("dateOfBirth", e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="residentialAddress">Residential Address</Label>
							<Input
								id="residentialAddress"
								placeholder="Enter your full address"
								value={formData.residentialAddress}
								onChange={(e) => updateField("residentialAddress", e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="governmentIdType">Government ID Type</Label>
							<Select value={formData.governmentIdType} onValueChange={(v) => { if (v) updateField("governmentIdType", v); }}>
								<SelectTrigger>
									<SelectValue placeholder="Select ID type" />
								</SelectTrigger>
								<SelectContent>
									{GOV_ID_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type.replace("_", " ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="governmentIdNumber">Government ID Number</Label>
							<Input
								id="governmentIdNumber"
								placeholder="Enter your ID number"
								value={formData.governmentIdNumber}
								onChange={(e) => updateField("governmentIdNumber", e.target.value)}
							/>
						</div>

						<Button onClick={() => setStep("selfie")} disabled={!isFormValid} className="w-full">
							Next: Take Selfie
						</Button>
					</div>
				)}

				{step === "selfie" && (
					<div className="space-y-4">
						<SelfieCapture
							onCapture={(blob, preview) => {
								setSelfieBlob(blob);
								setSelfiePreview(preview);
							}}
							capturedPreview={selfiePreview}
							onRetake={() => {
								setSelfieBlob(null);
								setSelfiePreview(null);
							}}
						/>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setStep("form")} className="flex-1">
								Back
							</Button>
							<Button onClick={() => setStep("confirm")} disabled={!selfieBlob} className="flex-1">
								Next: Review
							</Button>
						</div>
					</div>
				)}

				{step === "confirm" && (
					<div className="space-y-4">
						<div className="rounded-lg border p-4 space-y-2">
							<h3 className="font-medium">Review Your Details</h3>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<span className="text-muted-foreground">Name</span>
								<span>{formData.fullName}</span>
								<span className="text-muted-foreground">Date of Birth</span>
								<span>{formData.dateOfBirth}</span>
								<span className="text-muted-foreground">Address</span>
								<span>{formData.residentialAddress}</span>
								<span className="text-muted-foreground">ID Type</span>
								<span>{formData.governmentIdType.replace("_", " ")}</span>
								<span className="text-muted-foreground">ID Number</span>
								<span>{formData.governmentIdNumber}</span>
							</div>
							{selfiePreview && (
								<div className="flex justify-center pt-2">
									<img src={selfiePreview} alt="Your selfie" className="w-24 h-24 rounded-lg object-cover" />
								</div>
							)}
						</div>
						<p className="text-xs text-muted-foreground">
							By submitting, your data will be hashed and the hash stored on the Ethereum blockchain. Your raw data
							will be temporarily stored for verifier review and deleted after approval or rejection.
						</p>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setStep("selfie")} disabled={isSubmitting} className="flex-1">
								Back
							</Button>
							<Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
								{isSubmitting ? "Submitting..." : "Submit KYC"}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
