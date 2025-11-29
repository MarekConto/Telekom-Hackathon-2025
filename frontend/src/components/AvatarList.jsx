import React, { useEffect, useState } from 'react';
import { User, ChevronRight } from 'lucide-react';

function AvatarList({ jobId, selectedAvatarId, onSelect }) {
    const [avatars, setAvatars] = useState([]);

    useEffect(() => {
        if (!jobId) return;

        fetch(`http://localhost:5000/api/recruiter/avatars/${jobId}`)
            .then(res => res.json())
            .then(data => setAvatars(data.avatars || []))
            .catch(err => console.error("Failed to fetch avatars:", err));
    }, [jobId]);

    if (!jobId) return <div className="text-muted">Select a job to see candidates.</div>;
    if (avatars.length === 0) return <div className="text-muted">No candidates found for this job.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {avatars.map(avatar => {
                const isSelected = selectedAvatarId === avatar.avatarId;
                return (
                    <div
                        key={avatar.avatarId}
                        className="card"
                        onClick={() => onSelect(avatar.avatarId)}
                        style={{
                            padding: '16px',
                            cursor: 'pointer',
                            border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                            backgroundColor: isSelected ? '#FFF5F9' : 'var(--color-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#E5E7EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <User size={20} color="#6B7280" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Candidate {avatar.avatarId.substring(0, 6)}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                    Match: <span style={{ color: avatar.matchScore > 0.7 ? '#10B981' : '#F59E0B', fontWeight: 600 }}>{Math.round(avatar.matchScore * 100)}%</span>
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={18} color="#9CA3AF" />
                    </div>
                );
            })}
        </div>
    );
}

export default AvatarList;
