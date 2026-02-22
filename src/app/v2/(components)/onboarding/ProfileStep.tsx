'use client';

import { OnboardingData } from '../../(onboarding)/page';

// A temporary v2 button.
const TempButton = ({ children, onClick, disabled=false, variant='primary' }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, variant?: 'primary' | 'outline' }) => {
    const baseClasses = "w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-12 py-2 px-4 btn-press";
    const variantClasses = variant === 'primary' 
        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
        : 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground';
    return <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses}`}>{children}</button>
}

const Input = ({ label, value, onChange, name, placeholder }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, name: string, placeholder: string }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-foreground mb-1">{label}</label>
        <input 
            type="text" 
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
    </div>
);


export function ProfileStep({ data, updateFormData, nextStep, prevStep }: Props) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        updateFormData({ [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2">Tell us about yourself</h1>
            <p className="text-muted-foreground mb-6">This information will be displayed on your public profile.</p>

            <div className="space-y-4">
                 <Input label="Full Name" name="name" value={data.name} onChange={handleChange} placeholder="e.g. Jane Doe" />
                 <Input label="Username" name="username" value={data.username} onChange={handleChange} placeholder="e.g. jane_doe" />
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1">Bio</label>
                    <textarea 
                        id="bio"
                        name="bio"
                        value={data.bio}
                        onChange={handleChange}
                        placeholder="A short bio about your academic interests, goals, or hobbies."
                        className="w-full px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        rows={3}
                    />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">Your Role</label>
                    <select
                        id="role"
                        name="role"
                        value={data.role}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option>Student</option>
                        <option>Research Scholar</option>
                        <option>Faculty</option>
                    </select>
                </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
                <TempButton variant="outline" onClick={prevStep}>Back</TempButton>
                <TempButton onClick={nextStep} disabled={!data.name || !data.username}>Next</TempButton>
            </div>
        </div>
    );
}
