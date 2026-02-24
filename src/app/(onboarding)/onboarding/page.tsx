'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { MultiStepLayout } from '../../(components)/onboarding/MultiStepLayout';
import { WelcomeStep } from '../../(components)/onboarding/WelcomeStep';
import { ProfileStep } from '../../(components)/onboarding/ProfileStep';
import { SkillsStep } from '../../(components)/onboarding/SkillsStep';
import { toast } from 'sonner';

const TOTAL_STEPS = 3;

export type OnboardingData = {
    name: string;
    username: string;
    bio: string;
    university: string;
    role: 'Student' | 'Research Scholar' | 'Faculty';
    skills: string[];
};

export default function OnboardingPage() {
    const router = useRouter();
    const currentUser = useQuery(api.users.getCurrentUser);
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingData>({
        name: '',
        username: '',
        bio: '',
        university: '',
        role: 'Student',
        skills: [],
    });

    // Update form data when currentUser loads (useState initializer only runs once)
    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || currentUser.name || '',
                username: prev.username || currentUser.username || '',
            }));
        }
    }, [currentUser]);

    const nextStep = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
    
    const updateFormData = (newData: Partial<OnboardingData>) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const handleSubmit = async () => {
        try {
            await completeOnboarding(formData);
            toast.success("Welcome! Your profile is all set up.");
            router.push('/feed');
        } catch (error) {
            toast.error("Failed to complete onboarding.", {
                description: (error as Error).message
            });
        }
    }

    return (
        <MultiStepLayout step={step} totalSteps={TOTAL_STEPS}>
            <div className="animate-in fade-in duration-500">
                {step === 1 && <WelcomeStep nextStep={nextStep} />}
                {step === 2 && (
                    <ProfileStep 
                        data={formData} 
                        updateFormData={updateFormData} 
                        nextStep={nextStep}
                        prevStep={prevStep}
                    />
                )}
                {step === 3 && (
                     <SkillsStep 
                        data={formData} 
                        updateFormData={updateFormData}
                        prevStep={prevStep}
                        submit={handleSubmit}
                    />
                )}
            </div>
        </MultiStepLayout>
    );
}
