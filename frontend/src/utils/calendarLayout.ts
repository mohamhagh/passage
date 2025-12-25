import { Booking, Availability } from '@/lib/api';
import { parseISO, format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  startTime: number; // minutes since midnight
  endTime: number; // minutes since midnight
  type: 'booking' | 'availability';
  data: Booking | Availability;
  consultantId?: string;
}

export interface EventPosition {
  top: number; // percentage from top of day (0-100)
  left: number; // percentage from left (0-100)
  width: number; // percentage width (0-100)
  height: number; // percentage height (0-100)
}

export interface DayTimeRange {
  startMinutes: number; // earliest event start time
  endMinutes: number; // latest event end time
  totalMinutes: number; // total span
}

// Convert time string (HH:mm) to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if two time ranges overlap
function overlaps(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1;
}

// Calculate positions for events in a day
export function calculateEventPositions(
  bookings: Booking[],
  availabilities: Availability[],
  day: Date,
): { positions: Map<string, EventPosition>; timeRange: DayTimeRange | null } {
  const positions = new Map<string, EventPosition>();
  const dayDateStr = format(day, 'yyyy-MM-dd');
  
  // Convert bookings to events
  const bookingEvents: CalendarEvent[] = bookings
    .filter((booking) => {
      const bookingDate = parseISO(booking.start);
      return format(bookingDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    })
    .map((booking) => {
      const start = parseISO(booking.start);
      const end = parseISO(booking.end);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();
      return {
        id: booking.id,
        startTime: startMinutes,
        endTime: endMinutes,
        type: 'booking' as const,
        data: booking,
        consultantId: booking.consultant_id,
      };
    });

  // Convert availabilities to events
  const dayName = format(day, 'EEEE').toLowerCase();
  
  const availabilityEvents: CalendarEvent[] = availabilities
    .filter((avail) => {
      if (avail.day !== dayName) return false;
      const availStart = parseISO(avail.start);
      const availEnd = parseISO(avail.end);
      const dayStart = parseISO(dayDateStr);
      
      // Check if date is within availability range
      return dayStart >= availStart && dayStart <= availEnd;
    })
    .map((avail) => {
      const startMinutes = timeToMinutes(avail.start_time);
      const endMinutes = timeToMinutes(avail.end_time);
      // Normalize time format to HH:mm for consistent ID generation
      const normalizedStartTime = avail.start_time.substring(0, 5);
      return {
        id: avail.id || `avail-${dayDateStr}-${normalizedStartTime}`,
        startTime: startMinutes,
        endTime: endMinutes,
        type: 'availability' as const,
        data: avail,
        consultantId: avail.consultant_id,
      };
    });

  // Combine all events and sort by start time
  const allEvents = [...bookingEvents, ...availabilityEvents].sort(
    (a, b) => a.startTime - b.startTime
  );

  if (allEvents.length === 0) {
    return { positions, timeRange: null };
  }

  // Calculate actual time range (earliest start to latest end)
  const minStart = Math.min(...allEvents.map(e => e.startTime));
  const maxEnd = Math.max(...allEvents.map(e => e.endTime));
  
  // Add padding: 30 minutes before first event, 30 minutes after last event
  const padding = 30;
  const rangeStart = Math.max(0, minStart - padding);
  const rangeEnd = Math.min(24 * 60, maxEnd + padding);
  const totalRange = rangeEnd - rangeStart;
  
  const timeRange: DayTimeRange = {
    startMinutes: rangeStart,
    endMinutes: rangeEnd,
    totalMinutes: totalRange,
  };

  // Group events by overlapping time ranges
  const groups: CalendarEvent[][] = [];
  
  for (const event of allEvents) {
    let placed = false;
    
    // Try to place in existing group
    for (const group of groups) {
      // Check if event overlaps with any event in this group
      const overlapsWithGroup = group.some((groupEvent) =>
        overlaps(
          event.startTime,
          event.endTime,
          groupEvent.startTime,
          groupEvent.endTime
        )
      );
      
      if (overlapsWithGroup) {
        group.push(event);
        placed = true;
        break;
      }
    }
    
    // If not placed, create new group
    if (!placed) {
      groups.push([event]);
    }
  }

  // For each group, calculate positions
  for (const group of groups) {
    // Sort group by start time again (in case order changed)
    group.sort((a, b) => a.startTime - b.startTime);
    
    // Calculate columns for each event in the group
    const columns: number[] = new Array(group.length).fill(-1);
    
    // Assign columns greedily
    for (let i = 0; i < group.length; i++) {
      // Find overlapping events that already have columns assigned
      const overlappingColumns = new Set<number>();
      for (let j = 0; j < i; j++) {
        if (
          overlaps(
            group[i].startTime,
            group[i].endTime,
            group[j].startTime,
            group[j].endTime
          ) &&
          columns[j] !== -1
        ) {
          overlappingColumns.add(columns[j]);
        }
      }
      
      // Find the first available column
      let col = 0;
      while (overlappingColumns.has(col)) {
        col++;
      }
      columns[i] = col;
    }
    
    // Calculate the maximum number of columns used in this group
    const usedColumns = columns.length > 0 ? Math.max(...columns) + 1 : 1;
    
    // Calculate positions for each event in the group
    for (let i = 0; i < group.length; i++) {
      const event = group[i];
      const column = columns[i];
      
      // Calculate position relative to actual time range
      const topPercent = ((event.startTime - rangeStart) / totalRange) * 100;
      const heightPercent = ((event.endTime - event.startTime) / totalRange) * 100;
      const widthPercent = 100 / usedColumns;
      const leftPercent = (column / usedColumns) * 100;
      
      positions.set(event.id, {
        top: topPercent,
        left: leftPercent,
        width: widthPercent,
        height: Math.max(heightPercent, 3), // Minimum 3% height for visibility
      });
    }
  }

  return { positions, timeRange };
}

