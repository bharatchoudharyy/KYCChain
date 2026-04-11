import { ethers } from "ethers";
import type { KYCFormData } from "./types";

export function computeKYCHash(data: KYCFormData, walletAddress: string): string {
	return ethers.keccak256(
		ethers.AbiCoder.defaultAbiCoder().encode(
			["string", "string", "string", "string", "string", "address"],
			[
				data.fullName,
				data.dateOfBirth,
				data.residentialAddress,
				data.governmentIdType,
				data.governmentIdNumber,
				walletAddress,
			]
		)
	);
}
