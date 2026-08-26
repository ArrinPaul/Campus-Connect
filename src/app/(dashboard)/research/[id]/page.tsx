'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@/lib/api';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  GitPullRequest,
  Calendar,
  ThumbsUp,
  MessageSquarePlus,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { toast } from 'sonner';

type PageProps = {
  params: {
    id: Id<'papers'>;
  };
};

export default function ResearchDetailPage({ params }: PageProps) {
  const paper = useQuery(api.papers.getPaperById, { id: params.id, paperId: params.id });
  const votePaper = useMutation(api.papers.votePaper);
  const addReview = useMutation(api.papers.addReview);

  // Voting state
  const [voteCount, setVoteCount] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Peer review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState<'accept' | 'minor_revision' | 'major_revision' | 'reject'>('accept');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  if (paper === undefined) {
    return <div className="text-center py-16 text-slate">Loading paper details...</div>;
  }

  if (paper === null) {
    notFound();
  }

  const currentVotes = voteCount !== null ? voteCount : (paper.vote_count ?? paper.voteCount ?? 0);
  const currentReviews = paper.review_count ?? paper.reviewCount ?? 0;

  const handleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const res = (await votePaper({
        paperId: params.id,
        voteType: hasVoted ? 'down' : 'up',
      })) as any;

      if (res?.voteCount !== undefined) {
        setVoteCount(res.voteCount);
        setHasVoted(res.userVote === 'up');
      } else {
        setVoteCount((prev) => (prev !== null ? prev + 1 : currentVotes + 1));
        setHasVoted(true);
      }
      toast.success('Vote recorded');
    } catch {
      toast.error('Failed to register vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!comments.trim()) {
      setReviewError('Please provide feedback comments for your peer review');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await addReview({
        paperId: params.id,
        rating,
        comments: comments.trim(),
        recommendation,
      });
      setReviewSuccess(true);
      setShowReviewForm(false);
      setComments('');
      toast.success('Peer review submitted successfully');
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to submit peer review. Authors cannot review their own paper.');
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link href="/research" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-ink-deep mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to research papers
      </Link>

      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">{paper.title}</h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground my-4 border-y py-4">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors || 'Authors'}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Uploaded {format(new Date(paper.created_at || paper.createdAt || Date.now()), 'MMM d, yyyy')}
            </div>
            {paper.doi && (
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
                <ExternalLink className="h-4 w-4" /> DOI: {paper.doi}
              </a>
            )}
            {(paper.file_url || paper.pdfUrl) && (
              <a href={paper.file_url || paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary font-semibold hover:underline">
                <ExternalLink className="h-4 w-4" /> View PDF
              </a>
            )}
          </div>
        </div>

        {/* Voting & Review Action Bar */}
        <div className="flex items-center gap-3 bg-canvas p-3 rounded-lg border border-hairline">
          <button
            type="button"
            onClick={handleVote}
            disabled={isVoting}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              hasVoted ? 'bg-primary text-on-primary' : 'bg-surface-soft text-slate hover:text-primary hover:bg-surface'
            }`}
            title="Upvote preprint"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{currentVotes} {currentVotes === 1 ? 'Vote' : 'Votes'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReviewForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-surface-soft text-slate hover:text-primary hover:bg-surface transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>Peer Review ({currentReviews})</span>
          </button>
        </div>

        {/* Peer Review Form Modal/Drawer */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="bg-canvas border border-hairline rounded-xl p-4 space-y-4 animate-in">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-sm text-ink-deep flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Submit Peer Review
              </h3>
              <button type="button" onClick={() => setShowReviewForm(false)} className="text-xs text-slate hover:text-ink-deep">
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate mb-1">Overall Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                  >
                    <Star className={`h-5 w-5 ${star <= rating ? 'fill-amber-500' : 'text-slate-300'}`} />
                  </button>
                ))}
                <span className="text-xs text-slate ml-2">{rating} / 5</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate mb-1">Recommendation</label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as any)}
                className="w-full text-xs rounded-md border border-hairline bg-surface-soft p-2 focus:ring-1 focus:ring-primary"
              >
                <option value="accept">Accept (High Quality)</option>
                <option value="minor_revision">Minor Revision Needed</option>
                <option value="major_revision">Major Revision Needed</option>
                <option value="reject">Reject</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate mb-1">Peer Review Feedback</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Detail the methodology strengths, clarity, data reproducibility, and suggested improvements..."
                rows={4}
                className="w-full text-xs rounded-md border border-hairline bg-surface-soft p-2 focus:ring-1 focus:ring-primary"
              />
            </div>

            {reviewError && (
              <div className="flex items-center gap-1.5 text-xs text-critical">
                <AlertCircle className="h-4 w-4" />
                <span>{reviewError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="w-full py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {isSubmittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmittingReview ? 'Submitting Review...' : 'Submit Peer Review'}</span>
            </button>
          </form>
        )}

        {reviewSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Your peer review has been submitted and registered.</span>
          </div>
        )}

        <div>
          <h3 className="font-bold text-lg mb-2">Abstract</h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{paper.abstract}</p>
        </div>

        {paper.tags && paper.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-lg mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {paper.tags.map((tag: any) => (
                <Link href={`/hashtag/${tag}`} key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-muted hover:bg-muted/80">
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {paper.lookingForCollaborators && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
            <GitPullRequest className="h-4 w-4" /> Looking for Collaborators
          </div>
        )}

        {paper.uploader && (
          <div className="border-t pt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
              {paper.uploader.profile_picture || paper.uploader.profilePicture ? (
                <Image
                  src={paper.uploader.profile_picture || paper.uploader.profilePicture}
                  alt={paper.uploader.name ?? ''}
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="font-bold text-xs">{paper.uploader.name?.[0] || 'U'}</span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Uploaded by</p>
              <Link href={`/profile/${paper.uploader.id || paper.uploader._id}`} className="font-bold text-xs hover:underline">
                {paper.uploader.name}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
