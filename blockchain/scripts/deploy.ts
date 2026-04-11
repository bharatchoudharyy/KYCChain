import { ethers, run, network } from "hardhat";

async function main() {
	const KYCChain = await ethers.getContractFactory("KYCChain");
	console.log("Deploying KYCChain...");

	const kyc = await KYCChain.deploy();
	await kyc.waitForDeployment();

	const address = await kyc.getAddress();
	console.log("KYCChain deployed to:", address);

	if (network.name === "sepolia") {
		console.log("Waiting for block confirmations...");
		await kyc.deploymentTransaction()?.wait(5);

		console.log("Verifying on Etherscan...");
		try {
			await run("verify:verify", {
				address: address,
				constructorArguments: [],
			});
			console.log("Verified on Etherscan!");
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			if (message.includes("Already Verified")) {
				console.log("Already verified on Etherscan.");
			} else {
				console.error("Etherscan verification failed:", message);
			}
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
