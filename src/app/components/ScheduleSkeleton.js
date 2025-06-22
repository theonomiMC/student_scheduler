import React from 'react';
import { times, days } from '@/utils/constants';

export default function ScheduleSkeleton() {
  return (
    <div className="p-4 bg-white min-h-screen flex flex-col animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-2 py-1 w-[35px]">Day</th>
              {times.map((time, i) => (
                <th key={i} className="px-2 py-1 text-right">
                  <div className="h-3 w-8 bg-gray-300 rounded mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, idx) => (
              <tr key={day} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-1 py-2 sticky left-0 bg-white font-bold text-xs z-10">
                  <div className="h-3 w-6 bg-gray-300 rounded mx-auto" />
                </td>
                {times.map((_, i) => (
                  <td key={i} className="px-1 py-3">
                    <div className="h-4 bg-gray-200 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
