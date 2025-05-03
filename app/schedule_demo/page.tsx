'use client';

import { useState } from 'react';

export default function SchedulePage() {
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const generateSchedule = async () => {
        setLoading(true);
        setError(null);
        setSchedule(null);

        try {
            const res = await fetch('/api/demo_schedule', {method: 'POST'});

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Schedule generation failed');
            }

            setSchedule(data.schedule);
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Generate Your Schedule</h1>

        <button
            onClick={generateSchedule}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
        >
            {loading ? 'Generating...' : 'Generate Schedule'}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        {schedule && (
            <div className="mt-6">
            <h2 className="text-lg font-semibold">Generated Schedule:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2">
                {JSON.stringify(schedule, null, 2)}
            </pre>
            </div>
        )}
        </div>
    );
}
