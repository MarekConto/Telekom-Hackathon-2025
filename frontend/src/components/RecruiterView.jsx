import React, { useState, useEffect } from 'react';
import JobSelector from './JobSelector';
import AvatarList from './AvatarList';
import AvatarDetail from './AvatarDetail';

function RecruiterView() {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [selectedAvatarId, setSelectedAvatarId] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/jobs')
            .then(res => res.json())
            .then(data => {
                setJobs(data);
                if (data.length > 0) setSelectedJobId(data[0].jobId);
            })
            .catch(err => console.error("Failed to fetch jobs:", err));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2>Recruiter Dashboard</h2>
                    <JobSelector
                        jobs={jobs}
                        selectedJobId={selectedJobId}
                        onSelect={setSelectedJobId}
                    />
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <section>
                    <h3 style={{ marginBottom: '16px' }}>Candidates (Anonymous)</h3>
                    <AvatarList
                        jobId={selectedJobId}
                        selectedAvatarId={selectedAvatarId}
                        onSelect={setSelectedAvatarId}
                    />
                </section>

                <section>
                    <h3 style={{ marginBottom: '16px' }}>Candidate Detail</h3>
                    {selectedAvatarId ? (
                        <AvatarDetail avatarId={selectedAvatarId} />
                    ) : (
                        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Select a candidate to view details
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default RecruiterView;
