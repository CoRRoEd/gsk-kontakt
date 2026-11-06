const requestCodeSchema = z.object({
  phone: z.string().min(10, 'Некорректный номер телефона'),
});