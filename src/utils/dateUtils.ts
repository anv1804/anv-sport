export const getCurrentDateFormatted = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateFormattedWithOffset = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getVietnamTimeFromUTC = (utcTimestamp: string): { displayDate: string, time: string } => {
  if (!utcTimestamp) return { displayDate: "Hôm nay", time: "00:00" };
  try {
    // Ép hiểu là UTC bằng cách thêm Z
    const date = new Date(utcTimestamp.endsWith('Z') ? utcTimestamp : `${utcTimestamp}Z`);
    if (isNaN(date.getTime())) return { displayDate: "Hôm nay", time: "00:00" };

    // Lấy múi giờ VN
    const optionsDate: Intl.DateTimeFormatOptions = { 
      timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    };
    const optionsTime: Intl.DateTimeFormatOptions = { 
      timeZone: 'Asia/Ho_Chi_Minh', 
      hour: '2-digit', minute: '2-digit', hour12: false 
    };

    const vnDateStr = date.toLocaleDateString('en-GB', optionsDate); // dd/mm/yyyy
    const vnTimeStr = date.toLocaleTimeString('en-GB', optionsTime); // HH:mm
    
    // Ngày hiện tại ở VN
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-GB', optionsDate);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toLocaleDateString('en-GB', optionsDate);

    let displayDate = vnDateStr.substring(0, 5); // dd/mm
    if (vnDateStr === todayStr) {
      displayDate = "Hôm nay";
    } else if (vnDateStr === tomorrowStr) {
      displayDate = "Ngày mai";
    }

    return { displayDate, time: vnTimeStr };
  } catch {
    return { displayDate: "Hôm nay", time: "00:00" };
  }
};
