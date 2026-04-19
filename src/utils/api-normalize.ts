export function pickArray<T = any>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.list)) return res.list;
  if (Array.isArray(res?.rows)) return res.rows;
  if (Array.isArray(res?.records)) return res.records;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res?.data?.list)) return res.data.list;
  if (Array.isArray(res?.data?.rows)) return res.data.rows;
  if (Array.isArray(res?.data?.records)) return res.data.records;
  return [];
}

export function pickTotal(res: any): number {
  const raw =
    res?.total ??
    res?.count ??
    res?.total_count ??
    res?.totalCount ??
    res?.data?.total ??
    res?.data?.count ??
    res?.data?.total_count ??
    res?.data?.totalCount;
  return Number(raw || 0);
}

export function pickObject<T = any>(res: any): T | null {
  if (!res || typeof res !== 'object') return null;
  if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  if (res?.result && typeof res.result === 'object' && !Array.isArray(res.result)) return res.result;
  if (res?.record && typeof res.record === 'object' && !Array.isArray(res.record)) return res.record;
  if (res?.payload && typeof res.payload === 'object' && !Array.isArray(res.payload)) return res.payload;
  if (res?.item && typeof res.item === 'object' && !Array.isArray(res.item)) return res.item;
  if (res?.data?.payload && typeof res.data.payload === 'object' && !Array.isArray(res.data.payload)) return res.data.payload;
  if (res?.data?.item && typeof res.data.item === 'object' && !Array.isArray(res.data.item)) return res.data.item;
  return res;
}
