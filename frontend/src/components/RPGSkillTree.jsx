import React from 'react';
import { Zap, Book, Users, Briefcase, Lock, Unlock } from 'lucide-react';

function RPGSkillTree({ baseSkills, build }) {
    // Group skills by category for "branches"
    const categories = {
        "Code": { icon: <Zap size={16} />, color: "#E20074" },
        "Data": { icon: <Book size={16} />, color: "#3B82F6" },
        "Social": { icon: <Users size={16} />, color: "#10B981" },
        "Business": { icon: <Briefcase size={16} />, color: "#F59E0B" },
        "Other": { icon: <Zap size={16} />, color: "#6B7280" }
    };

    // Helper to get category
    const getCategory = (skill) => {
        // In a real app, skill object would have category. 
        // We'll infer or use what we added in backend.
        return skill.category || "Other";
    };

    // Merge all relevant skills
    const allSkills = [
        ...build.coveredSkills.map(s => ({ ...s, status: 'covered', name: s.jobSkillId.replace('skill_', '') })),
        ...build.missingSkills.map(s => ({ ...s, status: 'missing' }))
    ];

    // Group by category
    const grouped = {};
    allSkills.forEach(skill => {
        const cat = getCategory(skill); // This might need better mapping if category isn't passed through builds yet
        // Fallback mapping based on ID if category missing
        let finalCat = cat;
        if (!skill.category) {
            if (skill.jobSkillId?.includes('sql') || skill.jobSkillId?.includes('viz')) finalCat = "Data";
            else if (skill.jobSkillId?.includes('python') || skill.jobSkillId?.includes('react')) finalCat = "Code";
            else if (skill.jobSkillId?.includes('comm') || skill.jobSkillId?.includes('lead')) finalCat = "Social";
            else if (skill.jobSkillId?.includes('finance')) finalCat = "Business";
        }

        if (!grouped[finalCat]) grouped[finalCat] = [];
        grouped[finalCat].push(skill);
    });

    return (
        <div className="card" style={{ background: '#1a1a2e', color: 'white', border: '1px solid #2d1b69' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ color: '#E20074', textTransform: 'uppercase', letterSpacing: '1px' }}>Skill Constellation</h4>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {Object.entries(grouped).map(([catName, skills]) => {
                    const catConfig = categories[catName] || categories["Other"];
                    return (
                        <div key={catName} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: `rgba(255,255,255,0.1)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: catConfig.color,
                                border: `2px solid ${catConfig.color}`
                            }}>
                                {catConfig.icon}
                            </div>

                            <div style={{ flex: 1 }}>
                                <h5 style={{ marginBottom: '12px', color: catConfig.color, opacity: 0.8 }}>{catName} Branch</h5>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                    {skills.map((skill, idx) => {
                                        const isCovered = skill.status === 'covered';
                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    position: 'relative',
                                                    padding: '10px 16px',
                                                    borderRadius: '8px',
                                                    background: isCovered ? `linear-gradient(45deg, ${catConfig.color}40, ${catConfig.color}10)` : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${isCovered ? catConfig.color : 'rgba(255,255,255,0.1)'}`,
                                                    minWidth: '120px',
                                                    textAlign: 'center',
                                                    opacity: isCovered ? 1 : 0.6,
                                                    transition: 'all 0.3s'
                                                }}
                                            >
                                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                                                    {skill.name || skill.jobSkillId}
                                                </div>
                                                <div style={{ fontSize: '11px', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                    {isCovered ? <Unlock size={10} /> : <Lock size={10} />}
                                                    {isCovered ? 'Mastered' : 'Locked'}
                                                </div>

                                                {/* Connector Line (Visual only) */}
                                                {idx < skills.length - 1 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: '-16px',
                                                        top: '50%',
                                                        width: '16px',
                                                        height: '2px',
                                                        background: isCovered ? catConfig.color : 'rgba(255,255,255,0.1)'
                                                    }}></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default RPGSkillTree;
