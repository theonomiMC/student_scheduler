// components/Loader.js
export default function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
    </div>
  );
}
