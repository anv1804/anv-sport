import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'indigo'
  | 'outline'
  | 'ghost';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Thêm dot indicator trước text */
  dot?: boolean;
  /** Icon từ lucide-react */
  icon?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-slate-100 text-slate-600 border-transparent',
  success:  'bg-emerald-100 text-emerald-700 border-transparent',
  danger:   'bg-red-100 text-red-700 border-transparent',
  warning:  'bg-amber-100 text-amber-700 border-transparent',
  info:     'bg-blue-100 text-blue-700 border-transparent',
  indigo:   'bg-indigo-100 text-indigo-700 border-transparent',
  outline:  'bg-transparent text-slate-600 border-slate-200',
  ghost:    'bg-white/80 text-slate-500 border-slate-200 shadow-sm',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] rounded',
  md: 'px-2.5 py-1 text-xs rounded-md',
  lg: 'px-3 py-1.5 text-sm rounded-lg',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  danger:  'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
  indigo:  'bg-indigo-500',
  outline: 'bg-slate-400',
  ghost:   'bg-slate-400',
};

/**
 * Badge — Nhãn trạng thái / danh mục tái sử dụng.
 *
 * @example
 * <Badge variant="success">Xuất bản</Badge>
 * <Badge variant="danger" size="sm">Lỗi</Badge>
 * <Badge variant="default" dot>Active</Badge>
 */
export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold border uppercase tracking-wider leading-none whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotClasses[variant])} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
