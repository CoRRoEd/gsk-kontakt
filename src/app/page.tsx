import Link from 'next/link';
import { prisma } from '@/lib/db';
import { 
  Home, ShieldCheck, CreditCard, FileText, 
  ArrowRight, Phone, Mail, MapPin, ChevronRight 
} from 'lucide-react';

// Делаем страницу динамической, чтобы новости подтягивались из БД
export const dynamic = 'force-dynamic';

export default async function PublicHomePage() {
  // Подтягиваем 3 последние опубликованные новости
  const latestNews = await prisma.news.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Шапка сайта */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {/* Заменили иконку Home на нашу картинку */}
            <img 
              src="/garage-icon.png" 
              alt="ГСК Контакт" 
              className="w-12 h-12 object-contain" 
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">ГСК «Контакт»</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Цифровая платформа</p>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Возможности</Link>
            <Link href="/news" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Новости</Link>
            <Link href="/documents" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Документы</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              Войти в кабинет
            </Link>
          </div>
        </div>
      </header>

      {/* Главный баннер (Hero) */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-y-0 w-full h-full bg-[url('/garage-icon.png')] bg-no-repeat bg-right-bottom bg-contain opacity-5 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Управляйте гаражом <br/>
              <span className="text-blue-600">в один клик</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Передавайте показания счётчиков, оплачивайте электроэнергию без комиссии и следите за новостями кооператива с любого устройства.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                Передать показания
                <ArrowRight size={18} />
              </Link>
              <Link 
                href="#features" 
                className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Узнать больше
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Блок преимуществ */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Всё для вашего удобства</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Мы перенесли все бюрократические процессы в цифровой формат, чтобы вы тратили меньше времени и нервов.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Карточка 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Безопасность</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Вход в систему защищён кодом из SMS. Ваши персональные данные и история начислений надёжно хранятся в базе.
              </p>
            </div>

            {/* Карточка 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="bg-green-50 w-14 h-14 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                <CreditCard size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Оплата онлайн</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Забудьте про очереди. Оплачивайте электроэнергию через СБП или по QR-коду, а все квитанции храните в личном кабинете.
              </p>
            </div>

            {/* Карточка 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="bg-amber-50 w-14 h-14 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Прозрачность</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Все решения Правления, тарифы, отчёты и История ваших начислений всегда под рукой. Доступ в личном кабинете.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Последние новости */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Новости кооператива</h2>
              <p className="text-slate-500">Будьте в курсе последних событий ГСК</p>
            </div>
            <Link href="/news" className="hidden sm:flex items-center gap-1 text-blue-600 font-medium hover:text-blue-700 transition">
              Все новости <ChevronRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.length === 0 ? (
              <div className="col-span-3 bg-slate-50 p-8 rounded-2xl text-center border border-slate-100">
                <p className="text-slate-500">Пока нет опубликованных новостей. Как только Правление добавит их в админке, они появятся здесь.</p>
              </div>
            ) : (
              latestNews.map((news) => (
                <div key={news.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition flex flex-col">
                  {news.coverUrl && (
                    <img src={news.coverUrl} alt={news.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                      {news.category === 'important' ? 'Важное' : 'Новости'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2">{news.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-3">{news.excerpt}</p>
                    <Link href={`/news/${news.slug}`} className="mt-auto text-blue-600 text-sm font-medium hover:underline">
                      Читать далее →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/news" className="inline-flex items-center gap-1 text-blue-600 font-medium">
              Все новости <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-4">
              <Home size={24} />
              <span>ГСК «Контакт»</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              Официальный сайт гаражно-строительного кооператива. Удобный сервис для собственников.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/news" className="hover:text-white transition">Новости</Link></li>
              <li><Link href="/documents" className="hover:text-white transition">Документы</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Личный кабинет</Link></li>
              <li><Link href="/admin/login" className="hover:text-white transition">Для персонала</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Контакты</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-500 shrink-0" />
                <span>164500, Архангельская обл,<br/>г. Северодвинск, ул. Окружная 28</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-slate-500 shrink-0" />
                <span>+7 (900) 765-43-21</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-slate-500 shrink-0" />
                <span>info@gsk-kontakt.ru</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ГСК «Контакт». Все права защищены.
        </div>
      </footer>
    </div>
  );
}