'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface PostJobModalProps {
  onClose: () => void;
}

export function PostJobModal({ onClose }: PostJobModalProps) {
  const router = useRouter();
  const postJob = useMutation(api.jobs.postJob);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'job' | 'internship'>('job');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(false);
  const [duration, setDuration] = useState('');
  const [salary, setSalary] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill) && skills.length < 20) {
      setSkills([...skills, skill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !company.trim() || !description.trim() || !location.trim()) return;
    setIsSubmitting(true);
    try {
      await postJob({
        title: title.trim(),
        company: company.trim(),
        description: description.trim(),
        type,
        location: location.trim(),
        remote,
        duration: duration.trim() || undefined,
        salary: salary.trim() || undefined,
        skillsRequired: skills,
      });
      toast.success('Job posted successfully!');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Post a Job</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Research Assistant"
              maxLength={200}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Company / Lab *</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. AI Research Lab"
              maxLength={200}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'job' | 'internship')}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="job">Full-time Job</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remote"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="remote" className="text-sm font-medium">Remote friendly</label>
          </div>

          <div>
            <label className="text-sm font-medium">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={5}
              maxLength={5000}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Salary (optional)</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. $50k-$70k"
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duration (optional)</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 months"
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Required Skills (up to 20)</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
                className="flex-1 px-3 py-2 text-sm bg-muted/50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button type="button" onClick={addSkill} className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg">
                Add
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !company.trim() || !description.trim() || !location.trim()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
