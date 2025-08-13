/**
 * Linear Design System Colors
 * Based on Linear's mobile app design
 */

// Brand colors
const brandPrimary = '#5E6AD2';
const brandSecondary = '#00D2FF';

// Priority colors
const priorityUrgent = '#F5365C';
const priorityHigh = '#FB7185';
const priorityMedium = '#FBBF24';
const priorityLow = '#A3A3A3';

// Status colors
const statusBacklog = '#64748B';
const statusTodo = '#94A3B8';
const statusInProgress = '#3B82F6';
const statusInReview = '#F59E0B';
const statusDone = '#10B981';
const statusCanceled = '#6B7280';

export const Colors = {
  light: {
    // Text colors - Optimized for readability in light theme
    text: '#111827',
    textSecondary: '#4B5563',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Background colors - Clean, bright backgrounds with subtle variations
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
    backgroundElevated: '#FFFFFF',
    
    // Surface colors - Card and elevated surfaces with subtle shadows
    surface: '#FFFFFF',
    surfaceSecondary: '#FAFBFC',
    surfaceHover: '#F5F6F7',
    
    // Border colors - Subtle borders that don't interfere with content
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderFocus: brandPrimary,
    
    // Brand colors
    primary: brandPrimary,
    secondary: brandSecondary,
    
    // Interactive colors
    tint: brandPrimary,
    icon: '#4B5563',
    iconSecondary: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: brandPrimary,
    
    // Priority colors
    priorityUrgent,
    priorityHigh,
    priorityMedium,
    priorityLow,
    
    // Status colors
    statusBacklog,
    statusTodo,
    statusInProgress,
    statusInReview,
    statusDone,
    statusCanceled,
    
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  dark: {
    // Text colors
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textInverse: '#0F172A',
    
    // Background colors
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',
    backgroundElevated: '#1E293B',
    
    // Surface colors
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    surfaceHover: '#475569',
    
    // Border colors
    border: '#334155',
    borderLight: '#475569',
    borderFocus: brandPrimary,
    
    // Brand colors
    primary: brandPrimary,
    secondary: brandSecondary,
    
    // Interactive colors
    tint: brandPrimary,
    icon: '#CBD5E1',
    iconSecondary: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: brandPrimary,
    
    // Priority colors
    priorityUrgent,
    priorityHigh,
    priorityMedium,
    priorityLow,
    
    // Status colors
    statusBacklog,
    statusTodo,
    statusInProgress,
    statusInReview,
    statusDone,
    statusCanceled,
    
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

// Helper function to get priority color
export const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1: return priorityUrgent;
    case 2: return priorityHigh;
    case 3: return priorityMedium;
    case 4: return priorityLow;
    default: return priorityLow;
  }
};

// Helper function to get status color
export const getStatusColor = (statusType: string) => {
  switch (statusType) {
    case 'backlog': return statusBacklog;
    case 'unstarted': return statusTodo;
    case 'started': return statusInProgress;
    case 'completed': return statusDone;
    case 'cancelled': return statusCanceled;
    default: return statusTodo;
  }
};
