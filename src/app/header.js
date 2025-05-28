'use client';
import Link from "next/link";
import Image from 'next/image';

export default function Header() {
    return (

        <div className="py-6 flex flex-col items-center text-center space-y-2">
            {/* Logo */}
            <Link href={"/"}>
            <Image
                src="/logo_2.png"
                alt="University Logo"
                 height={80}
                 width={auto}
            />
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
