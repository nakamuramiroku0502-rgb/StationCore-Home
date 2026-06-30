import React, { useState } from 'react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardData = {
    todaySchedules: 4,
    missingRecords: 2,
    unreadNotifications: 3
  };

  const apps = [
    { id: 'schedule', name: 'スケジュール', desc: '週間看護枠・訪問予定管理', color: 'border-blue-500', icon: '📅' },
    { id: 'users', name: '利用者管理', desc: '基本情報・カルテ連携', color: 'border-green-500', icon: '👥' },
    { id: 'staff', name: '職員管理', desc: 'シフト・権限設定', color: 'border-purple-500', icon: '🪪' },
    { id: 'records', name: '訪問記録', desc: '現場でのかんたん記録入力', color: 'border-orange-500', icon: '📝' },
    { id: 'vehicles', name: '車両管理', desc: '車両異常・空き状況チェック', color: 'border-red-500', icon: '🚗' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <header className="bg-blue-900 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏥</span>
            <h1 className="text-xl font-bold tracking-wider">StationCore Home</h1>
          </div>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md hover:bg-blue-800 focus:outline-none"
          >
            <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
        {isMenuOpen && (
          <div className="bg-blue-800 border-t border-blue-700 px-4 py-3 space-y-2">
            <a href="#" className="block py-2 px-3 rounded hover:bg-blue-700 text-sm">個人設定</a>
            <a href="#" className="block py-2 px-3 rounded hover:bg-blue-700 text-sm text-red-300">ログアウト</a>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-500 mb-3 tracking-wider flex items-center gap-2">
            📊 今日の業務状況
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs text-blue-700 font-bold">今日の予定</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{dashboardData.todaySchedules} 件</p>
              </div>
              <span className="text-2xl bg-blue-100 p-2 rounded-full">📅</span>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs text-amber-700 font-bold">未入力記録</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{dashboardData.missingRecords} 件</p>
              </div>
              <span className="text-2xl bg-amber-100 p-2 rounded-full">📝</span>
            </div>
            <div className="bg-red-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs text-red-700 font-bold">未確認通知</p>
                <p className="text-2xl font-black text-red-900 mt-1">{dashboardData.unreadNotifications} 件</p>
              </div>
              <span className="text-2xl bg-red-100 p-2 rounded-full">🔔</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-500 mb-3 tracking-wider flex items-center gap-2">
            📱 業務アプリ一覧
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {apps.map((app) => (
              <div 
                key={app.id}
                className={`bg-white p-5 rounded-xl shadow-sm border-t-4 ${app.color} border border-slate-200 hover:shadow-md transition-all active:scale-98 cursor-pointer flex items-start space-x-4`}
              >
                <div className="text-3xl p-2 bg-slate-50 rounded-lg">{app.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{app.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{app.desc}</p>
                </div>
                <span className="text-slate-300 text-sm">▶</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around text-slate-600 z-50">
        <button className="flex flex-col items-center justify-center w-full h-full text-blue-600">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold mt-1">ホーム</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full hover:text-blue-600">
          <span className="text-xl">🔔</span>
          <span className="text-[10px] mt-1">通知</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full hover:text-blue-600">
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] mt-1">設定</span>
        </button>
      </div>
      <div className="h-16 md:hidden"></div>
    </div>
  );
}

export default App;