'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
    step: number;
    totalSteps: number;
    children: React.ReactNode;
};

export function MultiStepLayout({ step, totalSteps, children }: Props) {
    const progressPercentage = (step / totalSteps) * 100;

    return (
        <div className="flex flex-col min-h-screen bg-card items-center justify-center p-4">
             <div className="absolute top-6 left-6">
                <Link href="/feed">
                    <div className="h-8 w-8 rounded-lg bg-primary" />
                </Link>
             </div>
            <div className="w-full max-w-[600px] bg-card border border-border rounded-lg shadow-sm p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="h-1 w-full bg-muted rounded-full">
                        <div 
                            className="h-1 bg-primary rounded-full transition-all duration-500 ease-in-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {children}
                </div>
            </div>
        </div>
    );
}

