'use client';

import { Loader2 } from 'lucide-react';

export const SettingsSection = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <div className="border-b pb-6 mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

export const Input = ({ label, value, onChange, name, placeholder, subtext, type = 'text' }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, name: string, placeholder?: string, subtext?: string, type?: string }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-foreground">{label}</label>
        <input 
            type={type} 
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
);

export const Textarea = ({ label, value, onChange, name, placeholder, maxLength }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, name: string, placeholder?: string, maxLength?: number }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-foreground">{label}</label>
        <textarea 
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={4}
        />
        {maxLength && <p className="text-xs text-right text-muted-foreground mt-1">{value?.length || 0}/{maxLength}</p>}
    </div>
);

export const FormButton = ({ isSubmitting, text = "Save Changes" }: { isSubmitting: boolean, text?: string }) => (
     <button type="submit" disabled={isSubmitting} className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center disabled:opacity-50">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {text}
    </button>
);
