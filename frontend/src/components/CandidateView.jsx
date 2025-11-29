import React, { useState } from 'react';
import CandidateInputForm from './CandidateInputForm';
import BuildSelector from './BuildSelector';
import RPGSkillTree from './RPGSkillTree';
import BridgeQuestList from './BridgeQuestList';
import { TrendingUp, Target, Award } from 'lucide-react';

function CandidateView() {
    const [candidateData, setCandidateData] = useState(null);
    const [builds, setBuilds] = useState([]);
    const [selectedBuild, setSelectedBuild] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleParse = async (cvText, file, currentDomain, targetDomains) => {
        setLoading(true);
        try {
            // 1. Parse CV (Handle File)
            let profile;
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('currentDomain', currentDomain);

                const parseRes = await fetch('http://localhost:5000/api/candidate/parse', {
                    method: 'POST',
                    body: formData,
                });
                profile = await parseRes.json();
            } else {
                const parseRes = await fetch('http://localhost:5000/api/candidate/parse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cvText, currentDomain, targetDomains })
                });
                profile = await parseRes.json();
            }

            if (profile.error) throw new Error(profile.error);
            setCandidateData(profile);

            // 2. Generate Builds
            const buildsRes = await fetch('http://localhost:5000/api/candidate/builds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateProfile: profile })
            });
            const buildsData = await buildsRes.json();

            // Sort builds by match score (highest first)
            const sortedBuilds = buildsData.builds.sort((a, b) => b.matchScore - a.matchScore);
            setBuilds(sortedBuilds);

            if (sortedBuilds.length > 0) {
                setSelectedBuild(sortedBuilds[0]);
            }
        } catch (error) {
            console.error("Error processing candidate:", error);
            alert("Failed to process candidate: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const [filter, setFilter] = useState('all'); // all, high_match, medium_match

    // Filter builds
    const filteredBuilds = builds.filter(build => {
        if (filter === 'high_match') return build.matchScore >= 0.7;
        if (filter === 'medium_match') return build.matchScore >= 0.4 && build.matchScore < 0.7;
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <h2 style={{ marginBottom: '16px' }}>Candidate Profile</h2>
                <CandidateInputForm onParse={handleParse} loading={loading} />

                {candidateData && (
                    <div className="card" style={{ marginTop: '24px', background: 'linear-gradient(135deg, #2D1B69 0%, #E20074 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ color: 'white', marginBottom: '4px' }}>{candidateData.rpgClass}</h3>
                                <p style={{ opacity: 0.9, fontSize: '14px' }}>Level {candidateData.skills.length} Character</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.8 }}>Creativity Score</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{Math.round((candidateData.creativityScore || 0) * 100)}/100</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {candidateData.metaSkills && candidateData.metaSkills.map(skill => (
                                <span key={skill} style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {builds.length > 0 && (
                <>
                    {/* Role Fit Analysis Section */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={24} color="var(--color-primary)" />
                                <h2 style={{ margin: 0 }}>Role Fit Analysis</h2>
                            </div>

                            {/* Filter Controls */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setFilter('all')}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    All Roles
                                </button>
                                <button
                                    className={`btn ${filter === 'high_match' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setFilter('high_match')}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    High Match (70%+)
                                </button>
                                <button
                                    className={`btn ${filter === 'medium_match' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setFilter('medium_match')}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    Medium Match
                                </button>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #E20074 0%, #00A0E0 100%)', color: 'white', border: 'none' }}>
                                <Target size={32} style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{builds.length}</div>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>Roles Analyzed</div>
                            </div>

                            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #00A0E0 0%, #10B981 100%)', color: 'white', border: 'none' }}>
                                <Award size={32} style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{Math.round(builds[0].matchScore * 100)}%</div>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>Best Match</div>
                            </div>

                            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #10B981 0%, #E20074 100%)', color: 'white', border: 'none' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{builds.filter(b => b.matchScore >= 0.7).length}</div>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>Strong Fits (70%+)</div>
                            </div>
                        </div>

                        {/* All Roles Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {filteredBuilds.map((build) => {
                                const percentage = Math.round(build.matchScore * 100);
                                const isSelected = selectedBuild?.jobId === build.jobId;

                                // Determine color based on match score
                                let barColor = '#E20074'; // magenta
                                if (percentage >= 80) barColor = '#10B981'; // green
                                else if (percentage >= 60) barColor = '#00A0E0'; // blue
                                else if (percentage >= 40) barColor = '#F59E0B'; // orange

                                return (
                                    <div
                                        key={build.jobId}
                                        className="card"
                                        onClick={() => setSelectedBuild(build)}
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            background: isSelected ? 'rgba(226, 0, 116, 0.05)' : 'var(--color-surface)',
                                            transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }
                                        }}
                                    >
                                        <div style={{ marginBottom: '12px' }}>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{build.jobTitle}</h4>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                                {build.coveredSkills.length} of {build.coveredSkills.length + build.missingSkills.length} skills matched
                                            </div>
                                        </div>

                                        {/* Match Percentage */}
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '500' }}>Match Score</span>
                                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: barColor }}>{percentage}%</span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div style={{
                                                width: '100%',
                                                height: '8px',
                                                background: 'var(--color-border)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: barColor,
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </div>
                                        </div>

                                        {/* Gap Cost */}
                                        {build.gapCostHours > 0 && (
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                                📚 {build.gapCostHours}h learning needed
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Future Role Builds - keep original selector for detailed view */}
                    <section>
                        <h2 style={{ marginBottom: '16px' }}>Detailed Role Analysis</h2>
                        <BuildSelector
                            builds={builds}
                            selectedBuild={selectedBuild}
                            onSelect={setSelectedBuild}
                        />
                    </section>

                    {selectedBuild && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            <section>
                                <h3 style={{ marginBottom: '16px' }}>Skill Tree & Gaps</h3>
                                <RPGSkillTree
                                    baseSkills={candidateData?.skills || []}
                                    build={selectedBuild}
                                />
                            </section>

                            <section>
                                <h3 style={{ marginBottom: '16px' }}>Bridge Quests</h3>
                                <BridgeQuestList quests={selectedBuild.quests} />
                            </section>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default CandidateView;
