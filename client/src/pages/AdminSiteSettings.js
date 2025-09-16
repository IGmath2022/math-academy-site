// client/src/pages/AdminSiteSettings.js
import React, { useEffect, useState } from "react";
import { getSiteSettings, saveSiteSettings } from "../utils/staffApi";

export default function AdminSiteSettings() {
  const [form, setForm] = useState({
    menu_home_on: 'true',
    menu_blog_on: 'true',
    menu_materials_on: 'true',
    menu_contact_on: 'true',
    site_theme_color: '#2d4373',
    site_theme_mode: 'light',
    default_class_name: 'IG수학',
    home_sections: [{ key:'hero', on:true }, { key:'features', on:true }, { key:'cta', on:true }]
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await getSiteSettings();
        if (r?.settings) {
          setForm({
            menu_home_on: r.settings.menu_home_on || 'true',
            menu_blog_on: r.settings.menu_blog_on || 'true',
            menu_materials_on: r.settings.menu_materials_on || 'true',
            menu_contact_on: r.settings.menu_contact_on || 'true',
            site_theme_color: r.settings.site_theme_color || '#2d4373',
            site_theme_mode: r.settings.site_theme_mode || 'light',
            default_class_name: r.settings.default_class_name || 'IG수학',
            home_sections: Array.isArray(r.settings.home_sections) ? r.settings.home_sections : []
          });
        }
      } catch {
        setErr('설정 불러오기 실패');
      }
    })();
  }, []);

  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleSection = (key) =>
    setForm(prev => ({
      ...prev,
      home_sections: (prev.home_sections || []).map(s => s.key===key ? { ...s, on: !s.on } : s)
    }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveSiteSettings(form);
      setMsg('저장되었습니다.');
      setTimeout(()=>setMsg(''), 1800);
    } catch {
      setErr('저장 실패'); setTimeout(()=>setErr(''), 1800);
    }
  };

  return (
    <div style={{ maxWidth:720, margin:'32px auto', background:'#fff', padding:'24px', borderRadius:16, boxShadow:'0 2px 18px #0001' }}>
      <h2 style={{ marginTop:0 }}>슈퍼 관리자 전역 설정</h2>
      {msg && <div style={{ color:'#227a22', marginBottom:12 }}>{msg}</div>}
      {err && <div style={{ color:'#e14', marginBottom:12 }}>{err}</div>}

      <form onSubmit={onSubmit}>
        <fieldset style={fs}>
          <legend>메뉴 토글</legend>
          {['home','blog','materials','contact'].map(k => (
            <label key={k} style={lbl}>
              <input
                type="checkbox"
                checked={(form[`menu_${k}_on`]+'') === 'true'}
                onChange={(e)=>onChange(`menu_${k}_on`, e.target.checked?'true':'false')}
              /> {k.toUpperCase()} 표시
            </label>
          ))}
        </fieldset>

        <fieldset style={fs}>
          <legend>테마</legend>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:10 }}>
            <label style={{ width:140 }}>메인 색상</label>
            <input type="color" value={form.site_theme_color} onChange={(e)=>onChange('site_theme_color', e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <label style={{ width:140 }}>모드</label>
            <select value={form.site_theme_mode} onChange={(e)=>onChange('site_theme_mode', e.target.value)}>
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </div>
        </fieldset>

        <fieldset style={fs}>
          <legend>홈 섹션</legend>
          {(form.home_sections || []).map(s => (
            <label key={s.key} style={lbl}>
              <input type="checkbox" checked={!!s.on} onChange={()=>toggleSection(s.key)} /> {s.key}
            </label>
          ))}
        </fieldset>

        <fieldset style={fs}>
          <legend>기본 반 이름</legend>
          <input
            type="text"
            value={form.default_class_name}
            onChange={(e)=>onChange('default_class_name', e.target.value)}
            style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #ccc', width:'100%' }}
          />
        </fieldset>

        <div style={{ display:'flex', gap:10 }}>
          <button type="submit" style={btnPrimary}>저장</button>
        </div>
      </form>
    </div>
  );
}

const fs = { border:'1px solid #eee', borderRadius:10, padding:14, marginBottom:18 };
const lbl = { display:'inline-flex', alignItems:'center', gap:8, marginRight:16, marginBottom:8 };
const btnPrimary = { padding:'10px 18px', border:'none', borderRadius:8, background:'#226ad6', color:'#fff', fontWeight:800, cursor:'pointer' };
