/**
 * ЗАГЛУШКА для отправки SMS.
 * В разработке — выводим код в консоль.
 * В продакшене — заменить на реальный SMSC.ru.
 */

export async function sendSms(phone: string, message: string): Promise<boolean> {
  console.log('📱 SMS →', phone, ':', message);
  return true;
}

export async function sendVerificationCode(
  phone: string,
  code: string
): Promise<boolean> {
  const message = `ГСК Контакт: код входа ${code}. Никому не сообщайте.`;
  return sendSms(phone, message);
}