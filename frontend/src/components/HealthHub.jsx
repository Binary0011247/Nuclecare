import React from 'react';
import styled from 'styled-components';
import HealthAura from './HealthAura.jsx';
import VitalSignsChart from './VitalSignsChart.jsx';
import MedicationTracker from './MedicationTracker.jsx';
import LogVitalsForm from './LogVitalsForm.jsx';
import Spinner from './layout/Spinner.jsx';
import BloodGlucoseChart from './BloodGlucoseChart.jsx';

// --- Styled Components ---
const HubLayout = styled.div`
  padding: 40px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  max-width: 1800px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 20px; }
`;
const Card = styled.div`
  background: #282c34;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  h3 { margin-top: 0; color: #61dafb; }
`;
const AuraCard = styled(Card)`
  grid-column: 1 / -1;
  text-align: center;
`;

// --- The Component ---
const HealthHub = ({ data, isLoading, onLogMedication, onLogVitals, showVitalsForm = false }) => {
    if (isLoading) return <Spinner />;

    // --- THIS IS THE CORRECTED DATA LOGIC ---
    // The history from the backend is already sorted DESC, so the first item is the newest.
    // We also handle the case where the patient might have a `latestVitals` object from their own dashboard view.
     
    const vitalsHistory = data?.history || [];
    const latestVitals = data?.latestVitals || vitalsHistory[0];
    
    
    const medications = data?.medications || [];
    // --- END OF CORRECTION ---

    return (
        <HubLayout>
            <AuraCard>
                {/* Now, this will always have the correct data for both patient and clinician views */}
                <HealthAura 
                    healthScore={latestVitals?.health_score} 
                    insight={latestVitals?.insight_text} 
                />
            </AuraCard>

            <Card>
                <h3>Vitals Trend (Last 30 Days)</h3>
                {/* The chart component will now receive the correct history data */}
                <VitalSignsChart data={[...vitalsHistory].reverse()} />
            </Card>
             <Card>
                <h3>Blood Glucose Trend</h3>
                <BloodGlucoseChart data={[...vitalsHistory].reverse()} />
            </Card>

            <Card>
                <h3>Medication Adherence</h3>
                <MedicationTracker medications={medications} onLogTaken={onLogMedication} />
            </Card>

            {showVitalsForm && (
              <Card>
                  <h3>Log Today's Readings</h3>
                  <LogVitalsForm onSubmit={onLogVitals} />
              </Card>
            )}
        </HubLayout>
    );
};

export default HealthHub;