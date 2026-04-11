import { expect } from "chai";
import { ethers } from "hardhat";
import { KYCChain } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("KYCChain", function () {
	let kyc: KYCChain;
	let admin: HardhatEthersSigner;
	let verifier: HardhatEthersSigner;
	let customer: HardhatEthersSigner;
	let stranger: HardhatEthersSigner;

	const sampleHash = ethers.keccak256(
		ethers.AbiCoder.defaultAbiCoder().encode(
			["string", "string", "string", "string", "string", "address"],
			["John Doe", "1999-03-15", "123 Main St, Mumbai", "AADHAAR", "1234-5678-9012", ethers.ZeroAddress]
		)
	);

	const sampleHash2 = ethers.keccak256(
		ethers.AbiCoder.defaultAbiCoder().encode(
			["string", "string", "string", "string", "string", "address"],
			["Jane Doe", "2000-01-01", "456 Oak Ave, Delhi", "PAN", "ABCDE1234F", ethers.ZeroAddress]
		)
	);

	beforeEach(async function () {
		[admin, verifier, customer, stranger] = await ethers.getSigners();

		const KYCChainFactory = await ethers.getContractFactory("KYCChain");
		kyc = await KYCChainFactory.deploy();
		await kyc.waitForDeployment();

		// Admin adds a separate verifier
		await kyc.addVerifier(verifier.address);
	});

	// ============ SUBMISSION TESTS ============

	describe("submitKYC", function () {
		it("should allow a customer to submit KYC", async function () {
			await expect(kyc.connect(customer).submitKYC(sampleHash))
				.to.emit(kyc, "KYCSubmitted")
				.withArgs(customer.address, sampleHash, (v: bigint) => v > 0n);

			const record = await kyc.getKYCRecord(customer.address);
			expect(record.status).to.equal(1); // Pending
			expect(record.dataHash).to.equal(sampleHash);
		});

		it("should reject submission with zero hash", async function () {
			await expect(kyc.connect(customer).submitKYC(ethers.ZeroHash)).to.be.revertedWith("Invalid data hash");
		});

		it("should reject submission when already pending", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await expect(kyc.connect(customer).submitKYC(sampleHash2)).to.be.revertedWith(
				"KYC already pending or verified"
			);
		});

		it("should reject submission when already verified", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(verifier).approveKYC(customer.address);
			await expect(kyc.connect(customer).submitKYC(sampleHash2)).to.be.revertedWith(
				"KYC already pending or verified"
			);
		});

		it("should allow re-submission after rejection", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(verifier).rejectKYC(customer.address, "Blurry selfie");

			await expect(kyc.connect(customer).submitKYC(sampleHash2)).to.emit(kyc, "KYCSubmitted");

			const record = await kyc.getKYCRecord(customer.address);
			expect(record.status).to.equal(1); // Pending again
			expect(record.dataHash).to.equal(sampleHash2);
			expect(record.rejectionReason).to.equal(""); // Cleared
		});

		it("should allow re-submission after revocation", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(verifier).approveKYC(customer.address);
			await kyc.connect(customer).revokeKYC();

			await expect(kyc.connect(customer).submitKYC(sampleHash2)).to.emit(kyc, "KYCSubmitted");

			const record = await kyc.getKYCRecord(customer.address);
			expect(record.status).to.equal(1); // Pending
		});

		it("should track submitted addresses for enumeration", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(stranger).submitKYC(sampleHash2);

			expect(await kyc.getSubmissionCount()).to.equal(2);

			const addresses = await kyc.getSubmittedAddresses(0, 10);
			expect(addresses).to.include(customer.address);
			expect(addresses).to.include(stranger.address);
		});

		it("should not duplicate address on re-submission", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(verifier).rejectKYC(customer.address, "Bad photo");
			await kyc.connect(customer).submitKYC(sampleHash2);

			expect(await kyc.getSubmissionCount()).to.equal(1);
		});
	});

	// ============ APPROVAL TESTS ============

	describe("approveKYC", function () {
		beforeEach(async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
		});

		it("should allow verifier to approve pending KYC", async function () {
			await expect(kyc.connect(verifier).approveKYC(customer.address))
				.to.emit(kyc, "KYCApproved")
				.withArgs(customer.address, verifier.address, (v: bigint) => v > 0n);

			const record = await kyc.getKYCRecord(customer.address);
			expect(record.status).to.equal(2); // Verified
			expect(record.verifier).to.equal(verifier.address);
			expect(record.verifiedAt).to.be.greaterThan(0);
		});

		it("should reject approval from non-verifier", async function () {
			await expect(kyc.connect(stranger).approveKYC(customer.address)).to.be.reverted;
		});

		it("should reject approval of non-pending record", async function () {
			await kyc.connect(verifier).approveKYC(customer.address);
			await expect(kyc.connect(verifier).approveKYC(customer.address)).to.be.revertedWith("Not pending");
		});

		it("should reject approval of address with no submission", async function () {
			await expect(kyc.connect(verifier).approveKYC(stranger.address)).to.be.revertedWith("Not pending");
		});
	});

	// ============ REJECTION TESTS ============

	describe("rejectKYC", function () {
		beforeEach(async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
		});

		it("should allow verifier to reject pending KYC with reason", async function () {
			const reason = "ID document is expired";
			await expect(kyc.connect(verifier).rejectKYC(customer.address, reason))
				.to.emit(kyc, "KYCRejected")
				.withArgs(customer.address, verifier.address, reason, (v: bigint) => v > 0n);

			const record = await kyc.getKYCRecord(customer.address);
			expect(record.status).to.equal(3); // Rejected
			expect(record.rejectionReason).to.equal(reason);
		});

		it("should reject rejection from non-verifier", async function () {
			await expect(kyc.connect(stranger).rejectKYC(customer.address, "bad")).to.be.reverted;
		});

		it("should reject rejection of non-pending record", async function () {
			await kyc.connect(verifier).rejectKYC(customer.address, "bad");
			await expect(kyc.connect(verifier).rejectKYC(customer.address, "bad again")).to.be.revertedWith(
				"Not pending"
			);
		});
	});

	// ============ REVOCATION TESTS ============

	describe("revokeKYC", function () {
		it("should allow verified customer to revoke", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(verifier).approveKYC(customer.address);

			await expect(kyc.connect(customer).revokeKYC())
				.to.emit(kyc, "KYCRevoked")
				.withArgs(customer.address, (v: bigint) => v > 0n);

			const record = await kyc.getKYCRecord(customer.address);
			expect(record.status).to.equal(4); // Revoked
		});

		it("should reject revocation when not verified", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await expect(kyc.connect(customer).revokeKYC()).to.be.revertedWith("Not currently verified");
		});

		it("should reject revocation when no submission exists", async function () {
			await expect(kyc.connect(customer).revokeKYC()).to.be.revertedWith("Not currently verified");
		});
	});

	// ============ VIEW FUNCTION TESTS ============

	describe("View functions", function () {
		it("isVerified should return false for unsubmitted address", async function () {
			expect(await kyc.isVerified(customer.address)).to.equal(false);
		});

		it("isVerified should return true after approval", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(verifier).approveKYC(customer.address);
			expect(await kyc.isVerified(customer.address)).to.equal(true);
		});

		it("isVerified should return false after revocation", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(verifier).approveKYC(customer.address);
			await kyc.connect(customer).revokeKYC();
			expect(await kyc.isVerified(customer.address)).to.equal(false);
		});

		it("getStatus should return correct enum values", async function () {
			expect(await kyc.getStatus(customer.address)).to.equal(0); // NotSubmitted
			await kyc.connect(customer).submitKYC(sampleHash);
			expect(await kyc.getStatus(customer.address)).to.equal(1); // Pending
		});

		it("getSubmittedAddresses should handle offset and limit correctly", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			await kyc.connect(stranger).submitKYC(sampleHash2);

			const first = await kyc.getSubmittedAddresses(0, 1);
			expect(first.length).to.equal(1);

			const second = await kyc.getSubmittedAddresses(1, 1);
			expect(second.length).to.equal(1);

			const outOfRange = await kyc.getSubmittedAddresses(10, 5);
			expect(outOfRange.length).to.equal(0);
		});

		it("getKYCRecord should return timestamps", async function () {
			await kyc.connect(customer).submitKYC(sampleHash);
			const record = await kyc.getKYCRecord(customer.address);
			expect(record.submittedAt).to.be.greaterThan(0);
			expect(record.verifiedAt).to.equal(0);

			await kyc.connect(verifier).approveKYC(customer.address);
			const updated = await kyc.getKYCRecord(customer.address);
			expect(updated.verifiedAt).to.be.greaterThan(0);
		});
	});

	// ============ ADMIN TESTS ============

	describe("Admin functions", function () {
		it("admin can add a verifier", async function () {
			await expect(kyc.addVerifier(stranger.address))
				.to.emit(kyc, "VerifierAdded")
				.withArgs(stranger.address, admin.address);

			expect(await kyc.isVerifier(stranger.address)).to.equal(true);
		});

		it("admin can remove a verifier", async function () {
			await expect(kyc.removeVerifier(verifier.address))
				.to.emit(kyc, "VerifierRemoved")
				.withArgs(verifier.address, admin.address);

			expect(await kyc.isVerifier(verifier.address)).to.equal(false);
		});

		it("non-admin cannot add a verifier", async function () {
			await expect(kyc.connect(stranger).addVerifier(customer.address)).to.be.reverted;
		});

		it("non-admin cannot remove a verifier", async function () {
			await expect(kyc.connect(stranger).removeVerifier(verifier.address)).to.be.reverted;
		});

		it("deployer is both admin and verifier", async function () {
			expect(await kyc.isAdmin(admin.address)).to.equal(true);
			expect(await kyc.isVerifier(admin.address)).to.equal(true);
		});

		it("isAdmin returns false for non-admin", async function () {
			expect(await kyc.isAdmin(stranger.address)).to.equal(false);
		});
	});
});
