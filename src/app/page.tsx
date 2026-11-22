import Link from 'next/link';
import { prisma } from '@/lib/db';
import { User, ShieldCheck, Phone, MapPin, Clock, FileText, ChevronRight, Car, Wallet, HelpCircle } from 'lucide-react';

export default async function HomePage() {
  // 1. Подтягиваем последние 3 новости
  const news = await prisma.news.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 3
  });

  // 2. Подтягиваем последние 4 документа
  const documents = await prisma.document.findMany({
    where: { status: 'active' },
    orderBy: { publishedAt: 'desc' },
    take: 4
  });

  // Словарь категорий для новостей
  const newsCategories: Record<string, string> = {
    important: 'Важное',
    electricity: 'Электроэнергия',
    documents: 'Документы',
    meetings: 'Собрания',
    improvement: 'Благоустройство',
    announcements: 'Объявления',
    other: 'Другое'
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      
      {/* ================= ШАПКА ================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/garage-icon.png" alt="ГСК Контакт" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">ГСК «Контакт»</h1>
              <p className="text-xs text-slate-500">г. Северодвинск</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#news" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Новости</Link>
            <Link href="#documents" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Документы</Link>
            <Link href="#contacts" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Контакты</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
              <User size={16} />
              <span className="hidden sm:inline">Личный кабинет</span>
            </Link>
            <Link href="/admin/login" className="hidden sm:flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition border border-slate-200">
              <ShieldCheck size={16} />
              <span>Для персонала</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative bg-white overflow-hidden border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
            
            {/* Левая часть: Текст */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
                Цифровая платформа <br className="hidden lg:block"/> для собственников гаражей
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Передавайте показания счётчиков, получайте расчёт и оплачивайте электроэнергию онлайн. Без очередей и бумажной волокиты.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 text-center flex items-center justify-center gap-2">
                  <User size={20} />
                  Войти в кабинет
                </Link>
                <Link href="/app/help" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition text-center flex items-center justify-center gap-2">
                  <HelpCircle size={20} />
                  Как это работает?
                </Link>
              </div>
            </div>

            {/* Правая часть: Картинка/Декор */}
            <div className="flex-1 relative hidden lg:block">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 transform scale-110"></div>
              <img src="/garage-icon.png" alt="Гараж" className="relative z-10 w-64 h-64 mx-auto object-contain drop-shadow-2xl" />
            </div>
          </div>
        </section>

        {/* ================= БЫСТРЫЕ ДЕЙСТВИЯ ================= */}
        <section className="bg-slate-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex items-center gap-4">
                <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Car size={28} /></div>
                <div>
                  <h3 className="text-white font-bold">Передача показаний</h3>
                  <p className="text-slate-400 text-sm mt-1">До 5-го числа каждого месяца</p>
                </div>
              </div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex items-center gap-4">
                <div className="bg-green-500/20 p-3 rounded-xl text-green-400"><Wallet size={28} /></div>
                <div>
                  <h3 className="text-white font-bold">Онлайн-оплата</h3>
                  <p className="text-slate-400 text-sm mt-1">Через СБП или банковской картой</p>
                </div>
              </div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex items-center gap-4">
                <div className="bg-amber-500/20 p-3 rounded-xl text-amber-400"><FileText size={28} /></div>
                <div>
                  <h3 className="text-white font-bold">Квитанции</h3>
                  <p className="text-slate-400 text-sm mt-1">Всегда доступны в личном кабинете</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= НОВОСТИ ================= */}
        <section id="news" className="py-16 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Новости Правления</h2>
                <p className="text-slate-500 mt-2">Актуальная информация для собственников</p>
              </div>
            </div>

            {news.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-500">Пока новостей нет.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item) => (
                  <Link href={`/news/${item.slug}`} key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition group flex flex-col">
                    {item.coverUrl ? (
                      <div className="h-48 bg-slate-100 overflow-hidden">
                        <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="h-48 bg-blue-50 flex items-center justify-center">
                        <FileText size={48} className="text-blue-200" />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">{newsCategories[item.category] || item.category}</span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition">{item.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{item.excerpt || item.body}</p>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 text-sm font-medium">
                        Читать полностью
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================= ДОКУМЕНТЫ ================= */}
        <section id="documents" className="py-16 bg-slate-50 border-t border-slate-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Официальные документы</h2>
              <p className="text-slate-500 mt-2">Решения собраний, отчёты и объявления</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Документов пока нет.</div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="p-5 hover:bg-slate-50 transition flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="bg-red-50 text-red-500 p-2.5 rounded-lg">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">{doc.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(doc.publishedAt || doc.createdAt).toLocaleDateString('ru-RU')} • PDF
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ================= ПОДВАЛ ================= */}
      <footer id="contacts" className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/garage-icon.png" alt="ГСК Контакт" className="w-10 h-10 object-contain brightness-0 invert opacity-80" />
              <h2 className="text-xl font-bold text-white">ГСК «Контакт»</h2>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Цифровая платформа для управления гаражным кооперативом и удобной оплаты электроэнергии.
            </p>
            <p className="text-sm">© 2026 ГСК «Контакт». Все права защищены.</p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Контакты</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <span>164500, Архангельская обл, г. Северодвинск, ул. Окружная 28</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-blue-500 shrink-0" />
                <a href="tel:+79007654321" className="hover:text-white transition">+7 (900) 765-43-21 (Председатель)</a>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={18} className="text-blue-500 shrink-0" />
                <span>Приём: Сб 10:00 – 14:00</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Реквизиты</h3>
            <ul className="space-y-2 text-sm">
              <li>ИНН: 2902027646</li>
              <li>КПП: 290202001</li>
              <li>ОГРН: ... (добавить)</li>
              <li className="pt-2">
                <Link href="/privacy" className="hover:text-white transition underline underline-offset-2">Политика обработки персональных данных</Link>
              </li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}