import React from 'react';

export default function App() {
  // スケジュール画面の仮データ（スタッフごとの週間空き枠状況）
  const staffSchedules = [
    { id: 1, name: '山田 太郎', role: '看護師（主任）', mon: '満枠', tue: '空き2', wed: '空き1', thu: '往診同行', fri: '空き3' },
    { id: 2, name: '鈴木 花子', role: '看護師', mon: '空き1', tue: '満枠', wed: '空き2', thu: '休み', fri: '満枠' },
    { id: 3, name: '佐藤 健太', role: '理学療法士', mon: '空き3', tue: '空き2', wed: '休み', thu: '空き1', fri: '空き2' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ホームアプリとトーンを合わせたシンプルなヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">StationCore アプリ群</div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-wide flex items-center gap-2">
              📅 週間看護枠管理
            </h1>
          </div>
          
          {/* 業務システムらしいシンプルなボタン */}
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors self-start sm:self-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            新規枠の登録
          </button>
        </div>

        {/* メインのデータ表示エリア：業務システムらしいカチッとした白いカード */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* テーブルの上の案内やフィルター置き場 */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">担当職員ごとの週間予約枠・空き状況一覧</span>
            <div className="text-xs text-slate-400">※データはリアルタイムで同期されます（予定）</div>
          </div>

          {/* 週間スケジュールのメインテーブル（レスポンシブ対応で横スクロール可能） */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="px-6 py-3.5 font-bold">職員名 / 職種</th>
                  <th className="px-4 py-3.5 text-center font-bold">月</th>
                  <th className="px-4 py-3.5 text-center font-bold">火</th>
                  <th className="px-4 py-3.5 text-center font-bold">水</th>
                  <th className="px-4 py-3.5 text-center font-bold">木</th>
                  <th className="px-4 py-3.5 text-center font-bold">金</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffSchedules.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 職員情報 */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{staff.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{staff.role}</div>
                    </td>
                    
                    {/* 各曜日の枠状況（文字の質感や色をプロ仕様に制限） */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${staff.mon === '満枠' ? 'bg-slate-100 text-slate-500' : staff.mon === '休み' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600 font-bold'}`}>{staff.mon}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${staff.tue === '満枠' ? 'bg-slate-100 text-slate-500' : staff.tue === '休み' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600 font-bold'}`}>{staff.tue}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${staff.wed === '満枠' ? 'bg-slate-100 text-slate-500' : staff.wed === '休み' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600 font-bold'}`}>{staff.wed}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${staff.thu === '満枠' ? 'bg-slate-100 text-slate-500' : staff.thu === '休み' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600 font-bold'}`}>{staff.thu}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${staff.fri === '満枠' ? 'bg-slate-100 text-slate-500' : staff.fri === '休み' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600 font-bold'}`}>{staff.fri}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}