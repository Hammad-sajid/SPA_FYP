import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";

const CalendarView = ({ events, onDateSelect, onEventClick, initialView = "dayGridMonth" }) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay" , 
          }}
          selectable
          selectMirror
          editable={false}
          events={events}
          select={onDateSelect}
          eventClick={onEventClick}
          height="700px"
        />
      </div>
    </div>
  );
};

export default CalendarView;

