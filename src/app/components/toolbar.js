'use client'

export default function EventToolbar({ user, showForm, setShowForm, handleResetRescheduled, semesters, currentSemester, handleManualSemesterChange }) {
    const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    return (
        <div className="tools px-5 ">
          {/* <AuthButton /> */}
        {!user && <div className="max-w-6xl mx-auto px-4 text-xs text-gray-400">Student Schedule</div>}
        {user && (
          <div className="flex gap-3 border-l-2 border-r-2 px-2 border-gray-100">
            {/* Add class button */}
            <button
              type="button"
              onClick={() => setShowForm(prev => !prev)}
              className="px-1 flex items-center gap-2 text-[0.8em] max-h-max text-blue-800 cursor-pointer font-medium text-center transition-all duration-500 hover:text-red-600"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.22229 5.00011H8.77785M5.00007 8.77789V1.22233" stroke="#5551FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>{' '}
              {showForm ? 'Hide Form' : 'Add'}
            </button>
            {/* Reset button */}
            <button type="button" onClick={handleResetRescheduled} className="reset-btn">
              Reset
            </button>
          </div>
        )}
        {/* Semesters */}
        {user && (
          <div className="">
            <span className="text-lg">🎓: </span>
            {semesters &&
              semesters.map((sem, idx) => {
                const isActive = currentSemester === sem;
                const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
                return (
                  <button
                    key={idx}
                    onClick={() => handleManualSemesterChange(sem)}
                    className={`py-2 px-2 text-sm font-semibold transition-all duration-500 hover:text-red-600 ${isActive ? 'text-red-600' : 'text-slate-700'}`}
                  >
                    {ROMAN_NUMERALS[sem - 1]}
                  </button>
                );
              })}
          </div>
        )}
      </div>
    );
}
