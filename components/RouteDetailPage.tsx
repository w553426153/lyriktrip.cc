import React, { useEffect, useMemo, useState } from 'react';
import type { RouteDay, RouteDetail, RouteNode, RouteNodeType, Tour } from '../types';
import { fetchRouteDetail } from '../apiClient';
import TourDetail from './TourDetail';

type RouteDetailPageProps = {
  routeId: string;
  fallbackTour?: Tour | null;
  onOpenConsult: (source: string) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onBack: () => void;
};

function formatHhmm(time?: string | null): string {
  if (!time) return '';
  const s = String(time);
  // Accept "10:00:00" or "10:00".
  const m = s.match(/^(\d{1,2}:\d{2})/);
  return m ? m[1] : s;
}

function formatDuration(minutes?: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function nodeTypeMeta(type: RouteNodeType): { label: string; icon: string; tone: string; ring: string; chip: string } {
  switch (type) {
    case 'transport':
      return {
        label: '交通',
        icon: 'fa-solid fa-train-subway',
        tone: 'text-sky-700',
        ring: 'ring-sky-200/80',
        chip: 'bg-sky-50 text-sky-800'
      };
    case 'restaurant':
      return {
        label: '餐厅',
        icon: 'fa-solid fa-utensils',
        tone: 'text-orange-700',
        ring: 'ring-orange-200/80',
        chip: 'bg-orange-50 text-orange-800'
      };
    case 'attraction':
    default:
      return {
        label: '景点',
        icon: 'fa-solid fa-landmark',
        tone: 'text-emerald-700',
        ring: 'ring-emerald-200/80',
        chip: 'bg-emerald-50 text-emerald-800'
      };
  }
}

function getNodeTitle(node: RouteNode): string {
  if (node.nodeType === 'transport') {
    const t = node.transport;
    const from = t?.fromLocation ? String(t.fromLocation).trim() : '';
    const to = t?.toLocation ? String(t.toLocation).trim() : '';
    if (from && to) return `${from} → ${to}`;
    return t?.transportMethod ? `交通：${t.transportMethod}` : '交通';
  }
  if (node.nodeType === 'attraction') return node.attraction?.name || '景点';
  if (node.nodeType === 'restaurant') return node.restaurant?.name || '餐厅';
  return '节点';
}

function SafeText({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null;
  return <div className={className ? className : ''}>{text}</div>;
}

function DayPills({
  days,
  activeDay,
  onPick
}: {
  days: RouteDay[];
  activeDay: number;
  onPick: (dayNumber: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((d) => {
        const active = d.dayNumber === activeDay;
        return (
          <button
            key={d.id}
            onClick={() => onPick(d.dayNumber)}
            className={[
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all',
              active
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-white/70 text-slate-700 hover:bg-white shadow-sm ring-1 ring-slate-200/70'
            ].join(' ')}
          >
            Day {d.dayNumber}
          </button>
        );
      })}
    </div>
  );
}

function NodeCard({
  node,
  open,
  onToggle
}: {
  node: RouteNode;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = nodeTypeMeta(node.nodeType);
  const title = getNodeTitle(node);
  const time = formatHhmm(node.startTime);
  const dur = formatDuration(node.durationMinutes ?? null);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={[
          'w-full text-left rounded-2xl bg-white/75 backdrop-blur-sm shadow-[0_10px_30px_-18px_rgba(15,23,42,0.55)]',
          'ring-1 ring-slate-200/70 hover:ring-slate-300/80 transition-all',
          'px-5 py-4'
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              'mt-0.5 h-10 w-10 rounded-xl grid place-items-center ring-1',
              meta.ring,
              'bg-white'
            ].join(' ')}
          >
            <i className={[meta.icon, meta.tone].join(' ')}></i>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold', meta.chip].join(' ')}>
                {meta.label}
              </span>
              {time && (
                <span className="text-[11px] font-semibold text-slate-600">
                  <i className="fa-regular fa-clock mr-1"></i>
                  {time}
                </span>
              )}
              {dur && (
                <span className="text-[11px] font-semibold text-slate-600">
                  <i className="fa-regular fa-hourglass-half mr-1"></i>
                  {dur}
                </span>
              )}
            </div>
            <div className="mt-1.5 font-display text-[15px] md:text-[16px] font-semibold text-slate-900 truncate">
              {title}
            </div>
          </div>

          <div className="mt-1 text-slate-400">
            <i className={open ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'}></i>
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-3 rounded-2xl bg-white/70 ring-1 ring-slate-200/70 p-5 animate-fade-in">
          {node.nodeType === 'transport' && (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-sky-50/70 ring-1 ring-sky-100 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-sky-700/80 font-bold mb-1">From</div>
                  <div className="font-semibold">{node.transport?.fromLocation || '—'}</div>
                </div>
                <div className="rounded-xl bg-sky-50/70 ring-1 ring-sky-100 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-sky-700/80 font-bold mb-1">To</div>
                  <div className="font-semibold">{node.transport?.toLocation || '—'}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {node.transport?.transportMethod && (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200">
                    <i className="fa-solid fa-route mr-2 text-sky-600"></i>
                    {node.transport.transportMethod}
                  </span>
                )}
                {node.transport?.cost != null && node.transport?.cost !== '' && (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200">
                    <i className="fa-solid fa-coins mr-2 text-amber-600"></i>
                    {String(node.transport.cost)}
                  </span>
                )}
              </div>

              <SafeText
                text={node.transport?.routeDetail || null}
                className="whitespace-pre-line leading-relaxed text-slate-700"
              />
            </div>
          )}

          {node.nodeType === 'attraction' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-emerald-50/60 ring-1 ring-emerald-100 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-emerald-700/80 font-bold mb-1">地址</div>
                  <div className="text-slate-800">{node.attraction?.address || '—'}</div>
                </div>
                <div className="rounded-xl bg-emerald-50/60 ring-1 ring-emerald-100 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-emerald-700/80 font-bold mb-1">开放时间</div>
                  <div className="text-slate-800">{node.attraction?.openingHours || '—'}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {node.attraction?.ticketPrice && (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200">
                    <i className="fa-solid fa-ticket mr-2 text-emerald-600"></i>
                    {node.attraction.ticketPrice}
                  </span>
                )}
                {node.attraction?.suggestedDuration && (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200">
                    <i className="fa-solid fa-stopwatch mr-2 text-emerald-600"></i>
                    {node.attraction.suggestedDuration}
                  </span>
                )}
                {node.attraction?.bestSeason && (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200">
                    <i className="fa-solid fa-leaf mr-2 text-emerald-600"></i>
                    {node.attraction.bestSeason}
                  </span>
                )}
              </div>

              <SafeText
                text={node.attraction?.description || null}
                className="whitespace-pre-line leading-relaxed text-sm text-slate-700"
              />

              {!!(node.attraction?.highlights && node.attraction.highlights.length) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                    <div className="font-display font-semibold text-slate-900">游览要点</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {node.attraction!.highlights!.map((h, idx) => (
                      <div key={idx} className="rounded-xl bg-white ring-1 ring-slate-200/70 p-4">
                        <div className="font-semibold text-slate-900">{h.title}</div>
                        {h.content && <div className="mt-1.5 text-sm leading-relaxed text-slate-700 whitespace-pre-line">{h.content}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {node.nodeType === 'restaurant' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-orange-50/60 ring-1 ring-orange-100 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-orange-700/80 font-bold mb-1">地址</div>
                  <div className="text-slate-800">{node.restaurant?.address || '—'}</div>
                </div>
                <div className="rounded-xl bg-orange-50/60 ring-1 ring-orange-100 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-orange-700/80 font-bold mb-1">营业时间</div>
                  <div className="text-slate-800">{node.restaurant?.businessHours || '—'}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {node.restaurant?.avgCost != null && node.restaurant.avgCost !== '' && (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200">
                    <i className="fa-solid fa-wallet mr-2 text-orange-600"></i>
                    人均 {String(node.restaurant.avgCost)}
                  </span>
                )}
                {node.restaurant?.queueStatus && (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200">
                    <i className="fa-solid fa-user-clock mr-2 text-orange-600"></i>
                    {node.restaurant.queueStatus}
                  </span>
                )}
                {node.restaurant?.phone && (
                  <a
                    href={`tel:${node.restaurant.phone}`}
                    className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200 hover:ring-slate-300"
                  >
                    <i className="fa-solid fa-phone mr-2 text-orange-600"></i>
                    {node.restaurant.phone}
                  </a>
                )}
              </div>

              {node.restaurant?.mustEatRating != null && (
                <div className="text-sm text-slate-700 flex items-center gap-2">
                  <span className="font-semibold">必吃指数</span>
                  <span className="text-orange-600">
                    {Array.from({ length: Math.max(0, Math.min(5, node.restaurant.mustEatRating)) }).map((_, i) => (
                      <i key={i} className="fa-solid fa-star"></i>
                    ))}
                  </span>
                </div>
              )}

              <SafeText
                text={node.restaurant?.background || null}
                className="whitespace-pre-line leading-relaxed text-sm text-slate-700"
              />

              {!!(node.restaurant?.recommendedDishes && node.restaurant.recommendedDishes.length) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                    <div className="font-display font-semibold text-slate-900">推荐菜品</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {node.restaurant!.recommendedDishes!.map((d, idx) => (
                      <div key={idx} className="rounded-xl bg-white ring-1 ring-slate-200/70 p-4">
                        <div className="font-semibold text-slate-900">{d.name}</div>
                        {d.description && (
                          <div className="mt-1.5 text-sm leading-relaxed text-slate-700 whitespace-pre-line">{d.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Itinerary({
  days,
  activeDay,
  onPickDay
}: {
  days: RouteDay[];
  activeDay: number;
  onPickDay: (dayNumber: number) => void;
}) {
  const active = useMemo(() => days.find((d) => d.dayNumber === activeDay) || days[0], [days, activeDay]);
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);

  useEffect(() => {
    // Reset open card when switching days.
    setOpenNodeId(null);
  }, [activeDay]);

  if (!active) return null;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Itinerary</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mt-2">行程安排</h2>
        </div>
      </div>

      <div className="mt-5">
        <DayPills days={days} activeDay={activeDay} onPick={onPickDay} />
      </div>

      <div className="mt-6 rounded-3xl bg-white/55 ring-1 ring-slate-200/70 p-6 md:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-orange/10 ring-1 ring-brand-orange/20 grid place-items-center">
              <span className="font-display font-extrabold text-brand-orange">D{active.dayNumber}</span>
            </div>
            <div>
              <div className="font-display font-semibold text-slate-900">{active.dayTitle || `Day ${active.dayNumber}`}</div>
              {active.daySubtitle && <div className="text-sm text-slate-600 mt-0.5">{active.daySubtitle}</div>}
            </div>
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            <i className="fa-solid fa-list-check mr-2"></i>
            {active.nodes.length} 个节点
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {active.nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              open={openNodeId === node.id}
              onToggle={() => setOpenNodeId((cur) => (cur === node.id ? null : node.id))}
            />
          ))}
          {active.nodes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
              No nodes for this day.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const RouteDetailPage: React.FC<RouteDetailPageProps> = ({
  routeId,
  fallbackTour = null,
  onOpenConsult,
  wishlist,
  onToggleWishlist,
  onBack
}) => {
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeDay, setActiveDay] = useState<number>(1);

  const isLegacyTourId = useMemo(() => /^\d+$/.test(String(routeId || '')), [routeId]);
  const isInWishlist = useMemo(() => wishlist.includes(routeId), [wishlist, routeId]);

  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setRoute(null);

    fetchRouteDetail(routeId)
      .then((res) => {
        if (cancelled) return;
        setRoute(res);
        const day1 = Array.isArray(res.days) && res.days.length ? res.days[0].dayNumber : 1;
        setActiveDay(day1);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  // Legacy tours are still served from constants.tsx. For these ids we silently fall back.
  if (!route && !loading && isLegacyTourId && fallbackTour) {
    return (
      <TourDetail
        tour={fallbackTour}
        onOpenConsult={onOpenConsult}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onBack={onBack}
      />
    );
  }

  const cover =
    route?.coverImages && route.coverImages.length
      ? route.coverImages[0]
      : 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?auto=format&fit=crop&q=80&w=1600';

  return (
    <div className="min-h-screen font-body bg-[radial-gradient(circle_at_15%_10%,rgba(255,107,53,0.16),transparent_45%),radial-gradient(circle_at_75%_20%,rgba(26,54,93,0.14),transparent_45%),linear-gradient(to_bottom,#ffffff,#f6f8fb)]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={cover} alt={route?.routeName || 'Route'} className="h-[72vh] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-black/30"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.22),transparent_60%)]"></div>
        </div>

        <div className="relative h-[72vh]">
          <div className="container mx-auto px-6 pt-28 pb-10 h-full flex items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 ring-1 ring-white/60 backdrop-blur px-4 py-2 text-xs font-bold tracking-[0.24em] text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-orange"></span>
                ROADBOOK • LYR I KTRIP
              </div>

              <h1 className="mt-5 font-display text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.02]">
                {route?.routeName || (loading ? 'Loading…' : 'Route')}
              </h1>

              {route?.routeAlias && <div className="mt-4 text-lg md:text-xl text-slate-700 font-medium">{route.routeAlias}</div>}

              <div className="mt-6 flex flex-wrap gap-2">
                {(route?.highlights || []).slice(0, 6).map((h, idx) => (
                  <span
                    key={`${h}-${idx}`}
                    className="rounded-full bg-white/70 ring-1 ring-slate-200/70 backdrop-blur px-3 py-1 text-[11px] font-bold text-slate-700"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {error && !loading && (
                <div className="mt-6 rounded-2xl bg-red-50 ring-1 ring-red-200 p-4 text-sm text-red-800">
                  <div className="font-bold mb-1">无法加载线路数据</div>
                  <div className="opacity-90">{error}</div>
                  <div className="opacity-80 mt-2">提示：如果你刚新增了表结构，请先执行 seed 或迁移。</div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onBack}
            className="absolute top-24 left-6 md:left-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all z-20 shadow-lg"
            aria-label="Back"
          >
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main */}
          <div className="lg:col-span-8">
            <section className="rounded-3xl bg-white/65 ring-1 ring-slate-200/70 p-6 md:p-7 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.8)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Overview</div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mt-2">行程概览</h2>
                </div>
                <button
                  onClick={() => onToggleWishlist(routeId)}
                  className={[
                    'h-12 w-12 rounded-2xl grid place-items-center ring-1 transition-all active:scale-95',
                    isInWishlist ? 'bg-brand-orange text-white ring-brand-orange/30' : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-300'
                  ].join(' ')}
                  aria-label="Toggle wishlist"
                >
                  <i className={`${isInWishlist ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Days</div>
                  <div className="mt-1 font-display text-2xl font-extrabold text-slate-900">{route?.totalDays || '—'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Price</div>
                  <div className="mt-1 font-display text-2xl font-extrabold text-slate-900">
                    {route?.price != null ? String(route.price) : '—'}
                  </div>
                  {route?.priceUnit && <div className="text-xs text-slate-600 mt-1">{route.priceUnit}</div>}
                </div>
                <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Style</div>
                  <div className="mt-1 text-slate-700 font-semibold">高精度 · 百科式导览</div>
                  <div className="mt-1 text-xs text-slate-500">以动线与时间节点为核心</div>
                </div>
              </div>

              {route?.recommendation && (
                <div className="mt-7">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-orange"></div>
                    <div className="font-display font-semibold text-slate-900">推荐理由</div>
                  </div>
                  <div className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{route.recommendation}</div>
                </div>
              )}

              {route?.introduction && (
                <div className="mt-7">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-blue"></div>
                    <div className="font-display font-semibold text-slate-900">行程简介</div>
                  </div>
                  <div className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{route.introduction}</div>
                </div>
              )}
            </section>

            {route?.days && route.days.length > 0 && (
              <Itinerary days={route.days} activeDay={activeDay} onPickDay={setActiveDay} />
            )}

            {!route && loading && (
              <div className="mt-10 rounded-3xl bg-white/60 ring-1 ring-slate-200/70 p-10 text-center text-slate-600">
                <i className="fa-solid fa-compass text-2xl mb-3 text-slate-400"></i>
                <div className="font-semibold">正在加载线路数据…</div>
              </div>
            )}
          </div>

          {/* Aside */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-3xl bg-white/75 ring-1 ring-slate-200/70 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.8)]">
                <div className="font-display text-lg font-bold text-slate-900">咨询与定制</div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                  想把这条路线改成更适合你的节奏？告诉我们你的偏好（步行强度、亲子/情侣、预算、饮食忌口），我们会给出可落地的版本。
                </div>
                <button
                  onClick={() => onOpenConsult(`Route: ${route?.routeName || routeId}`)}
                  className="mt-5 w-full rounded-2xl bg-brand-orange text-white py-3.5 font-bold hover:bg-brand-darkOrange transition-all shadow-lg"
                >
                  预约行程咨询
                </button>
                <div className="mt-3 text-center text-xs text-slate-500">不需要立即付款 • 先沟通再决定</div>
              </div>

              {route?.days && route.days.length > 1 && (
                <div className="rounded-3xl bg-white/70 ring-1 ring-slate-200/70 p-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Day Index</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {route.days.map((d) => {
                      const active = d.dayNumber === activeDay;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setActiveDay(d.dayNumber)}
                          className={[
                            'rounded-2xl px-3 py-3 text-left ring-1 transition-all',
                            active ? 'bg-brand-blue text-white ring-brand-blue/30' : 'bg-white/70 text-slate-700 ring-slate-200 hover:ring-slate-300'
                          ].join(' ')}
                        >
                          <div className="text-xs font-extrabold tracking-widest opacity-90">DAY {d.dayNumber}</div>
                          <div className="mt-1 text-sm font-semibold leading-snug">{d.dayTitle || `Day ${d.dayNumber}`}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailPage;
