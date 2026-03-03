"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Trash, LayoutGrid, List } from 'lucide-react';
import { getEvents, saveEvent, deleteEvent, CalendarEvent } from '@/services/storage';
import Swal from 'sweetalert2';
import { useOrders } from '@/context/OrdersContext';
import { logger } from "@/lib/logger";

// Helper to get days in month
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function AgendaPage() {
    const { orders } = useOrders(); // ✅ Consumir contexto global

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [storedEvents, setStoredEvents] = useState<CalendarEvent[]>([]); // Solo eventos manuales
    const [events, setEvents] = useState<CalendarEvent[]>([]); // Combinados
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Form
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventType, setNewEventType] = useState<'delivery' | 'meeting' | 'other'>('delivery');

    // ✅ Cargar solo eventos manuales del storage
    useEffect(() => {
        loadStoredEvents();
    }, []);

    const loadStoredEvents = async () => {
        try {
            const data = await getEvents();
            setStoredEvents(data);
        } catch (error) {
            logger.error("Error loading events", error as Error, { component: 'AgendaPage' });
        }
    };

    // ✅ Combinar eventos manuales con eventos de pedidos (OrdersContext)
    useEffect(() => {
        const orderEvents: CalendarEvent[] = [];

        // Optimización: Procesar orders solo si cambian
        if (orders && orders.length > 0) {
            orders.forEach(order => {
                if (order.appointmentDate) {
                    const date = order.appointmentDate.split('T')[0];
                    orderEvents.push({
                        id: `apt-${order.id}`,
                        title: `Cita: ${order.clientName} - ${order.garmentName}`,
                        date: date,
                        type: 'meeting'
                    });
                }
                if (order.deliveryDate) {
                    const date = order.deliveryDate.split('T')[0];
                    orderEvents.push({
                        id: `del-${order.id}`,
                        title: `Entrega: ${order.clientName} - ${order.garmentName}`,
                        date: date,
                        type: 'delivery'
                    });
                }
            });
        }

        setEvents([...storedEvents, ...orderEvents]);
    }, [orders, storedEvents]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedEvent(event);
    };

    const handleDayClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setShowModal(true);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !newEventTitle) return;

        try {
            await saveEvent({
                title: newEventTitle,
                date: selectedDate,
                type: newEventType
            });
            setNewEventTitle("");
            setShowModal(false);
            loadStoredEvents();
            Swal.fire({ title: 'Evento guardado', icon: 'success', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        } catch (error) {
            logger.error("Error saving event", error as Error, { component: 'AgendaPage' });
        }
    };

    async function handleDeleteEvent(id: string) {
        try {
            await deleteEvent(id);
            setEvents(events.filter(e => e.id !== id));
        } catch (e) { console.error(e); }
    }

    // Mobile: selected day for bottom panel
    const [mobileSelectedDay, setMobileSelectedDay] = useState<number | null>(new Date().getDate());

    const handleMobileDaySelect = useCallback((day: number) => {
        setMobileSelectedDay(day);
    }, []);

    const mobileSelectedDateStr = mobileSelectedDay
        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(mobileSelectedDay).padStart(2, '0')}`
        : null;
    const mobileSelectedEvents = mobileSelectedDateStr ? events.filter(e => e.date === mobileSelectedDateStr) : [];
    const mobileSelectedDayOfWeek = mobileSelectedDay ? DAYS_OF_WEEK[new Date(year, month, mobileSelectedDay).getDay()] : '';

    // Desktop calendar days (full events)
    const desktopCalendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        desktopCalendarDays.push(<div key={`empty-${i}`} className="min-h-[8rem] bg-black/20 border-r border-b border-white/5 last:border-r-0"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        desktopCalendarDays.push(
            <div key={day} onClick={() => handleDayClick(day)}
                className="min-h-[8rem] p-2 relative group transition-all cursor-pointer border-b border-r border-white/5 last:border-r-0 hover:bg-white/[0.03] flex flex-col">
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-white text-black shadow-lg font-black' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{day}</span>
                    <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-100 transition-all p-1 hover:bg-white/5 rounded-md"><Plus size={14} /></button>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                    {dayEvents.map(event => (
                        <div key={event.id} onClick={(e) => handleEventClick(event, e)}
                            className={`text-xs p-1.5 rounded-lg border truncate font-medium cursor-pointer transition-all hover:scale-[1.02]
                                ${event.type === 'delivery' ? 'bg-emerald-500/10 border-emerald-500/20 text-zinc-100' :
                                    event.type === 'meeting' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-zinc-700/30 border-zinc-600/30 text-zinc-400'}`}>
                            {event.title}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Mobile calendar (compact dots)
    const mobileCalendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        mobileCalendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        const isSelected = mobileSelectedDay === day;

        mobileCalendarDays.push(
            <button key={day} type="button"
                onClick={() => handleMobileDaySelect(day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90 relative
                    ${isSelected ? 'bg-white text-black shadow-lg shadow-white/10' :
                        isToday ? 'bg-white/10 text-white ring-1 ring-white/30' :
                            'text-zinc-400 hover:bg-white/5'}`}>
                <span className={`text-sm font-bold ${isSelected ? 'text-black' : ''}`}>{day}</span>
                {dayEvents.length > 0 && (
                    <div className="flex gap-0.5">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                            <span key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? (
                                ev.type === 'delivery' ? 'bg-emerald-600' : ev.type === 'meeting' ? 'bg-blue-600' : 'bg-zinc-600'
                            ) : (
                                ev.type === 'delivery' ? 'bg-emerald-400' : ev.type === 'meeting' ? 'bg-blue-400' : 'bg-zinc-500'
                            )}`} />
                        ))}
                        {dayEvents.length > 3 && <span className={`text-[8px] font-bold ${isSelected ? 'text-black/60' : 'text-zinc-500'}`}>+</span>}
                    </div>
                )}
            </button>
        );
    }

    return (
        <div className="space-y-3 md:space-y-6 flex flex-col h-[calc(100dvh-140px)] md:h-[calc(100vh-100px)] bg-black md:pb-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 shrink-0">
                <div className="flex items-center justify-between md:justify-start gap-3 md:gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/40">
                                <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-black" />
                            </div>
                            Agenda
                        </h1>
                        <p className="text-zinc-400 text-sm mt-1 ml-13 hidden md:block">Organiza entregas y eventos</p>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 md:ml-6">
                        <button onClick={() => setView('calendar')}
                            className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setView('list')}
                            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                            <List size={18} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-lg shadow-black/10 self-center md:self-auto">
                    <button onClick={handlePrevMonth} className="p-2.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95"><ChevronLeft size={20} /></button>
                    <span className="font-bold text-lg text-white w-40 text-center select-none tracking-wide">{MONTH_NAMES[month]} {year}</span>
                    <button onClick={handleNextMonth} className="p-2.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95"><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {view === 'calendar' ? (
                    <>
                        {/* ── MOBILE Calendar ── */}
                        <div className="md:hidden flex flex-col flex-1 overflow-hidden">
                            {/* Compact Grid */}
                            <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.005] rounded-2xl border border-white/10 p-2 shrink-0">
                                <div className="grid grid-cols-7 mb-1">
                                    {DAYS_OF_WEEK.map(d => (
                                        <div key={d} className="py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-0.5">
                                    {mobileCalendarDays}
                                </div>
                            </div>

                            {/* Selected Day Events Panel */}
                            <div className="flex-1 mt-3 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-1 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold text-lg">
                                            {mobileSelectedDay && `${mobileSelectedDayOfWeek} ${mobileSelectedDay}`}
                                        </span>
                                        {mobileSelectedEvents.length > 0 && (
                                            <span className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                                {mobileSelectedEvents.length} {mobileSelectedEvents.length === 1 ? 'evento' : 'eventos'}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => mobileSelectedDay && handleDayClick(mobileSelectedDay)}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                                    {mobileSelectedEvents.length > 0 ? (
                                        mobileSelectedEvents.map(event => (
                                            <div key={event.id} onClick={(e) => handleEventClick(event, e)}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3
                                                    ${event.type === 'delivery' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                                        event.type === 'meeting' ? 'bg-blue-500/5 border-blue-500/20' :
                                                            'bg-zinc-800/30 border-zinc-700/30'}`}>
                                                <div className={`w-1 h-10 rounded-full shrink-0
                                                    ${event.type === 'delivery' ? 'bg-emerald-400' :
                                                        event.type === 'meeting' ? 'bg-blue-400' : 'bg-zinc-500'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold text-sm truncate">{event.title}</p>
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5
                                                        ${event.type === 'delivery' ? 'text-emerald-400' :
                                                            event.type === 'meeting' ? 'text-blue-400' : 'text-zinc-500'}`}>
                                                        {event.type === 'delivery' ? 'Entrega' : event.type === 'meeting' ? 'Cita' : 'Evento'}
                                                    </p>
                                                </div>
                                                <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
                                            <CalendarIcon size={24} className="mb-2 opacity-40" />
                                            <p className="text-sm font-medium">Sin eventos</p>
                                            <button onClick={() => mobileSelectedDay && handleDayClick(mobileSelectedDay)}
                                                className="mt-3 text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 transition-all active:scale-95">
                                                <Plus size={12} /> Agregar evento
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── DESKTOP Calendar ── */}
                        <div className="hidden md:flex flex-col flex-1 bg-gradient-to-br from-white/[0.03] to-white/[0.005] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/20 overflow-hidden">
                            <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
                                {DAYS_OF_WEEK.map(d => (
                                    <div key={d} className="py-4 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                                {desktopCalendarDays}
                            </div>
                        </div>
                    </>
                ) : (
                    /* ── LIST VIEW ── */
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-white/[0.03] to-white/[0.005] rounded-3xl border border-white/10">
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayEvents = events.filter(e => e.date === dateStr);
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                            const dayOfWeek = DAYS_OF_WEEK[new Date(year, month, day).getDay()];
                            return (
                                <div key={day} className={`flex gap-4 p-4 rounded-2xl border transition-all ${isToday ? 'bg-white/[0.03] border-white/20 shadow-lg shadow-black/40' : 'bg-transparent border-white/5 hover:bg-white/[0.02]'}`}>
                                    <div className="flex flex-col items-center min-w-[3.5rem]">
                                        <span className="text-xs font-bold text-zinc-500 uppercase">{dayOfWeek}</span>
                                        <span className={`text-2xl font-bold mt-1 ${isToday ? 'text-white' : 'text-zinc-300'}`}>{day}</span>
                                    </div>
                                    <div className="flex-1 space-y-2 border-l border-white/10 pl-4 py-1">
                                        {dayEvents.length > 0 ? dayEvents.map(event => (
                                            <div key={event.id} onClick={(e) => handleEventClick(event, e)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between
                                                    ${event.type === 'delivery' ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-100' :
                                                        event.type === 'meeting' ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' :
                                                            'bg-zinc-700/20 border-zinc-600/30 text-zinc-400'}`}>
                                                <span className="font-medium truncate">{event.title}</span>
                                                <span className="text-[10px] opacity-70 border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    {event.type === 'delivery' ? 'Entrega' : event.type === 'meeting' ? 'Cita' : 'Otro'}
                                                </span>
                                            </div>
                                        )) : (
                                            <div className="h-full flex items-center">
                                                <button onClick={() => handleDayClick(day)} className="text-sm text-zinc-600 hover:text-zinc-400 flex items-center gap-2 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                                                    <Plus size={14} /> Sin eventos
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-t-3xl md:rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 p-6 md:p-8 space-y-5 relative overflow-hidden">
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none
                            ${selectedEvent.type === 'delivery' ? 'bg-emerald-500' : selectedEvent.type === 'meeting' ? 'bg-blue-500' : 'bg-zinc-500'}`} />
                        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-2 mb-2 md:hidden" />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="font-bold text-xl text-white leading-tight">{selectedEvent.title}</h3>
                                <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mt-3
                                    ${selectedEvent.type === 'delivery' ? 'bg-emerald-500/10 text-zinc-100 border border-emerald-500/20' :
                                        selectedEvent.type === 'meeting' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            'bg-zinc-700/50 text-zinc-300 border border-zinc-600/50'}`}>
                                    {selectedEvent.type === 'delivery' ? 'Entrega' : selectedEvent.type === 'meeting' ? 'Cita' : 'Evento'}
                                </div>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="p-2 -mr-2 -mt-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="space-y-5 relative z-10">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Fecha</label>
                                <p className="text-zinc-200 font-medium text-lg flex items-center gap-2">
                                    <CalendarIcon size={16} className="text-zinc-400" />
                                    {selectedEvent.date}
                                </p>
                            </div>
                            {selectedEvent.id?.startsWith('apt-') || selectedEvent.id?.startsWith('del-') ? (
                                <div className="pt-1">
                                    <a href={`/pedidos?id=${selectedEvent.id.substring(4)}`}
                                        className="group w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-black/40 hover:-translate-y-0.5 active:scale-[0.98]">
                                        <span>Ver Detalle del Pedido</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <p className="text-xs text-center text-zinc-500 mt-3 flex items-center justify-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Evento sincronizado
                                    </p>
                                </div>
                            ) : (
                                <button onClick={() => { if (selectedEvent.id) handleDeleteEvent(selectedEvent.id); setSelectedEvent(null); }}
                                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]">
                                    <Trash size={18} /> Eliminar Evento
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {showModal && !selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-t-3xl md:rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 p-6 md:p-8 space-y-5">
                        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-2 mb-1 md:hidden" />
                        <div className="flex justify-between items-center pb-3 border-b border-white/10">
                            <h3 className="font-bold text-xl text-white">Nuevo Evento</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                            <div className="p-2 bg-white/5 rounded-lg text-zinc-300"><CalendarIcon size={18} /></div>
                            <div>
                                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Fecha</p>
                                <p className="text-white font-medium">{selectedDate}</p>
                            </div>
                        </div>
                        <form onSubmit={handleSaveEvent} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-300 ml-1">Título del Evento</label>
                                <input autoFocus type="text"
                                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30 focus:ring-4 focus:ring-white/5 text-white placeholder-zinc-500 transition-all font-medium min-h-[44px]"
                                    placeholder="Ej. Comprar materiales..." value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-300 ml-1">Tipo</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setNewEventType('delivery')}
                                        className={`py-3 rounded-xl text-sm font-bold border transition-all min-h-[44px] active:scale-95 ${newEventType === 'delivery' ? 'bg-emerald-500/20 border-emerald-500/50 text-zinc-100' : 'bg-black/20 border-white/5 text-zinc-400'}`}>
                                        Entrega
                                    </button>
                                    <button type="button" onClick={() => setNewEventType('meeting')}
                                        className={`py-3 rounded-xl text-sm font-bold border transition-all min-h-[44px] active:scale-95 ${newEventType === 'meeting' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/20 border-white/5 text-zinc-400'}`}>
                                        Cita
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-white text-black py-3.5 rounded-xl font-bold shadow-lg shadow-black/40 transition-all hover:bg-zinc-200 active:scale-[0.98] min-h-[44px]">Guardar Evento</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
