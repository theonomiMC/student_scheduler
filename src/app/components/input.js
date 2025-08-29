"use client";
import { useState, useEffect } from "react";
import { deleteRoom, getAllRooms, getAvailableRooms, insertEvent, insertRoom, updateEvent } from "../api/semester/route";
import { sanitizer, normalizeTime } from "@/utils/helper";
import {
    Combobox,
    ComboboxInput,
    ComboboxOptions,
    ComboboxOption,
} from "@headlessui/react";
import { Trash2 } from 'lucide-react';

export default function EventForm({ onSave,
    existingEvent,
    availableTitles = [], }) {

    const [titleQuery, setTitleQuery] = useState("");
    const [availableRooms, setAvailableRooms] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [roomQuery, setRoomQuery] = useState("");

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
    // Fetch all rooms on component mount
    useEffect(() => {
        const loadRooms = async () => {
            const data = await getAllRooms();
            setAllRooms(data);
        };
        loadRooms();
    }, []);

    // Fetch available rooms whenever day_of_week, startTime, or endTime changes
    useEffect(() => {
        const fetchRooms = async () => {
            if (formData.day_of_week && formData.startTime && formData.endTime) {
                const data = await getAvailableRooms(
                    formData.day_of_week,
                    formData.startTime,
                    formData.endTime
                );
                const rooms = data.map(r => r.room).filter(r => r && r.trim().length > 0 && r !== "Aladashvili Clinic");
                setAvailableRooms(rooms);
            }
        };

        fetchRooms();
    }, [formData.day_of_week, formData.startTime, formData.endTime]);

    const handleDeleteRoom = async (room) => {
        const confirm = window.confirm(`Are you sure you want to delete the room "${room}"?`);
        if (!confirm) return;
        console.log("Deleting room:", room);
        const { error } = await deleteRoom(room);
        if (error) {
            console.log("Error deleting room:", error.message);
            return;
        }
        const updatedRooms = await getAllRooms();
        setAllRooms(updatedRooms);
        // 🔁 Refresh available rooms
        if (formData.day_of_week && formData.startTime && formData.endTime) {
            const data = await getAvailableRooms(
                formData.day_of_week,
                formData.startTime,
                formData.endTime
            );

            const filtered = data
                .map(r => r.room || r.name)
                .filter(r => r && r.trim().length > 0 && r !== "Aladashvili Clinic");

            setAvailableRooms(filtered);
        }
    }
    useEffect(() => {
        if (existingEvent) {
            const updatedFormData = {
                title: existingEvent?.title || "",
                day_of_week: existingEvent?.extendedProps?.day_of_week || 1,
                startTime: normalizeTime(existingEvent?.startTime) || "",
                endTime: normalizeTime(existingEvent?.endTime) || "",
                semester: existingEvent?.extendedProps?.semester,
                room: existingEvent.extendedProps?.room || "",
                professor: existingEvent.extendedProps?.professor || "",
                rescheduled: existingEvent.extendedProps?.rescheduled || false,
            }
            setFormData((prev) => ({
                ...prev,
                ...updatedFormData
            }));

            setTitleQuery(existingEvent?.title || "");
            const fetchRooms = async () => {
                if (existingEvent.day_of_week && existingEvent.startTime && existingEvent.endTime) {
                    const data = await getAvailableRooms(
                        existingEvent.day_of_week,
                        existingEvent.startTime,
                        existingEvent.endTime
                    );
                    const rooms = data.map(r => r.name)
                        .filter(r => r && r.trim().length > 0);

                    setAvailableRooms(rooms);
                }
            };

            fetchRooms();
        }
    }, [existingEvent]);
    const filteredRooms =
        roomQuery === ""
            ? availableRooms
            : availableRooms.filter((r) =>
                r.toLowerCase().includes(roomQuery.toLowerCase())
            );


    const filteredTitles = titleQuery === ""
        ? availableTitles
        : availableTitles.filter((t) =>
            t.toLowerCase().includes(titleQuery?.toLowerCase())
        );

    const handleTitleChange = (value) => {
        setFormData((prev) => ({ ...prev, title: value }));
        setTitleQuery(value);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let val = value;

        if (name === "startTime" || name === "endTime") {
            val = normalizeTime(value);
        }

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox"
                ? checked
                : name === "semester" || name === "day_of_week"
                    ? parseInt(val, 10)
                    : val,
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
        if (!formData.title || formData.title.trim() === "") {
            alert("შეიყვანეთ სახელი / Title is required.");
            return;
        }
        // if (!availableRooms.includes(formData.room) && formData.room.trim() !== "") {
        //     const confirm = window.confirm(`The room "${formData.room}" is occupied.Do you want to proceed?`);
        //     if (!confirm) {
        //         return;
        //     }
        // }
        const normilizedTitle = sanitizer(formData.title);
        const normilizedRoom = sanitizer(formData.room);
        const normilizedProfessor = sanitizer(formData.professor);

        if (normilizedRoom && !allRooms.includes(normilizedRoom)) {
            const { error } = await insertRoom({ name: normilizedRoom });
            if (error) {
                alert("Error inserting new room:", error.message);
                return
            }
        }
        const newEvent = {
            title: normilizedTitle,
            start: formData.startTime,
            day_of_week: parseInt(formData.day_of_week),
            end: formData.endTime,
            semester: parseInt(formData.semester),
            room: normilizedRoom,
            professor: normilizedProfessor,
            rescheduled: formData.rescheduled !== undefined ? formData.rescheduled : false,
        };
        let editedEvent = {
            title: normilizedTitle,
            room: normilizedRoom,
            professor: normilizedProfessor,
            semester: formData.semester,
            start: formData.startTime,
            end: formData.endTime,
            day_of_week: parseInt(formData.day_of_week), // Ensure day_of_week is an integer
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

        if (onSave) {
            onSave();
        }
    }
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg">
            {/* ✅ NEW: Replaced title input with Headless UI Combobox */}
            <div className="col-span-2">
                <Combobox value={formData.title} onChange={handleTitleChange}>
                    <div className="relative">
                        <ComboboxInput
                            className="input w-full"
                            placeholder="Subject Title"
                            onChange={(e) => handleTitleChange(e.target.value)}
                            displayValue={(val) => val}
                        />
                        {filteredTitles.length > 0 && (
                            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-200 shadow-lg">
                                {filteredTitles.map((title, idx) => (
                                    <ComboboxOption
                                        key={idx}
                                        value={title}
                                        className={({ active }) =>
                                            `cursor-pointer select-none py-2 px-4 ${active ? "bg-blue-600 text-white" : "text-gray-900"
                                            }`
                                        }
                                    >
                                        {title}
                                    </ComboboxOption>
                                ))}
                            </ComboboxOptions>
                        )}
                    </div>
                </Combobox>
            </div>
            {/* START TIME */}
            <input type="time" name="startTime" min="09:00"
                max="19:00" value={formData.startTime} onChange={handleChange}
                className="input" required={!!existingEvent} />
            {/* END TIME */}
            <input type="time"
                min="11:00" max="20:00"
                name="endTime" value={formData.endTime} onChange={handleChange} className="input"
                required={!!existingEvent} />
            {/* DAY OF WEEK */}
            <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="input"            >
                {[1, 2, 3, 4, 5, 6].map((s) => {
                    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return (
                        <option key={s} value={s}>
                            {daysOfWeek[s - 1]}
                        </option>
                    )
                })}
            </select>
            {/* ADD ROOM */}
            {/* <div className="col-span-6"> */}
            <Combobox value={formData.room} onChange={(val) => setFormData((p) => ({ ...p, room: val }))}>
                <div className="relative">
                    <ComboboxInput
                        className="input w-full"
                        placeholder="Add new room or select existing"
                        onChange={(e) => {
                            setRoomQuery(e.target.value);
                            setFormData((prev) => ({ ...prev, room: e.target.value }));
                        }}
                        // value={formData?.room}
                        displayValue={(val) => val}
                    />
                    {filteredRooms?.length > 0 && (
                        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-200 shadow-lg">
                            {filteredRooms.map((room, idx) => (
                                <ComboboxOption
                                    key={idx}
                                    value={room}
                                    className={({ active }) =>
                                        `cursor-pointer select-none py-2 px-4 ${active ? "bg-blue-600 text-white" : "text-gray-900"
                                        }`
                                    }
                                >
                                    {room}
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    )}
                </div>
            </Combobox>
            {/* LIST OF AVAILABLE ROOMS */}

            {availableRooms?.length > 0 && (
                <div className="col-span-2">
                    <p className="text-sm text-blue-700">
                        <span className="font-semibold text-blue-800">თავისუფალია:</span>{' '}
                        <span className="flex flex-wrap gap-2 mt-1">
                            {availableRooms
                                .sort((a, b) =>
                                    a.toLowerCase().localeCompare(b.toLowerCase(), undefined, { numeric: true })
                                )
                                .map((room, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                                    >
                                        {room}
                                        <button
                                            onClick={() => handleDeleteRoom(room)}
                                            className="hover:text-red-600 transition-colors"
                                            aria-label={`Delete ${room}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </span>
                                ))}
                        </span>
                    </p>
                </div>
            )}

            {/* ADD PROFESSOR */}
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
