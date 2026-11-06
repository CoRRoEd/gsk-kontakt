'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const initialSearch = searchParams.get('search') || '';
  const [query, setQuery] = useState(initialSearch);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (query === (searchParams.get('search') || '')) return;

    setIsPending(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set('search', query);
      } else {
        params.delete('search');
      }
      
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      
      setTimeout(() => {
        setIsPending(false);
        const tableElement = document.getElementById('garages-table');
        if (tableElement) {
          const yOffset = -20; 
          const y = tableElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 400); 

    }, 400);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  const clearSearch = () => {
    setQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    // Увеличили максимальную ширину до max-w-2xl
    <div className="relative w-full max-w-2xl">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {isPending ? (
          <Loader2 size={18} className="text-blue-500 animate-spin" />
        ) : (
          <Search size={18} className="text-slate-400" />
        )}
      </div>
      <input
        type="text"
        // Сократили текст подсказки, чтобы он точно помещался
        placeholder="Ряд / Блок / Бокс или ФИО..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow shadow-sm bg-white"
      />
      {query && (
        <button
          onClick={clearSearch}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}