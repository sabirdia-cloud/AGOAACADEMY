import React from 'react';
import {
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

interface SkillRadarChartProps {
  skills: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  color?: string;
}

export function SkillRadarChart({ skills, color = "#10b981" }: SkillRadarChartProps) {
  const data = [
    { subject: 'السرعة', A: skills.pace, fullMark: 100 },
    { subject: 'التسديد', A: skills.shooting, fullMark: 100 },
    { subject: 'التمرير', A: skills.passing, fullMark: 100 },
    { subject: 'المراوغة', A: skills.dribbling, fullMark: 100 },
    { subject: 'الدفاع', A: skills.defending, fullMark: 100 },
    { subject: 'البدني', A: skills.physical, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="المهارات"
            dataKey="A"
            stroke={color}
            fill={color}
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
