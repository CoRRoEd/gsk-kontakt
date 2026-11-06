export function normalizePhone(input: string): string {
  let cleaned = input.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.startsWith('8') && cleaned.length === 11) {
    cleaned = '7' + cleaned.slice(1);
  }

  if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '7' + cleaned;
  }

  if (cleaned.startsWith('7') && cleaned.length === 11) {
    return '+' + cleaned;
  }

  return '+' + cleaned;
}

export function isValidPhone(phone: string): boolean {
  return /^\+7\d{10}$/.test(phone);
}

export function formatPhone(phone: string): string {
  if (!isValidPhone(phone)) return phone;
  return `+7 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10, 12)}`;
}