'use client';

import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { Task } from '@/types/task';
import { CheckIcon, EditIcon, TrashIcon, CloseIcon } from './Icons';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string, newTitle: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    setEditTitle(task.title);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleSaveEdit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editTitle.trim();
    if (!trimmed) {
      handleCancelEditing();
      return;
    }
    if (trimmed !== task.title) {
      const success = await onEdit(task.id, trimmed);
      if (success) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditing();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  return (
    <li
      className={`${styles.item} ${task.completed ? styles.checked : ''}`}
      role="listitem"
      data-testid="task-item"
    >
      {/* Checkbox toggle */}
      <label
        className={styles.checkboxContainer}
        title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        data-testid="task-checkbox-label"
      >
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className={styles.nativeCheckbox}
          aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
          data-testid="task-checkbox"
        />
        <span className={styles.customCheckbox} aria-hidden="true">
          {task.completed && <CheckIcon size={14} />}
        </span>
      </label>

      {/* Main Task Content or Inline Editor */}
      <div className={styles.contentArea}>
        {isEditing ? (
          <form className={styles.editForm} onSubmit={handleSaveEdit}>
            <input
              ref={inputRef}
              type="text"
              className={styles.editInput}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={300}
              aria-label="Edit task title"
              data-testid="task-edit-input"
            />
            <div className={styles.editActionButtons}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={!editTitle.trim()}
                aria-label="Save changes"
                data-testid="task-save-btn"
              >
                Save
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelEditing}
                aria-label="Cancel editing"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          </form>
        ) : (
          <span
            className={`${styles.title} ${task.completed ? styles.completedTitle : ''}`}
            onDoubleClick={handleStartEditing}
            title="Double-click to edit"
            data-testid="task-title"
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Row action controls */}
      {!isEditing && (
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleStartEditing}
            aria-label={`Edit task "${task.title}"`}
            title="Edit task"
            data-testid="task-edit-btn"
          >
            <EditIcon size={15} />
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={() => onDelete(task.id)}
            aria-label={`Delete task "${task.title}"`}
            title="Delete task"
            data-testid="task-delete-btn"
          >
            <TrashIcon size={15} />
          </button>
        </div>
      )}
    </li>
  );
}
