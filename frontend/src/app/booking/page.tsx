'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { consultantsApi, bookingsApi, availabilitiesApi } from '@/lib/api';
import { Consultant, Availability } from '@/lib/api';
import { Skill, SKILLS } from '../../../shared-config';
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  endOfWeek,
  addMinutes,
  parseISO,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
  addDays,
} from 'date-fns';
import Link from 'next/link';
import Toast from '@/components/Toast';

enum BookingStep {
  SELECT_SKILL = 1,
  SELECT_CONSULTANT = 2,
  SELECT_TIME = 3,
}

export default function BookingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>(BookingStep.SELECT_SKILL);
  const [selectedSkill, setSelectedSkill] = useState<Skill | ''>('');
  const [availableConsultants, setAvailableConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const minWeek = new Date();
  const maxWeek = addDays(new Date(), 90);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (step === BookingStep.SELECT_CONSULTANT && selectedSkill) {
      loadConsultants();
    }
  }, [step, selectedSkill]);

  useEffect(() => {
    if (step === BookingStep.SELECT_TIME && selectedConsultant) {
      loadAvailability();
    }
  }, [step, selectedConsultant, currentWeek]);

  const loadConsultants = async () => {
    if (!selectedSkill || !user) return;
    setLoading(true);
    try {
      const response = await consultantsApi.get({ skill: selectedSkill as Skill });
      const filtered = response.data.filter((c) => c.user_id !== user.id);
      setAvailableConsultants(filtered);
    } catch (error) {
      console.error('Error loading consultants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    if (!selectedConsultant) return;
    setLoading(true);
    try {
      const response = await availabilitiesApi.get(selectedConsultant.id);
      setAvailabilities(response.data.availabilities || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkill(skill);
    setStep(BookingStep.SELECT_CONSULTANT);
  };

  const handleConsultantSelect = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setStep(BookingStep.SELECT_TIME);
  };

  const handleTimeSelect = async (day: Date, timeSlot: Date) => {
    setSelectedStartTime(timeSlot);
  };

  const handleSubmitBooking = async () => {
    if (!selectedStartTime || !selectedConsultant) return;
    
    const endTime = addMinutes(selectedStartTime, selectedDuration);
    
    setLoading(true);
    try {
      await bookingsApi.create({
        consultantId: selectedConsultant.id,
        start: selectedStartTime.toISOString(),
        end: endTime.toISOString(),
        clientId: user?.id || '',
      });
      setToast({ message: 'Booking created successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.message || 'Failed to create booking', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (day: Date): Date[] => {
    if (availabilities.length === 0) return [];
    
    const slots: Date[] = [];
    const dayName = format(day, 'EEEE').toLowerCase();

    // Find all availabilities matching this day
    const dayAvailabilities = availabilities.filter(avail => avail.day === dayName);

    // Generate slots for each matching availability
    for (const availability of dayAvailabilities) {
      const startTime = availability.start_time;
      const endTime = availability.end_time;

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime!.split(':').map(Number);

      let current = setMinutes(setHours(startOfDay(day), startHour), startMin);
      const end = setMinutes(setHours(startOfDay(day), endHour), endMin);

      while (current < end) {
        const slotEnd = addMinutes(current, selectedDuration);
        if (slotEnd <= end) {
          // Avoid duplicates
          const slotTime = current.getTime();
          if (!slots.some(s => s.getTime() === slotTime)) {
            slots.push(new Date(current));
          }
        }
        current = addMinutes(current, 15);
      }
    }

    // Sort slots by time
    return slots.sort((a, b) => a.getTime() - b.getTime());
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const canNavigateBack = isAfter(currentWeek, minWeek);
  const canNavigateForward = isBefore(currentWeek, maxWeek);

  if (authLoading) {
    return (
      <div className="container">
        <div className="loading">
          <span className="spinner"></span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Book a Consultation 📅</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Schedule a consultation with an expert</p>
        </div>
        <Link 
          href="/home" 
          className="btn-outline btn-small"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>←</span>
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Progress indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '2rem',
        gap: '1rem'
      }}>
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: step >= stepNum ? 'var(--primary)' : 'var(--gray-300)',
              color: step >= stepNum ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              {stepNum}
            </div>
            {stepNum < 3 && (
              <div style={{
                width: '3rem',
                height: '2px',
                background: step > stepNum ? 'var(--primary)' : 'var(--gray-300)'
              }}></div>
            )}
          </div>
        ))}
      </div>

      {step === BookingStep.SELECT_SKILL && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Step 1: Choose a Skill</h2>
            <p className="card-description">Select the type of consultation you need</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillSelect(skill)}
                className="btn-outline"
                style={{ 
                  padding: '1.5rem',
                  textAlign: 'center',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === BookingStep.SELECT_CONSULTANT && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Step 2: Choose a Consultant</h2>
            <p className="card-description">Select from available consultants</p>
          </div>
          {loading ? (
            <div className="loading">
              <span className="spinner"></span>
              <span style={{ marginLeft: '1rem' }}>Loading consultants...</span>
            </div>
          ) : availableConsultants.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No Consultants Available</div>
              <p className="empty-state-description">No consultants are available for this skill at the moment.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {availableConsultants.map((consultant) => (
                <button
                  key={consultant.id}
                  onClick={() => handleConsultantSelect(consultant)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    border: '2px solid var(--gray-200)',
                    background: 'var(--bg-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {consultant.user?.first_name} {consultant.user?.last_name}
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                    {consultant.skill.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setStep(BookingStep.SELECT_SKILL)}>
              ← Back
            </button>
          </div>
        </div>
      )}

      {step === BookingStep.SELECT_TIME && selectedConsultant && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Step 3: Select Time</h2>
            <p className="card-description">
              Choose a time slot with {selectedConsultant.user?.first_name} {selectedConsultant.user?.last_name}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label>
              Duration
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={75}>75 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                disabled={!canNavigateBack}
              >
                ← Previous
              </button>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentWeek(new Date())}
              >
                Today
              </button>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                disabled={!canNavigateForward}
              >
                Next →
              </button>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </div>
          </div>

          {loading ? (
            <div className="loading">
              <span className="spinner"></span>
              <span style={{ marginLeft: '1rem' }}>Loading availability...</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
              {weekDays.map((day) => {
                const slots = generateTimeSlots(day);
                return (
                  <div
                    key={day.toISOString()}
                    style={{
                      border: '2px solid var(--gray-200)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-primary)',
                      minHeight: '200px'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      {format(day, 'EEE')}
                    </div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                      {format(day, 'd')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {slots.map((slot) => {
                        const isSelected = selectedStartTime && selectedStartTime.getTime() === slot.getTime();
                        return (
                          <button
                            key={slot.toISOString()}
                            onClick={() => handleTimeSelect(day, slot)}
                            className={isSelected ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.5rem',
                            }}
                          >
                            {format(slot, 'HH:mm')}
                          </button>
                        );
                      })}
                      {slots.length === 0 && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-tertiary)',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding: '0.5rem'
                        }}>
                          No availability
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedStartTime && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '2px solid var(--primary)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Booking Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Date & Time</div>
                  <div style={{ fontWeight: 600 }}>{format(selectedStartTime, 'PPpp')}</div>
                </div>
                <div>
                  <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Duration</div>
                  <div style={{ fontWeight: 600 }}>{selectedDuration} minutes</div>
                </div>
                <div>
                  <div className="text-secondary" style={{ fontSize: '0.875rem' }}>End Time</div>
                  <div style={{ fontWeight: 600 }}>{format(addMinutes(selectedStartTime, selectedDuration), 'PPpp')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn-primary"
                  onClick={handleSubmitBooking}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></span>
                      Creating booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setStep(BookingStep.SELECT_CONSULTANT)}>
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
