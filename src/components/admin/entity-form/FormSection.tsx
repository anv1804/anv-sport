import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormSectionProps {
  icon: ReactNode
  iconColor: string   // e.g. "text-emerald-600"
  iconBg: string      // e.g. "bg-emerald-100"
  title: string
  description?: string
  children: ReactNode
  bodyClassName?: string
}

export function FormSection({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  children,
  bodyClassName = 'p-6',
}: FormSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </div>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
