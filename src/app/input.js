"use client";
import { useState } from "react";
import { insertEvent } from "./api/semester/route";

export default function EventForm({ onSave, semester }) {
    const [formData, setFormData] = useState({
        title: "",
        day_of_week: 1,
        startTime: "",
        endTime: "",
        room: "",
        professor: "",
        // semester: 1,
    });

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

        await insertEvent(newEvent); // This should call your DB insert
        setFormData({
            title: "",
            day_of_week: 1,
            startTime: "",
            endTime: "",
            room: "",
            professor: "",
            rescheduled: false
        });
        if (onSave) { // Check if onSave prop was provided
            onSave(); // Call it after successful save
        }
        console.log(newEvent)
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-w-3xl mx-auto p-4 bg-white shadow-md rounded-lg">
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} className="input" required />
            <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="input">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                    <option key={s} value={s}>
                        Day {s}
                    </option>
                ))}
            </select>
            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="input" required />
            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="input" required />
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
            <button type="submit" className="col-span-2 bg-[#0f395d] text-white py-2 px-4 rounded hover:bg-[#0d2f4b]">
                Save
            </button>
        </form>
    );
}
