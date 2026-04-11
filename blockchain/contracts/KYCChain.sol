// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract KYCChain is AccessControl {
	bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

	enum KYCStatus {
		NotSubmitted,
		Pending,
		Verified,
		Rejected,
		Revoked
	}

	struct KYCRecord {
		bytes32 dataHash;
		KYCStatus status;
		address verifier;
		uint256 submittedAt;
		uint256 verifiedAt;
		string rejectionReason;
	}

	mapping(address => KYCRecord) private _records;

	address[] private _submittedAddresses;
	mapping(address => bool) private _hasSubmitted;

	event KYCSubmitted(address indexed customer, bytes32 dataHash, uint256 timestamp);
	event KYCApproved(address indexed customer, address indexed verifier, uint256 timestamp);
	event KYCRejected(address indexed customer, address indexed verifier, string reason, uint256 timestamp);
	event KYCRevoked(address indexed customer, uint256 timestamp);
	event VerifierAdded(address indexed verifier, address indexed addedBy);
	event VerifierRemoved(address indexed verifier, address indexed removedBy);

	constructor() {
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_grantRole(VERIFIER_ROLE, msg.sender);
	}

	// ============ CUSTOMER FUNCTIONS ============

	function submitKYC(bytes32 dataHash) external {
		KYCRecord storage record = _records[msg.sender];
		require(
			record.status == KYCStatus.NotSubmitted ||
				record.status == KYCStatus.Rejected ||
				record.status == KYCStatus.Revoked,
			"KYC already pending or verified"
		);
		require(dataHash != bytes32(0), "Invalid data hash");

		record.dataHash = dataHash;
		record.status = KYCStatus.Pending;
		record.verifier = address(0);
		record.submittedAt = block.timestamp;
		record.verifiedAt = 0;
		record.rejectionReason = "";

		if (!_hasSubmitted[msg.sender]) {
			_submittedAddresses.push(msg.sender);
			_hasSubmitted[msg.sender] = true;
		}

		emit KYCSubmitted(msg.sender, dataHash, block.timestamp);
	}

	function revokeKYC() external {
		KYCRecord storage record = _records[msg.sender];
		require(record.status == KYCStatus.Verified, "Not currently verified");

		record.status = KYCStatus.Revoked;

		emit KYCRevoked(msg.sender, block.timestamp);
	}

	// ============ VERIFIER FUNCTIONS ============

	function approveKYC(address customer) external onlyRole(VERIFIER_ROLE) {
		KYCRecord storage record = _records[customer];
		require(record.status == KYCStatus.Pending, "Not pending");

		record.status = KYCStatus.Verified;
		record.verifier = msg.sender;
		record.verifiedAt = block.timestamp;

		emit KYCApproved(customer, msg.sender, block.timestamp);
	}

	function rejectKYC(address customer, string calldata reason) external onlyRole(VERIFIER_ROLE) {
		KYCRecord storage record = _records[customer];
		require(record.status == KYCStatus.Pending, "Not pending");

		record.status = KYCStatus.Rejected;
		record.verifier = msg.sender;
		record.rejectionReason = reason;

		emit KYCRejected(customer, msg.sender, reason, block.timestamp);
	}

	// ============ PUBLIC VIEW FUNCTIONS ============

	function isVerified(address customer) external view returns (bool) {
		return _records[customer].status == KYCStatus.Verified;
	}

	function getKYCRecord(address customer) external view returns (KYCRecord memory) {
		return _records[customer];
	}

	function getStatus(address customer) external view returns (KYCStatus) {
		return _records[customer].status;
	}

	function getSubmissionCount() external view returns (uint256) {
		return _submittedAddresses.length;
	}

	function getSubmittedAddresses(uint256 offset, uint256 limit) external view returns (address[] memory) {
		uint256 end = offset + limit;
		if (end > _submittedAddresses.length) {
			end = _submittedAddresses.length;
		}
		if (offset >= _submittedAddresses.length) {
			return new address[](0);
		}
		address[] memory result = new address[](end - offset);
		for (uint256 i = offset; i < end; i++) {
			result[i - offset] = _submittedAddresses[i];
		}
		return result;
	}

	// ============ ADMIN FUNCTIONS ============

	function addVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
		grantRole(VERIFIER_ROLE, account);
		emit VerifierAdded(account, msg.sender);
	}

	function removeVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
		revokeRole(VERIFIER_ROLE, account);
		emit VerifierRemoved(account, msg.sender);
	}

	function isVerifier(address account) external view returns (bool) {
		return hasRole(VERIFIER_ROLE, account);
	}

	function isAdmin(address account) external view returns (bool) {
		return hasRole(DEFAULT_ADMIN_ROLE, account);
	}
}
