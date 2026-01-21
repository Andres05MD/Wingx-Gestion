"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Trash } from 'lucide-react';
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

    // Render Calendar
    const calendarDays = [];
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="min-h-[6rem] md:min-h-[8rem] bg-black/20 border-r border-b border-white/5 last:border-r-0"></div>);
    }
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

        calendarDays.push(
            <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`min-h-[6rem] md:min-h-[8rem] p-2 relative group transition-all cursor-pointer border-b border-r border-white/5 last:border-r-0 hover:bg-white/[0.03] flex flex-col`}
            >
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 font-bold scale-110' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {day}
                    </span>
                    <button className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-pink-400 transition-all p-1 hover:bg-white/5 rounded-md">
                        <Plus size={14} />
                    </button>
                </div>

                <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {dayEvents.map(event => (
                        <div
                            key={event.id}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`text-[10px] md:text-xs p-1.5 rounded-lg border backdrop-blur-sm truncate flex justify-between items-center group/event transition-all hover:scale-[1.02] hover:shadow-lg shadow-black/10 cursor-pointer
                                ${event.type === 'delivery' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40' :
                                    event.type === 'meeting' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/40' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50'}
                            `}
                        >
                            <span className="truncate font-medium">{event.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex flex-col h-full bg-slate-950 pb-6"> {/* Ensure full height context if needed */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                            <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        Agenda
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-13">Organiza entregas y eventos</p>
                </div>

                <div className="flex items-center gap-4 bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-lg shadow-black/10">
                    <button onClick={handlePrevMonth} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"><ChevronLeft size={20} /></button>
                    <span className="font-bold text-lg text-white w-40 text-center select-none tracking-wide">{MONTH_NAMES[month]} {year}</span>
                    <button onClick={handleNextMonth} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="flex-1 bg-gradient-to-br from-white/[0.03] to-white/[0.005] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/20 overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day} className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                    {calendarDays}
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 p-8 space-y-6 relative overflow-hidden">
                        {/* Background Splashes */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none
                            ${selectedEvent.type === 'delivery' ? 'bg-emerald-500' : selectedEvent.type === 'meeting' ? 'bg-blue-500' : 'bg-slate-500'}`} />

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="font-bold text-xl text-white leading-tight">{selectedEvent.title}</h3>
                                <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mt-3
                                    ${selectedEvent.type === 'delivery' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        selectedEvent.type === 'meeting' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            'bg-slate-700/50 text-slate-300 border border-slate-600/50'}`}>
                                    {selectedEvent.type === 'delivery' ? 'Entrega' : selectedEvent.type === 'meeting' ? 'Cita' : 'Evento'}
                                </div>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Fecha</label>
                                <p className="text-slate-200 font-medium text-lg flex items-center gap-2">
                                    <CalendarIcon size={16} className="text-slate-400" />
                                    {selectedEvent.date}
                                </p>
                            </div>

                            {selectedEvent.id?.startsWith('apt-') || selectedEvent.id?.startsWith('del-') ? (
                                <div className="pt-2">
                                    <a
                                        href={`/pedidos?id=${selectedEvent.id.substring(4)}`}
                                        className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                                    >
                                        <span>Ver Detalle del Pedido</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <p className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Evento sincronizado automáticamente
                                    </p>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <button
                                        onClick={() => {
                                            if (selectedEvent.id) handleDeleteEvent(selectedEvent.id);
                                            setSelectedEvent(null);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 py-3.5 rounded-xl font-bold transition-all hover:border-red-500/30"
                                    >
                                        <Trash size={18} />
                                        Eliminar Evento
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {showModal && !selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 p-8 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-white/10">
                            <h3 className="font-bold text-xl text-white">Nuevo Evento</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                            <div className="p-2 bg-white/5 rounded-lg text-slate-300">
                                <CalendarIcon size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Fecha Seleccionada</p>
                                <p className="text-white font-medium">{selectedDate}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveEvent} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300 ml-1">Título del Evento</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 text-white placeholder-slate-500 transition-all font-medium"
                                    placeholder="Ej. Comprar materiales..."
                                    value={newEventTitle}
                                    onChange={e => setNewEventTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300 ml-1">Tipo de Evento</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewEventType('delivery')}
                                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${newEventType === 'delivery' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
                                    >
                                        Entrega
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewEventType('meeting')}
                                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${newEventType === 'meeting' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
                                    >
                                        Cita
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-pink-600/20 hover:shadow-pink-600/40 hover:-translate-y-0.5 transition-all">Guardar Evento</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
