export enum KYCStatus {
	NotSubmitted = 0,
	Pending = 1,
	Verified = 2,
	Rejected = 3,
	Revoked = 4,
}

export interface KYCRecord {
	dataHash: string;
	status: KYCStatus;
	verifier: string;
	submittedAt: bigint;
	verifiedAt: bigint;
	rejectionReason: string;
}

export interface KYCFormData {
	fullName: string;
	dateOfBirth: string;
	residentialAddress: string;
	governmentIdType: string;
	governmentIdNumber: string;
}

export interface KYCSubmission extends KYCFormData {
	id: string;
	walletAddress: string;
	selfieUrl: string;
	dataHash: string;
	status: string;
	createdAt: string;
}

export const KYC_STATUS_LABELS: Record<KYCStatus, string> = {
	[KYCStatus.NotSubmitted]: "Not Submitted",
	[KYCStatus.Pending]: "Pending Review",
	[KYCStatus.Verified]: "Verified",
	[KYCStatus.Rejected]: "Rejected",
	[KYCStatus.Revoked]: "Revoked",
};

export const KYC_STATUS_COLORS: Record<KYCStatus, string> = {
	[KYCStatus.NotSubmitted]: "secondary",
	[KYCStatus.Pending]: "default",
	[KYCStatus.Verified]: "default",
	[KYCStatus.Rejected]: "destructive",
	[KYCStatus.Revoked]: "secondary",
};

export const GOV_ID_TYPES = ["AADHAAR", "PAN", "PASSPORT", "VOTER_ID", "DRIVING_LICENSE"] as const;
export type GovIdType = (typeof GOV_ID_TYPES)[number];
