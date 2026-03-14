"use client";

import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarView({
    reservations,
    onEventClick,
}: {
    reservations: any[];
    onEventClick: (reservation: any) => void;
}) {
    const calendarRef = useRef<FullCalendar>(null);

    // Map backend reservations to FullCalendar events
    const events = reservations.map((r) => {
        // Use custom room color from DB, fallback to deterministic hash color if empty
        const roomName = r.room?.name || "알 수 없는 숙소";
        const roomColor = r.room?.color;
        
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e"];
        const textHash = Array.from(String(roomName)).reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const color = roomColor || colors[textHash % colors.length];

        return {
            id: r.id.toString(),
            title: `${roomName} - ${r.guest_name || '이름 없음'}`,
            start: r.check_in,
            end: r.check_out, // FullCalendar naturally excludes this day for allDay events
            allDay: true,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { ...r },
        };
    });

    return (
        <div className="w-full h-full min-h-[600px] fc-custom-theme">
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="ko"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,listWeek",
                }}
                events={events}
                eventClick={(info) => {
                    onEventClick(info.event.extendedProps);
                }}
                height="auto"
                contentHeight="auto"
            />
        </div>
    );
}
