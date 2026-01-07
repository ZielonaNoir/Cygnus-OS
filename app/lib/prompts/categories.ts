'use client';

import * as React from 'react';

export interface Scenario {
  id: string;
  label: string;
  count: number;
}

export interface Domain {
  id: string;
  label: string;
  scenarios: Scenario[];
}

type CategoriesResponse = { ok: true; domains: Domain[] } | { ok: false; error: string };

export function useCategories() {
  const [domains, setDomains] = React.useState<Domain[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/prompts/categories');
      const data: CategoriesResponse = await resp.json();
      if (!resp.ok || !('ok' in data) || !data.ok) {
        throw new Error(('error' in data && data.error) || '获取分类失败');
      }
      setDomains(data.domains);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取分类失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return { domains, isLoading, error, refetch };
}


