import React, { useState } from 'react';

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const selectedStaffFromUrl = params.get('staff');
  const displayMode = selectedStaffFromUrl ? `${selectedStaffFromUrl} さんの予定をハイライト` : 'ステーション全体を表示中';

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 1分あたりの横幅（3px = 60分で180pxの幅）
  const PIXELS_PER_MIN = 3;
  // ★18:00まで表示するように拡張（9:00〜18:00 = 9時間分）
  const startHours = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
  const startMins = ['00', '10', '20', '30', '40', '50'];
  const days = ['月', '火', '水', '木', '金', '土', '日'];

  const durationOptions = [
    { value: 20, label: '20分（介護Ⅰ1など）' },
    { value: 30, label: '30分（介護Ⅰ2・医療標準など）' },
    { value: 40, label: '40分（精神科・医療など）' },
    { value: 60, label: '60分（介護Ⅰ3・医療ロングなど）' },
    { value: 90, label: '90分（介護Ⅰ4・医療特別など）' },
    { value: 120, label: '120分（介護Ⅰ5など）' }
  ];

  const [formData, setFormData] = useState({
    patient: '',
    insurance: '介護保険',
    day: '月',
    hour: '09',
    min: '00',
    duration: 60,
    fixedStaff: '',
    memo: ''
  });

  const [visits, setVisits] = useState([
    { id: 1, day: '月', time: '09:00', duration: 60, patient: '田中 幸子', staffNeeded: 2, assigned: ['山田 太郎', '鈴木 花子'], insurance: '介護保険' },
    { id: 2, day: '月', time: '09:30', duration: 30, patient: '渡辺 健一', staffNeeded: 1, assigned: ['佐藤 健太'], insurance: '医療保険' },
    { id: 3, day: '月', time: '14:20', duration: 40, patient: '伊藤 トメ', staffNeeded: 1, assigned: ['山田 太郎'], insurance: '介護保険' },
    { id: 4, day: '火', time: '10:00', duration: 90, patient: '山本 さくら', staffNeeded: 2, assigned: ['未定', '未定'], insurance: '精神科訪問看護' },
    { id: 5, day: '水', time: '11:00', duration: 60, patient: '高橋 吾郎', staffNeeded: 1, assigned: ['鈴木 花子'], insurance: '介護保険' },
    { id: 6, day: '金', time: '15:30', duration: 30, patient: '小林 松子', staffNeeded: 1, assigned: ['佐藤 健太'], insurance: '介護保険' },
  ]);

  const getMinutesFromStart = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h - 9) * 60 + m;
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ patient: '', insurance: '介護保険', day: '月', hour: '09', min: '00', duration: 60, fixedStaff: '', memo: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (visit) => {
    setEditingId(visit.id);
    const [h, m] = visit.time.split(':');
    setFormData({
      patient: visit.patient,
      insurance: visit.insurance || '介護保険',
      day: visit.day,
      hour: h,
      min: m,
      duration: visit.duration || 60,
      fixedStaff: visit.assigned.includes('未定') ? '' : visit.assigned[0],
      memo: visit.memo || ''
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

  const handleSave = () => {
    if (!formData.patient.trim()) return alert('利用者名を入力してください。');
    const timeStr = `${formData.hour}:${formData.min}`;
    
    if (editingId) {
      setVisits(prev => prev.map(v => v.id === editingId ? {
        ...v, patient: formData.patient, day: formData.day, time: timeStr, duration: formData.duration, assigned: formData.fixedStaff ? [formData.fixedStaff] : ['未定'], insurance: formData.insurance, memo: formData.memo
      } : v));
    } else {
      setVisits(prev => [...prev, {
        id: Date.now(), day: formData.day, time: timeStr, duration: formData.duration, patient: formData.patient, staffNeeded: 1, assigned: formData.fixedStaff ? [formData.fixedStaff] : ['未定'], insurance: formData.insurance, memo: formData.memo
      }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm('この枠を削除しますか？')) {
      setVisits(prev => prev.filter(v => v.id !== editingId));
      setIsModalOpen(false);
    }
  };

  const handleDragStart = (e, visitId) => {
    e.stopPropagation();
    e.dataTransfer.setData('visitId', visitId);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetDay) => {
    e.preventDefault();
    const visitId = parseInt(e.dataTransfer.getData('visitId'), 10);
    const visitToMove = visits.find(v => v.id === visitId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalMins = Math.max(0, Math.floor(x / PIXELS_PER_MIN));
    
    let hour = Math.floor(totalMins / 60) + 9;
    let min = Math.round((totalMins % 60) / 10) * 10;
    
    if (min >= 60) { hour += 1; min = 0; }
    if (hour > 17) { hour = 17; min = 50; }
    const targetTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

    if (visitToMove && (visitToMove.day !== targetDay || visitToMove.time !== targetTime)) {
      const timeString = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      setMoveHistory(prev => [{ id: Date.now(), time: timeString, message: `${visitToMove.patient}様の枠を [${visitToMove.day} ${visitToMove.time}] から [${targetDay} ${targetTime}] に移動しました。` }, ...prev]);
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, day: targetDay, time: targetTime } : v));
    }
  };

  // 曜日ごとの行をレンダリング
  const renderDayRow = (day, index) => {
    const rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-100';
    const headerBgClass = index % 2 === 0 ? 'bg-slate-50' : 'bg-slate-200';
    
    const dayVisits = visits.filter(v => v.day === day).sort((a, b) => getMinutesFromStart(a.time) - getMinutesFromStart(b.time));
    
    const lanes = [];
    const positionedVisits = dayVisits.map(visit => {
      const startMin = getMinutesFromStart(visit.time);
      const endMin = startMin + visit.duration;
      
      let laneIdx = lanes.findIndex(endTime => endTime <= startMin);
      if (laneIdx === -1) {
        laneIdx = lanes.length;
        lanes.push(endMin);
      } else {
        lanes[laneIdx] = endMin;
      }
      return { ...visit, startMin, laneIdx };
    });

    return (
      <div key={day} className={`flex border-b border-slate-300 group ${rowBgClass}`} style={{ height: '140px' }}>
        
        {/* 左側の曜日ヘッダー */}
        <div className={`w-20 sm:w-24 flex-shrink-0 sticky left-0 z-20 border-r border-slate-300 flex flex-col justify-center items-center shadow-[1px_0_0_#cbd5e1] transition-colors ${headerBgClass}`}>
          <div className="font-bold text-slate-700 text-lg">{day}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-normal bg-white/70 inline-block px-2 py-0.5 rounded-full border border-slate-300">
            {positionedVisits.length}件
          </div>
        </div>

        {/* 右側のタイムライン（横幅を9時間分に設定） */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, day)}
          className="flex-1 relative overflow-hidden group-hover:bg-blue-50/20 transition-colors"
          style={{ width: `${9 * 60 * PIXELS_PER_MIN}px`, minWidth: `${9 * 60 * PIXELS_PER_MIN}px` }}
        >
          {/* 00分の縦線 */}
          {startHours.map((hour, i) => (
            <div key={hour} className="absolute top-0 bottom-0 border-l-2 border-slate-300 pointer-events-none" style={{ left: `${i * 60 * PIXELS_PER_MIN}px` }}></div>
          ))}
          {/* ★30分の縦線（点線を薄く） */}
          {startHours.slice(0, -1).map((hour, i) => (
            <div key={`${hour}-half`} className="absolute top-0 bottom-0 border-l border-slate-300 border-dashed pointer-events-none opacity-30" style={{ left: `${(i * 60 + 30) * PIXELS_PER_MIN}px` }}></div>
          ))}

          {/* カード配置 */}
          {positionedVisits.map(pv => {
            const isTargetAssigned = selectedStaffFromUrl && pv.assigned.includes(selectedStaffFromUrl);
            const leftPos = pv.startMin * PIXELS_PER_MIN;
            const widthPx = pv.duration * PIXELS_PER_MIN;
            const topPos = 8 + pv.laneIdx * 44; // カードが重なる高さを調整
            
            return (
              <div 
                key={pv.id}
                draggable
                onDragStart={(e) => handleDragStart(e, pv.id)}
                onClick={(e) => { e.stopPropagation(); openEditModal(pv); }}
                style={{ left: `${leftPos}px`, width: `${widthPx}px`, top: `${topPos}px`, height: '40px' }}
                className={`absolute p-1 rounded border text-left shadow-sm cursor-pointer hover:z-30 hover:scale-[1.02] hover:shadow-md transition-all overflow-hidden ${
                  isTargetAssigned ? 'bg-amber-100 border-amber-400 ring-1 ring-amber-400 z-20' : 'bg-white border-slate-300 hover:border-blue-400 z-10'
                }`}
              >
                <div className="flex justify-between items-center mb-0.5 pointer-events-none">
                  <span className="font-bold text-slate-800 text-[11px] truncate leading-none">{pv.time} {pv.patient}様</span>
                </div>
                <div className="flex gap-1 items-center pointer-events-none">
                  <span className={`px-1 rounded text-[9px] font-bold ${pv.insurance === '医療保険' ? 'bg-blue-100 text-blue-600' : pv.insurance === '精神科訪問看護' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-700'}`}>
                    {pv.duration}分
                  </span>
                  {pv.duration >= 30 && pv.assigned.map((staff, idx) => (
                    <div key={idx} className={`text-[9px] px-1 rounded truncate leading-tight ${staff === '未定' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>👤 {staff.split(' ')[0]}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-2 md:p-6 relative">
      <div className="max-w-[1800px] mx-auto space-y-4">
        
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
          <div>
            <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">StationCore 連携</div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-wide flex items-center gap-2">📅 週間ガントスケジュール</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-full shadow-sm hidden md:inline-flex">
              <span className={`w-2 h-2 rounded-full ${selectedStaffFromUrl ? 'bg-amber-400 animate-pulse' : 'bg-blue-500'}`}></span>{displayMode}
            </div>
            <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="px-4 py-2 bg-white text-slate-600 border border-slate-300 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
              {isHistoryOpen ? '履歴を隠す' : '履歴を表示'}
            </button>
            <button onClick={openNewModal} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors">＋ 枠の追加</button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* カレンダー本体（スクロール枠） */}
          <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden flex flex-col">
            
            {/* ★ 縦スクロールと横スクロールに対応するコンテナ */}
            <div className="overflow-auto max-h-[75vh] w-full relative custom-scrollbar">
              <div className="min-w-fit">
                
                {/* タイムラインの上部ヘッダー（時間表示） ★sticky top-0 z-40で縦スクロール時に追従 */}
                <div className="flex border-b-2 border-slate-300 bg-slate-200 sticky top-0 z-40">
                  {/* ★左上の曜日セルも、横スクロールと縦スクロールの両方に追従するよう z-50 */}
                  <div className="w-20 sm:w-24 flex-shrink-0 sticky left-0 z-50 border-r border-slate-300 bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-[1px_0_0_#cbd5e1]">曜日</div>
                  <div className="flex-1 relative" style={{ width: `${9 * 60 * PIXELS_PER_MIN}px`, minWidth: `${9 * 60 * PIXELS_PER_MIN}px`, height: '40px' }}>
                    {startHours.map((hour, i) => (
                      // ★ 時間のテキストを縦線の左端にピッタリ合わせる (pl-1で少しだけ余白)
                      <div key={hour} className="absolute top-2 left-0 pl-1" style={{ left: `${i * 60 * PIXELS_PER_MIN}px` }}>
                        <span className="text-sm font-bold text-slate-700">{hour}:00</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 曜日ごとの行をレンダリング */}
                <div className="flex flex-col">
                  {days.map((day, index) => renderDayRow(day, index))}
                </div>
              </div>
            </div>
          </div>

          {/* 移動履歴サイドバー */}
          {isHistoryOpen && (
            <div className="w-full xl:w-80 bg-white rounded-xl border border-slate-300 shadow-md flex flex-col h-[500px] xl:h-auto max-h-[80vh] animate-fade-in-down xl:animate-none">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">枠の移動履歴</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{moveHistory.length}件</span>
                  <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 px-1">✕</button>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {moveHistory.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-8">予定をドラッグ＆ドロップすると<br/>履歴が記録されます。</div>
                ) : (
                  moveHistory.map(hist => (
                    <div key={hist.id} className="text-xs border-l-2 border-blue-400 pl-3 py-1 relative animate-fade-in-down">
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
                    {startHours.slice(0,-1).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="font-bold">:</span>
                  <select value={formData.min} onChange={e => setFormData({...formData, min: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    {startMins.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span className="text-sm text-slate-600">開始</span>
                </div>
                <div>
                  <select value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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