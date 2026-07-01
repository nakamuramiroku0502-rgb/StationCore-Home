import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // ★初期値を「全体（空文字）」に変更
  const [selectedStaff, setSelectedStaff] = useState('');

  const dashboardData = {
    todaySchedules: 4,
    missingRecords: 2,
    unreadNotifications: 3
  };

  const apps = [
    { id: 'schedule', name: 'スケジュール', desc: 'ステーション全体の週間枠・訪問予定' },
    { id: 'users', name: '利用者管理', desc: '基本情報・カルテの連携' },
    { id: 'staff', name: '職員管理', desc: 'シフト・資格・権限設定' },
    { id: 'records', name: '訪問記録', desc: '現場での記録のかんたん入力' },
    { id: 'vehicles', name: '車両管理', desc: '車両の空き状況と利用履歴' },
  ];

  const handleAppLaunch = (appId) => {
    if (appId === 'schedule') {
      const currentUrl = window.location.href;
      let baseUrl = 'http://localhost:3001';
      
      if (currentUrl.includes('github.dev')) {
        baseUrl = currentUrl.replace('-5173', '-3001').split('?')[0].replace(/\/$/, '');
      }
      
      // staffパラメータを結合
      const targetUrl = `${baseUrl}?staff=${encodeURIComponent(selectedStaff)}`;
      
      if (window.confirm(`スケジュールアプリを起動します。\n\nよろしいですか？`)) {
        window.location.href = targetUrl;
      }
    } else {
      alert(`${appId} アプリは今後開発予定です。`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
      
      <div className="flex flex-col min-h-screen">
        <Header openSidebar={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
          
          <section>
            <h2 className="text-sm font-bold text-slate-500 mb-4 tracking-wider">本日の状況</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <span className="text-sm font-medium text-slate-500 mb-2">今日の訪問予定</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800">{dashboardData.todaySchedules}</span>
                  <span className="text-sm font-medium text-slate-500">件</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <span className="text-sm font-medium text-slate-500 mb-2">未入力記録</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800">{dashboardData.missingRecords}</span>
                  <span className="text-sm font-medium text-slate-500">件</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <span className="text-sm font-medium text-slate-500 mb-2">未確認通知</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800">{dashboardData.unreadNotifications}</span>
                  <span className="text-sm font-medium text-slate-500">件</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
              👤 表示・操作対象の選択
            </h2>
            <p className="text-xs text-slate-400 mb-4">ここで選択した条件で、各業務アプリが立ち上がります。</p>
            <select 
              value={selectedStaff} 
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="block w-full sm:w-64 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {/* ★「指定なし（全体）」を追加 */}
              <option value="">ステーション全体を表示</option>
              <option value="山田 太郎">山田 太郎（看護師・主任）</option>
              <option value="鈴木 花子">鈴木 花子（看護師）</option>
              <option value="佐藤 健太">佐藤 健太（理学療法士）</option>
            </select>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-500 mb-4 tracking-wider">業務メニュー</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {apps.map((app) => (
                <button 
                  key={app.id}
                  onClick={() => handleAppLaunch(app.id)}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group flex flex-col w-full"
                >
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{app.name}</h3>
                    <span className="text-slate-300 group-hover:text-blue-500 transition-colors">→</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{app.desc}</p>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}