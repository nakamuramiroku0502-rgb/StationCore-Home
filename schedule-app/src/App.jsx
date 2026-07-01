import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const selectedStaffFromUrl = params.get('staff');

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSlotsModalOpen, setIsSlotsModalOpen] = useState(false);

  // ★ 新機能：ハンバーガーメニューの開閉状態を管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [laneCounts, setLaneCounts] = useState({
    '月': 6, '火': 6, '水': 6, '木': 6, '金': 6, '土': 6, '日': 6
  });

  const updateLaneCount = (day, delta) => {
    setLaneCounts(prev => ({
      ...prev,
      [day]: Math.max(1, prev[day] + delta)
    }));
  };

  const PIXELS_PER_MIN = 3;
  const startHours = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
  const startMins = ['00', '10', '20', '30', '40', '50'];
  const days = ['月', '火', '水', '木', '金', '土', '日'];
  
  const LANE_HEIGHT = 44; 
  const HEADER_OFFSET = 26; 
  const TIMELINE_MINUTES = 9 * 60 + 30; 
  const TIMELINE_WIDTH = TIMELINE_MINUTES * PIXELS_PER_MIN;

  const generateDurationOptions = () => {
    const options = [];
    for (let i = 10; i <= 120; i += 10) {
      options.push({ value: i, label: `${i}分` });
    }
    return options;
  };

  const DURATION_MAP = {
    '介護保険': generateDurationOptions(),
    '医療保険': generateDurationOptions(),
    '精神科訪問看護': generateDurationOptions(),
    '自費・その他': generateDurationOptions(),
  };

  const [formData, setFormData] = useState({
    patient: '', insurance: '介護保険', day: '月', hour: '09', min: '00', duration: 60, fixedStaff: '', memo: '', laneId: null
  });

  const [visits, setVisits] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'visits'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data()
      }));
      setVisits(list);
    });
    return () => unsubscribe();
  }, []);

  const getMinutesFromStart = (timeStr) => {
    const [h, m] = (timeStr || '09:00').split(':').map(Number);
    return (h - 9) * 60 + m;
  };

  const minsToTimeStr = (mins) => {
    const h = Math.floor(mins / 60) + 9;
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getManpowerAtMinute = (day, targetMin) => {
    const activeLanes = new Set();
    visits.forEach(v => {
      if (v.day !== day) return;
      const start = getMinutesFromStart(v.time);
      const end = start + v.duration;
      if (targetMin >= start && targetMin < end) {
        activeLanes.add(v.laneId);
      }
    });
    return activeLanes.size;
  };

  const getAvailableLaneId = (targetDay, startTimeStr, duration) => {
    const startMin = getMinutesFromStart(startTimeStr);
    const endMin = startMin + duration;
    const dayVisits = visits.filter(v => v.day === targetDay);
    const currentLaneCount = laneCounts[targetDay] || 6;

    for (let i = 0; i < currentLaneCount; i++) {
      const isConflict = dayVisits.some(v => {
        if (v.laneId !== i) return false;
        const vStart = getMinutesFromStart(v.time);
        const vEnd = vStart + v.duration;
        return (startMin < vEnd && endMin > vStart);
      });
      if (!isConflict) return i;
    }
    return 0;
  };

  const findAvailableSlots = () => {
    const slots = [];
    days.forEach(day => {
      const currentLaneCount = laneCounts[day] || 6;
      const dayVisits = visits.filter(v => v.day === day);
      
      for (let lane = 0; lane < currentLaneCount; lane++) {
        const laneVisits = dayVisits.filter(v => v.laneId === lane)
                                    .map(v => {
                                      const start = getMinutesFromStart(v.time);
                                      return { start, end: start + v.duration };
                                    })
                                    .sort((a, b) => a.start - b.start);
        
        let currentTime = 0; 
        const endTimeOfDay = TIMELINE_MINUTES; 

        laneVisits.forEach(v => {
          if (v.start - currentTime >= 30) {
            slots.push({ day, lane, start: currentTime, end: v.start, duration: v.start - currentTime });
          }
          currentTime = Math.max(currentTime, v.end);
        });

        if (endTimeOfDay - currentTime >= 30) {
          slots.push({ day, lane, start: currentTime, end: endTimeOfDay, duration: endTimeOfDay - currentTime });
        }
      }
    });
    return slots;
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      patient: '', insurance: '介護保険', day: '月', hour: '09', min: '00', duration: 60, fixedStaff: '', memo: '', laneId: null
    });
    setIsModalOpen(true);
  };

  const handleTimelineMouseMove = (e, targetDay) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const totalMins = Math.max(0, Math.floor(x / PIXELS_PER_MIN));
    let hour = Math.floor(totalMins / 60) + 9;
    let min = Math.round((totalMins % 60) / 10) * 10;
    if (min >= 60) { hour += 1; min = 0; }
    if (hour > 18 || (hour === 18 && min > 20)) { hour = 18; min = 20; }

    const roundedMins = (hour - 9) * 60 + min;
    const leftPos = roundedMins * PIXELS_PER_MIN;

    let targetLane = Math.floor((y - HEADER_OFFSET) / LANE_HEIGHT);
    if (targetLane < 0) targetLane = 0;
    const currentLaneCount = laneCounts[targetDay] || 6;
    if (targetLane >= currentLaneCount) targetLane = currentLaneCount - 1;
    const topPos = HEADER_OFFSET + targetLane * LANE_HEIGHT;

    setHoveredSlot({
      day: targetDay,
      left: leftPos,
      top: topPos,
      timeStr: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    });
  };

  const handleTimelineMouseLeave = () => {
    setHoveredSlot({ day: null, left: 0, top: 0, timeStr: '' });
  };

  const handleTimelineClick = (e, targetDay) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const totalMins = Math.max(0, Math.floor(x / PIXELS_PER_MIN));
    let hour = Math.floor(totalMins / 60) + 9;
    let min = Math.round((totalMins % 60) / 10) * 10;
    if (min >= 60) { hour += 1; min = 0; }
    if (hour > 18 || (hour === 18 && min > 20)) { hour = 18; min = 20; }

    let targetLane = Math.floor((y - HEADER_OFFSET) / LANE_HEIGHT);
    if (targetLane < 0) targetLane = 0;
    const currentLaneCount = laneCounts[targetDay] || 6;
    if (targetLane >= currentLaneCount) targetLane = currentLaneCount - 1;

    setEditingId(null);
    setFormData({
      patient: '',
      insurance: '介護保険',
      day: targetDay,
      hour: hour.toString().padStart(2, '0'),
      min: min.toString().padStart(2, '0'),
      duration: 60,
      fixedStaff: '',
      memo: '',
      laneId: targetLane
    });
    setIsModalOpen(true);
  };

  const openEditModal = (visit) => {
    if (!visit) return;
    setEditingId(visit.id);
    const [h, m] = (visit.time || '09:00').split(':');
    
    const hasAssigned = visit.assigned && Array.isArray(visit.assigned);
    const isUnassigned = (!hasAssigned || visit.assigned.includes('未定'));

    setFormData({
      patient: visit.patient || '',
      insurance: visit.insurance || '介護保険',
      day: visit.day || '月',
      hour: h || '09',
      min: m || '00',
      duration: visit.duration || 60,
      fixedStaff: !isUnassigned ? (visit.assigned.filter(s => s !== '未定')[0] || '') : '',
      memo: visit.memo || '',
      laneId: visit.laneId
    });
    setIsModalOpen(true);
  };

  const handleInsuranceChange = (newInsurance) => {
    let autoDuration = formData.duration;
    if (newInsurance === '介護保険') autoDuration = 60;
    if (newInsurance === '医療保険') autoDuration = 30;
    if (newInsurance === '精神科訪問看護') autoDuration = 40;
    if (newInsurance === '自費・その他') autoDuration = 60;
    setFormData({ ...formData, insurance: newInsurance, duration: autoDuration });
  };

  const handleSave = async () => {
    if (!formData.patient.trim()) return alert('利用者名を入力してください。');
    const timeStr = `${formData.hour}:${formData.min}`;
    const staffList = formData.fixedStaff ? [formData.fixedStaff] : ['未定'];
    
    try {
      if (editingId) {
        const visitDoc = doc(db, 'visits', editingId);
        await updateDoc(visitDoc, {
          patient: formData.patient, day: formData.day, time: timeStr, duration: formData.duration, assigned: staffList, insurance: formData.insurance, memo: formData.memo
        });
      } else {
        const assignedLaneId = (formData.laneId !== null && formData.laneId !== undefined) 
          ? formData.laneId 
          : getAvailableLaneId(formData.day, timeStr, formData.duration);

        await addDoc(collection(db, 'visits'), {
          day: formData.day, time: timeStr, duration: formData.duration, patient: formData.patient, staffNeeded: 1, assigned: staffList, insurance: formData.insurance, memo: formData.memo, laneId: assignedLaneId
        });
      }
    } catch (error) {
      console.error("保存エラー: ", error);
      alert("データの保存に失敗しました。");
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (window.confirm('この枠を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'visits', editingId));
      } catch (error) {
        console.error("削除エラー: ", error);
      }
      setIsModalOpen(false);
    }
  };

  const handleDragStart = (e, visitId) => {
    e.stopPropagation();
    e.dataTransfer.setData('visitId', visitId); 
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();
    const visitId = e.dataTransfer.getData('visitId');
    const visitToMove = visits.find(v => v.id === visitId);
    if (!visitToMove) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const totalMins = Math.max(0, Math.floor(x / PIXELS_PER_MIN));
    let hour = Math.floor(totalMins / 60) + 9;
    let min = Math.round((totalMins % 60) / 10) * 10;
    
    if (min >= 60) { hour += 1; min = 0; }
    if (hour > 18 || (hour === 18 && min > 20)) { hour = 18; min = 20; }
    const targetTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

    let targetLane = Math.floor((y - HEADER_OFFSET) / LANE_HEIGHT);
    if (targetLane < 0) targetLane = 0;
    if (targetLane >= laneCounts[targetDay]) targetLane = laneCounts[targetDay] - 1;

    if (visitToMove.day !== targetDay || visitToMove.time !== targetTime || visitToMove.laneId !== targetLane) {
      const timeString = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      setMoveHistory(prev => [{ id: Date.now(), time: timeString, message: `${visitToMove.patient}様の枠を [${visitToMove.day} ${visitToMove.time}] から [${targetDay} ${targetTime} (レーン${targetLane + 1})] に移動しました。` }, ...prev]);
      
      try {
        await updateDoc(doc(db, 'visits', visitId), {
          day: targetDay,
          time: targetTime,
          laneId: targetLane
        });
      } catch (error) {
        console.error("移動保存エラー: ", error);
      }
    }
  };

  const renderDayRow = (day, index) => {
    const rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    const headerBgClass = index % 2 === 0 ? 'bg-slate-50' : 'bg-slate-100';
    const currentLaneCount = laneCounts[day] || 6;
    
    const dayVisits = visits.filter(v => v.day === day);
    
    const usedLanesCount = new Set(dayVisits.map(v => v.laneId)).size;
    const totalManpower = usedLanesCount;

    const calculatedHeight = HEADER_OFFSET + currentLaneCount * LANE_HEIGHT; 

    return (
      <div key={day} className={`flex border-b-2 border-slate-300 group ${rowBgClass}`} style={{ height: `${calculatedHeight}px` }}>
        
        <div className={`w-16 flex-shrink-0 sticky left-0 z-30 border-r border-slate-300 flex flex-col justify-center items-center shadow-[1px_0_0_#cbd5e1] transition-colors ${headerBgClass}`}>
          <div className="font-bold text-slate-700 text-base">{day}</div>
          <div className="text-[9px] text-blue-700 mt-1 font-bold bg-blue-50 inline-block px-1.5 py-0.5 rounded-full border border-blue-200 shadow-sm text-center">
            {totalManpower}名
          </div>
        </div>

        <div className="w-10 flex-shrink-0 sticky left-16 z-30 border-r border-slate-300 bg-slate-50 flex flex-col shadow-[1px_0_0_#cbd5e1]">
          <div className="h-[26px] bg-slate-200 border-b border-slate-300 flex items-center justify-between px-0.5">
            <button onClick={() => updateLaneCount(day, -1)} className="w-3 h-4 flex items-center justify-center bg-white hover:bg-slate-100 rounded text-slate-600 text-[10px] font-bold shadow-sm">-</button>
            <span className="text-[10px] font-bold text-slate-700 leading-none">{currentLaneCount}</span>
            <button onClick={() => updateLaneCount(day, 1)} className="w-3 h-4 flex items-center justify-center bg-white hover:bg-slate-100 rounded text-slate-600 text-[10px] font-bold shadow-sm">+</button>
          </div>
          {Array.from({ length: currentLaneCount }).map((_, i) => (
            <div key={i} style={{ height: `${LANE_HEIGHT}px` }} className={`flex items-center justify-center text-[11px] font-bold text-slate-500 border-b border-slate-200 bg-slate-50/80 ${i === 0 ? 'border-t-2 border-slate-400' : ''}`}>
              L{i + 1}
            </div>
          ))}
        </div>

        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, day)}
          onClick={(e) => handleTimelineClick(e, day)}
          className="flex-1 relative overflow-hidden group-hover:bg-blue-50/10 transition-colors cursor-pointer"
          style={{ width: `${TIMELINE_WIDTH}px`, minWidth: `${TIMELINE_WIDTH}px` }}
        >
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 border-l-2 border-slate-300 pointer-events-none" style={{ left: `${i * 60 * PIXELS_PER_MIN}px` }}></div>
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`${i}-half`} className="absolute top-0 bottom-0 border-l border-slate-300 border-dashed pointer-events-none opacity-30" style={{ left: `${(i * 60 + 30) * PIXELS_PER_MIN}px` }}></div>
          ))}

          {Array.from({ length: currentLaneCount }).map((_, i) => (
            <div 
              key={`lane-line-${i}`} 
              className={`absolute left-0 right-0 border-t ${i === 0 ? 'border-slate-400 border-t-2 z-10' : 'border-slate-200 opacity-70'} pointer-events-none`} 
              style={{ top: `${HEADER_OFFSET + i * LANE_HEIGHT}px`, height: `${LANE_HEIGHT}px` }}
            ></div>
          ))}

          <div className="absolute top-0 left-0 right-0 bg-slate-200/50 flex items-center pointer-events-none z-0" style={{ height: `${HEADER_OFFSET}px` }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const minutes = i * 30;
              const currentRequiredStaff = getManpowerAtMinute(day, minutes);
              if (currentRequiredStaff === 0) return null;
              return (
                <div key={i} className="absolute top-0 bottom-0 flex items-center justify-start pl-1" style={{ left: `${minutes * PIXELS_PER_MIN}px`, width: `${30 * PIXELS_PER_MIN}px` }}>
                  <span className={`text-[9px] font-extrabold px-1 rounded scale-90 origin-left ${currentRequiredStaff > 4 ? 'bg-red-500 text-white' : currentRequiredStaff > 2 ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
                    {currentRequiredStaff}名
                  </span>
                </div>
              );
            })}
          </div>

          {dayVisits.map(pv => {
            const isTargetAssigned = selectedStaffFromUrl && pv.assigned && pv.assigned.includes(selectedStaffFromUrl);
            const leftPos = getMinutesFromStart(pv.time) * PIXELS_PER_MIN;
            const widthPx = pv.duration * PIXELS_PER_MIN;
            const topPos = HEADER_OFFSET + (pv.laneId || 0) * LANE_HEIGHT + 3; 
            
            const hasFixedStaff = pv.assigned && Array.isArray(pv.assigned) && pv.assigned.some(staff => staff !== '未定');
            const hasMemo = pv.memo && pv.memo.trim() !== '';
            const hasIndicator = hasFixedStaff || hasMemo;

            const tooltipParts = [`滞在: ${pv.duration}分`];
            if (pv.staffNeeded > 1) tooltipParts.push(`必要人数: ${pv.staffNeeded}名`);
            if (hasFixedStaff) tooltipParts.push(`固定職員: ${pv.assigned.filter(s => s !== '未定').join(', ')}`);
            if (hasMemo) tooltipParts.push(`メモ: ${pv.memo}`);
            
            return (
              <div 
                key={pv.id}
                draggable
                onDragStart={(e) => handleDragStart(e, pv.id)}
                onClick={(e) => { e.stopPropagation(); openEditModal(pv); }}
                style={{ left: `${leftPos}px`, width: `${widthPx}px`, top: `${topPos}px`, height: '38px' }}
                title={tooltipParts.join('\n')}
                className={`absolute p-1.5 rounded border shadow-sm cursor-pointer hover:z-30 hover:scale-[1.02] hover:shadow-md transition-all flex flex-col justify-start ${
                  isTargetAssigned ? 'bg-amber-100 border-amber-400 ring-1 ring-amber-400 z-20' : 'bg-white border-slate-300 hover:border-blue-400 z-10'
                }`}
              >
                {hasIndicator && <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-sky-500 rounded-full shadow-xs animate-pulse z-10"></div>}
                
                <div className={`relative w-full h-full flex flex-col pointer-events-none ${hasIndicator ? 'pl-2' : ''}`}>
                  <div className="flex justify-between items-start w-full">
                    <span className="text-[9px] text-slate-500 font-bold canvas-time">{pv.time}</span>
                    <span className={`flex-shrink-0 px-1 rounded text-[9px] font-bold ${pv.staffNeeded > 1 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>👤{pv.staffNeeded || 1}</span>
                  </div>
                  <div className="font-bold text-slate-800 text-[11px] truncate leading-none mt-0.5 flex-1 flex items-center">
                    {pv.patient}様
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const currentDurationOptions = DURATION_MAP[formData.insurance] || generateDurationOptions();

  const availableSlots = findAvailableSlots();
  const slotsByDay = days.reduce((acc, day) => {
    acc[day] = availableSlots.filter(s => s.day === day);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-2 md:p-6 relative">
      <div className="max-w-[1800px] mx-auto space-y-4">
        
        {/* ★ 改修したヘッダー部分 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
          <div className="flex items-center gap-4">
            
            {/* 左上のハンバーガーメニュー */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 z-50 relative flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* メニュー展開時のドロップダウンと背景透過オーバーレイ */}
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute top-12 left-0 z-50 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <button onClick={() => { setIsSlotsModalOpen(true); setIsMenuOpen(false); }} className="px-4 py-3 text-left text-sm font-bold text-emerald-600 hover:bg-emerald-50 border-b border-slate-100 flex items-center gap-2">
                      🔍 空き枠を探す
                    </button>
                    <button onClick={() => { setIsHistoryOpen(!isHistoryOpen); setIsMenuOpen(false); }} className="px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                      {isHistoryOpen ? '🕒 履歴を隠す' : '🕒 履歴を表示'}
                    </button>
                    <button onClick={() => { openNewModal(); setIsMenuOpen(false); }} className="px-4 py-3 text-left text-sm font-bold text-blue-600 hover:bg-blue-50">
                      ＋ 枠の追加
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* タイトル */}
            <div>
              <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">StationCore 連携</div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-wide flex items-center gap-2">看護枠管理</h1>
            </div>

          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden flex flex-col">
            <div className="overflow-auto max-h-[75vh] w-full relative custom-scrollbar">
              <div className="min-w-fit">
                
                <div className="flex border-b-2 border-slate-300 bg-slate-200 sticky top-0 z-40">
                  <div style={{ width: '104px', minWidth: '104px' }} className="flex-shrink-0 sticky left-0 z-50 border-r border-slate-300 bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-[1px_0_0_#cbd5e1]">曜日 / レーン</div>
                  <div className="flex-1 relative" style={{ width: `${TIMELINE_WIDTH}px`, minWidth: `${TIMELINE_WIDTH}px`, height: '40px' }}>
                    {startHours.map((hour, i) => (
                      <div key={hour} className="absolute top-2 left-0 pl-1" style={{ left: `${i * 60 * PIXELS_PER_MIN}px` }}>
                        <span className="text-sm font-bold text-slate-700">{hour}:00</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  {days.map((day, index) => renderDayRow(day, index))}
                </div>
              </div>
            </div>
          </div>

          {isHistoryOpen && (
            <div className="w-full xl:w-80 bg-white rounded-xl border border-slate-300 shadow-md flex flex-col h-[500px] xl:h-auto max-h-[80vh]">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">枠の移動履歴</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{moveHistory.length}件</span>
                  <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 px-1">✕</button>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {moveHistory.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-8">予定をドラッグ＆ドロップすると履歴が記録されます。</div>
                ) : (
                  moveHistory.map(hist => (
                    <div key={hist.id} className="text-xs border-l-2 border-blue-400 pl-3 py-1 relative">
                      <div className="text-slate-400 mb-0.5 font-mono">{hist.time}</div>
                      <div className="text-slate-700">{hist.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 空き枠検索モーダル */}
      {isSlotsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSlotsModalOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">🔍 30分以上の空き枠一覧</h2>
              <button onClick={() => setIsSlotsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
              {days.map(day => {
                const daySlots = slotsByDay[day];
                if (!daySlots || daySlots.length === 0) return null;
                
                const currentLaneCount = laneCounts[day] || 6;
                const groupedByLane = Array.from({ length: currentLaneCount }).map((_, laneIdx) => {
                  return daySlots.filter(slot => slot.lane === laneIdx);
                });

                return (
                  <div key={day} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <h3 className="font-bold text-slate-700 border-b-2 border-slate-200 pb-2 mb-4 text-lg">{day}曜日</h3>
                    <div className="space-y-4">
                      {groupedByLane.map((laneSlots, laneIdx) => {
                        if (laneSlots.length === 0) return null;
                        return (
                          <div key={laneIdx} className="bg-slate-50 p-3 rounded border border-slate-100">
                            <h4 className="font-bold text-slate-600 text-sm mb-3 border-l-4 border-blue-400 pl-2">L{laneIdx + 1}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {laneSlots.map((slot, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-white border border-slate-200 shadow-sm">
                                  <span className="font-mono text-slate-700 font-medium">
                                    {minsToTimeStr(slot.start)} 〜 {minsToTimeStr(slot.end)}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                    {slot.duration}分空き
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {availableSlots.length === 0 && (
                <div className="text-center text-slate-500 py-8 font-bold">現在、30分以上の空き枠はありません。</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 登録・編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{editingId ? '訪問枠の編集' : '新規訪問枠の登録'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">利用者名 <span className="text-red-500 text-xs ml-1">必須</span></label>
                <input type="text" value={formData.patient} onChange={(e) => setFormData({...formData, patient: e.target.value})} placeholder="例: 山田 花子" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">保険種別</label>
                <div className="grid grid-cols-2 gap-2">
                  {['介護保険', '医療保険', '精神科訪問看護', '自費・その他'].map(ins => (
                    <label key={ins} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input type="radio" checked={formData.insurance === ins} onChange={() => handleInsuranceChange(ins)} className="text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">{ins}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                <label className="block text-sm font-bold text-slate-700 mb-3">訪問時間・滞在時間</label>
                <div className="flex items-center gap-2 mb-3">
                  <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium">
                    {days.map(d => <option key={d} value={d}>{d}曜日</option>)}
                  </select>
                  <select value={formData.hour} onChange={e => setFormData({...formData, hour: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    {startHours.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="font-bold">:</span>
                  <select value={formData.min} onChange={e => setFormData({...formData, min: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    {startMins.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span className="text-sm text-slate-600">開始</span>
                </div>
                <div>
                  <select value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {currentDurationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">固定職員</label>
                <select value={formData.fixedStaff} onChange={e => setFormData({...formData, fixedStaff: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  <option value="">指定なし（誰でもアサイン可能）</option>
                  <option value="山田 太郎">山田 太郎（看護師・主任）</option>
                  <option value="鈴木 花子">鈴木 花子（看護師）</option>
                  <option value="佐藤 健太">佐藤 健太（理学療法士）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">特記事項・メモ</label>
                <textarea rows="3" value={formData.memo} onChange={(e) => setFormData({...formData, memo: e.target.value})} placeholder="例: パルスオキシメーター持参、バルーンカテーテル交換日など" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"></textarea>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                {editingId && <button onClick={handleDelete} className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">予定を削除</button>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">キャンセル</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700">
                  {editingId ? '変更を保存する' : 'この内容で登録する'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}