import * as React from"react";
import { Slot } from"@radix-ui/react-slot";
import { cva, type VariantProps } from"class-variance-authority";
import { Loader2 } from"lucide-react";

import { cn } from"@/lib/utils";

const buttonVariants = cva(
"inline-flex items-center justify-center whitespace-nowrap text-body active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
 {
 variants: {
 variant: {
 primary:
"bg-primary text-on-primary rounded-full",
 secondary:
"bg-transparent text-primary border border-primary rounded-full",
 utility:
"bg-ink-deep text-white text-xs rounded-sm",
 pearl:
"bg-card text-foreground border-[3px] border-border rounded-md",
 ghost:"hover:bg-card text-foreground",
 link:"text-primary hover:underline underline-offset-4",
 },
 size: {
 default:"py-[11px] px-[22px]",
 sm:"py-[8px] px-[15px]",
 lg:"py-[14px] px-[28px]",
 icon:"h-[44px] w-[44px] rounded-full",
 },
 },
 defaultVariants: {
 variant:"primary",
 size:"default",
 },
 }
);

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
 VariantProps<typeof buttonVariants> {
 asChild?: boolean;
 loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 (
 {
 className,
 variant,
 size,
 asChild = false,
 loading,
 children,
 disabled,
 ...props
 },
 ref
 ) => {
 const Comp = asChild ? Slot :"button";
 return (
 <Comp
 className={cn(buttonVariants({ variant, size, className }))}
 ref={ref}
 disabled={disabled || loading}
 {...props}
 >
 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
 {children}
 </Comp>
 );
 }
);
Button.displayName ="Button";

export { Button, buttonVariants };
