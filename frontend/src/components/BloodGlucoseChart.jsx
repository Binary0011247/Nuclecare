import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styled from 'styled-components';

// --- Styled Components ---
const ChartWrapper = styled.div`
  height: 300px;
  width: 100%;
`;

const NoDataMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #9ca3af;
  font-style: italic;
`;

// --- The React Component ---
const BloodGlucoseChart = ({ data }) => {
    // Filter out entries where blood_glucose is null or undefined
    const chartData = data.filter(d => d.blood_glucose != null);

    if (!chartData || chartData.length === 0) {
        return (
            <ChartWrapper>
                <NoDataMessage>
                    No blood glucose data has been logged yet.
                </NoDataMessage>
            </ChartWrapper>
        );
    }

    // Format the data for use in the chart
    const formattedData = chartData.map(d => ({
        ...d,
        name: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    // Function to determine the color of each bar
    const getBarColor = (glucose) => {
        if (glucose > 180) return '#e74c3c'; // High - Red
        if (glucose < 70) return '#e74c3c'; // Low (also high risk) - Red
        if (glucose > 140) return '#f1c40f'; // Warning - Yellow
        return '#2ecc71'; // Healthy Range - Green
    };

    return (
        <ChartWrapper>
            <ResponsiveContainer>
                <BarChart
                    data={formattedData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis 
                        stroke="#888"
                        label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(27, 39, 53, 0.9)', 
                            border: '1px solid #61dafb', 
                            borderRadius: '8px' ,
                            color: '#fff'
                        }}
                        labelStyle={{ color: '#f1c40f', fontWeight: 'bold' }}
                        cursor={{fill: 'rgba(52, 152, 219, 0.1)'}}
                    />
                    <Legend />
                    <Bar dataKey="blood_glucose" name="Blood Glucose" >
                        {formattedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.blood_glucose)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export default BloodGlucoseChart;