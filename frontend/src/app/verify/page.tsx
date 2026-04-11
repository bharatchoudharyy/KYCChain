"use client";

import { useState } from "react";
import { getReadOnlyContract } from "@/lib/contract";
import { KYCStatus } from "@/lib/types";
import { AddressInput } from "@/components/verify/AddressInput";
import { VerificationResult } from "@/components/verify/VerificationResult";

interface ResultData {
	address: string;
	status: KYCStatus;
	verifier: string;
	verifiedAt: bigint;
	submittedAt: bigint;
}

export default function VerifyPage() {
	const [result, setResult] = useState<ResultData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleCheck = async (address: string) => {
		setIsLoading(true);
		setError("");
		setResult(null);

		try {
			const contract = getReadOnlyContract();
			const record = await contract.getKYCRecord(address);

			setResult({
				address,
				status: Number(record.status) as KYCStatus,
				verifier: record.verifier,
				verifiedAt: record.verifiedAt,
				submittedAt: record.submittedAt,
			});
		} catch (err) {
			console.error("Verification check failed:", err);
			setError("Failed to check verification status. Make sure you are connected to the right network.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="container mx-auto max-w-2xl px-4 py-12">
			<div className="space-y-2 mb-8">
				<h1 className="text-3xl font-bold">Check Verification</h1>
				<p className="text-muted-foreground">
					Enter any wallet address to check its KYC verification status. No personal data is revealed.
				</p>
			</div>

			<div className="space-y-6">
				<AddressInput onSubmit={handleCheck} isLoading={isLoading} />

				{error && (
					<p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
				)}

				{result && (
					<VerificationResult
						address={result.address}
						status={result.status}
						verifier={result.verifier}
						verifiedAt={result.verifiedAt}
						submittedAt={result.submittedAt}
					/>
				)}
			</div>
		</div>
	);
}
