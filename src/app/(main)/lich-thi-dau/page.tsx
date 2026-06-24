import type { Metadata } from 'next';
import { MatchScheduleClient } from './MatchScheduleClient';

export const metadata: Metadata = {
  title: 'Lịch Thi Đấu FIFA World Cup 2026™ | ANV Sport',
  description: 'Xem lịch thi đấu đầy đủ FIFA World Cup 2026, tỷ lệ thắng, dự đoán AI và kết quả trực tiếp theo từng bảng đấu.',
};

export default function LichThiDauPage() {
  return <MatchScheduleClient />;
}
