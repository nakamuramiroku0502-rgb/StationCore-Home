import React from 'react';

export default function Header({ openSidebar }) {
  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* ハンバーガーメニューアイコン */}
        <button 
          onClick={openSidebar} 
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800 tracking-wide">StationCore</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* 通知ベルアイコン */}
        <button className="text-slate-400 hover:text-slate-600 relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">3</span>
        </button>
        {/* ユーザーアイコン */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded transition-colors">
          <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
            看
          </div>
        </div>
      </div>
    </header>
  );
}