import React, { useState } from 'react';
import { Plus, Wand2, Loader2, Calendar, Star } from 'lucide-react';
import { generateSubtasks } from './aiService';

export function TaskInput({ onAdd, apiSettings }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), difficulty, dueDate || null);
    setTitle('');
    setDueDate('');
    setDifficulty(1);
    setErrorMsg(null);
  };

  const handleAiSplit = async () => {
    if (!title.trim()) { setErrorMsg('タスク名を入力してから分割ボタンを押してください。'); return; }
    if (!apiSettings.apiKey) { setErrorMsg('設定からAPIキーを入力してください。'); return; }
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const subtasksText = await generateSubtasks(apiSettings.apiKey, apiSettings.modelName, title.trim());
      let addedCount = 0;
      if (Array.isArray(subtasksText)) {
        subtasksText.forEach(subTitle => {
          if (subTitle && subTitle.trim()) {
            onAdd(subTitle.trim(), difficulty, dueDate || null, null);
            addedCount++;
          }
        });
      }
      if (addedCount > 0) {
        setTitle(''); setDueDate(''); setDifficulty(1);
      } else {
        setErrorMsg('うまく分割できませんでした。別のタスク名でお試しください。');
      }
    } catch (err) {
      setErrorMsg('AIの呼び出し中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rpg-window" style={{ marginBottom: 'var(--spacing-lg)' }}>
      {/* ウィンドウタイトル風 */}
      <p style={{ color: 'var(--accent-secondary)', marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-window-inner)', paddingBottom: '6px' }}>
        ▶ 新しいクエストを追加
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {/* タスク名入力 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="クエスト名を入力..."
          disabled={isGenerating}
        />

        {/* オプション行（期限・難易度・ボタン） */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 期限 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '2px solid var(--border-window)', borderRadius: 'var(--radius-sm)', padding: '4px 8px' }}>
            <Calendar size={14} color="var(--text-secondary)" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isGenerating}
              style={{ border: 'none', padding: 0, fontSize: '0.85rem', width: 'auto' }}
            />
          </div>

          {/* 難易度（★） */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border: '2px solid var(--border-window)', borderRadius: 'var(--radius-sm)', padding: '4px 8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '4px' }}>難易度</span>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setDifficulty(star)}
                disabled={isGenerating}
                style={{ padding: '0 2px', color: star <= difficulty ? 'var(--accent-secondary)' : 'var(--text-muted)', border: 'none', background: 'transparent' }}
              >
                ★
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* 追加ボタン */}
          <button
            type="submit"
            className="btn-primary"
            disabled={!title.trim() || isGenerating}
          >
            <Plus size={16} />
            追加
          </button>
        </div>
      </form>

      {/* AI分割ボタンとエラー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--spacing-sm)', borderTop: '1px solid var(--border-window-inner)', paddingTop: 'var(--spacing-sm)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{errorMsg}</span>
        <button
          type="button"
          onClick={handleAiSplit}
          disabled={!title.trim() || isGenerating || !apiSettings.apiKey}
          className="btn-primary"
          style={{
            color: (title.trim() && apiSettings.apiKey) ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontSize: '0.85rem',
            padding: '6px 12px'
          }}
          title={!apiSettings.apiKey ? "⚙設定からAPIキーを登録してください" : "AIがサブクエストに分割します"}
        >
          {isGenerating ? <>⌛ AI分割中...</> : <>✦ AIで分割</>}
        </button>
      </div>
    </div>
  );
}
