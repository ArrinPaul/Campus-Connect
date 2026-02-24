'use client';

import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { X, Upload, FileText, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';

interface UploadPaperModalProps {
  onClose: () => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function UploadPaperModal({ onClose }: UploadPaperModalProps) {
  const uploadPaper = useMutation(api.papers.uploadPaper);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const resolveStorageUrls = useMutation(api.media.resolveStorageUrls);

  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [authors, setAuthors] = useState<string[]>([]);
  const [doi, setDoi] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [lookingForCollaborators, setLookingForCollaborators] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addAuthor = () => {
    const author = authorInput.trim();
    if (author && !authors.includes(author) && authors.length < 20) {
      setAuthors([...authors, author]);
      setAuthorInput('');
    }
  };

  const removeAuthor = (author: string) => {
    setAuthors(authors.filter((a) => a !== author));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 20) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed for research papers');
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
    if (!title.trim() || !abstract.trim() || authors.length === 0) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let pdfUrl: string | undefined;

      // Upload PDF if one was selected
      if (file) {
        setUploadProgress(10);

        const uploadUrl = await generateUploadUrl({
          fileType: file.type,
          fileSize: file.size,
          uploadType: 'file' as const,
        });

        setUploadProgress(30);

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) throw new Error('Failed to upload PDF');

        const { storageId } = await uploadRes.json();
        setUploadProgress(70);

        const resolvedUrls = await resolveStorageUrls({
          storageIds: [storageId as Id<'_storage'>],
        });

        pdfUrl = resolvedUrls.filter((u): u is string => u !== null)[0];
        setUploadProgress(90);
      }

      await uploadPaper({
        title: title.trim(),
        abstract: abstract.trim(),
        authors,
        doi: doi.trim() || undefined,
        pdfUrl,
        tags,
        lookingForCollaborators,
      });

      setUploadProgress(100);
      toast.success('Research paper uploaded successfully!');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload paper');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const isValid = title.trim() && abstract.trim() && authors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Upload Research Paper</h2>
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
              placeholder="Paper title"
              maxLength={300}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Abstract */}
          <div>
            <label className="text-sm font-medium">Abstract *</label>
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Paper abstract..."
              rows={5}
              maxLength={5000}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Authors */}
          <div>
            <label className="text-sm font-medium">Authors * (at least one)</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                placeholder="Author name"
                className="flex-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={addAuthor}
                disabled={!authorInput.trim()}
                className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {authors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {authors.map((author) => (
                  <span
                    key={author}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    {author}
                    <button onClick={() => removeAuthor(author)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* DOI */}
          <div>
            <label className="text-sm font-medium">DOI (optional)</label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="e.g. 10.1234/example.2024"
              maxLength={100}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium">Tags (up to 20)</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 20}
                className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded-full"
                  >
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Looking for Collaborators */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="collaborators"
              checked={lookingForCollaborators}
              onChange={(e) => setLookingForCollaborators(e.target.checked)}
              className="h-4 w-4 rounded border-muted-foreground"
            />
            <label htmlFor="collaborators" className="text-sm">
              Looking for collaborators
            </label>
          </div>

          {/* PDF Upload */}
          <div>
            <label className="text-sm font-medium">PDF File (optional)</label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Upload the full paper as a PDF — max 25MB
            </p>

            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>Click to select a PDF</span>
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
              accept=".pdf"
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
                Upload Paper
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
