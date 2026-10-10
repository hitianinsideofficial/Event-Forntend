'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { uploadToImageKitApi } from '../services/api.service';
import { X, Crop, ZoomIn, Check, RotateCw, Loader2 } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  initialAspect?: number; // e.g. 16/9 or 4/3
  targetType: 'banner' | 'cover';
  onClose: () => void;
  onUploadSuccess: (url: string, targetType: 'banner' | 'cover') => void;
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  initialAspect = 16 / 9,
  targetType,
  onClose,
  onUploadSuccess
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [aspect, setAspect] = useState<number>(initialAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  if (!isOpen || !imageSrc) return null;

  // Helper function to create canvas cropped image & compress it
  const getCroppedCanvasBlob = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise(resolve => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not supported');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    ctx.restore();

    return new Promise((resolve, reject) => {
      // Compress cropped canvas output to WebP at 85% quality
      canvas.toBlob(
        blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas compression failed'));
        },
        'image/webp',
        0.85
      );
    });
  };

  const handleSaveAndUpload = async () => {
    if (!croppedAreaPixels) return;

    setUploading(true);
    setError('');

    try {
      // 1. Crop and Compress on Client-Side HTML5 Canvas
      const compressedBlob = await getCroppedCanvasBlob(imageSrc, croppedAreaPixels, rotation);
      const filename = `${targetType}_${Date.now()}.webp`;
      const compressedFile = new File([compressedBlob], filename, { type: 'image/webp' });

      // 2. Upload Compressed Image to ImageKit CDN
      const uploadRes = await uploadToImageKitApi(compressedFile);
      if (uploadRes && uploadRes.url) {
        onUploadSuccess(uploadRes.url, targetType);
        onClose();
      }
    } catch (err: any) {
      console.error('Crop & Compression upload error:', err);
      setError(err.message || 'Failed to crop and compress image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl w-full p-6 bg-[#20070d] border border-[#f7f1e5]/20 rounded-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Crop className="w-5 h-5 text-[#e6c594]" />
            <span>Crop & Compress {targetType === 'banner' ? 'Header Banner (16:9)' : 'Card Cover (4:3)'}</span>
          </h2>
          <button onClick={onClose} className="p-1 text-[#a69181] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Cropper Container */}
        <div className="relative w-full h-80 my-4 bg-black/60 rounded-xl overflow-hidden border border-white/10">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>

        {/* Aspect Ratio Selector & Controls */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a69181] font-semibold">Aspect Ratio:</span>
              <button
                type="button"
                onClick={() => setAspect(16 / 9)}
                className={`px-3 py-1 text-xs rounded-lg font-mono font-bold border transition-all ${
                  Math.abs(aspect - 16 / 9) < 0.05
                    ? 'bg-[#800020] text-[#e6c594] border-[#e6c594]/40'
                    : 'bg-white/5 text-[#a69181] border-white/10'
                }`}
              >
                16:9 Banner
              </button>
              <button
                type="button"
                onClick={() => setAspect(4 / 3)}
                className={`px-3 py-1 text-xs rounded-lg font-mono font-bold border transition-all ${
                  Math.abs(aspect - 4 / 3) < 0.05
                    ? 'bg-[#800020] text-[#e6c594] border-[#e6c594]/40'
                    : 'bg-white/5 text-[#a69181] border-white/10'
                }`}
              >
                4:3 Cover
              </button>
            </div>

            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#e6d7c3] border border-white/10 inline-flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-[#a69181]" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={e => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#e6c594]"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndUpload}
            disabled={uploading}
            className="btn-primary text-xs min-w-[160px] justify-center inline-flex items-center gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compressing & Uploading...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Crop, Compress & Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
