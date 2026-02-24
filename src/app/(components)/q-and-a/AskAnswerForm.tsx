'use client';

import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Send, Loader2, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

type Props = {
    questionId: Id<'questions'>;
};

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function AskAnswerForm({ questionId }: Props) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachedImages, setAttachedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const answerQuestion = useMutation(api.questions.answerQuestion);
    const generateUploadUrl = useMutation(api.media.generateUploadUrl);
    const resolveStorageUrls = useMutation(api.media.resolveStorageUrls);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remaining = MAX_IMAGES - attachedImages.length;
        if (remaining <= 0) {
            toast.error(`Maximum ${MAX_IMAGES} images allowed`);
            return;
        }

        const validFiles: File[] = [];
        const previews: string[] = [];

        for (const file of files.slice(0, remaining)) {
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                toast.error(`${file.name}: Invalid type. Use JPEG, PNG, GIF, or WebP.`);
                continue;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                toast.error(`${file.name}: Too large. Max 10MB.`);
                continue;
            }
            validFiles.push(file);
            previews.push(URL.createObjectURL(file));
        }

        setAttachedImages((prev) => [...prev, ...validFiles]);
        setImagePreviews((prev) => [...prev, ...previews]);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setAttachedImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedContent = content.trim();
        if (trimmedContent === '') {
            toast.error("Answer cannot be empty.");
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            let mediaUrls: string[] | undefined;

            // Upload images if any
            if (attachedImages.length > 0) {
                const storageIds: string[] = [];

                for (let i = 0; i < attachedImages.length; i++) {
                    const file = attachedImages[i];

                    const uploadUrl = await generateUploadUrl({
                        fileType: file.type,
                        fileSize: file.size,
                        uploadType: 'image' as const,
                    });

                    const uploadRes = await fetch(uploadUrl, {
                        method: 'POST',
                        body: file,
                        headers: { 'Content-Type': file.type },
                    });

                    if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name}`);

                    const { storageId } = await uploadRes.json();
                    storageIds.push(storageId);
                    setUploadProgress(Math.round(((i + 1) / attachedImages.length) * 80));
                }

                const resolvedUrls = await resolveStorageUrls({
                    storageIds: storageIds as Id<'_storage'>[],
                });

                mediaUrls = resolvedUrls.filter((u): u is string => u !== null);
                setUploadProgress(90);
            }

            await answerQuestion({
                questionId,
                content: trimmedContent,
                mediaUrls: mediaUrls && mediaUrls.length > 0 ? mediaUrls : undefined,
            });

            // Cleanup
            imagePreviews.forEach((url) => URL.revokeObjectURL(url));
            setContent('');
            setAttachedImages([]);
            setImagePreviews([]);
            setUploadProgress(100);
            toast.success("Answer posted successfully!");
        } catch (error) {
            toast.error("Failed to post answer.", { description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-card mt-8">
            <h3 className="font-bold text-lg mb-4">Your Answer</h3>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={5}
                disabled={isSubmitting}
            />

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                            <Image
                                src={preview}
                                alt={`Attachment ${index + 1}`}
                                width={80}
                                height={80}
                                className="h-20 w-20 object-cover rounded-lg border"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                disabled={isSubmitting}
                                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && (
                <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading images...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting || attachedImages.length >= MAX_IMAGES}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Attach images (${attachedImages.length}/${MAX_IMAGES})`}
                    >
                        <ImagePlus className="h-5 w-5" />
                    </button>
                    {attachedImages.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {attachedImages.length}/{MAX_IMAGES} images
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting || content.trim() === ''}
                    className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold flex items-center disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Answer
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageSelect}
                className="hidden"
            />
        </form>
    );
}
