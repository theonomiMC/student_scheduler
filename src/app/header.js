'use client';
import Link from "next/link";
import Image from 'next/image';

export default function Header() {
    return (

        <div className="py-6 flex flex-col items-center text-center space-y-2">
            {/* Logo */}

            <Link href={"/"}>
                <div className="w-full max-w-[300px] hidden sm:block">
                    <Image
                        src="/logo.webp"
                        alt="University Logo"
                        className="w-full h-auto object-contain mb-2"
                        width={300}
                        height={50}
                        priority
                    />
                </div>
                <h1 className="font-extrabold text-blue-950 m-0 sm:hidden">EAST - WEST UNIVERSITY</h1>
            </Link>
            {/* Subheading */}
            <h2 className="text-lg sm:text-xl font-light text-gray-600 tracking-wide">
                Student Class Schedule
            </h2>

            {/* Semester Info */}
            <p className="text-sm sm:text-base text-[#0f395d] font-medium tracking-wide">
                for <span className="font-semibold">Semesters I–VI</span>
            </p>
        </div>
    )

}
