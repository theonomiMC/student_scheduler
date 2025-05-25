import React from 'react';

const ClassTooltip = ({ timeText, title, room, professor, rescheduled, semester }) => {

  return (
    <div
      className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        w-max max-w-[200px]
        p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg
        opacity-0 group-hover:opacity-100
        invisible group-hover:visible
        transition-opacity duration-300 ease-in-out
        z-50
        pointer-events-none
      "
    >
      <p className="font-bold">{title || 'No Title'}</p>
      {timeText && <p>Time: {timeText}</p>}
      {room && <p>Room: {room}</p>}
      {professor && <p>Professor: {professor}</p>}
      {semester && <p>Semester: {semester}</p>}
      {rescheduled && <p className="text-yellow-300 font-bold">Rescheduled!</p>}

      {/* Triangle pointer */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800"></div>
    </div>
  );
};

export default ClassTooltip;