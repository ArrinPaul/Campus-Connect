'use client';

import { useState } from 'react';
import { OnboardingData } from '../../(onboarding)/page';
import { X, Check } from 'lucide-react';

const TempButton = ({ children, onClick, disabled=false, variant='primary' }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, variant?: 'primary' | 'outline' }) => {
    const baseClasses = "w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-12 py-2 px-4 btn-press";
    const variantClasses = variant === 'primary' 
        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
        : 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground';
    return <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses}`}>{children}</button>
}

const PREDEFINED_SKILLS = [
    'Python', 'JavaScript', 'React', 'Data Analysis', 'Machine Learning', 
    'Project Management', 'UI/UX Design', 'Public Speaking', 'Research', 'Writing'
];


type Props = {
    data: OnboardingData;
    updateFormData: (data: Partial<OnboardingData>) => void;
    prevStep: () => void;
    submit: () => void;
};

export function SkillsStep({ data, updateFormData, prevStep, submit }: Props) {
    const [customSkill, setCustomSkill] = useState('');

    const toggleSkill = (skill: string) => {
        const newSkills = data.skills.includes(skill)
            ? data.skills.filter(s => s !== skill)
            : [...data.skills, skill];
        updateFormData({ skills: newSkills });
    };

    const handleAddCustomSkill = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedSkill = customSkill.trim();
        if (trimmedSkill && !data.skills.includes(trimmedSkill)) {
            toggleSkill(trimmedSkill);
            setCustomSkill('');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2">What are your skills?</h1>
            <p className="text-muted-foreground mb-6">Select a few skills to help others understand your expertise. You can add more later.</p>

            <div className="flex flex-wrap gap-2">
                {PREDEFINED_SKILLS.map(skill => (
                    <button 
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            data.skills.includes(skill) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                        {skill}
                    </button>
                ))}
            </div>

            <form onSubmit={handleAddCustomSkill} className="mt-6">
                <label htmlFor="custom-skill" className="block text-sm font-medium text-foreground mb-1">Add your own</label>
                <div className="flex gap-2">
                    <input 
                        id="custom-skill"
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        placeholder="e.g. Quantum Computing"
                        className="flex-1 w-full px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary/20 text-primary hover:bg-primary/30">Add</button>
                </div>
            </form>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
                <TempButton variant="outline" onClick={prevStep}>Back</TempButton>
                <TempButton onClick={submit}><Check className="mr-2 h-4 w-4"/>Finish Setup</TempButton>
            </div>
        </div>
    );
}
