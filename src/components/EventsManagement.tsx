import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, MapPin, Clock, Users, Plus, CheckCircle, XCircle, 
  AlertCircle, Trophy, Plane, MessageSquare, ChevronLeft, CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface EventsManagementProps {
  category?: string;
  isParent?: boolean;
  playerId?: string;
}

type FilterType = 'all' | 'match' | 'trip' | 'tournament' | 'meeting';

export const EventsManagement: React.FC<EventsManagementProps> = ({ category, isParent, playerId }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadEvents();
  }, [category]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents(category);
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string, status: string) => {
    if (!playerId) return;
    try {
      await api.upsertEventResponse({
        event_id: eventId,
        player_id: playerId,
        status: status
      });
      setResponses({ ...responses, [eventId]: status });
      alert("✅ تم تسجيل ردكم بنجاح");
    } catch (error) {
      alert("❌ خطأ في تسجيل الرد");
    }
  };

  const getEventTypeConfig = (type: string) => {
    switch (type) {
      case 'match': return { label: 'مباراة', icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'trip': return { label: 'رحلة', icon: Plane, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'tournament': return { label: 'دورة كروية', icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'meeting': return { label: 'اجتماع', icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default: return { label: 'حدث', icon: CalendarDays, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
    }
  };

  const filters = [
    { id: 'all', label: 'الكل', icon: Calendar },
    { id: 'match', label: 'مباريات', icon: Trophy },
    { id: 'trip', label: 'رحلات', icon: Plane },
    { id: 'tournament', label: 'دورات', icon: Trophy },
    { id: 'meeting', label: 'اجتماعات', icon: MessageSquare },
  ];

  const filteredEvents = activeFilter === 'all' 
    ? events 
    : events.filter(e => e.event_type === activeFilter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-bold">جاري تحميل الأحداث...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Horizontal Scrollable Filters */}
      <div className="relative">
        <div className="flex overflow-x-auto pb-4 no-scrollbar gap-2 px-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all",
                activeFilter === filter.id 
                  ? "bg-emerald-600 text-white shadow-lg scale-105" 
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800"
              )}
            >
              <filter.icon className="w-4 h-4" />
              <span className="text-sm">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event) => {
            const config = getEventTypeConfig(event.event_type);
            const dateObj = new Date(event.start_time);
            
            return (
              <motion.div 
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl">
                  <CardContent className="p-0">
                    <div className="p-6 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className={cn("px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2", config.bg, config.color)}>
                          <config.icon className="w-3 h-3" />
                          {config.label}
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">
                            {dateObj.toLocaleDateString('ar-DZ', { weekday: 'long' })}
                          </p>
                          <p className="text-xl font-black text-white">
                            {dateObj.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-white group-hover:text-emerald-500 transition-colors leading-tight">
                          {event.title}
                        </h3>
                        <p className="text-xs text-zinc-500 font-medium line-clamp-2">{event.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/50 space-y-1">
                          <p className="text-[8px] text-zinc-600 font-black uppercase">التوقيت</p>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-black text-zinc-300">
                              {dateObj.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/50 space-y-1">
                          <p className="text-[8px] text-zinc-600 font-black uppercase">الموقع</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-black text-zinc-300 truncate">{event.location || 'غير محدد'}</span>
                          </div>
                        </div>
                      </div>

                      {isParent && (
                        <div className="pt-6 border-t border-zinc-800 space-y-4">
                          <p className="text-[10px] text-zinc-500 font-black uppercase text-center tracking-widest">تأكيد حضور اللاعب</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              onClick={() => handleRSVP(event.id, 'attending')}
                              className={cn(
                                "h-12 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95",
                                responses[event.id] === 'attending' 
                                  ? "bg-emerald-600 text-white" 
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white"
                              )}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>سأحضر</span>
                            </Button>
                            <Button 
                              onClick={() => handleRSVP(event.id, 'declined')}
                              className={cn(
                                "h-12 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95",
                                responses[event.id] === 'declined' 
                                  ? "bg-rose-600 text-white" 
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white"
                              )}
                            >
                              <XCircle className="w-4 h-4" />
                              <span>لا أستطيع</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredEvents.length === 0 && (
        <div className="py-20 text-center bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
          <Calendar className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-600 font-black">لا توجد أحداث متاحة ضمن هذا التصنيف</p>
        </div>
      )}
    </div>
  );
};
