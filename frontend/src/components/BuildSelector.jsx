import React from 'react';
import { Briefcase, CheckCircle, AlertCircle } from 'lucide-react';

function BuildSelector({ builds, selectedBuild, onSelect }) {
    return (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {builds.map(build => {
                const isSelected = selectedBuild?.jobId === build.jobId;
                return (
                    <div
                        key={build.jobId}
                        className="card"
                        onClick={() => onSelect(build)}
                        style={{
                            minWidth: '280px',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            backgroundColor: isSelected ? '#FFF5F9' : 'var(--color-surface)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <h4 style={{ color: isSelected ? 'var(--color-primary)' : 'inherit' }}>{build.jobTitle}</h4>
                            {isSelected && <CheckCircle size={18} color="var(--color-primary)" />}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="text-muted">Match</span>
                                <span style={{ fontWeight: 600, color: build.matchScore > 0.7 ? '#10B981' : '#F59E0B' }}>
                                    {Math.round(build.matchScore * 100)}%
                                </span>
                            </div>
                            <div style={{ width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="text-muted">Gap</span>
                                <span style={{ fontWeight: 600 }}>{build.gapCostHours}h</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default BuildSelector;
