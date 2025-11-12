import React, { useRef, useState } from 'react';

export default function SimpleChart({ data = [3,5,2,8,6,9,7], labels = [], height = 60 }) {
  const max = Math.max(...data, 1);
  
  // Prevent NaN when data has only 1 point by handling division by zero
  const getX = (i) => data.length > 1 ? (i/(data.length-1))*100 : 50;
  const getY = (v) => 100 - (v/max*100);
  
  const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const showTooltip = (e, v, i) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return setTooltip(null);
    const left = e.clientX - rect.left;
    const top = e.clientY - rect.top;
    setTooltip({ left, top, value: v, index: i, label: labels[i] });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <div className="w-full relative" ref={containerRef}>
      <svg className="w-full block" viewBox="0 0 100 100" preserveAspectRatio="none" style={{height}}>
        <polyline fill="none" stroke="#0ea5e9" strokeWidth="1.5" points={points} />
        {data.map((v,i)=> (
          <circle key={i}
            cx={getX(i)}
            cy={getY(v)}
            r="1.6"
            fill="#0369a1"
            onMouseEnter={(ev)=>showTooltip(ev, v, i)}
            onFocus={(ev)=>showTooltip(ev, v, i)}
            onMouseLeave={hideTooltip}
            onBlur={hideTooltip}
            tabIndex={0}
          />
        ))}
      </svg>

      {/* x-axis labels */}
      {labels && labels.length === data.length && (
        <div className="w-full flex text-xs text-gray-500 mt-2 justify-between px-1">
          {labels.map((l,i)=>(<div key={i} className="truncate text-center" style={{width: `${100/(labels.length)}%`, transform: 'translateX(-50%)', marginLeft: `${labels.length > 1 ? (i/(labels.length-1))*100 : 50}%`}}>{l}</div>))}
        </div>
      )}

      {/* tooltip */}
      {tooltip && (
        <div className="absolute z-50 bg-white border rounded shadow px-2 py-1 text-sm" style={{ left: tooltip.left + 8, top: tooltip.top - 36, transform: 'translateX(0)' }}>
          <div className="font-medium">{tooltip.value}</div>
          {tooltip.label && <div className="text-xs text-gray-500">{tooltip.label}</div>}
        </div>
      )}
    </div>
  );
}
