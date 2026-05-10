// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn.js';

/**
 * Button — primary / secondary / outline / ghost variants.
 *
 * Mirrors `.btn-*` classes from website/styles.css so the marketing site
 * and the apps share visual language. Tailwind classes resolve via
 * @clubup/config/tailwind.preset.js.
 */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-sm font-semibold text-sm ' +
    'transition-colors disabled:pointer-events-none disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-blue text-paper hover:bg-blue-dark',
        secondary:
          'bg-transparent text-navy border border-navy/30 hover:bg-navy/5',
        outline:
          'bg-transparent text-blue border border-blue hover:bg-blue hover:text-paper',
        ghost: 'bg-transparent text-navy hover:bg-navy/5',
        danger: 'bg-danger text-paper hover:bg-danger/90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
