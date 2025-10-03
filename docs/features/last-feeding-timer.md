# Last Feeding Timer Feature

## Overview

The Last Feeding Timer is a new feature that enhances the Quick Save button to display real-time information about how long ago the most recent feeding occurred. This feature addresses the common need for parents to quickly check when their baby was last fed while providing contextual information exactly when they need it most.

## User Story

**As a parent**, I want to see how long ago the last feeding was on the Quick Save button **so that** I can quickly determine if it's time for the next feeding and get visual feedback about the urgency of recording a new feeding.

## Feature Requirements

### Functional Requirements

1. **Enhanced Quick Save Button**: Display time elapsed since last feeding on the Quick Save button
2. **Real-time Updates**: Update the display every minute
3. **Empty State Handling**: Show default "FEED NOW" when no feedings exist
4. **Time Formatting**: Display time in human-readable format (e.g., "2h 25m since last")
5. **Color-coded Urgency**: Visual feedback through button color changes
6. **Two-line Layout**: "FEED NOW" on first line, time info on second line
7. **Special States**: Show "Just fed" for anything under 1 minute after feeding

### Technical Requirements

1. **Component Enhancement**: Modify existing Quick Save button component
2. **Data Source**: Use existing `useFeedings()` composable
3. **Time Calculation**: Use Luxon DateTime for accurate time calculations
4. **Performance**: Use computed properties and reactive timers efficiently
5. **Responsive**: Two-line layout works on all screen sizes
6. **Accessibility**: Include proper ARIA labels and semantic HTML
7. **Color Transitions**: Smooth color morphing between thresholds

### Design Requirements

1. **Button Enhancement**: Enhance existing Quick Save button with timer information
2. **Two-line Layout**: "FEED NOW" on first line, time info on second line
3. **Color Coding**: Green (< 3h), Orange (3-4h), Red (4h+)
4. **Dark Mode**: Full support for dark/light theme switching
5. **Mobile-First**: Wider button (w-32) with two-line layout optimized for mobile
6. **Button Shape**: Rounded rectangle (rounded-2xl) instead of circular

## Implementation Details

### Integration Points

1. **FloatingButtons Component**: Enhanced existing floating Quick Save button with timer functionality
2. **useFeedings.js**: Uses existing composable to access feeding data
3. **Luxon DateTime**: Used for accurate time calculations
4. **Floating positioning**: Maintains existing bottom-right positioning (bottom-24 right-6)

## User Experience

### Visual Design

```
┌─────────────────────────────────┐
│                                 │
│        [FEED NOW]               │ ← No feedings (default green)
│                                 │
│        [FEED NOW]               │ ← "Just fed" (green, < 1 minute)
│        [Just fed]               │
│                                 │
│        [FEED NOW]               │ ← 2h 25m since last (green, < 3h)
│        [2h 25m since last]      │
│                                 │
│        [FEED NOW]               │ ← 3h 45m since last (orange, 3-4h)
│        [3h 45m since last]      │
│                                 │
│        [FEED NOW]               │ ← 5h 20m since last (red, 4h+)
│        [5h 20m since last]      │
│                                 │
└─────────────────────────────────┘
```

### States

1. **No Feedings**: "FEED NOW" (default green button)
2. **Just Fed**: "FEED NOW" + "Just fed" (green, < 1 minute)
3. **Recent**: "FEED NOW" + "2h 25m since last" (green, < 3h)
4. **Moderate**: "FEED NOW" + "3h 45m since last" (orange, 3-4h)
5. **Long**: "FEED NOW" + "5h 20m since last" (red, 4h+)
6. **Loading**: Show loading state while data loads

### Responsive Behavior

- **Mobile**: Wider button with two-line layout, optimized for touch
- **Tablet**: Same as mobile (consistency)
- **Desktop**: Same as mobile (maintains touch-friendly design)

## Testing Considerations

### Unit Tests

1. **Time Calculation**: Test various time differences
2. **Edge Cases**: Test with no feedings, very recent feedings
3. **Formatting**: Test different time combinations
4. **Reactivity**: Test timer updates

### Integration Tests

1. **Component Integration**: Test within HistoryView
2. **Data Flow**: Test with useFeedings composable
3. **Theme Switching**: Test dark/light mode
4. **Responsive**: Test on different screen sizes

### User Acceptance Tests

1. **Timer Updates**: Verify updates every minute
2. **Visual Design**: Confirm matches design specifications
3. **Accessibility**: Test with screen readers
4. **Performance**: Ensure no performance impact

## Future Enhancements

### Potential Improvements

1. **Smooth Color Transitions**: Gradual color morphing between thresholds instead of hard color jumps
2. **Configurable Thresholds**: User-defined time thresholds for different feeding schedules
3. **Time-of-Day Awareness**: Different thresholds for day vs night feedings
4. **Notifications**: Alert when it's been too long since last feeding
5. **Statistics**: Show average time between feedings

### Advanced Features

1. **Smooth Color Morphing**: CSS transitions for gradual color changes between thresholds
2. **Predictive Timing**: Suggest when next feeding might be due
3. **Pattern Recognition**: Identify feeding patterns
4. **Customizable Alerts**: User-defined time thresholds for alerts
5. **Time-of-Day Thresholds**: Different color thresholds for day vs night feedings


## Success Metrics

### User Engagement

1. **Usage**: Timer viewed on each app session
2. **Accuracy**: Users find the information helpful
3. **Feedback**: Positive user feedback on the feature

### Technical Performance

1. **Load Time**: No impact on page load performance
2. **Memory Usage**: Efficient timer management
3. **Battery Impact**: Minimal impact on mobile battery life

## Documentation Updates

### Files Modified

1. **UI Design** (`docs/ui-design.md`): Added component specifications
2. **Changelog** (`docs/changelog.md`): Added feature to unreleased section
3. **Feature Spec** (`docs/features/last-feeding-timer.md`): This document

### Code Documentation

1. **Component Comments**: Comprehensive inline documentation
2. **API Documentation**: Update if new composables are added
3. **README Updates**: Update if needed for setup instructions

## Implementation Timeline

### Phase 1: Core Implementation
- [ ] Create LastFeedingTimer component
- [ ] Implement time calculation logic
- [ ] Add to HistoryView component
- [ ] Basic styling and responsive design

### Phase 2: Enhancement
- [ ] Add real-time timer updates
- [ ] Implement dark mode support
- [ ] Add accessibility features
- [ ] Performance optimization

### Phase 3: Testing & Documentation
- [ ] Unit tests
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Documentation updates

### Phase 4: Deployment
- [ ] Code review
- [ ] Testing in staging
- [ ] Production deployment
- [ ] User feedback collection
