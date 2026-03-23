export const getTimeOptionsForTimezone = (timezone) => {
  const timezoneOffsets = {
    'Eastern (America/New York)': 0,
    'Central (America/Chicago)': -1,
    'Mountain (America/Denver)': -2,
    'Pacific (America/Los Angeles)': -3
  };

  const offset = timezoneOffsets[timezone] || 0;
  const baseHours = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17];

  return baseHours.map((hour) => {
    let adjustedHour = hour + offset;

    if (adjustedHour < 0) adjustedHour += 24;
    if (adjustedHour >= 24) adjustedHour -= 24;

    const hourPart = Math.floor(adjustedHour);
    const minutePart = adjustedHour % 1 === 0.5 ? '30' : '00';
    const period = hourPart >= 12 ? 'PM' : 'AM';
    const displayHour = hourPart === 0 ? 12 : hourPart > 12 ? hourPart - 12 : hourPart;

    return `${displayHour}:${minutePart} ${period}`;
  });
};
