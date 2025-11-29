import React, { useState } from 'react';
import CandidateInputForm from './CandidateInputForm';
import BuildSelector from './BuildSelector';
import RPGSkillTree from './RPGSkillTree';
import BridgeQuestList from './BridgeQuestList';
import DraggableCarousel from './DraggableCarousel';
import { TrendingUp, Target, Award } from 'lucide-react';

function CandidateView() {
    const [candidateData, setCandidateData] = useState(null);
    const [builds, setBuilds] = useState([]);
    const [selectedBuild, setSelectedBuild] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, high_match, medium_match

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

    // Filter builds
    const filteredBuilds = builds.filter(build => {
        if (filter === 'high_match') return build.matchScore >= 0.7;
        if (filter === 'medium_match') return build.matchScore >= 0.4 && build.matchScore < 0.7;
        return true;
    });

    // Placeholder data for locked state
    const PLACEHOLDER_CANDIDATE = {
        rpgClass: "Unknown Adventurer",
        skills: Array(10).fill({}),
        creativityScore: 0,
        metaSkills: ["???", "???", "???"]
    };

    const PLACEHOLDER_BUILDS = Array(5).fill({
        jobId: "locked",
        jobTitle: "Locked Role Path",
        matchScore: 0,
        gapCostHours: 0,
        coveredSkills: [],
        missingSkills: []
    });

    const displayCandidate = candidateData || PLACEHOLDER_CANDIDATE;
    const displayBuilds = candidateData ? filteredBuilds : PLACEHOLDER_BUILDS;
    const isLocked = !candidateData;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <h2 style={{ marginBottom: '16px' }}>Candidate Profile</h2>
                <CandidateInputForm onParse={handleParse} loading={loading} />

                <div style={{
                    marginTop: '24px',
                    opacity: isLocked ? 0.5 : 1,
                    filter: isLocked ? 'grayscale(100%)' : 'none',
                    transition: 'all 0.5s ease',
                    pointerEvents: isLocked ? 'none' : 'auto',
                    userSelect: isLocked ? 'none' : 'auto'
                }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #E20074 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ color: 'white', marginBottom: '4px' }}>{displayCandidate.rpgClass}</h3>
                                <p style={{ opacity: 0.9, fontSize: '14px' }}>Level {displayCandidate.skills.length} Character</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.8 }}>Creativity Score</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                    {Math.round((displayCandidate.creativityScore || 0) * 100)}/100
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {displayCandidate.metaSkills && displayCandidate.metaSkills.map((skill, i) => (
                                <span key={i} style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* LOCKED / UNLOCKED ROLE FIT SECTION */}
            <div style={{ position: 'relative' }}>
                {isLocked && (
                    <div style={{
                        position: 'absolute',
                        top: '0%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        background: 'rgba(255,255,255,0.9)',
                        padding: '16px 32px',
                        borderRadius: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        whiteSpace: 'nowrap'
                    }}>
                        <span>🔒 Upload CV to Unlock Career Paths</span>
                    </div>
                )}

                {/* This inner wrapper gets grayscale/blur when locked */}
                <div
                    style={{
                        opacity: isLocked ? 0.4 : 1,
                        filter: isLocked ? 'grayscale(100%) blur(1px)' : 'none',
                        transition: 'all 0.5s ease',
                        pointerEvents: isLocked ? 'none' : 'auto',
                        userSelect: isLocked ? 'none' : 'auto',
                    }}
                >
                    {/* Role Fit Analysis Section */}
                    <section>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={24} color="var(--color-primary)" />
                                <h2 style={{ margin: 0 }}>Role Fit Analysis</h2>
                            </div>

                            {/* Filter Controls (UI only for now) */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                    onClick={() => setFilter('all')}
                                >
                                    All Roles
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                    onClick={() => setFilter('high_match')}
                                >
                                    High Match
                                </button>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            <div className="card" style={{
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #E20074 0%, #00A0E0 100%)',
                                color: 'white',
                                border: 'none'
                            }}>
                                <Target size={32} style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                                    {candidateData ? builds.length : 0}
                                </div>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>Roles Analyzed</div>
                            </div>

                            <div className="card" style={{
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #00A0E0 0%, #10B981 100%)',
                                color: 'white',
                                border: 'none'
                            }}>
                                <Award size={32} style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                                    {candidateData && builds.length > 0
                                        ? `${Math.round(builds[0].matchScore * 100)}%`
                                        : '0%'}
                                </div>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>Best Match</div>
                            </div>

                            <div className="card" style={{
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #10B981 0%, #E20074 100%)',
                                color: 'white',
                                border: 'none'
                            }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                                    {candidateData
                                        ? builds.filter(b => b.matchScore >= 0.7).length
                                        : 0}
                                </div>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>Strong Fits</div>
                            </div>
                        </div>

                        {/* All Roles Carousel */}
                        <DraggableCarousel itemMinWidth={320} gap={16}>
                            {displayBuilds.map((build, idx) => {
                                const matchPercent = Math.round((build.matchScore || 0) * 100);
                                const totalSkills = (build.coveredSkills?.length || 0) +
                                    (build.missingSkills?.length || 0);
                                const coveredCount = build.coveredSkills?.length || 0;
                                const isSelected = selectedBuild?.jobId === build.jobId || (!selectedBuild && idx === 0);

                                return (
                                    <div
                                        key={idx}
                                        className="card"
                                        onClick={() => setSelectedBuild(build)}
                                        style={{
                                            height: '100%',
                                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            background: isSelected ? 'rgba(226, 0, 116, 0.05)' : 'var(--color-surface)',
                                            cursor: 'pointer',
                                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ marginBottom: '12px' }}>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                                                {build.jobTitle}
                                            </h4>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                                {candidateData
                                                    ? `${coveredCount} of ${totalSkills} skills matched`
                                                    : '0 of 10 skills matched'}
                                            </div>
                                        </div>

                                        {/* Match Percentage */}
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '4px'
                                            }}>
                                                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                                    Match Score
                                                </span>
                                                <span style={{
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    color: isSelected ? 'var(--color-primary)' : '#ccc'
                                                }}>
                                                    {candidateData ? `${matchPercent}%` : '0%'}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div style={{
                                                width: '100%',
                                                height: '8px',
                                                background: 'var(--color-border)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div
                                                    style={{
                                                        width: candidateData ? `${matchPercent}%` : '0%',
                                                        height: '100%',
                                                        background: isSelected ? 'var(--color-primary)' : '#ccc'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </DraggableCarousel>
                    </section>

                    {/* Detail Section: Skill Tree & Quests */}
                    {(selectedBuild || isLocked) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '32px' }}>
                            <section>
                                <h3 style={{ marginBottom: '16px' }}>Skill Tree & Gaps</h3>
                                <RPGSkillTree
                                    baseSkills={displayCandidate.skills || []}
                                    build={selectedBuild || displayBuilds[0]}
                                />
                            </section>

                            <section>
                                <h3 style={{ marginBottom: '16px' }}>Bridge Quests</h3>
                                <BridgeQuestList quests={(selectedBuild || displayBuilds[0]).quests || []} />
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CandidateView;
