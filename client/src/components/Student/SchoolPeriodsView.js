import React, { useEffect, useState } from "react";
import axios from "axios";
function SchoolPeriodsView({ schoolId }) {
  const [periods, setPeriods] = useState([]);
  useEffect(() => {
    if (schoolId)
      axios.get("/api/school-periods", { params: { schoolId } }).then(r => setPeriods(r.data));
  }, [schoolId]);
  if (!schoolId) return null;
  if (periods.length === 0) return <div style={{ color: "#888", margin: "10px 0" }}>기간 기록 없음</div>;
  return (
    <div style={{ background: "#f8fafd", padding: "10px 16px", borderRadius: 11, margin: "14px 0" }}>
      <b style={{ color: "#226ad6" }}>학교별 기간 안내</b>
      <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
        {periods.map(p => (
          <li key={p.id} style={{ margin: "7px 0" }}>
            <span style={{ fontWeight: 600 }}>{p.name}</span> ({p.type})<br />
            <span style={{ color: "#888" }}>{p.start} ~ {p.end}</span>
            {p.note && <div style={{ fontSize: 13, color: "#666" }}>{p.note}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default SchoolPeriodsView;