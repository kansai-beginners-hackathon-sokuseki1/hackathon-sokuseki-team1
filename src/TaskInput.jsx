import React, { useEffect, useRef, useState } from 'react';
import { Mic, Plus, Square } from 'lucide-react';
import { generateSubtasks } from './aiService';
import { FantasyDatePicker } from './FantasyDatePicker';

export function TaskInput({ onAdd, apiSettings }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const shouldSubmitTranscriptRef = useRef(false);
  const supportsSpeechRecognition = typeof window !== 'undefined'
    && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const resetVoiceState = () => {
    clearSilenceTimer();
    recognitionRef.current = null;
    transcriptRef.current = '';
    shouldSubmitTranscriptRef.current = false;
    setIsListening(false);
  };

  const submitTask = async (rawTitle) => {
    const normalizedTitle = rawTitle.trim();
    if (!normalizedTitle) return;

    setErrorMsg(null);

    if (apiSettings.apiKey) {
      setIsGenerating(true);
      try {
        const result = await generateSubtasks(apiSettings.apiKey, apiSettings.modelName, normalizedTitle);
        await onAdd(result.mainTask.trim() || normalizedTitle, difficulty, dueDate || null);
        for (const sub of result.subtasks) {
          if (sub && sub.trim()) {
            await onAdd(sub.trim(), difficulty, dueDate || null);
          }
        }
        setTitle('');
        setDueDate('');
        setDifficulty(1);
      } catch {
        setErrorMsg('AI によるタスク分解に失敗しました。');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    await onAdd(normalizedTitle, difficulty, dueDate || null);
    setTitle('');
    setDueDate('');
    setDifficulty(1);
  };

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isListening) return;
    await submitTask(title);
  };

  const startSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 5000);
  };

  const stopListening = () => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    setIsListening(false);
  };

  const handleVoiceInput = () => {
    if (!supportsSpeechRecognition || isGenerating) return;
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();

    transcriptRef.current = '';
    shouldSubmitTranscriptRef.current = false;
    setErrorMsg(null);

    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let nextTranscript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        nextTranscript += event.results[i][0]?.transcript || '';
      }
      transcriptRef.current = nextTranscript.trim();
      shouldSubmitTranscriptRef.current = transcriptRef.current.length > 0;
      startSilenceTimer();
    };

    recognition.onerror = (event) => {
      clearSilenceTimer();
      if (event.error === 'no-speech') {
        shouldSubmitTranscriptRef.current = false;
      } else if (event.error !== 'aborted') {
        setErrorMsg('音声入力に失敗しました。マイク権限と対応ブラウザを確認してください。');
      }
    };

    recognition.onend = async () => {
      const transcript = transcriptRef.current.trim();
      const shouldSubmit = shouldSubmitTranscriptRef.current && transcript.length > 0;
      resetVoiceState();

      if (!shouldSubmit) return;

      setTitle(transcript);
      await submitTask(transcript);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    startSilenceTimer();

    try {
      recognition.start();
    } catch {
      resetVoiceState();
      setErrorMsg('音声入力を開始できませんでした。');
    }
  };

  return (
    <div className="rpg-window" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <p style={{ color: 'var(--accent-secondary)', marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-window-inner)', paddingBottom: '6px' }}>
        新しいクエストを追加
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="クエスト名を入力..."
          disabled={isGenerating || isListening}
        />

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          <FantasyDatePicker
            value={dueDate}
            onChange={setDueDate}
            disabled={isGenerating || isListening}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border: '2px solid var(--border-window)', borderRadius: 'var(--radius-sm)', padding: '4px 8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '4px' }}>難易度</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setDifficulty(star)}
                disabled={isGenerating || isListening}
                style={{ padding: '0 2px', color: star <= difficulty ? 'var(--accent-secondary)' : 'var(--text-muted)', border: 'none', background: 'transparent' }}
              >
                ★
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleVoiceInput}
            disabled={!supportsSpeechRecognition || isGenerating}
            title={
              supportsSpeechRecognition
                ? (isListening ? '音声入力を停止' : '音声入力を開始')
                : 'このブラウザでは音声入力を利用できません'
            }
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: !supportsSpeechRecognition ? 0.6 : 1 }}
          >
            {isListening ? <Square size={16} /> : <Mic size={16} />}
            {isListening ? '録音停止' : '音声入力'}
          </button>

          <div style={{ flex: 1 }} />

          <button
            type="submit"
            className="btn-primary"
            disabled={!title.trim() || isGenerating || isListening}
            title={apiSettings.apiKey ? 'AI でタスクを分解して追加' : 'クエストを追加'}
          >
            {isGenerating
              ? <>AI 解析中...</>
              : apiSettings.apiKey
                ? <>AI 追加</>
                : <><Plus size={16} />追加</>
            }
          </button>
        </div>
      </form>

      {!supportsSpeechRecognition && (
        <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          このブラウザでは音声入力を利用できません。
        </div>
      )}

      {isListening && (
        <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
          音声入力中です。5秒以上の無音で自動終了します。
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.8rem', color: 'var(--danger)' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
