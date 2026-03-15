import React, { useEffect, useRef, useState } from 'react';
import { Mic, Plus, Square } from 'lucide-react';
import { FantasyDatePicker } from './FantasyDatePicker';

const JAPANESE_TASK_PATTERN = /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}々ー、。！？「」（）・\s]+$/u;

function validateTaskTitle(rawTitle) {
  const normalizedTitle = rawTitle.trim();

  if (!normalizedTitle) {
    return null;
  }

  if (normalizedTitle.length > 50) {
    return 'タスク名は50文字以内で入力してください。';
  }

  if (!JAPANESE_TASK_PATTERN.test(normalizedTitle)) {
    return 'タスク名は日本語のみで入力してください。';
  }

  return null;
}

export function TaskInput({ onAdd, scoreDifficulty }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [difficultyMeta, setDifficultyMeta] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const shouldSubmitTranscriptRef = useRef(false);
  const scoreTimerRef = useRef(null);
  const supportsSpeechRecognition = typeof window !== 'undefined'
    && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const clearScoreTimer = () => {
    if (scoreTimerRef.current) {
      clearTimeout(scoreTimerRef.current);
      scoreTimerRef.current = null;
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

    const validationError = validateTaskTitle(normalizedTitle);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onAdd(normalizedTitle, difficulty, dueDate || null);
      setTitle('');
      setDueDate('');
      setDifficulty(1);
      setDifficultyMeta(null);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'タスクの追加に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => () => {
    clearSilenceTimer();
    clearScoreTimer();
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
  }, []);

  useEffect(() => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      clearScoreTimer();
      setDifficulty(1);
      setDifficultyMeta(null);
      setIsScoring(false);
      return;
    }

    const validationError = validateTaskTitle(normalizedTitle);
    if (validationError) {
      clearScoreTimer();
      setDifficultyMeta({
        reason: validationError,
        matchedCategories: []
      });
      setIsScoring(false);
      return;
    }

    clearScoreTimer();
    scoreTimerRef.current = setTimeout(async () => {
      setIsScoring(true);
      try {
        const result = await scoreDifficulty({
          title: normalizedTitle,
          dueDate: dueDate || null
        });
        setDifficulty(result.difficulty);
        setDifficultyMeta(result);
      } catch (error) {
        console.error(error);
        setDifficultyMeta({
          reason: 'AI 判定を利用できなかったため、現在の難易度をそのまま使います。',
          matchedCategories: []
        });
      } finally {
        setIsScoring(false);
      }
    }, 450);

    return clearScoreTimer;
  }, [title, dueDate, scoreDifficulty]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || isListening || isSubmitting) return;
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
    if (!supportsSpeechRecognition || isSubmitting) return;
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
      for (let index = 0; index < event.results.length; index += 1) {
        nextTranscript += event.results[index][0]?.transcript || '';
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
        setErrorMsg('音声入力に失敗しました。');
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

  const validationError = validateTaskTitle(title);

  return (
    <div className="rpg-window task-input-window" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <p style={{ color: 'var(--accent-secondary)', marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-window-inner)', paddingBottom: '6px' }}>
        タスクを追加
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <input
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (errorMsg) {
              setErrorMsg(null);
            }
          }}
          placeholder="やることを入力"
          maxLength={50}
          disabled={isSubmitting || isListening}
        />

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="task-meta-chip task-meta-chip--deadline">
            <span className="task-meta-chip__label">期限</span>
            <FantasyDatePicker
              value={dueDate}
              onChange={setDueDate}
              disabled={isSubmitting || isListening}
            />
          </div>

          <div className="task-meta-chip task-meta-chip--difficulty">
            <span className="task-meta-chip__label">難易度</span>
            <div className="task-difficulty-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDifficulty(star)}
                  disabled={isSubmitting || isListening}
                  className="task-difficulty-stars__button"
                  aria-label={`難易度 ${star}`}
                >
                  <span className={star <= difficulty ? 'task-difficulty-stars__icon is-active' : 'task-difficulty-stars__icon'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleVoiceInput}
            disabled={!supportsSpeechRecognition || isSubmitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: !supportsSpeechRecognition ? 0.6 : 1 }}
          >
            {isListening ? <Square size={16} /> : <Mic size={16} />}
            {isListening ? '停止' : '音声入力'}
          </button>

          <div style={{ flex: 1 }} />

          <button
            type="submit"
            className="btn-primary"
            disabled={!title.trim() || Boolean(validationError) || isSubmitting || isListening}
          >
            {isSubmitting ? '追加中...' : <><Plus size={16} />追加</>}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 'var(--spacing-sm)', minHeight: '1.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>日本語のみ、50文字以内で入力できます。</span>
        {isScoring && <div>AI が難易度を判定中です...</div>}
        {!isScoring && difficultyMeta?.reason && (
          <div>
            {difficultyMeta.reason}
            {difficultyMeta.matchedCategories?.length > 0 && ` 判定カテゴリ: ${difficultyMeta.matchedCategories.join(', ')}`}
          </div>
        )}
      </div>

      {(errorMsg || validationError) && (
        <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.8rem', color: 'var(--danger)' }}>
          {errorMsg || validationError}
        </div>
      )}
    </div>
  );
}
