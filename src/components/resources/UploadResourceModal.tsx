'use client';

import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';

interface UploadResourceModalProps {
  onClose: () => void;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'text/plain',
];

const ALLOWED_EXTENSIONS = '.pdf,.docx,.pptx,.doc,.txt';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function UploadResourceModal({ onClose }: UploadResourceModalProps) {
  const uploadResource = useMutation(api.resources.uploadResource);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const resolveStorageUrls = useMutation(api.media.resolveStorageUrls);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error('Invalid file type. Allowed: PDF, DOCX, PPTX, DOC, TXT');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !course.trim()) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let fileUrl: string | undefined;

      // Upload file if one was selected
      if (file) {
        setUploadProgress(10);

        // 1. Get presigned upload URL
        const uploadUrl = await generateUploadUrl({
          fileType: file.type,
          fileSize: file.size,
          uploadType: 'file' as const,
        });

        setUploadProgress(30);

        // 2. Upload file to storage
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) throw new Error('Failed to upload file');

        const { storageId } = await uploadRes.json();
        setUploadProgress(70);

        // 3. Resolve storage ID to public URL
        const resolvedUrls = await resolveStorageUrls({
          storageIds: [storageId as Id<'_storage'>],
        });

        fileUrl = resolvedUrls.filter((u): u is string => u !== null)[0];
        setUploadProgress(90);
      }

      // 4. Create the resource record
      await uploadResource({
        title: title.trim(),
        description: description.trim(),
        course: course.trim(),
        subject: subject.trim() || undefined,
        fileUrl,
      });

      setUploadProgress(100);
      toast.success('Resource uploaded successfully!');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload resource');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const isValid = title.trim() && description.trim() && course.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Upload Resource</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted" disabled={isSubmitting}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Linear Algebra Cheat Sheet"
              maxLength={200}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this resource covers..."
              rows={4}
              maxLength={3000}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Course */}
          <div>
            <label className="text-sm font-medium">Course *</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. MATH201, Data Structures"
              maxLength={100}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium">Subject (optional)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics, Computer Science"
              maxLength={100}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="text-sm font-medium">Attach File (optional)</label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              PDF, DOCX, PPTX, DOC, or TXT — max 25MB
            </p>

            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>Click to select a file</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg border">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isSubmitting}
                  className="p-1 rounded hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
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
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded-lg hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Resource
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
