import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ethers } from "ethers";
import { getReadOnlyContract } from "@/lib/contract";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const verifierAddress = request.headers.get("x-wallet-address");
		if (!verifierAddress || !ethers.isAddress(verifierAddress)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const contract = getReadOnlyContract();
		const isVerifier = await contract.isVerifier(verifierAddress);
		if (!isVerifier) {
			return NextResponse.json({ error: "Not a verifier" }, { status: 403 });
		}

		const { data, error } = await getSupabaseAdmin().from("kyc_submissions").select("*").eq("id", id).single();

		if (error || !data) {
			return NextResponse.json({ error: "Submission not found" }, { status: 404 });
		}

		let selfieUrl = "";
		if (data.selfie_path) {
			const { data: signedData } = await getSupabaseAdmin().storage
				.from("kyc-selfies")
				.createSignedUrl(data.selfie_path, 3600);
			selfieUrl = signedData?.signedUrl || "";
		}

		return NextResponse.json({
			id: data.id,
			walletAddress: data.wallet_address,
			fullName: data.full_name,
			dateOfBirth: data.date_of_birth,
			residentialAddress: data.residential_address,
			governmentIdType: data.government_id_type,
			governmentIdNumber: data.government_id_number,
			selfieUrl,
			dataHash: data.data_hash,
			status: data.status,
			createdAt: data.created_at,
		});
	} catch (err) {
		console.error("Fetch error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const verifierAddress = request.headers.get("x-wallet-address");
		if (!verifierAddress || !ethers.isAddress(verifierAddress)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const contract = getReadOnlyContract();
		const isVerifier = await contract.isVerifier(verifierAddress);
		if (!isVerifier) {
			return NextResponse.json({ error: "Not a verifier" }, { status: 403 });
		}

		const { data, error } = await getSupabaseAdmin().from("kyc_submissions").select("selfie_path").eq("id", id).single();

		if (error || !data) {
			return NextResponse.json({ error: "Submission not found" }, { status: 404 });
		}

		if (data.selfie_path) {
			await getSupabaseAdmin().storage.from("kyc-selfies").remove([data.selfie_path]);
		}

		await getSupabaseAdmin().from("kyc_submissions").delete().eq("id", id);

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Delete error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
