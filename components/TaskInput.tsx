'use client';

import React, { useState, FormEvent, KeyboardEvent, useRef } from 'react';
import { PlusIcon } from './Icons';
import styles from './TaskInput.module.css';

interface TaskInputProps {
  onAddTask: (title: string) => Promise<boolean>;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onAddTask(trimmed);
    if (success) {
      setTitle('');
      // Keep focus on input for fast rapid task entry
      inputRef.current?.focus();
    }
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid = title.trim().length > 0;

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search" aria-label="Add task form">
      <label htmlFor="new-task-input" className="sr-only">
        Add a new task
      </label>
      <input
        ref={inputRef}
        id="new-task-input"
        type="text"
        className={styles.input}
        placeholder="Add a new task... (e.g. Call dentist, Review PR)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        autoComplete="off"
        maxLength={300}
        data-testid="new-task-input"
      />
      <button
        type="submit"
        className={styles.addButton}
        disabled={!isValid || isSubmitting}
        aria-label="Add task"
        data-testid="add-task-btn"
      >
        <PlusIcon size={18} />
        <span className={styles.buttonText}>Add</span>
      </button>
    </form>
  );
}
