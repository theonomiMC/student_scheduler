"use client";
import { useState, useEffect } from "react";
import { insertEvent, updateEvent } from "./api/semester/route";

export default function EventForm({ onSave, semester, existingEvent }) {
    const [formData, setFormData] = useState({
        title: "",
        day_of_week: 1,
        startTime: "",
        endTime: "",
        room: "",
        professor: "",
        rescheduled: false,
    });
    useEffect(() => {
        if (existingEvent) {
            setFormData((prev)=>({...prev,  
                title: existingEvent?.title || "",
                room: existingEvent.extendedProps?.room || "",
                professor: existingEvent.extendedProps?.professor || "",
                rescheduled: existingEvent.extendedProps?.rescheduled || false,
            }));
        }
    }, [existingEvent]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : name === "day_of_week"
                        ? parseInt(value)
                        : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newEvent = {
            title: formData.title,
            start: formData.startTime,
            day_of_week: parseInt(formData.day_of_week),
            end: formData.endTime,
            room: formData.room,
            professor: formData.professor,
            semester,
            rescheduled: formData.rescheduled !== undefined ? formData.rescheduled : false,
        };
        let editedEvent = {
            title: formData.title,
            room: formData.room,
            professor: formData.professor,
            semester,
            rescheduled: formData.rescheduled !== undefined ? formData.rescheduled : false,
        };
        if (existingEvent?.id) {
            // ✏️ Update existing event
            
            await updateEvent(existingEvent.id, editedEvent);
        } else {
            // ➕ Insert new event
            await insertEvent(newEvent);
        }

        setFormData({
            title: "",
            day_of_week: 1,
            startTime: "",
            endTime: "",
            room: "",
            professor: "",
            rescheduled: false
        });
        if (onSave) {
            onSave();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg">
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} className="input" required/>
            <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="input" disabled={!!existingEvent}>
                {[1, 2, 3, 4, 5, 6].map((s) => (
                    <option key={s} value={s}>
                        Day {s}
                    </option>
                ))}
            </select>
            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="input" required= {!!existingEvent} disabled={!!existingEvent}/>
            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="input" required={!!existingEvent} disabled={!!existingEvent} />
            <input type="text" name="room" placeholder="Room" value={formData.room} onChange={handleChange} className="input" />
            <input type="text" name="professor" placeholder="Professor" value={formData.professor} onChange={handleChange} className="input" />

            {/* Rescheduled Checkbox */}
            <div className="col-span-2 flex items-center">
                <input
                    type="checkbox"
                    name="rescheduled"
                    id="rescheduled"
                    checked={!!formData.rescheduled}
                    onChange={handleChange}
                    className="mr-2"
                />
                <label htmlFor="rescheduled" className="text-gray-700">Rescheduled</label>
            </div>
            <div className="flex justify-center col-span-2">
                <button type="submit" className="
                        w-full max-w-[200px]
                        bg-[#0057b7] text-white
                        py-2 px-4 rounded
                        hover:bg-[#fed500] hover:text-[#0057b7]
                        font-semibold transition">
                    Save
                </button>
            </div>

        </form>
    );
}
