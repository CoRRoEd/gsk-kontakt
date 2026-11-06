import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(1, 'Введите телефон')
  .transform((v) => v.replace(/[^\d+]/g, ''))
  .refine((v) => /^(\+7|8|7)?\d{10}$/.test(v), 'Неверный формат телефона');

export const codeSchema = z
  .string()
  .length(6, 'Код должен быть 6 цифр')
  .regex(/^\d+$/, 'Только цифры');

export const requestCodeSchema = z.object({
  phone: phoneSchema,
});

export const verifyCodeSchema = z.object({
  phone: phoneSchema,
  code: codeSchema,
});

export const passwordLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Введите пароль'),
});

export const adminCodeSchema = z.object({
  phone: phoneSchema,
  code: codeSchema,
});
