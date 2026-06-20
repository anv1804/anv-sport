import { ReactNode } from "react";

type AdminPageHeaderProps = {
  /** Tiêu đề trang, dùng thẻ <h1> */
  title: string;
  /** Mô tả ngắn bên dưới tiêu đề */
  description?: string;
  /** Slot bên phải: nút hành động, badge, v.v. */
  actions?: ReactNode;
};

/**
 * Header chuẩn cho các trang admin dashboard.
 * Bố cục: tiêu đề + mô tả (trái) | actions (phải).
 */
export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-slate-500 font-medium">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
