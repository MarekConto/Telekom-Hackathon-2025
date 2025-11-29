import React from 'react';
import { Map, Clock, ArrowRight } from 'lucide-react';

function BridgeQuestList({ quests }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quests.map(quest => (
                <div key={quest.id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#E0F2FE',
                            color: '#0284C7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Map size={18} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>{quest.title}</h4>
                            <p className="text-muted" style={{ fontSize: '14px', marginBottom: '8px', lineHeight: '1.4' }}>
                                {quest.description}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={14} />
                                    {quest.estimatedHours}h est.
                                </span>
                                <button style={{ color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Start Quest <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {quests.length === 0 && (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No quests needed! You are a perfect match.
                </div>
            )}
        </div>
    );
}

export default BridgeQuestList;
