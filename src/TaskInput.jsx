import React, { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { generateSubtasks } from './aiService';

export function TaskInput({ onAdd, apiSettings }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setErrorMsg(null);

    if (apiSettings.apiKey) {
      setIsGenerating(true);
      try {
        const result = await generateSubtasks(apiSettings.apiKey, apiSettings.modelName, title.trim());
        await onAdd(result.mainTask.trim() || title.trim(), difficulty, dueDate || null);
        for (const sub of result.subtasks) {
          if (sub && sub.trim()) {
            await onAdd(sub.trim(), difficulty, dueDate || null);
          }
        }
        setTitle(''); setDueDate(''); setDifficulty(1);
      } catch (err) {
        setErrorMsg('AIの呼び出し中にエラーが発生しました。');
      } finally {
        setIsGenerating(false);
      }
    } else {
      onAdd(title.trim(), difficulty, dueDate || null);
      setTitle('');
      setDueDate('');
      setDifficulty(1);
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
            title={apiSettings.apiKey ? 'AIがメインタスク＋サブクエストに分解して追加します' : 'クエストを追加します'}
          >
            {isGenerating
              ? <>⌛ AI分析中...</>
              : apiSettings.apiKey
                ? <>✦ AI追加</>
                : <><Plus size={16} />追加</>
            }
          </button>
        </div>
      </form>

      {errorMsg && (
        <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.8rem', color: 'var(--danger)' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
