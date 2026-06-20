'use client';

import * as React from "react"
import { useState, useRef } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClickOutside } from "@/hooks/useClickOutside"

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  error?: boolean;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
}

const getChildrenText = (children: React.ReactNode): string => {
  if (children === null || children === undefined) return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(getChildrenText).join('');
  }
  if (React.isValidElement(children)) {
    return getChildrenText(children.props.children);
  }
  return '';
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, value, defaultValue, placeholder, name, onChange, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Extract options from children
    const options: { value: string; label: string }[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === 'option' || (child.props as any).value !== undefined) {
          const valProp = child.props.value;
          const labelText = getChildrenText(child.props.children);
          options.push({
            value: String(valProp !== undefined ? valProp : labelText),
            label: labelText,
          });
        }
      }
    });

    const [selectedValue, setSelectedValue] = useState<string>(
      String(value !== undefined ? value : (defaultValue !== undefined ? defaultValue : (options[0]?.value || '')))
    );

    // Sync with controlled value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(String(value));
      }
    }, [value]);

    useClickOutside(containerRef, () => setOpen(false));

    const selectedOption = options.find(o => o.value === selectedValue) || options[0];

    const handleSelect = (val: string) => {
      setSelectedValue(val);
      setOpen(false);
      if (onChange) {
        onChange({
          target: {
            name,
            value: val,
          }
        });
      }
    };

    const isWAuto = className?.includes('w-auto');

    return (
      <div ref={containerRef} className={cn(isWAuto ? "relative inline-block w-auto" : "relative w-full")}>
        <select
          name={name}
          value={selectedValue}
          onChange={(e) => handleSelect(e.target.value)}
          className="sr-only"
          {...props}
        >
          {options.map((o, index) => (
            <option key={`${o.value}-${index}`} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Custom Button */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={cn(
            "flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500",
            isWAuto ? "w-auto" : "w-full",
            error && "border-red-500 hover:border-red-500 focus:ring-red-500/10 focus:border-red-500",
            open && "border-emerald-500 ring-4 ring-emerald-500/10",
            className
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : (placeholder || '-- Chọn --')}</span>
          <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
        </button>

        {/* Dropdown list */}
        {open && options.length > 0 && (
          <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="py-1">
              {options.map((o, index) => {
                const isSelected = o.value === selectedValue;
                return (
                  <div
                    key={`${o.value}-${index}`}
                    onClick={() => handleSelect(o.value)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 md:py-2.5 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors",
                      isSelected && "bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-50"
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
