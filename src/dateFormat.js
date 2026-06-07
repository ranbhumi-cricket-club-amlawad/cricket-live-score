export function formatDisplayDateTime(value) {
  if (!value) return "Waiting for update";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const hours = date.getHours();
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()} ${String(hours % 12 || 12).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

export function formatMatchSchedule(dateValue, timeValue) {
  const dateParts = String(dateValue || "").split("-");
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : String(dateValue || "");
  const timeParts = String(timeValue || "").split(":");
  const hours = Number(timeParts[0]);
  const formattedTime = timeValue && Number.isFinite(hours) ? `${String(hours % 12 || 12).padStart(2, "0")}:${String(timeParts[1] || "00").padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}` : String(timeValue || "");
  return [formattedDate, formattedTime].filter(Boolean).join(" · ");
}
