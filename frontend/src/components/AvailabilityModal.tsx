'use client';

import { useState, useEffect } from 'react';
import { availabilitiesApi } from '@/lib/api';
import { Availability } from '@/lib/api';
import { Consultant } from '@/lib/api';
import { addMonths, format, startOfDay } from 'date-fns';

interface AvailabilityModalProps {
  consultant: Consultant;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AvailabilityFormData {
  id?: string;
  day: string;
  start_time: string;
  end_time: string;
  start: string;
  end: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
] as const;

export default function AvailabilityModal({ consultant, isOpen, onClose, onSuccess }: AvailabilityModalProps) {
  const [availabilities, setAvailabilities] = useState<AvailabilityFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && consultant) {
      loadAvailabilities();
    }
  }, [isOpen, consultant]);

  const loadAvailabilities = async () => {
    try {
      const response = await availabilitiesApi.get(consultant.id);
      if (response.data?.availabilities && response.data.availabilities.length > 0) {
        const formatted = response.data.availabilities.map((avail: Availability) => ({
          id: (avail as any).id,
          day: avail.day,
          start_time: avail.start_time,
          end_time: avail.end_time,
          start: format(new Date(avail.start), 'yyyy-MM-dd'),
          end: format(new Date(avail.end), 'yyyy-MM-dd'),
        }));
        setAvailabilities(formatted);
      } else {
        setAvailabilities([]);
      }
      setError('');
    } catch (error: any) {
      if (error.response?.status === 404) {
        setAvailabilities([]);
      } else {
        setError('Failed to load availabilities');
      }
    }
  };

  const addNewRow = () => {
    setAvailabilities([
      ...availabilities,
      {
        day: 'monday',
        start_time: '09:00',
        end_time: '17:00',
        start: format(startOfDay(new Date()), 'yyyy-MM-dd'),
        end: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
      },
    ]);
  };

  const updateRow = (index: number, field: keyof AvailabilityFormData, value: string) => {
    const updated = [...availabilities];
    updated[index] = { ...updated[index], [field]: value };
    setAvailabilities(updated);
  };

  const removeRow = (index: number) => {
    const updated = availabilities.filter((_, i) => i !== index);
    setAvailabilities(updated);
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    try {
      // Save all availabilities
      const savePromises = availabilities.map(async (avail) => {
        const data = {
          consultant_id: consultant.id,
          day: avail.day,
          start: new Date(avail.start).toISOString(),
          end: new Date(avail.end).toISOString(),
          start_time: avail.start_time,
          end_time: avail.end_time,
        };

        if (avail.id) {
          // Update existing
          return availabilitiesApi.update(avail.id, data);
        } else {
          // Create new
          return availabilitiesApi.create(data);
        }
      });

      await Promise.all(savePromises);
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save availabilities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, index: number) => {
    if (!id) {
      // Remove from list if not saved yet
      removeRow(index);
      return;
    }

    if (!confirm('Are you sure you want to delete this availability?')) {
      return;
    }

    setLoading(true);
    try {
      await availabilitiesApi.delete(id);
      removeRow(index);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete availability');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="card-title">Set Availability</h2>
            <p className="card-description">
              {consultant.skill.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase())}
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

        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={addNewRow}
            className="btn-outline btn-small"
            style={{ marginBottom: '1rem' }}
          >
            + Add Availability Slot
          </button>

          {availabilities.length === 0 ? (
            <div className="empty-state" style={{ 
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-xl)'
            }}>
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">No Availability Slots</div>
              <p className="empty-state-description">Click "Add Availability Slot" to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {availabilities.map((avail, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--gray-50)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ 
                    minWidth: '120px',
                    flex: '0 0 auto'
                  }}>
                    <select
                      value={avail.day}
                      onChange={(e) => updateRow(index, 'day', e.target.value)}
                      required
                      disabled={loading}
                      style={{ width: '100%', padding: '0.5rem' }}
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
                    <input
                      type="time"
                      value={avail.start_time}
                      onChange={(e) => updateRow(index, 'start_time', e.target.value)}
                      required
                      disabled={loading}
                      style={{ padding: '0.5rem', width: '100px' }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>to</span>
                    <input
                      type="time"
                      value={avail.end_time}
                      onChange={(e) => updateRow(index, 'end_time', e.target.value)}
                      required
                      disabled={loading}
                      style={{ padding: '0.5rem', width: '100px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto', minWidth: '200px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>From:</span>
                    <input
                      type="date"
                      value={avail.start}
                      onChange={(e) => updateRow(index, 'start', e.target.value)}
                      required
                      disabled={loading}
                      style={{ padding: '0.5rem', flex: '1 1 auto', minWidth: '140px' }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Until:</span>
                    <input
                      type="date"
                      value={avail.end}
                      onChange={(e) => updateRow(index, 'end', e.target.value)}
                      required
                      disabled={loading}
                      style={{ padding: '0.5rem', flex: '1 1 auto', minWidth: '140px' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(avail.id || '', index)}
                    className="btn-secondary btn-small"
                    disabled={loading}
                    style={{ 
                      background: 'var(--error)', 
                      color: 'white', 
                      border: 'none',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      flex: '0 0 auto',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary"
            disabled={loading || availabilities.length === 0}
            style={{ flex: 1 }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></span>
                Saving...
              </>
            ) : (
              'Save All'
            )}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
