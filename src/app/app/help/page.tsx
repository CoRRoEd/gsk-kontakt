import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { ArrowLeft, PlayCircle, BookOpen, Wallet, Gauge, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function HelpPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) redirect('/login');

  const videos = [
    {
      id: 'readings',
      title: 'Как передать показания счётчика',
      description: 'Пошаговая инструкция: куда заходить, какие цифры вводить и что делать, если система выдаёт ошибку.',
      icon: Gauge,
      file: '/videos/kak-peredat-pokazaniya.mp4', // Замени на реальное имя файла
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      id: 'payments',
      title: 'Как оплатить счёт и прикрепить чек',
      description: 'Узнайте, как получить QR-код, перевести деньги через банк и загрузить чек в личный кабинет.',
      icon: Wallet,
      file: '/videos/kak-oplatit.mp4', // Замени на реальное имя файла
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      id: 'history',
      title: 'Где посмотреть историю и квитанции',
      description: 'Как проверить свои начисления за прошлые месяцы и скачать официальные квитанции.',
      icon: FileText,
      file: '/videos/kak-posmotret-istoriyu.mp4', // Замени на реальное имя файла
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4 transition">
          <ArrowLeft size={16} /> Назад в кабинет
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Помощь и обучение</h1>
        <p className="text-slate-500 mt-2 text-base">
          Короткие видеоинструкции, которые помогут вам разобраться в личном кабинете.
        </p>
      </div>

      <div className="grid gap-6">
        {videos.map((video) => {
          const Icon = video.icon;
          return (
            <div key={video.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              {/* Блок с видео-плеером */}
              <div className="md:w-1/2 bg-slate-900 relative aspect-video md:aspect-auto">
                <video 
                  controls 
                  className="w-full h-full object-cover"
                  poster={`/video-poster-${video.id}.jpg`} // Опционально: картинка-заставка
                >
                  <source src={video.file} type="video/mp4" />
                  Ваш браузер не поддерживает видео.
                </video>
              </div>

              {/* Блок с описанием */}
              <div className="p-6 md:w-1/2 flex flex-col justify-center">
                <div className={`w-12 h-12 ${video.bg} ${video.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{video.title}</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}