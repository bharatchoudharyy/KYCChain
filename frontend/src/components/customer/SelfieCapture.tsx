"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SelfieCaptureProps {
	onCapture: (blob: Blob, preview: string) => void;
	capturedPreview: string | null;
	onRetake: () => void;
}

const videoConstraints = {
	width: 480,
	height: 480,
	facingMode: "user",
};

export function SelfieCapture({ onCapture, capturedPreview, onRetake }: SelfieCaptureProps) {
	const webcamRef = useRef<Webcam>(null);
	const [isWebcamReady, setIsWebcamReady] = useState(false);

	const capture = useCallback(() => {
		const imageSrc = webcamRef.current?.getScreenshot();
		if (imageSrc) {
			const byteString = atob(imageSrc.split(",")[1]);
			const ab = new ArrayBuffer(byteString.length);
			const ia = new Uint8Array(ab);
			for (let i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}
			const blob = new Blob([ab], { type: "image/jpeg" });
			onCapture(blob, imageSrc);
		}
	}, [onCapture]);

	if (capturedPreview) {
		return (
			<Card>
				<CardContent className="p-4 space-y-3">
					<p className="text-sm font-medium">Selfie Captured</p>
					<div className="flex justify-center">
						<img
							src={capturedPreview}
							alt="Captured selfie"
							className="w-48 h-48 rounded-lg object-cover"
						/>
					</div>
					<Button variant="outline" size="sm" onClick={onRetake} className="w-full">
						Retake
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardContent className="p-4 space-y-3">
				<p className="text-sm font-medium">Take a Selfie</p>
				<p className="text-xs text-muted-foreground">Position your face in the center of the frame.</p>
				<div className="flex justify-center rounded-lg overflow-hidden bg-muted">
					<Webcam
						ref={webcamRef}
						audio={false}
						screenshotFormat="image/jpeg"
						videoConstraints={videoConstraints}
						onUserMedia={() => setIsWebcamReady(true)}
						mirrored
						className="w-48 h-48 object-cover"
					/>
				</div>
				<Button onClick={capture} disabled={!isWebcamReady} className="w-full">
					{isWebcamReady ? "Capture Selfie" : "Loading camera..."}
				</Button>
			</CardContent>
		</Card>
	);
}
