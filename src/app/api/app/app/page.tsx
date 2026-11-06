import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export default async function AppPage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      owner: {
        include: {
          garages: {
            include: { garage: true },
          },
        },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const garages = user.owner?.garages || [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-1">
            Здравствуйте, {user.fullName}
          </h1>
          <p className="text-gray-500 text-sm">Личный кабинет собственника</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Мои гаражи</h2>
          {garages.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Гаражей пока нет. Обратитесь к председателю.
            </p>
          ) : (
            <ul className="space-y-2">
              {garages.map((og) => (
                <li key={og.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">
                    Блок {og.garage.block} · Ряд {og.garage.row} · Бокс {og.garage.number}
                  </span>
                  <span className="text-xs text-gray-500">
                    {og.ownershipType === 'owner' ? 'Собственник' : 'Арендатор'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form action="/api/app/auth/logout" method="POST" className="mt-6 text-center">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            Выйти
          </button>
        </form>
      </div>
    </main>
  );
}