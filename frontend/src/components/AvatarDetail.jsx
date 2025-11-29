import React, { useEffect, useState } from 'react';
import { Check, X, Shield } from 'lucide-react';
import BridgeQuestList from './BridgeQuestList';

function AvatarDetail({ avatarId }) {
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        if (!avatarId) return;

        fetch(`http://localhost:5000/api/recruiter/avatar/${avatarId}`)
            .then(res => res.json())
            .then(data => setDetail(data))
            .catch(err => console.error("Failed to fetch avatar detail:", err));
    }, [avatarId]);

    if (!detail) return <div className="card" style={{ padding: '24px' }}>Loading details...</div>;

    const { tree, quests } = detail;
    const covered = tree.nodes.filter(n => n.status === 'covered');
    const missing = tree.nodes.filter(n => n.status === 'missing');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
                <h4 style={{ marginBottom: '16px' }}>Skill Coverage</h4>

                <div style={{ marginBottom: '24px' }}>
                    <h5 style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Verified Skills</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {covered.map((node, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: '#FFF5F9',
                                    border: '1px solid var(--color-primary)',
                                    color: 'var(--color-primary)',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Shield size={14} />
                                {node.name}
                            </div>
                        ))}
                        {covered.length === 0 && <span className="text-muted">None</span>}
                    </div>
                </div>

                <div>
                    <h5 style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Missing Skills</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {missing.map((node, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: '#F3F4F6',
                                    border: '1px solid #D1D5DB',
                                    color: '#4B5563',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <X size={14} />
                                {node.name}
                                {node.importance === 'critical' && (
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} title="Critical"></span>
                                )}
                            </div>
                        ))}
                        {missing.length === 0 && <span className="text-muted">None</span>}
                    </div>
                </div>
            </div>

            <div>
                <h4 style={{ marginBottom: '16px' }}>Recommended Quests</h4>
                <BridgeQuestList quests={quests} />
            </div>
        </div>
    );
}

export default AvatarDetail;
