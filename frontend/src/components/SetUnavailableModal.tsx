'use client';

import { useState, useEffect } from 'react';
import { Consultant, bookingsApi } from '@/lib/api';
import { format, setHours, setMinutes, startOfDay, endOfDay } from 'date-fns';

interface SetUnavailableModalProps {
  consultants: Consultant[];
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function SetUnavailableModal({
  userId,
  date,
  isOpen,
  onClose,
  onSuccess,
}: SetUnavailableModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unavailableType, setUnavailableType] = useState<'entire-day' | 'time-range'>('entire-day');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  if (!isOpen) return null;


  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let start: Date;
      let end: Date;

      if (unavailableType === 'entire-day') {
        start = startOfDay(date);
        end = endOfDay(date);
      } else {
        // Parse time range
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        start = setMinutes(setHours(startOfDay(date), startHour), startMin);
        end = setMinutes(setHours(startOfDay(date), endHour), endMin);

        if (end <= start) {
          setError('End time must be after start time');
          setLoading(false);
          return;
        }
      }

      // Create a booking for each selected consultant role
      
        await bookingsApi.create({
          userId: userId,
          clientId: userId,
          start: start.toISOString(),
          end: end.toISOString(),
          consultantId: null,
        });
      


      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to set unavailable time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="card-title">Set as Unavailable</h2>
            <p className="card-description">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.5rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>
            Unavailability Type
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className={unavailableType === 'entire-day' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setUnavailableType('entire-day')}
              disabled={loading}
              style={{ flex: 1 }}
            >
              Entire Day
            </button>
            <button
              type="button"
              className={unavailableType === 'time-range' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setUnavailableType('time-range')}
              disabled={loading}
              style={{ flex: 1 }}
            >
              Time Range
            </button>
          </div>
        </div>

        {unavailableType === 'time-range' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Setting...' : `Set as Unavailable`}
          </button>
        </div>
      </div>
    </div>
  );
}

