import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';

function CandidateInputForm({ onParse, loading }) {
  const [file, setFile] = useState(null);
  const [currentDomain, setCurrentDomain] = useState('technology_engineering');
  const [wantsDomainChange, setWantsDomainChange] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onParse(null, file, currentDomain, [], wantsDomainChange);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Current Domain</label>
          <select
            value={currentDomain}
            onChange={(e) => setCurrentDomain(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontFamily: 'inherit',
              marginBottom: '12px'
            }}
          >
            <option value="technology_engineering">Technology & Engineering</option>
            <option value="business_finance_legal">Business, Finance & Legal</option>
            <option value="sales_marketing_customer">Sales, Marketing & Customer Service</option>
            <option value="education_arts_media">Education, Arts & Media</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="domainChange"
              checked={wantsDomainChange}
              onChange={(e) => setWantsDomainChange(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="domainChange" style={{ fontSize: '14px', cursor: 'pointer' }}>
              I want to change my career domain
            </label>
          </div>
        </div>

        <div className="CVbox"
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {/* PDF Upload Section */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Upload CV (PDF)</label>

            <div style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              backgroundColor: file ? '#F0FDF4' : 'transparent',
              borderColor: file ? '#10B981' : 'var(--color-border)'
            }}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="cv-upload"
              />
              <label htmlFor="cv-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {file ? (
                  <>
                    <FileText size={32} color="#10B981" />
                    <span style={{ fontWeight: 500, color: '#10B981' }}>{file.name} selected</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Click to change</span>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="var(--color-text-muted)" />
                    <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Upload PDF</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>or drag and drop</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !file}
          style={{ opacity: loading || !file ? 0.5 : 1 }}
        >
          {loading ? 'Analyzing...' : 'Parse CV'}
        </button>
      </form>
    </div>
  );
}

export default CandidateInputForm;
