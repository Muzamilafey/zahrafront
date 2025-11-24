import React from 'react';
import { AlertTriangle, Pill, CheckCircle2, Clock, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function SeverityBadge({ level }) {
  const colors = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Severe: 'bg-orange-100 text-orange-800 border-orange-200',
    Critical: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  };
  const cls = colors[level] || colors.Low;
  return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${cls}`}>Severity: {level}</span>;
}

export default function ResultCard({ result }) {
  const generateChartData = (days) => {
    const data = [];
    for (let i = 0; i <= (days || 5) + 2; i++) {
      const intensity = Math.max(0, 100 * Math.pow(0.7, i));
      data.push({ day: `Day ${i}`, intensity: Math.round(intensity) });
    }
    return data;
  };

  const chartData = generateChartData(result?.recoveryTimelineDays || 5);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {result?.isEmergency && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 animate-bounce" />
          <div>
            <h3 className="text-lg font-bold text-red-700">Medical Emergency Detected</h3>
            <p className="text-red-600 mt-1">The symptoms described suggest a critical condition. Please visit an Emergency Room or call emergency services immediately.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <SeverityBadge level={result?.severity || 'Low'} />
                <div className="flex items-center text-slate-400 text-xs"><Clock className="w-3 h-3 mr-1" />Est. Recovery: {result?.recoveryTimelineDays || 5} Days</div>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mt-2">{result?.conditionName || 'Unknown'}</h2>
              <p className="text-slate-600 mt-3 leading-relaxed">{result?.explanation || 'No explanation provided.'}</p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center mb-4"><Pill className="w-5 h-5 text-medical-500 mr-2" />Suggested Medication</h3>
                <ul className="space-y-3">
                  {(result?.suggestedMedications || []).map((med, idx) => (
                    <li key={idx} className="flex items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 bg-medical-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-slate-700 text-sm">{med}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 flex items-center mb-4"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />Recommended Actions</h3>
                <ul className="space-y-3">
                  {(result?.immediateActions || []).map((action, idx) => (
                    <li key={idx} className="flex items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 mr-3 flex-shrink-0 opacity-60" /><span className="text-slate-700 text-sm">{action}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 flex items-center mb-6"><Activity className="w-5 h-5 text-medical-500 mr-2" />Projected Recovery</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={'preserveStartEnd'} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} labelStyle={{color: '#64748b', fontSize: '12px'}} />
                  <Area type="monotone" dataKey="intensity" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorIntensity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-slate-400 mt-4">Estimated symptom intensity over time.</p>
          </div>

          <div className="bg-medical-50 rounded-2xl border border-medical-100 p-6">
            <h4 className="text-medical-900 font-semibold mb-2 text-sm">Need a Doctor?</h4>
            <p className="text-medical-700 text-xs mb-4">This AI assessment is preliminary. If symptoms persist, connect with a healthcare provider.</p>
            <button className="w-full py-2 bg-white text-medical-600 text-sm font-semibold rounded-lg border border-medical-200 hover:bg-medical-50 transition-colors">Find Nearby Clinic</button>
          </div>
        </div>
      </div>
    </div>
  );
}
