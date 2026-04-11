"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { KYCStatus, KYC_STATUS_LABELS } from "@/lib/types";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

function HowItWorks() {
	const steps = [
		{
			title: "Customer submits KYC",
			description:
				"Fill in your identity details and take a selfie. The app hashes your data client-side using keccak256 and submits only the hash to the Ethereum blockchain. Your raw data is sent to a temporary database for verifier review.",
		},
		{
			title: "Verifier reviews and approves",
			description:
				"A trusted verifier (government body, institution) reviews the raw submission including the selfie. They approve or reject directly on-chain. After the decision, the raw data is permanently deleted from the database.",
		},
		{
			title: "Anyone can verify",
			description:
				"Any service, dApp, or institution can check if a wallet is KYC-verified by querying the smart contract. They get a yes/no answer \u2014 never the customer\u2019s personal data.",
		},
		{
			title: "Customer stays in control",
			description:
				"You can revoke your KYC at any time, which immediately invalidates your on-chain verification. You can also re-submit after a rejection or revocation. Your identity, your control.",
		},
	];

	return (
		<div className="max-w-3xl mx-auto mt-16">
			<h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
			<div className="space-y-6">
				{steps.map((step, i) => (
					<div key={i} className="flex gap-4 items-start">
						<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
							{i + 1}
						</div>
						<div>
							<h3 className="font-medium">{step.title}</h3>
							<p className="text-sm text-muted-foreground">{step.description}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function CustomerHome() {
	const { kycStatus } = useWallet();

	const statusColor =
		kycStatus === KYCStatus.Verified
			? "bg-green-600"
			: kycStatus === KYCStatus.Pending
				? "bg-yellow-600"
				: kycStatus === KYCStatus.Rejected
					? "bg-red-600"
					: "bg-muted";

	return (
		<div className="container mx-auto px-4 py-16 max-w-3xl">
			<div className="text-center space-y-4 mb-12">
				<h1 className="text-4xl font-bold tracking-tight">Welcome to KYCChain</h1>
				{kycStatus !== KYCStatus.NotSubmitted ? (
					<div className="flex items-center justify-center gap-3">
						<p className="text-lg text-muted-foreground">Your KYC status:</p>
						<Badge className={statusColor}>{KYC_STATUS_LABELS[kycStatus]}</Badge>
					</div>
				) : (
					<p className="text-lg text-muted-foreground">
						Complete your KYC verification to get started.
					</p>
				)}
			</div>

			<div className="grid sm:grid-cols-2 gap-6">
				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-lg">My KYC</CardTitle>
						<CardDescription>
							{kycStatus === KYCStatus.NotSubmitted
								? "Submit your identity details and selfie to get verified."
								: kycStatus === KYCStatus.Pending
									? "Your submission is under review."
									: kycStatus === KYCStatus.Verified
										? "You are verified. Manage your KYC status."
										: kycStatus === KYCStatus.Rejected
											? "Your submission was rejected. You can re-submit."
											: "Your KYC was revoked. You can re-submit."}
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-auto">
						<Link href="/customer">
							<Button className="w-full">
								{kycStatus === KYCStatus.NotSubmitted
									? "Submit KYC"
									: kycStatus === KYCStatus.Rejected || kycStatus === KYCStatus.Revoked
										? "Re-submit KYC"
										: "View Status"}
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-lg">Verify Address</CardTitle>
						<CardDescription>
							Check the KYC status of any wallet address. No personal data is revealed.
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-auto">
						<Link href="/verify">
							<Button variant="outline" className="w-full">Check Status</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			<HowItWorks />
		</div>
	);
}

function VerifierHome() {
	return (
		<div className="container mx-auto px-4 py-16 max-w-3xl">
			<div className="text-center space-y-4 mb-12">
				<h1 className="text-4xl font-bold tracking-tight">KYCChain Verifier</h1>
				<p className="text-lg text-muted-foreground">
					Review and process pending KYC submissions.
				</p>
			</div>

			<div className="grid sm:grid-cols-2 gap-6">
				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-lg">Review KYC</CardTitle>
						<CardDescription>
							View pending KYC submissions, review applicant details and selfies, then approve or reject on-chain.
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-auto">
						<Link href="/verifier">
							<Button className="w-full">Open Dashboard</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-lg">Verify Address</CardTitle>
						<CardDescription>
							Check the KYC status of any wallet address. No personal data is revealed.
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-auto">
						<Link href="/verify">
							<Button variant="outline" className="w-full">Check Status</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			<HowItWorks />
		</div>
	);
}

function GuestHome() {
	return (
		<div className="container mx-auto px-4 py-16">
			<div className="max-w-3xl mx-auto text-center space-y-6 mb-12">
				<h1 className="text-5xl font-bold tracking-tight">KYCChain</h1>
				<p className="text-xl text-muted-foreground">
					Decentralized identity verification on Ethereum. Prove your identity once. Verify anywhere.
					Privacy-preserving — your personal data never touches the blockchain.
				</p>
				<div className="flex items-center justify-center gap-4 pt-4">
					<ConnectWalletButton />
					<Link href="/verify">
						<Button variant="outline">Verify an Address</Button>
					</Link>
				</div>
			</div>

			<HowItWorks />
		</div>
	);
}

export default function HomePage() {
	const { isConnected, isVerifier } = useWallet();

	if (!isConnected) return <GuestHome />;
	if (isVerifier) return <VerifierHome />;
	return <CustomerHome />;
}
