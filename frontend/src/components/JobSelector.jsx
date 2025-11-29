import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

function JobSelector({ jobs, selectedJobId, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedJob = jobs.find(j => j.jobId === selectedJobId);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 500 }}>Select Job:</label>
            <div style={{ position: 'relative', minWidth: '250px' }} ref={dropdownRef}>
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        userSelect: 'none'
                    }}
                >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedJob ? selectedJob.title : 'Select a job...'}
                    </span>
                    <ChevronDown size={16} color="var(--color-text-muted)" />
                </div>

                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        maxHeight: '300px', // Approx 8 items (36px each)
                        overflowY: 'auto'
                    }}>
                        {jobs.map(job => (
                            <div
                                key={job.jobId}
                                onClick={() => {
                                    onSelect(job.jobId);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: job.jobId === selectedJobId ? '#FFF5F9' : 'transparent',
                                    color: job.jobId === selectedJobId ? 'var(--color-primary)' : 'inherit',
                                    borderBottom: '1px solid var(--color-border-light)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = job.jobId === selectedJobId ? '#FFF5F9' : '#F9FAFB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = job.jobId === selectedJobId ? '#FFF5F9' : 'transparent'}
                            >
                                <span>{job.title}</span>
                                {job.jobId === selectedJobId && <Check size={14} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default JobSelector;
