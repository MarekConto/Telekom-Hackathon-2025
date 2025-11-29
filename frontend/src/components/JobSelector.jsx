import React from 'react';

function JobSelector({ jobs, selectedJobId, onSelect }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 500 }}>Select Job:</label>
            <select
                value={selectedJobId || ''}
                onChange={(e) => onSelect(e.target.value)}
                style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'inherit',
                    minWidth: '200px'
                }}
            >
                {jobs.map(job => (
                    <option key={job.jobId} value={job.jobId}>
                        {job.title}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default JobSelector;
