"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const SettingsSection = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) => (
  <div className="mb-12 animate-in">
    <div className="mb-6">
      <h3 className="text-display-md text-foreground font-bold tracking-tight">{title}</h3>
      <p className="text-body text-foreground-muted-48 mt-1">{description}</p>
    </div>
    <div className="space-y-6 bg-card border border-border rounded-lg p-lg shadow-sm">
      {children}
    </div>
  </div>
)

export const Input = ({
  label,
  value,
  onChange,
  name,
  placeholder,
  subtext,
  type = "text",
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  name: string
  placeholder?: string
  subtext?: string
  type?: string
}) => (
  <div className="space-y-2">
    <label
      htmlFor={name}
      className="block text-caption-strong text-foreground uppercase tracking-wider"
    >
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-11 px-4 rounded-sm border border-border bg-card text-body focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
    />
    {subtext && <p className="text-[11px] text-foreground-muted-48 font-medium italic">{subtext}</p>}
  </div>
)

export const Textarea = ({
  label,
  value,
  onChange,
  name,
  placeholder,
  maxLength,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  name: string
  placeholder?: string
  maxLength?: number
}) => (
  <div className="space-y-2">
    <label
      htmlFor={name}
      className="block text-caption-strong text-foreground uppercase tracking-wider"
    >
      {label}
    </label>
    <div className="relative">
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-3 rounded-sm border border-border bg-card text-body focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm resize-none"
        rows={4}
      />
      {maxLength && (
        <p className="absolute bottom-2 right-3 text-[10px] text-foreground-muted-48 font-bold uppercase tracking-widest">
          {value?.length || 0} / {maxLength}
        </p>
      )}
    </div>
  </div>
)

export const FormButton = ({
  isSubmitting,
  text = "Save Changes",
}: {
  isSubmitting: boolean
  text?: string
}) => (
  <Button
    type="submit"
    disabled={isSubmitting}
    variant="primary"
    size="lg"
    className="min-w-[140px]"
  >
    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {text}
  </Button>
)
