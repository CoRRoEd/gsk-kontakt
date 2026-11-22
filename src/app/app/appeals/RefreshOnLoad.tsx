'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshOnLoad() {
  const router = useRouter();
  
  useEffect(() => {
    // Принудительно обновляем серверные компоненты (включая Layout с колокольчиком)
    router.refresh();
  }, [router]);

  return null;
}