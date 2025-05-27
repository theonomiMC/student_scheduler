export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-12">
      <div className="max-w-4xl mx-auto text-[10px]  px-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Scheduler App</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <a 
            href="https://github.com/theonomiMC" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-black transition"
          >
            GitHub
          </a>
          <a href="https://ewuni.edu.ge/en/" className="hover:text-black transition">East West University</a>
        </div>
      </div>
    </footer>
  );
}
