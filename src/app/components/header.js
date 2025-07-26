'use client';
import Link from "next/link";
import Image from 'next/image';

export default function Header() {
    return (

        <div className="py-6 flex flex-col items-center text-center space-y-2">
            {/* Logo */}

            <Link href={"/"}>
                <div className="w-full max-w-[250px] hidden sm:block">
                    <Image
                        src="/logo.webp"
                        alt="University Logo"
                        className="w-full h-auto object-contain mb-2"
                        width={300}
                        height={50}
                        priority
                    />
                </div>
                <h1 className="font-extrabold font-[montserrat] text-bred m-0 sm:hidden text-[1.1rem]">EAST - WEST UNIVERSITY</h1>
            </Link>
            {/* Subheading */}
            <h2 className="text-[1rem] font-[montserrat] sm:text-lg text-bblue tracking-wide weight-semibold">
                Student Class Schedule for Semesters<span className="font-semibold text-[#8b0015]"> I–VI</span>
            </h2>
        </div>
    )

}
