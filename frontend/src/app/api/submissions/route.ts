import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ethers } from "ethers";
import { getReadOnlyContract } from "@/lib/contract";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		const walletAddress = formData.get("walletAddress") as string;
		const fullName = formData.get("fullName") as string;
		const dateOfBirth = formData.get("dateOfBirth") as string;
		const residentialAddress = formData.get("residentialAddress") as string;
		const governmentIdType = formData.get("governmentIdType") as string;
		const governmentIdNumber = formData.get("governmentIdNumber") as string;
		const dataHash = formData.get("dataHash") as string;
		const selfie = formData.get("selfie") as File | null;

		if (!walletAddress || !fullName || !dateOfBirth || !residentialAddress || !governmentIdType || !governmentIdNumber || !dataHash) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		if (!ethers.isAddress(walletAddress)) {
			return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
		}

		let selfiePath = "";

		if (selfie) {
			const fileId = randomUUID();
			const filePath = `${walletAddress}/${fileId}.jpg`;
			const buffer = Buffer.from(await selfie.arrayBuffer());

			const { error: uploadError } = await getSupabaseAdmin().storage
				.from("kyc-selfies")
				.upload(filePath, buffer, { contentType: "image/jpeg", upsert: false });

			if (uploadError) {
				console.error("Selfie upload error:", uploadError);
				return NextResponse.json({ error: "Failed to upload selfie" }, { status: 500 });
			}

			selfiePath = filePath;
		}

		const { data, error } = await getSupabaseAdmin()
			.from("kyc_submissions")
			.insert({
				wallet_address: walletAddress,
				full_name: fullName,
				date_of_birth: dateOfBirth,
				residential_address: residentialAddress,
				government_id_type: governmentIdType,
				government_id_number: governmentIdNumber,
				selfie_path: selfiePath,
				data_hash: dataHash,
				status: "pending",
			})
			.select()
			.single();

		if (error) {
			console.error("DB insert error:", error);
			return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
		}

		return NextResponse.json({ id: data.id, status: "pending", createdAt: data.created_at }, { status: 201 });
	} catch (err) {
		console.error("Submission error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	try {
		const verifierAddress = request.headers.get("x-wallet-address");
		if (!verifierAddress || !ethers.isAddress(verifierAddress)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verify on-chain that caller is a verifier
		try {
			const contract = getReadOnlyContract();
			const isVerifier = await contract.isVerifier(verifierAddress);
			if (!isVerifier) {
				return NextResponse.json({ error: "Not a verifier" }, { status: 403 });
			}
		} catch (contractErr) {
			console.error("Contract call failed:", contractErr);
			return NextResponse.json(
				{ error: "Failed to verify role on-chain: " + (contractErr instanceof Error ? contractErr.message : String(contractErr)) },
				{ status: 500 }
			);
		}

		const status = request.nextUrl.searchParams.get("status") || "pending";

		let supabase;
		try {
			supabase = getSupabaseAdmin();
		} catch (sbErr) {
			console.error("Supabase init failed:", sbErr);
			return NextResponse.json(
				{ error: "Database not configured: " + (sbErr instanceof Error ? sbErr.message : String(sbErr)) },
				{ status: 500 }
			);
		}

		const { data, error } = await supabase
			.from("kyc_submissions")
			.select("*")
			.eq("status", status)
			.order("created_at", { ascending: true });

		if (error) {
			console.error("DB query error:", error);
			return NextResponse.json({ error: "DB query failed: " + error.message }, { status: 500 });
		}

		const submissions = await Promise.all(
			(data || []).map(async (row) => {
				let selfieUrl = "";
				if (row.selfie_path) {
					const { data: signedData } = await supabase.storage
						.from("kyc-selfies")
						.createSignedUrl(row.selfie_path, 3600);
					selfieUrl = signedData?.signedUrl || "";
				}

				return {
					id: row.id,
					walletAddress: row.wallet_address,
					fullName: row.full_name,
					dateOfBirth: row.date_of_birth,
					residentialAddress: row.residential_address,
					governmentIdType: row.government_id_type,
					governmentIdNumber: row.government_id_number,
					selfieUrl,
					dataHash: row.data_hash,
					status: row.status,
					createdAt: row.created_at,
				};
			})
		);

		return NextResponse.json({ submissions });
	} catch (err) {
		console.error("Fetch error:", err);
		return NextResponse.json(
			{ error: "Internal server error: " + (err instanceof Error ? err.message : String(err)) },
			{ status: 500 }
		);
	}
}
