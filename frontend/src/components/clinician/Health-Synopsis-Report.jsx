// frontend/src/components/clinician/HealthSynopsisReport.jsx
import React from 'react';
import styled from 'styled-components';
import { FaBrain, FaStethoscope, FaClipboardList, FaArrowRight } from 'react-icons/fa';

const ReportCard = styled.div`...`; // Add styling for the card
// ... add styling for headline, sections, findings, etc.

const HealthSynopsisReport = ({ report }) => {
    const getConfidenceColor = (score) => {
        if (score > 0.85) return '#2ecc71'; // green
        if (score > 0.6) return '#f1c40f'; // yellow
        return '#e74c3c'; // red
    };

    return (
        <ReportCard>
            <p>Generated on: {new Date(report.created_at).toLocaleString()}</p>
            <h3><FaBrain /> AI Headline:</h3>
            <p>{report.headline}</p>

            <h3><FaClipboardList /> Key Findings:</h3>
            <ul>
                {report.key_findings.map((finding, index) => <li key={index}>{finding}</li>)}
            </ul>
            
            <h3><FaStethoscope /> AI Conclusion:</h3>
            <p>
                Class: <strong>{report.conclusion_class}</strong>
                <span style={{ color: getConfidenceColor(report.confidence_score), marginLeft: '10px' }}>
                    (Confidence: {(report.confidence_score * 100).toFixed(1)}%)
                </span>
            </p>

            <h3><FaArrowRight /> Recommended Action:</h3>
            <p>{report.recommendation}</p>
        </ReportCard>
    );
};

export default HealthSynopsisReport;