'use client';

export default function Header() {
    return (

        <div className="py-6 flex flex-col items-center text-center space-y-2">
            {/* Logo */}
            <img
                src="/logo_2.png"
                alt="University Logo"
                className="h-20 w-auto"
            // style={{ filter: 'brightness(0) saturate(100%) invert(14%) sepia(46%) saturate(456%) hue-rotate(165deg) brightness(97%) contrast(95%)' }}
            />

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
