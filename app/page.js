'use client';

import { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://oockmhrqgildjcuiwkfs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uH7pSxDr5JGwS7Mw2lxeGw_KkYoskfc';
const TABLE_URL = `${SUPABASE_URL}/rest/v1/ghg_records`;
const SESSION_KEY = 'taps-esg-session';

const factorLibrary = {
  Electricity: { scope: 2, unit: 'kWh', factor: 0.4999 },
  LPG: { scope: 1, unit: 'kg', factor: 3.001 },
  Diesel: { scope: 1, unit: 'L', factor: 2.676 },
  Gasoline: { scope: 1, unit: 'L', factor: 2.271 },
  Refrigerant: { scope: 1, unit: 'kg', factor: 1430 },
  Water: { scope: 3, unit: 'm³', factor: 0.344 },
  Waste: { scope: 3, unit: 'kg', factor: 0.587 },
  'Business Travel': { scope: 3, unit: 'km', factor: 0.18 },
  'Employee Commute': { scope: 3, unit: 'km', factor: 0.12 },
  Other: { scope: 3, unit: 'unit', factor: 1 }
};

const factories = ['HEAD FACTORY', 'SOUTH FACTORY', 'NORTH FACTORY', 'EAST FACTORY'];
const companies = ['TAPS', 'TFW', 'KTG', 'UIM', 'OTHER'];

function formatNumber(value, digits = 3) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function LogoMark() {
  return (
    <div className="logoMark" aria-label="TAPS ESG Platform logo">
      <div className="logoRing logoRingOuter" />
      <div className="logoRing logoRingInner" />
      <div className="logoLeaf">◆</div>
    </div>
  );
}

export default function Home() {
  const today = new Date().toISOString().slice(0, 10);
  const monthNow = today.slice(0, 7);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ email: '', password: '' });
  const [authMessage, setAuthMessage] = useState('');
  const [page, setPage] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState({ search: '', month: '', factory: '', company: '', scope: '' });
  const [form, setForm] = useState({
    record_date: today,
    record_month: monthNow,
    factory: factories[0],
    company: companies[0],
    scope: 2,
    source: 'Electricity',
    activity_data: '',
    unit: 'kWh',
    emission_factor: 0.4999,
    remark: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch { localStorage.removeItem(SESSION_KEY); }
    }
  }, []);

  useEffect(() => {
    if (session?.access_token) loadRecords();
  }, [session]);

  function headers(extra = {}) {
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...extra
    };
  }

  async function authenticate() {
    setAuthMessage('กำลังดำเนินการ...');
    const endpoint = authMode === 'login' ? 'token?grant_type=password' : 'signup';
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(auth)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.message || 'Authentication failed');
      if (data.access_token) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
        setSession(data);
        setAuthMessage('เข้าสู่ระบบเรียบร้อย');
      } else {
        setAuthMessage('สมัครเรียบร้อย กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี');
      }
    } catch (error) {
      setAuthMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setRecords([]);
  }

  async function loadRecords() {
    setLoading(true);
    try {
      const response = await fetch(`${TABLE_URL}?select=*&order=record_date.desc,id.desc`, { headers: headers() });
      if (!response.ok) throw new Error(await response.text());
      setRecords(await response.json());
    } catch (error) {
      alert(`โหลดข้อมูลไม่สำเร็จ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function chooseSource(source) {
    const factor = factorLibrary[source];
    setForm((current) => ({ ...current, source, scope: factor.scope, unit: factor.unit, emission_factor: factor.factor }));
  }

  function resetForm() {
    setEditId(null);
    setForm({
      record_date: today,
      record_month: monthNow,
      factory: factories[0],
      company: companies[0],
      scope: 2,
      source: 'Electricity',
      activity_data: '',
      unit: 'kWh',
      emission_factor: 0.4999,
      remark: ''
    });
  }

  async function saveRecord(event) {
    event.preventDefault();
    if (!form.activity_data || !form.emission_factor) return alert('กรุณากรอก Activity Data และ Emission Factor');
    const payload = {
      ...form,
      scope: Number(form.scope),
      activity_data: Number(form.activity_data),
      emission_factor: Number(form.emission_factor),
      remark: form.remark || null
    };
    const url = editId ? `${TABLE_URL}?id=eq.${editId}` : TABLE_URL;
    const method = editId ? 'PATCH' : 'POST';
    setLoading(true);
    try {
      const response = await fetch(url, {
        method,
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await response.text());
      resetForm();
      await loadRecords();
      setPage('records');
    } catch (error) {
      alert(`บันทึกไม่สำเร็จ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function editRecord(record) {
    setEditId(record.id);
    setForm({
      record_date: record.record_date,
      record_month: record.record_month,
      factory: record.factory,
      company: record.company,
      scope: record.scope,
      source: record.source,
      activity_data: record.activity_data,
      unit: record.unit,
      emission_factor: record.emission_factor,
      remark: record.remark || ''
    });
    setPage('entry');
  }

  async function deleteRecord(id) {
    if (!confirm('ยืนยันลบรายการนี้?')) return;
    const response = await fetch(`${TABLE_URL}?id=eq.${id}`, { method: 'DELETE', headers: headers() });
    if (!response.ok) return alert(await response.text());
    await loadRecords();
  }

  const filteredRecords = useMemo(() => records.filter((record) => {
    const keyword = `${record.source} ${record.remark || ''}`.toLowerCase();
    return (!filter.search || keyword.includes(filter.search.toLowerCase())) &&
      (!filter.month || record.record_month === filter.month) &&
      (!filter.factory || record.factory === filter.factory) &&
      (!filter.company || record.company === filter.company) &&
      (!filter.scope || String(record.scope) === filter.scope);
  }), [records, filter]);

  const summary = useMemo(() => {
    const scopes = { 1: 0, 2: 0, 3: 0 };
    const months = {};
    const factoryTotals = {};
    records.forEach((record) => {
      const value = Number(record.tco2e || 0);
      scopes[record.scope] += value;
      months[record.record_month] = (months[record.record_month] || 0) + value;
      factoryTotals[record.factory] = (factoryTotals[record.factory] || 0) + value;
    });
    return { scopes, total: scopes[1] + scopes[2] + scopes[3], months, factoryTotals };
  }, [records]);

  function exportCsv() {
    if (!filteredRecords.length) return alert('ไม่มีข้อมูลสำหรับ Export');
    const rows = [['Date','Month','Factory','Company','Scope','Source','Activity','Unit','EF','tCO2e','Remark'], ...filteredRecords.map((r) => [r.record_date,r.record_month,r.factory,r.company,r.scope,r.source,r.activity_data,r.unit,r.emission_factor,r.tco2e,r.remark || ''])];
    const csv = '\ufeff' + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'TAPS_GHG_Data.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!session) {
    return (
      <main className="loginPage">
        <section className="loginCard">
          <LogoMark />
          <p className="eyebrow">TAPS ESG PLATFORM</p>
          <h1>Sustainability starts with reliable data.</h1>
          <p className="loginIntro">เข้าสู่ระบบเพื่อบันทึก ตรวจสอบ และติดตามข้อมูล GHG ขององค์กร</p>
          <label>Email<input type="email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} /></label>
          <label>Password<input type="password" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} /></label>
          <button className="primaryButton" onClick={authenticate}>{authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครผู้ใช้'}</button>
          <button className="textButton" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMessage(''); }}>
            {authMode === 'login' ? 'ยังไม่มีบัญชี? สมัครผู้ใช้' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
          </button>
          <p className="statusMessage">{authMessage}</p>
        </section>
      </main>
    );
  }

  const chartEntries = Object.entries(summary.months).sort((a,b) => a[0].localeCompare(b[0])).slice(-12);
  const chartMax = Math.max(...chartEntries.map(([,v]) => v), 1);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brandBlock"><LogoMark /><div><strong>TAPS ESG</strong><span>Platform v0.6</span></div></div>
        <nav>
          {[
            ['dashboard','Dashboard'],['entry','Activity Data'],['records','GHG Records'],['factors','Emission Factors'],['reports','Reports']
          ].map(([key,label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => setPage(key)}>{label}</button>)}
        </nav>
        <div className="sidebarFooter"><small>{session.user?.email}</small><button onClick={logout}>ออกจากระบบ</button></div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">AMAGASAKI PIPE (THAILAND)</p><h1>{page === 'dashboard' ? 'Executive Dashboard' : page === 'entry' ? (editId ? 'Edit Activity' : 'New Activity') : page === 'records' ? 'GHG Records' : page === 'factors' ? 'Emission Factor Library' : 'Report Center'}</h1></div>
          <div className="cloudStatus">● Supabase Cloud Connected</div>
        </header>

        {page === 'dashboard' && <>
          <section className="kpiGrid">
            {[['Total Emission',summary.total],['Scope 1',summary.scopes[1]],['Scope 2',summary.scopes[2]],['Scope 3',summary.scopes[3]]].map(([label,value]) => <article className="kpiCard" key={label}><span>{label}</span><strong>{formatNumber(value)}</strong><small>tCO₂e</small></article>)}
            <article className="kpiCard"><span>Total Records</span><strong>{records.length}</strong><small>รายการ</small></article>
          </section>
          <section className="contentGrid">
            <article className="panel widePanel"><div className="panelHeading"><div><span className="eyebrow">TREND</span><h2>Monthly Emission</h2></div><button className="outlineButton" onClick={loadRecords}>{loading ? 'Loading...' : 'Refresh'}</button></div>
              <div className="barChart">{chartEntries.length ? chartEntries.map(([month,value]) => <div className="barColumn" key={month}><div className="barValue">{formatNumber(value,1)}</div><div className="bar" style={{height:`${Math.max((value/chartMax)*180,4)}px`}}/><span>{month.slice(5)}</span></div>) : <p className="emptyState">ยังไม่มีข้อมูลสำหรับแสดงกราฟ</p>}</div>
            </article>
            <article className="panel"><span className="eyebrow">FACTORY</span><h2>Top Emission</h2>{Object.entries(summary.factoryTotals).sort((a,b)=>b[1]-a[1]).map(([name,value]) => <div className="ranking" key={name}><span>{name}</span><strong>{formatNumber(value)}</strong></div>)}</article>
          </section>
        </>}

        {page === 'entry' && <section className="panel formPanel"><form onSubmit={saveRecord}><div className="formGrid">
          <label>วันที่<input type="date" value={form.record_date} onChange={(e)=>setForm({...form,record_date:e.target.value,record_month:e.target.value.slice(0,7)})}/></label>
          <label>เดือน<input type="month" value={form.record_month} onChange={(e)=>setForm({...form,record_month:e.target.value})}/></label>
          <label>Factory<select value={form.factory} onChange={(e)=>setForm({...form,factory:e.target.value})}>{factories.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Company<select value={form.company} onChange={(e)=>setForm({...form,company:e.target.value})}>{companies.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Emission Source<select value={form.source} onChange={(e)=>chooseSource(e.target.value)}>{Object.keys(factorLibrary).map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Scope<select value={form.scope} onChange={(e)=>setForm({...form,scope:Number(e.target.value)})}><option value="1">Scope 1</option><option value="2">Scope 2</option><option value="3">Scope 3</option></select></label>
          <label>Activity Data<input type="number" step="0.0001" value={form.activity_data} onChange={(e)=>setForm({...form,activity_data:e.target.value})}/></label>
          <label>Unit<input value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})}/></label>
          <label>Emission Factor<input type="number" step="0.000001" value={form.emission_factor} onChange={(e)=>setForm({...form,emission_factor:e.target.value})}/></label>
          <label className="spanTwo">Remark<textarea value={form.remark} onChange={(e)=>setForm({...form,remark:e.target.value})}/></label>
        </div><div className="formActions"><button type="button" className="outlineButton" onClick={resetForm}>ล้างฟอร์ม</button><button className="primaryButton" disabled={loading}>{editId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</button></div></form></section>}

        {page === 'records' && <section className="panel"><div className="filterBar"><input placeholder="ค้นหา Source / Remark" value={filter.search} onChange={(e)=>setFilter({...filter,search:e.target.value})}/><input type="month" value={filter.month} onChange={(e)=>setFilter({...filter,month:e.target.value})}/><select value={filter.factory} onChange={(e)=>setFilter({...filter,factory:e.target.value})}><option value="">ทุก Factory</option>{factories.map(x=><option key={x}>{x}</option>)}</select><select value={filter.scope} onChange={(e)=>setFilter({...filter,scope:e.target.value})}><option value="">ทุก Scope</option><option value="1">Scope 1</option><option value="2">Scope 2</option><option value="3">Scope 3</option></select><button className="primaryButton" onClick={exportCsv}>Export CSV</button></div><div className="tableWrap"><table><thead><tr><th>Date</th><th>Factory</th><th>Company</th><th>Scope</th><th>Source</th><th>Activity</th><th>Unit</th><th>EF</th><th>tCO₂e</th><th>Action</th></tr></thead><tbody>{filteredRecords.length ? filteredRecords.map((r)=><tr key={r.id}><td>{r.record_date}</td><td>{r.factory}</td><td>{r.company}</td><td>Scope {r.scope}</td><td>{r.source}</td><td>{formatNumber(r.activity_data,2)}</td><td>{r.unit}</td><td>{formatNumber(r.emission_factor,6)}</td><td><strong>{formatNumber(r.tco2e)}</strong></td><td><button className="tableButton" onClick={()=>editRecord(r)}>แก้ไข</button><button className="tableButton dangerText" onClick={()=>deleteRecord(r.id)}>ลบ</button></td></tr>) : <tr><td colSpan="10" className="emptyState">ยังไม่มีข้อมูล</td></tr>}</tbody></table></div></section>}

        {page === 'factors' && <section className="panel"><div className="tableWrap"><table><thead><tr><th>Source</th><th>Scope</th><th>Unit</th><th>Emission Factor</th></tr></thead><tbody>{Object.entries(factorLibrary).map(([source,item])=><tr key={source}><td>{source}</td><td>Scope {item.scope}</td><td>{item.unit}</td><td>{formatNumber(item.factor,6)}</td></tr>)}</tbody></table></div><p className="helperText">ค่าปัจจุบันเป็นค่าตัวอย่างสำหรับพัฒนาระบบ โปรดตรวจสอบกับแหล่งอ้างอิงของบริษัทก่อนใช้รายงานอย่างเป็นทางการ</p></section>}

        {page === 'reports' && <section className="panel reportEmpty"><span className="eyebrow">COMING NEXT</span><h2>Report Center</h2><p>เวอร์ชันถัดไปจะเพิ่มรายงาน Excel, PDF, Target vs Actual และ Executive Summary</p><button className="primaryButton" onClick={exportCsv}>Export ข้อมูลปัจจุบันเป็น CSV</button></section>}
      </main>
    </div>
  );
}
