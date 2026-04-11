"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";

export default function HomePage() {
	const { isConnected } = useWallet();

	return (
		<div className="container mx-auto px-4 py-16">
			<div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
				<h1 className="text-5xl font-bold tracking-tight">KYCChain</h1>
				<p className="text-xl text-muted-foreground">
					Decentralized identity verification on Ethereum. Prove your identity once. Verify anywhere.
					Privacy-preserving — your personal data never touches the blockchain.
				</p>
			</div>

			<div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-16">
				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-lg">Submit KYC</CardTitle>
						<CardDescription>
							Connect your wallet, fill in your details, take a selfie. Your data is hashed locally — only the hash goes on-chain.
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-auto">
						<Link href="/customer">
							<Button className="w-full">{isConnected ? "Go to Dashboard" : "Get Started"}</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-lg">Verifier Dashboard</CardTitle>
						<CardDescription>
							Authorized verifiers review pending KYC submissions, verify documents and selfies, then approve or reject on-chain.
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-auto">
						<Link href="/verifier">
							<Button variant="outline" className="w-full">
								Open Dashboard
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-lg">Check Verification</CardTitle>
						<CardDescription>
							Enter any wallet address to check if it is KYC-verified. No personal data is revealed — just verified or not.
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-auto">
						<Link href="/verify">
							<Button variant="outline" className="w-full">
								Check Status
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			<div className="max-w-3xl mx-auto">
				<h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
				<div className="space-y-6">
					<div className="flex gap-4 items-start">
						<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
							1
						</div>
						<div>
							<h3 className="font-medium">Customer submits KYC</h3>
							<p className="text-sm text-muted-foreground">
								Fill in your identity details and take a selfie. The app hashes your data client-side using keccak256
								and submits only the hash to the Ethereum blockchain. Your raw data is sent to a temporary
								database for verifier review.
							</p>
						</div>
					</div>

					<div className="flex gap-4 items-start">
						<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
							2
						</div>
						<div>
							<h3 className="font-medium">Verifier reviews and approves</h3>
							<p className="text-sm text-muted-foreground">
								A trusted verifier (government body, institution) reviews the raw submission including the selfie.
								They approve or reject directly on-chain. After the decision, the raw data is permanently deleted
								from the database.
							</p>
						</div>
					</div>

					<div className="flex gap-4 items-start">
						<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
							3
						</div>
						<div>
							<h3 className="font-medium">Anyone can verify</h3>
							<p className="text-sm text-muted-foreground">
								Any service, dApp, or institution can check if a wallet is KYC-verified by querying the smart contract.
								They get a yes/no answer — never the customer&apos;s personal data. The hash on-chain serves as
								cryptographic proof that the verified identity data hasn&apos;t been tampered with.
							</p>
						</div>
					</div>

					<div className="flex gap-4 items-start">
						<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
							4
						</div>
						<div>
							<h3 className="font-medium">Customer stays in control</h3>
							<p className="text-sm text-muted-foreground">
								You can revoke your KYC at any time, which immediately invalidates your on-chain verification.
								You can also re-submit after a rejection or revocation. Your identity, your control.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
