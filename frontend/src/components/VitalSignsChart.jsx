import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styled from 'styled-components';

// --- Styled Components ---

const ChartWrapper = styled.div`
  height: 100%; /* A fixed height for the chart container */
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

const VitalSignsChart = ({ data }) => {
    // If there's no data or not enough data to draw a line, show a message.
    if (!data || data.length < 2) {
        return (
            <ChartWrapper>
                <NoDataMessage>
                    Not enough data to display a trend. Please log vitals for at least two days.
                </NoDataMessage>
            </ChartWrapper>
        )
    }

    // Format the data for use in the chart
    const formattedData = data.map(d => ({
        ...d,
        // Format the date for a clean look on the X-axis (e.g., "Jun 13")
        name: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return (
        <ChartWrapper>
            {/* ResponsiveContainer makes the chart adapt to the size of its parent wrapper */}
            <ResponsiveContainer>
                <LineChart
                    data={formattedData}
                    margin={{
                        top: 5,
                        right: 20,
                        left: -10, // Adjust to bring Y-axis labels closer
                        bottom: 5,
                    }}
                >
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis 
                        yAxisId="bp" 
                        stroke="#8884d8"
                        label={{ value: 'BP (mmHg)', angle: -90, position: 'insideLeft', fill: '#8884d8' }}
                    />
                    <YAxis 
                        yAxisId="hr" 
                        orientation="right" 
                        stroke="#82ca9d" 
                        label={{ value: 'HR (bpm)', angle: 90, position: 'insideRight', fill: '#82ca9d' }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(27, 39, 53, 0.9)', // Semi-transparent dark blue
                            border: '1px solid #61dafb', // Vibrant blue border
                            borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#f1c40f', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: '#61dafb', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Legend wrapperStyle={{ color: '#fff', paddingTop: '20px' }} />
                    
                    <Line 
                        yAxisId="bp" 
                        type="monotone" 
                        dataKey="systolic" 
                        name="Systolic BP" 
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line 
                        yAxisId="bp" 
                        type="monotone" 
                        dataKey="diastolic" 
                        name="Diastolic BP" 
                        stroke="#ffc658"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line 
                        yAxisId="hr" 
                        type="monotone" 
                        dataKey="heart_rate" 
                        name="Heart Rate" 
                        stroke="#82ca9d"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export default VitalSignsChart;