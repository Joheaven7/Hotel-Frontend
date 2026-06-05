import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Reusable image uploader component.
 *
 * Props:
 *   typeId      — the RoomType or HallType _id to attach images to
 *   endpoint    — 'room-type' | 'hall-type'
 *   images      — current images array (URLs)
 *   onUpdate    — callback(newImagesArray) after upload or delete
 *   maxImages   — max number of images allowed (default 5)
 *   disabled    — disable all interactions
 */
const ImageUploader = ({
    typeId,
    endpoint,
    images = [],
    onUpdate,
    maxImages = 5,
    disabled = false,
}) => {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [removing, setRemoving] = useState(null); // URL being removed
    const inputRef = useRef(null);

    const canUpload = images.length < maxImages && !disabled;

    // ── Upload handler ─────────────────────────────────────────────────────────
    const handleFiles = async (files) => {
        if (!typeId) {
            toast.error('Save the type first before uploading images');
            return;
        }
        if (!files || files.length === 0) return;

        const remaining = maxImages - images.length;
        const toUpload = Array.from(files).slice(0, remaining);

        // Validate each file
        for (const file of toUpload) {
            if (!file.type.startsWith('image/')) {
                toast.error(`"${file.name}" is not an image`);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`"${file.name}" exceeds 5MB`);
                return;
            }
        }

        setUploading(true);
        const toastId = toast.loading(`Uploading ${toUpload.length} image(s)...`);
        try {
            const formData = new FormData();
            toUpload.forEach((file) => formData.append('images', file));

            const res = await apiClient.post(
                `/upload/${endpoint}/${typeId}/images`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            toast.success(`${toUpload.length} image(s) uploaded`, { id: toastId });
            onUpdate?.(res.data.allImages || [...images, ...res.data.images]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    // ── Delete handler ─────────────────────────────────────────────────────────
    const handleRemove = async (imageUrl) => {
        if (disabled) return;
        setRemoving(imageUrl);
        try {
            const res = await apiClient.delete(`/upload/${endpoint}/${typeId}/images`, {
                data: { imageUrl },
            });
            toast.success('Image removed');
            onUpdate?.(res.data.allImages || images.filter((u) => u !== imageUrl));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove image');
        } finally {
            setRemoving(null);
        }
    };

    // ── Drag and drop ──────────────────────────────────────────────────────────
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (!canUpload) return;
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div className="space-y-3">
            {/* Label */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-primary">
                    Gallery Images
                </label>
                <span className="text-xs text-text-secondary">
                    {images.length} / {maxImages} uploaded
                </span>
            </div>

            {/* Existing images grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {images.map((url, idx) => (
                        <div key={url} className="relative group aspect-video rounded-xl overflow-hidden border border-border bg-background">
                            <img
                                src={url}
                                alt={`Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = ''; e.target.className = 'hidden'; }}
                            />
                            {/* Remove button */}
                            {!disabled && (
                                <button
                                    onClick={() => handleRemove(url)}
                                    disabled={removing === url}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-error text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60 hover:bg-error/90"
                                    title="Remove image"
                                >
                                    {removing === url
                                        ? <Loader2 size={12} className="animate-spin" />
                                        : <X size={12} />
                                    }
                                </button>
                            )}
                            {/* Primary badge on first image */}
                            {idx === 0 && (
                                <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 bg-primary text-white rounded font-medium">
                                    Main
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Drop zone */}
            {canUpload && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && inputRef.current?.click()}
                    className={`
            relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${dragOver
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-border hover:border-primary/40 hover:bg-background'
                        }
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
                >
                    {uploading ? (
                        <>
                            <Loader2 size={24} className="text-primary animate-spin" />
                            <p className="text-sm text-text-secondary font-medium">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <div className="p-3 rounded-full bg-primary/10">
                                <Upload size={20} className="text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-text-primary">
                                    Drop images here or <span className="text-primary underline">browse</span>
                                </p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    JPG, PNG, WebP · Max 5MB each · Up to {maxImages - images.length} more
                                </p>
                            </div>
                        </>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="sr-only"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                </div>
            )}

            {/* Max reached notice */}
            {!canUpload && !disabled && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border text-text-secondary text-sm">
                    <ImageIcon size={15} />
                    Maximum {maxImages} images reached — remove one to upload another
                </div>
            )}

            {/* No Cloudinary warning */}
            {!typeId && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/5 border border-warning/20 text-warning text-xs font-medium">
                    <AlertCircle size={14} />
                    Save the type first — image upload requires a saved record ID
                </div>
            )}
        </div>
    );
};

export default ImageUploader;