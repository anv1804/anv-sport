export function slugify(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Chuẩn hóa Unicode
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ các dấu
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-') // Thay thế các ký tự không phải chữ số bằng dấu gạch ngang
    .replace(/(^-|-$)+/g, ''); // Loại bỏ dấu gạch ngang ở đầu và cuối
}

export function createArticleUrl(title: string, id: string | number) {
  return `/${slugify(title)}-${id}.html`;
}
