// components/Loader.js
export default function Loader() {
  return (
    <div className="flex items-center flex-col gap-2 justify-center h-screen bg-white">
      <span className="text-xl font-semibold block my-5">Coming soon</span>
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
    </div>
  );
}
