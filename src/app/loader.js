// components/Loader.js
export default function Loader({ message = "Loading..."}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-700">
      {/* Dots animation */}
      <div className="flex space-x-2 my-4">
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
      </div>

      {/* Dynamic message */}
      <span className="text-lg sm:text-xl font-semibold text-center px-4">
        {message}
      </span>
    </div>
  );
}
