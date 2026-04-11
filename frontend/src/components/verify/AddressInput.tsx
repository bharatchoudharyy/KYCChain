"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddressInputProps {
	onSubmit: (address: string) => void;
	isLoading: boolean;
}

export function AddressInput({ onSubmit, isLoading }: AddressInputProps) {
	const [input, setInput] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!input.trim()) {
			setError("Please enter a wallet address");
			return;
		}

		if (!ethers.isAddress(input.trim())) {
			setError("Invalid Ethereum address");
			return;
		}

		onSubmit(ethers.getAddress(input.trim()));
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-3">
			<div className="flex gap-2">
				<Input
					placeholder="0x... Enter wallet address"
					value={input}
					onChange={(e) => {
						setInput(e.target.value);
						setError("");
					}}
					className="font-mono"
				/>
				<Button type="submit" disabled={isLoading}>
					{isLoading ? "Checking..." : "Check"}
				</Button>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</form>
	);
}
