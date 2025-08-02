import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-1 mt-12">
      <div className="max-w-6xl mx-auto  px-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
        <p className="hover:text-bred transition">&copy; {new Date().getFullYear()} <Link href='/'> Scheduler App</Link></p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <a 
            href="https://github.com/theonomiMC" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-bred transition"
          >
            GitHub
          </a>
          <a href="https://ewuni.edu.ge" target="_blank" className="hover:text-bred transition">East West University</a>
        </div>
      </div>
    </footer>
  );
}
