import React from 'react';
import { Check, X } from 'lucide-react';

function SkillTreeView({ baseSkills, build }) {
    // Merge skills to show status
    const coveredIds = new Set(build.coveredSkills.map(s => s.jobSkillId));
    const missing = build.missingSkills;

    return (
        <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Covered Skills */}
                <div>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                        Covered Skills
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {build.coveredSkills.map(skill => (
                            <div
                                key={skill.jobSkillId}
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
                                <Check size={14} />
                                {/* Find name from baseSkills or use ID if not found easily (simplified) */}
                                {skill.jobSkillId.replace('skill_', '').replace('_', ' ')}
                            </div>
                        ))}
                        {build.coveredSkills.length === 0 && <span className="text-muted" style={{ fontSize: '14px' }}>None</span>}
                    </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }}></div>

                {/* Missing Skills */}
                <div>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                        Missing Skills
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {missing.map(skill => (
                            <div
                                key={skill.jobSkillId}
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
                                {skill.name}
                                {skill.importance === 'critical' && (
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} title="Critical"></span>
                                )}
                            </div>
                        ))}
                        {missing.length === 0 && <span className="text-muted" style={{ fontSize: '14px' }}>None</span>}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default SkillTreeView;
