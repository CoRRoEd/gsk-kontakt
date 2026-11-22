'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function GarageSortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Получаем текущее значение из URL (по умолчанию 'default')
  const currentSort = searchParams.get('sort') || 'default';

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (e.target.value === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', e.target.value);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select 
      value={currentSort} 
      onChange={handleSortChange}
      className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="default">По порядку (Ряд, Блок, Бокс)</option>
      <option value="date_desc">Сначала изменённые</option>
      <option value="area_desc">По площади (убыв.)</option>
    </select>
  );
}