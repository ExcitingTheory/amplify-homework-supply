/**
 * Interactive Keyboard Shortcut Trainer
 * 
 * Gamified component that tracks user's keyboard shortcuts and awards achievements.
 * Highlights shortcuts as they're performed correctly.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress, Chip, Alert, Paper, Stack } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { getOnboardingEmitter } from '../../.storybook/code/onboarding-events';

interface Shortcut {
  id: string;
  name: string;
  keys: string[];
  category: 'formatting' | 'block' | 'alignment' | 'navigation';
  description: string;
  achievement?: string;
}

const SHORTCUTS: Shortcut[] = [
  // Formatting - OS-standard shortcuts use Meta (Cmd on Mac, Ctrl on Windows)
  { id: 'bold', name: 'Bold', keys: ['Meta', 'b'], category: 'formatting', description: 'Make text bold (Cmd/Ctrl+B)', achievement: 'Bold Beginner' },
  { id: 'italic', name: 'Italic', keys: ['Meta', 'i'], category: 'formatting', description: 'Make text italic (Cmd/Ctrl+I)', achievement: 'Italic Expert' },
  { id: 'underline', name: 'Underline', keys: ['Meta', 'u'], category: 'formatting', description: 'Underline text (Cmd/Ctrl+U)' },
  
  // App-specific shortcuts use Control on ALL platforms (including Mac!)
  { id: 'strikethrough', name: 'Strikethrough', keys: ['Control', 'Shift', 'x'], category: 'formatting', description: 'Strike through text (Ctrl+Shift+X)' },
  { id: 'clear-formatting', name: 'Clear Formatting', keys: ['Control', 'Shift', '0'], category: 'formatting', description: 'Remove formatting (Ctrl+Shift+0)', achievement: 'Format Master' },
  
  // Block Types - Use Control on ALL platforms
  { id: 'heading1', name: 'Heading 1', keys: ['Control', 'Shift', '1'], category: 'block', description: 'Convert to H1 (Ctrl+Shift+1)', achievement: 'Heading Hero' },
  { id: 'heading2', name: 'Heading 2', keys: ['Control', 'Shift', '2'], category: 'block', description: 'Convert to H2 (Ctrl+Shift+2)' },
  { id: 'heading3', name: 'Heading 3', keys: ['Control', 'Shift', '3'], category: 'block', description: 'Convert to H3 (Ctrl+Shift+3)' },
  { id: 'bullet-list', name: 'Bullet List', keys: ['Control', 'Shift', '8'], category: 'block', description: 'Create bullet list (Ctrl+Shift+8)', achievement: 'List Legend' },
  { id: 'numbered-list', name: 'Numbered List', keys: ['Control', 'Shift', '7'], category: 'block', description: 'Create numbered list (Ctrl+Shift+7)' },
  { id: 'quote', name: 'Quote', keys: ['Control', '\''], category: 'block', description: 'Create quote block (Ctrl+\')' },
  { id: 'code', name: 'Code Block', keys: ['Control', 'Shift', 'c'], category: 'block', description: 'Create code block (Ctrl+Shift+C)', achievement: 'Code Ninja' },
  
  // Alignment - Use Control on ALL platforms
  { id: 'align-left', name: 'Align Left', keys: ['Control', 'Shift', 'l'], category: 'alignment', description: 'Align text left (Ctrl+Shift+L)' },
  { id: 'align-center', name: 'Align Center', keys: ['Control', 'Shift', 'e'], category: 'alignment', description: 'Align text center (Ctrl+Shift+E)', achievement: 'Alignment Ace' },
  { id: 'align-right', name: 'Align Right', keys: ['Control', 'Shift', 'r'], category: 'alignment', description: 'Align text right (Ctrl+Shift+R)' },
  { id: 'justify', name: 'Justify', keys: ['Control', 'Shift', 'j'], category: 'alignment', description: 'Justify text (Ctrl+Shift+J)' },
  
  // Navigation - OS-standard shortcuts use Meta
  { id: 'undo', name: 'Undo', keys: ['Meta', 'z'], category: 'navigation', description: 'Undo last action (Cmd/Ctrl+Z)', achievement: 'Time Traveler' },
  { id: 'redo', name: 'Redo', keys: ['Meta', 'Shift', 'z'], category: 'navigation', description: 'Redo last action (Cmd/Ctrl+Shift+Z)' },
  { id: 'select-all', name: 'Select All', keys: ['Meta', 'a'], category: 'navigation', description: 'Select all content (Cmd/Ctrl+A)' },
];

const ACHIEVEMENT_TIERS = [
  { count: 5, title: 'Keyboard Novice', icon: '🎯', color: '#90caf9' },
  { count: 10, title: 'Shortcut Apprentice', icon: '⚡', color: '#ce93d8' },
  { count: 15, title: 'Efficiency Expert', icon: '🚀', color: '#ffb74d' },
  { count: 20, title: 'Keyboard Master', icon: '👑', color: '#ffd700' },
];

export const KeyboardShortcutTrainer: React.FC = () => {
  const [completedShortcuts, setCompletedShortcuts] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('keyboard-trainer-completed');
      if (stored) return new Set(JSON.parse(stored));
    } catch { /* ignore */ }
    return new Set();
  });
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('keyboard-trainer-achievements');
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return [];
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentTier, setCurrentTier] = useState(0);

  // Record start time on first mount if not already set
  useEffect(() => {
    if (!localStorage.getItem('keyboard-trainer-start')) {
      localStorage.setItem('keyboard-trainer-start', String(Date.now()));
    }
  }, []);

  // Persist completed shortcuts to localStorage
  useEffect(() => {
    if (completedShortcuts.size > 0) {
      localStorage.setItem('keyboard-trainer-completed', JSON.stringify([...completedShortcuts]));
    }
  }, [completedShortcuts]);

  // Persist achievements to localStorage
  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem('keyboard-trainer-achievements', JSON.stringify(achievements));
    }
  }, [achievements]);

  // Check if keys match a shortcut
  const checkShortcut = useCallback((keys: Set<string>) => {
    for (const shortcut of SHORTCUTS) {
      // Create a normalized version of pressed keys for comparison
      const normalizedKeys = new Set(keys);
      
      // On Windows, map Control to Meta for OS-standard shortcuts (those using Meta)
      // This allows Ctrl to work for Bold, Italic, etc. on Windows
      if (!navigator.platform.includes('Mac') && normalizedKeys.has('Control')) {
        if (shortcut.keys.includes('Meta')) {
          normalizedKeys.delete('Control');
          normalizedKeys.add('Meta');
        }
      }
      
      const allKeysPressed = shortcut.keys.every(key => normalizedKeys.has(key));
      const noExtraKeys = normalizedKeys.size === shortcut.keys.length;
      
      if (allKeysPressed && noExtraKeys) {
        return shortcut;
      }
    }
    return null;
  }, []);

  // Handle key down
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Capture actual keys pressed (no platform normalization here)
    const newKeys = new Set(pressedKeys);
    
    // Add the actual modifier keys that are pressed
    if (e.metaKey) newKeys.add('Meta');
    if (e.ctrlKey) newKeys.add('Control');
    if (e.shiftKey) newKeys.add('Shift');
    if (e.altKey) newKeys.add('Alt');
    
    // For number keys, use e.code to get the physical key (handles Shift+2 = "@" issue)
    if (e.code && e.code.startsWith('Digit')) {
      newKeys.add(e.code.replace('Digit', '').toLowerCase());
    } else if (e.key && !['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) {
      newKeys.add(e.key.toLowerCase());
    }
    
    setPressedKeys(newKeys);
    
    const matchedShortcut = checkShortcut(newKeys);
    if (matchedShortcut) {
      e.preventDefault();
      handleShortcutComplete(matchedShortcut);
    }
  }, [pressedKeys, checkShortcut]);

  // Handle key up
  const handleKeyUp = useCallback(() => {
    setPressedKeys(new Set());
    setActiveShortcut(null);
  }, []);

  // Handle shortcut completion
  const handleShortcutComplete = useCallback((shortcut: Shortcut) => {
    if (completedShortcuts.has(shortcut.id)) return;
    
    setActiveShortcut(shortcut.id);
    
    setTimeout(() => {
      setCompletedShortcuts(prev => {
        const newSet = new Set(prev);
        newSet.add(shortcut.id);
        
        // Check for achievement
        if (shortcut.achievement && !achievements.includes(shortcut.achievement)) {
          setAchievements(prev => [...prev, shortcut.achievement!]);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
        
        // Check for tier achievement
        const newTier = ACHIEVEMENT_TIERS.findIndex(tier => tier.count > newSet.size);
        const tierIndex = newTier === -1 ? ACHIEVEMENT_TIERS.length - 1 : Math.max(0, newTier - 1);
        if (tierIndex > currentTier) {
          setCurrentTier(tierIndex);
          setShowCelebration(true);
          
          // Emit onboarding event for hidden task unlock
          try {
            const emitter = getOnboardingEmitter();
            emitter.emit({
              type: 'task-completed',
              taskId: 'secret-keyboard-master',
              persona: emitter.getPersona(),
              timestamp: Date.now(),
            } as any);
          } catch (error) {
            console.error('Failed to emit achievement event:', error);
          }
        }
        
        return newSet;
      });
    }, 100);
  }, [completedShortcuts, achievements, currentTier]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const progress = (completedShortcuts.size / SHORTCUTS.length) * 100;
  const categoryProgress = (category: string) => {
    const categoryShortcuts = SHORTCUTS.filter(s => s.category === category);
    const completed = categoryShortcuts.filter(s => completedShortcuts.has(s.id)).length;
    return (completed / categoryShortcuts.length) * 100;
  };

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      if (key === 'Meta') return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
      if (key === 'Shift') return '⇧';
      if (key === 'Alt') return '⌥';
      return key.toUpperCase();
    }).join(' + ');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ color: 'primary.main' }} />
          Keyboard Shortcut Challenge
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Practice shortcuts by pressing the key combinations below. Each completed shortcut unlocks achievements!
        </Typography>
        
        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Progress: {completedShortcuts.size} / {SHORTCUTS.length}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* Current Tier */}
        {currentTier >= 0 && (
          <Chip 
            icon={<span>{ACHIEVEMENT_TIERS[currentTier].icon}</span>}
            label={ACHIEVEMENT_TIERS[currentTier].title}
            sx={{ 
              backgroundColor: ACHIEVEMENT_TIERS[currentTier].color,
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Box>

      {/* Celebration */}
      {showCelebration && (
        <Alert 
          severity="success" 
          icon={<EmojiEventsIcon />}
          sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 'bold' }}
        >
          🎉 Achievement Unlocked! Keep going!
        </Alert>
      )}

      {/* Categories */}
      <Stack spacing={3}>
        {(['formatting', 'block', 'alignment', 'navigation'] as const).map(category => (
          <Paper key={category} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
              {category === 'formatting' && '📝 '}
              {category === 'block' && '🔤 '}
              {category === 'alignment' && '↔️ '}
              {category === 'navigation' && '🎯 '}
              {category} Shortcuts
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={categoryProgress(category)} 
              sx={{ mb: 2, height: 6, borderRadius: 1 }}
            />
            
            <Stack spacing={1}>
              {SHORTCUTS.filter(s => s.category === category).map(shortcut => {
                const isCompleted = completedShortcuts.has(shortcut.id);
                const isActive = activeShortcut === shortcut.id;
                
                return (
                  <Box
                    key={shortcut.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 1,
                      backgroundColor: isActive 
                        ? 'success.light' 
                        : isCompleted 
                        ? 'action.hover' 
                        : 'background.paper',
                      border: '1px solid',
                      borderColor: isActive 
                        ? 'success.main' 
                        : isCompleted 
                        ? 'success.light' 
                        : 'divider',
                      transition: 'all 0.3s ease',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: 'action.disabled' }} />
                    )}
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={isCompleted ? 'bold' : 'normal'}>
                        {shortcut.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {shortcut.description}
                      </Typography>
                    </Box>
                    
                    <Chip 
                      label={formatKeys(shortcut.keys)}
                      size="small"
                      sx={{ 
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        backgroundColor: isCompleted ? 'success.light' : 'action.selected'
                      }}
                    />
                    
                    {shortcut.achievement && isCompleted && (
                      <Chip 
                        icon={<EmojiEventsIcon />}
                        label={shortcut.achievement}
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Achievements Summary */}
      {achievements.length > 0 && (
        <Paper sx={{ p: 3, mt: 3, backgroundColor: 'warning.light' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon /> Your Achievements
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {achievements.map(achievement => (
              <Chip 
                key={achievement}
                label={achievement}
                color="warning"
                sx={{ fontWeight: 'bold' }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Completion Message */}
      {completedShortcuts.size === SHORTCUTS.length && (
        <Alert 
          severity="success" 
          icon={<EmojiEventsIcon sx={{ fontSize: 40 }} />}
          sx={{ mt: 3, fontSize: '1.2rem' }}
        >
          <Typography variant="h5" gutterBottom>
            🎊 Congratulations! You've mastered all keyboard shortcuts! 🎊
          </Typography>
          <Typography>
            You've unlocked the secret <strong>Keyboard Master</strong> achievement and proven your dedication to efficiency!
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default KeyboardShortcutTrainer;
