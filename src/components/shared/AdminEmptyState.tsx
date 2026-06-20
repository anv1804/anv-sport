import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type AdminEmptyStateProps = {
  /** Nội dung hiển thị — thường là icon từ lucide-react */
  icon?: LucideIcon;
  /** Tiêu đề trạng thái trống */
  title: string;
  /** Mô tả gợi ý hành động tiếp theo */
  description?: string;
  /** Nút hành động (VD: Link "Thêm mới") */
  action?: ReactNode;
  /** Dùng trong <td> của bảng — bọc bằng wrapper table-safe */
  asTableCell?: boolean;
  /** Số cột table cần span (khi asTableCell=true) */
  colSpan?: number;
};

/**
 * Trạng thái trống chuẩn cho bảng / danh sách admin.
 *
 * Dùng trong `<tbody>`:
 * ```tsx
 * <AdminEmptyState asTableCell colSpan={4} title="Chưa có dữ liệu" />
 * ```
 *
 * Dùng độc lập ngoài bảng:
 * ```tsx
 * <AdminEmptyState title="Chưa có bài viết" description="Hãy tạo bài viết đầu tiên." />
 * ```
 */
export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  asTableCell = false,
  colSpan,
}: AdminEmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-3 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="text-slate-500 font-medium">{title}</p>
      {description && (
        <p className="text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );

  if (asTableCell) {
    return (
      <tr>
        <td colSpan={colSpan} className="text-center">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}
