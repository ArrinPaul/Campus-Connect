'use client';

// A temporary v2 button.
const TempButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
    const baseClasses = "w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-12 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90";
    return <button onClick={onClick} className={baseClasses}>{children}</button>
}

type Props = {
    nextStep: () => void;
};

export function WelcomeStep({ nextStep }: Props) {
    return (
        <div className="text-center flex flex-col items-center h-full justify-center">
            <div className="rounded-full bg-primary/10 p-4 mb-6">
                <div className="rounded-full bg-primary/20 p-4">
                    <span className="text-5xl">👋</span>
                </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Campus Connect!</h1>
            <p className="text-muted-foreground max-w-sm mb-8">
                Let&apos;s get your profile set up so you can start connecting with peers and discovering opportunities.
            </p>
            <TempButton onClick={nextStep}>
                Get Started
            </TempButton>
        </div>
    );
}
