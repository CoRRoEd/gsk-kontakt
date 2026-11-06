export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">ГСК «Контакт»</h1>
        <p className="text-xl text-gray-600 mb-8">Цифровая платформа для собственников гаражей</p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Войти в личный кабинет
          </a>
        </div>
      </div>
    </main>
  );
}