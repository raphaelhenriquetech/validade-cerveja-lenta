import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TinyImageEntry = {
  image_url: string | null;
  product_name: string | null;
  loading: boolean;
};

/**
 * Fetches and caches Tiny product images by SKU.
 * Reads existing cache from `tiny_product_cache` on mount, and calls the
 * `get-tiny-product-image` edge function only for SKUs missing or stale (>7d).
 */
export function useTinyImages(skus: string[]) {
  const [images, setImages] = useState<Record<string, TinyImageEntry>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  // Stable, deduped, sorted key of SKUs so the effect doesn't loop
  const skuKey = Array.from(new Set(skus.filter(Boolean).map((s) => s.trim())))
    .sort()
    .join("|");

  useEffect(() => {
    const uniqueSkus = skuKey ? skuKey.split("|") : [];
    if (uniqueSkus.length === 0) return;

    let cancelled = false;

    (async () => {
      // 1) Read cache from DB
      const { data: cached } = await supabase
        .from("tiny_product_cache")
        .select("sku, image_url, product_name, fetched_at")
        .in("sku", uniqueSkus);

      if (cancelled) return;

      const now = Date.now();
      const TTL = 7 * 24 * 60 * 60 * 1000;
      const cacheMap = new Map<string, { image_url: string | null; product_name: string | null; fresh: boolean }>();
      for (const row of cached || []) {
        const fresh = row.fetched_at ? now - new Date(row.fetched_at).getTime() < TTL : false;
        cacheMap.set(row.sku, {
          image_url: row.image_url,
          product_name: row.product_name,
          fresh,
        });
      }

      const initial: Record<string, TinyImageEntry> = {};
      const toFetch: string[] = [];
      for (const sku of uniqueSkus) {
        const c = cacheMap.get(sku);
        if (c) {
          initial[sku] = { image_url: c.image_url, product_name: c.product_name, loading: !c.fresh };
          if (!c.fresh && !fetchedRef.current.has(sku)) toFetch.push(sku);
        } else {
          initial[sku] = { image_url: null, product_name: null, loading: true };
          if (!fetchedRef.current.has(sku)) toFetch.push(sku);
        }
      }
      setImages((prev) => ({ ...prev, ...initial }));

      if (toFetch.length === 0) return;
      toFetch.forEach((s) => fetchedRef.current.add(s));

      // Fetch in small batches so images appear progressively and
      // we don't hit the edge function timeout with many SKUs.
      const BATCH_SIZE = 5;
      for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = toFetch.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.functions.invoke("get-tiny-product-image", {
          body: { skus: batch },
        });
        if (cancelled) return;

        if (error) {
          console.error("[useTinyImages] fetch failed:", error);
          setImages((prev) => {
            const next = { ...prev };
            for (const s of batch) {
              next[s] = { ...(next[s] || { image_url: null, product_name: null }), loading: false };
              // Allow retry on next mount since request failed entirely
              fetchedRef.current.delete(s);
            }
            return next;
          });
          continue;
        }

        const results: Record<string, { image_url: string | null; product_name: string | null }> =
          data?.results || {};
        setImages((prev) => {
          const next = { ...prev };
          for (const sku of batch) {
            const r = results[sku];
            next[sku] = {
              image_url: r?.image_url ?? null,
              product_name: r?.product_name ?? next[sku]?.product_name ?? null,
              loading: false,
            };
          }
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skuKey]);

  const refetchImage = useCallback(async (sku: string) => {
    const clean = sku.trim();
    if (!clean) return;
    fetchedRef.current.delete(clean);
    setImages((prev) => ({
      ...prev,
      [clean]: { ...(prev[clean] || { image_url: null, product_name: null }), loading: true },
    }));

    const { data, error } = await supabase.functions.invoke("get-tiny-product-image", {
      body: { skus: [clean], force: true },
    });

    if (error) {
      console.error("[useTinyImages] refetch failed:", error);
      setImages((prev) => ({
        ...prev,
        [clean]: { ...(prev[clean] || { image_url: null, product_name: null }), loading: false },
      }));
      return;
    }
    const r = data?.results?.[clean];
    setImages((prev) => ({
      ...prev,
      [clean]: {
        image_url: r?.image_url ?? null,
        product_name: r?.product_name ?? prev[clean]?.product_name ?? null,
        loading: false,
      },
    }));
  }, []);

  return { images, refetchImage };
}
