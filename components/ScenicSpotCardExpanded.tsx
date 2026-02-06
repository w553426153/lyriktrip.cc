import React, { useMemo, useState } from 'react';
import { Attraction } from '../types';

type Props = {
  spot: Attraction;
  isLiked: boolean;
  onToggleWishlist: (id: string) => void;
};

const clampArray = (arr: string[] | undefined, max: number) => (arr || []).slice(0, max);

const ScenicSpotCardExpanded: React.FC<Props> = ({ spot, isLiked, onToggleWishlist }) => {
  const [expanded, setExpanded] = useState(false);

  const titleZh = spot.nameZh || spot.name;
  const titleEn = spot.nameEn;

  const categoryTags = useMemo(() => {
    const tags: string[] = [];
    if (spot.category) tags.push(spot.category);
    if (spot.tags?.length) tags.push(...spot.tags);
    // De-dup while keeping order.
    return Array.from(new Set(tags)).slice(0, 6);
  }, [spot.category, spot.tags]);

  const sellingPoints = useMemo(() => {
    const points = spot.sellingPoints?.length ? spot.sellingPoints : undefined;
    if (points?.length) return clampArray(points, 3);
    // Fallback: use tags as "soft selling points" when structured data is missing.
    return clampArray(spot.tags, 3);
  }, [spot.sellingPoints, spot.tags]);

  const intro = spot.introduction || spot.reason;

  const photos = useMemo(() => {
    const list = (spot.photos && spot.photos.length > 0) ? spot.photos : [spot.image].filter(Boolean);
    return list.slice(0, 6);
  }, [spot.photos, spot.image]);

  const copyAddress = async () => {
    if (!spot.address) return;
    try {
      await navigator.clipboard.writeText(spot.address);
    } catch {
      // Clipboard APIs may be blocked; fallback to a prompt for manual copy.
      window.prompt('复制地址', spot.address);
    }
  };

  const Fact: React.FC<{ icon: string; label: string; value?: string }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2 text-sm text-gray-600">
        <i className={`${icon} text-brand-orange mt-0.5`}></i>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</div>
          <div className="truncate">{value}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all">
      <div className="flex flex-col lg:flex-row min-h-[260px]">
        {/* Media */}
        <div className="lg:w-[340px] relative overflow-hidden h-60 lg:h-auto">
          <img
            src={spot.image}
            alt={titleZh}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Top-left badge (rating) */}
          {typeof spot.rating === 'number' && (
            <div className="absolute top-4 left-4 bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
              <i className="fa-solid fa-star mr-1"></i> {spot.rating} Rating
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(spot.id);
            }}
            className={`absolute top-4 right-4 px-3 h-10 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-90 z-10 ${
              isLiked ? 'bg-brand-orange text-white' : 'bg-white/90 text-brand-orange hover:bg-white'
            }`}
            aria-pressed={isLiked}
            title={isLiked ? '已加入心愿单' : '加入心愿单'}
          >
            <i className={`${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
            <span className="text-xs font-bold hidden sm:inline">{isLiked ? '已种草' : '想去'}</span>
          </button>

          {/* Photo strip (desktop hint) */}
          {photos.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/55 via-black/0 to-transparent">
              <div className="flex gap-2">
                {photos.slice(0, 4).map((p, idx) => (
                  <img
                    key={idx}
                    src={p}
                    alt={`${titleZh} photo ${idx + 1}`}
                    className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/30"
                  />
                ))}
                {photos.length > 4 && (
                  <div className="w-10 h-10 rounded-lg bg-white/15 text-white text-xs font-bold flex items-center justify-center ring-1 ring-white/30">
                    +{photos.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {/* Title row */}
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="min-w-0">
              <h4 className="text-2xl font-bold text-brand-blue leading-tight">{titleZh}</h4>
              {titleEn && <div className="text-sm text-gray-400 mt-1 truncate">{titleEn}</div>}
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 text-sm font-bold text-brand-blue hover:text-brand-orange transition-colors"
            >
              {expanded ? '收起详情' : '展开详情'} <i className={`fa-solid ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'} ml-1`}></i>
            </button>
          </div>

          {/* Tags */}
          {categoryTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categoryTags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="text-[10px] bg-brand-lightBlue text-brand-blue px-3 py-1 rounded-full font-bold uppercase tracking-widest"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Selling points */}
          {sellingPoints.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">景区卖点</div>
              <div className="flex flex-wrap gap-2">
                {sellingPoints.map((p, i) => (
                  <span key={`${p}-${i}`} className="text-xs bg-orange-50 text-brand-orange px-3 py-1 rounded-full font-bold">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick facts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <Fact icon="fa-solid fa-location-dot" label="省市区" value={spot.region} />
            <Fact icon="fa-solid fa-train-subway" label="附近交通" value={spot.nearbyTransport} />
            <Fact icon="fa-solid fa-ticket" label="门票价格" value={spot.ticketPrice} />
            <Fact icon="fa-solid fa-clock" label="开放时间" value={spot.openingHours} />
            <Fact icon="fa-solid fa-hourglass-half" label="建议时长" value={spot.suggestedDuration} />
            <Fact icon="fa-solid fa-calendar-days" label="最佳日期" value={spot.bestVisitDate} />
          </div>

          {/* Intro */}
          {intro && (
            <p className={`text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {intro}
            </p>
          )}

          {/* Expanded details */}
          {expanded && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: description + audience */}
                <div>
                  {(spot.introduction || spot.reason) && (
                    <div className="mb-6">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">景区介绍</div>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {spot.introduction || spot.reason}
                      </div>
                    </div>
                  )}

                  {spot.suitableFor && spot.suitableFor.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">适合人群</div>
                      <div className="flex flex-wrap gap-2">
                        {spot.suitableFor.slice(0, 10).map((p, i) => (
                          <span key={`${p}-${i}`} className="text-xs bg-gray-50 text-gray-700 px-3 py-1 rounded-full font-bold border border-gray-100">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: location + ticketing */}
                <div>
                  {(spot.address || spot.ticketPurchase) && (
                    <div className="mb-6">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">位置与票务</div>

                      {spot.address && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-500 mb-1">地址</div>
                              <div className="text-sm text-gray-700 leading-relaxed">{spot.address}</div>
                            </div>
                            <button
                              onClick={copyAddress}
                              className="shrink-0 text-xs font-bold text-brand-blue hover:text-brand-orange transition-colors"
                            >
                              复制
                            </button>
                          </div>
                        </div>
                      )}

                      {spot.ticketPurchase && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100">
                          <div className="text-xs font-bold text-gray-500 mb-1">购票方式</div>
                          <div className="text-sm text-gray-700 leading-relaxed">{spot.ticketPurchase}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {spot.topReview && (
                    <div className="bg-orange-50/50 p-4 rounded-2xl border-l-4 border-brand-orange italic text-sm text-gray-600 relative">
                      <i className="fa-solid fa-quote-left absolute -top-2 -left-1 text-brand-orange/20 text-3xl"></i>
                      <p className="relative z-10">"{spot.topReview}"</p>
                      <div className="text-[10px] font-bold text-brand-orange mt-2 uppercase tracking-tighter">— Top Traveler Review</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenicSpotCardExpanded;

