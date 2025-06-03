"use client";
import { useState, useEffect } from "react";
import { insertEvent, updateEvent } from "./api/semester/route";

export default function EventForm({ onSave, existingEvent }) {
    const [formData, setFormData] = useState({
        title: "",
        day_of_week: 1,
        startTime: "",
        endTime: "",
        semester: 1,
        room: "",
        professor: "",
        rescheduled: false,
    });
    useEffect(() => {
        if (existingEvent) {
            setFormData((prev) => ({
                ...prev,
                title: existingEvent?.title || "",
                semester: existingEvent?.extendedProps?.semester,
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
            [name]: type === "checkbox"
                ? checked
                : name === "semester" || name === "day_of_week"
                    ? parseInt(value, 10)
                    : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const parseTime = (t) => {
            const [hours, minutes] = t.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const start = parseTime(formData.startTime);
        const end = parseTime(formData.endTime);

        if (start >= end) {
            alert("Start time must be earlier than end time.");
            return;
        }
        const newEvent = {
            title: formData.title,
            start: formData.startTime,
            day_of_week: parseInt(formData.day_of_week),
            end: formData.endTime,
            semester: parseInt(formData.semester),
            room: formData.room,
            professor: formData.professor,
            // semester,
            rescheduled: formData.rescheduled !== undefined ? formData.rescheduled : false,
        };
        let editedEvent = {
            title: formData.title,
            room: formData.room,
            professor: formData.professor,
            semester: formData.semester,
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
            semester: 1,
            room: "",
            professor: "",
            rescheduled: false
        });
        if (onSave) {
            onSave();
        }
    };
    const handleCancelEdit = () => {
        // setFormData({
        //     title: "",
        //     day_of_week: 1,
        //     startTime: "",
        //     endTime: "",
        //     room: "",
        //     professor: "",
        //     rescheduled: false,
        // })
        if (onSave) {
            onSave();
        }
    }
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg">
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} className="input" required />
            <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="input" disabled={!!existingEvent}>
                {[1, 2, 3, 4, 5, 6].map((s) => {
                    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return (
                        <option key={s} value={s}>
                            {daysOfWeek[s - 1]}
                        </option>
                    )
                })}
            </select>
            <input type="time" name="startTime" min="09:00" max="18:00" value={formData.startTime} onChange={handleChange} className="input" required={!!existingEvent} disabled={!!existingEvent} />
            <input type="time"
                min="09:00" max="18:00"
                name="endTime" value={formData.endTime} onChange={handleChange} className="input" required={!!existingEvent} disabled={!!existingEvent} />
            <input type="text" name="room" placeholder="Room" value={formData.room} onChange={handleChange} className="input" />
            <input type="text" name="professor" placeholder="Professor" value={formData.professor} onChange={handleChange} className="input" />
            <select name="semester" value={formData.semester} onChange={handleChange} className="input">
                {[1, 2, 3, 4, 5, 6].map((s) => {
                    const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

                    return (
                        <option key={s} value={s}>
                            Semester {ROMAN_NUMERALS[s - 1]}
                        </option>
                    )
                })}
            </select>
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
            <div className="flex justify-center col-span-2 gap-4">
                <button
                    type="submit"
                    className="
                            w-full max-w-[180px]
                            bg-blue-800 text-white
                            
                            py-2 px-4 rounded
                            hover:shadow-md
                            font-medium transition"
                >

                    Save Class
                </button>
                <button type="button" onClick={handleCancelEdit} className="
                        w-full max-w-[100px]
                        border border-blue-800 text-blue-950
                        py-2 px-4 rounded
                        hover:shadow-md
                        transition">

                    Cancel
                </button>

            </div>

        </form>
    );
}
