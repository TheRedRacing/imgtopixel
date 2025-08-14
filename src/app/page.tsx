'use client'

import { cn } from "@/lib/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox";

export default function Home() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const offscreenRef = useRef<HTMLCanvasElement | null>(null);
	const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
	const [pixelSize, setPixelSize] = useState<number>(10); // taille de bloc en px
	const [gridStep, setGridStep] = useState<number>(10); // pas de la grille (px)
	const [bindGridToPixel, setBindGridToPixel] = useState<boolean>(true);
	const [gridOpacity, setGridOpacity] = useState<number>(0.5);
	const [gridColor, setGridColor] = useState<string>("#000000");
	const [bgColor, setBgColor] = useState<string>("#ffffff");
	const [exportScale, setExportScale] = useState<number>(1);
	const [imageLoaded, setImageLoaded] = useState<boolean>(false);
	const [gridOn, setGridOn] = useState<boolean>(true);

	useEffect(() => {
		if (bindGridToPixel) setGridStep(pixelSize);
	}, [pixelSize, bindGridToPixel]);

	// Charger une image depuis un Blob (fichier + clipboard)
	const loadFromBlob = (blob: Blob) => {
		setImageLoaded(false);
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			setImgEl(img);
			setImageLoaded(true);
			URL.revokeObjectURL(url);
		};
		img.src = url;
	};

	useEffect(() => {
		const onPaste = async (e: ClipboardEvent) => {
			if (!e.clipboardData) return;
			const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
			if (item) {
				const blob = item.getAsFile();
				if (blob) loadFromBlob(blob);
			}
		};
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	}, []);

	const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) loadFromBlob(file);
	};

	const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
		e.preventDefault();
	};

	const draw = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();

		if (!imgEl) return;

		const imgW = imgEl.naturalWidth || imgEl.width;
		const imgH = imgEl.naturalHeight || imgEl.height;

		// Taille du canvas = taille native de l'image (pour export net)
		canvas.width = Math.max(1, Math.floor(imgW * exportScale));
		canvas.height = Math.max(1, Math.floor(imgH * exportScale));

		// Offscreen pour downscale
		if (!offscreenRef.current) {
			offscreenRef.current = document.createElement("canvas");
		}
		const off = offscreenRef.current;
		const offCtx = off.getContext("2d")!;

		const block = Math.max(1, Math.floor(pixelSize));

		const smallW = Math.max(1, Math.floor(imgW / block));
		const smallH = Math.max(1, Math.floor(imgH / block));

		off.width = smallW;
		off.height = smallH;

		// Dessiner l'image réduite
		offCtx.imageSmoothingEnabled = true; // réduire proprement
		offCtx.clearRect(0, 0, smallW, smallH);
		offCtx.drawImage(imgEl, 0, 0, smallW, smallH);

		// Redessiner en grand sans smoothing pour l'effet pixel
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(
			off,
			0,
			0,
			smallW,
			smallH,
			0,
			0,
			Math.floor(canvas.width),
			Math.floor(canvas.height)
		);

		// Grille
		if (gridOn) {
			const step = Math.max(1, Math.floor(gridStep * exportScale));
			ctx.save();
			ctx.globalAlpha = Math.max(0, Math.min(1, gridOpacity));
			ctx.strokeStyle = gridColor;
			ctx.lineWidth = 1;

			// Lignes verticales
			for (let x = 0; x <= canvas.width; x += step) {
				ctx.beginPath();
				ctx.moveTo(x + 0.5, 0);
				ctx.lineTo(x + 0.5, canvas.height);
				ctx.stroke();
			}
			// Lignes horizontales
			for (let y = 0; y <= canvas.height; y += step) {
				ctx.beginPath();
				ctx.moveTo(0, y + 0.5);
				ctx.lineTo(canvas.width, y + 0.5);
				ctx.stroke();
			}
			ctx.restore();
		}
	};

	// Redessiner quand paramètres changent
	useEffect(() => {
		draw();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imgEl, pixelSize, gridOn, gridStep, gridOpacity, gridColor, bgColor, exportScale]);

	// Ajuste le style pour un affichage responsive (sans toucher au buffer export)
	const canvasStyle = useMemo<React.CSSProperties>(() => ({
		width: "100%",
		maxWidth: 900,
		height: "auto",
		borderRadius: 12,
		border: "1px solid rgba(0,0,0,0.1)",
		boxShadow: "0 1px 10px rgba(0,0,0,0.07)",
		background: bgColor,
	}), [bgColor]);

	const download = (type: "image/png" | "image/jpeg") => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		try {
			const link = document.createElement("a");
			link.download = `pixelized_${pixelSize}px.${type === "image/png" ? "png" : "jpg"}`;
			link.href = canvas.toDataURL(type);
			link.click();
		} catch (e) {
			alert("Export impossible. Certaines images externes empêchent l'export sans CORS (crossOrigin). Tente un upload ou héberge l'image avec CORS activé.");
		}
	};

	return (
		<>
			<header className="h-20">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
					<span className="inline-flex items-center py-1 text-xl font-medium text-zinc-900">ImgToPixels</span>

					<div className="flex items-center justify-center gap-4 text-[0.8125rem] leading-6 text-slate-500">
						<p className="hidden md:block">V1.0.0</p>
					</div>
				</div>
			</header>

			<div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
				<div className="bg-white rounded-2xl p-4 sm:p-6 lg:col-span-2 flex flex-col gap-4 border">
					{!imageLoaded && (
						<div
							onDrop={onDrop}
							onDragOver={onDragOver}
							className="rounded-2xl border border-dashed border-zinc-300 bg-white h-full flex flex-col items-center justify-center gap-4 text-center hover:border-blue-300"
						>
							<p className="text-sm text-zinc-600">Glisse-dépose une image ici, ou colle directement (⌘/Ctrl + V)</p>
							<div className="flex flex-wrap items-center justify-center">
								<label className={cn(buttonVariants({ variant: "outline" }))}>
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) loadFromBlob(file);
										}}
									/>
									Importer un fichier
								</label>
							</div>
						</div>
					)}

					{imageLoaded && (
						<>
							<div className="w-full overflow-auto">
								<canvas ref={canvasRef} style={canvasStyle} />
							</div>

							<div className="flex items-center justify-end gap-3">

								<div className="flex gap-3">
									<Button onClick={() => download("image/png")}>
										Export PNG
									</Button>
									<Button onClick={() => download("image/jpeg")}>
										Export JPG
									</Button>
								</div>
							</div>
						</>
					)}
				</div>
				<aside className="bg-white rounded-2xl p-4 sm:p-6 border flex flex-col gap-4 max-h-[calc(100vh-200px)] sticky top-4">
					<div className="flex flex-col gap-2">
						<span className="text-xs tabular-nums">Taille pixel : {pixelSize}</span>
						<Slider
							min={1}
							max={100}
							defaultValue={[pixelSize]}
							onValueChange={([value]) => setPixelSize(value)}
						/>
					</div>

					<div className="flex items-center justify-between gap-2">
						<label className="text-xs tabular-nums">Background</label>
						<input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
					</div>

					<hr className="py-2" />

					<div className="flex items-center gap-2">
						<Checkbox id="displayGrid" checked={gridOn} onCheckedChange={() => setGridOn(!gridOn)} />
						<label htmlFor="displayGrid" className="text-xs tabular-nums">Afficher la grille</label>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<Checkbox id="bindGridToPixel" checked={bindGridToPixel} onCheckedChange={() => setBindGridToPixel(!bindGridToPixel)} />
							<label htmlFor="bindGridToPixel" className="text-xs tabular-nums">Grille liée à la taille pixel</label>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-xs tabular-nums">Pas</span>
							<input
								type="number"
								min={1}
								value={gridStep}
								onChange={(e) => setGridStep(Math.max(1, parseInt(e.target.value || "1")))}
								disabled={bindGridToPixel}
								className="w-20 px-2 py-1 text-xs rounded border bg-white disabled:opacity-50"
							/>
							<span className="text-xs">px</span>
						</div>
					</div>

					<div className="flex items-center justify-between gap-2">
						<span className="text-xs tabular-nums">Grid color </span>
						<input type="color" value={gridColor} onChange={(e) => setGridColor(e.target.value)} />
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-xs tabular-nums">Opacity</span>
							<span className="text-xs tabular-nums">{Math.round(gridOpacity * 100)}%</span>
						</div>
						<Slider
							min={0}
							max={1}
							step={0.01}
							defaultValue={[gridOpacity]}
							onValueChange={([value]) => setGridOpacity(value)}
						/>
					</div>

					<div className="mt-auto">
						<Button onClick={() => setImageLoaded(false)} variant={"destructive"} className="w-full">
							Remove picture
						</Button>
					</div>
				</aside>
			</div>
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<div className=" bg-white rounded-2xl border p-4 sm:p-6 flex flex-col gap-3">
					<h2 className="text-lg font-semibold">Astuces</h2>
					<ul className="text-sm list-disc pl-5 space-y-2 text-zinc-700">
						<li>Colle une image directement avec ⌘/Ctrl + V.</li>
						<li>Tu peux aussi glisser-déposer un fichier image dans la zone en haut.</li>
						<li>Le curseur « Taille pixel » contrôle le côté des blocs (en pixels).</li>
						<li>Active la grille pour compter facilement : lie-la à la taille des pixels ou choisis un pas personnalisé.</li>
					</ul>
				</div>
			</div>
		</>
	);
}
