# UI/UX Design

## Design Principles

- **Simplicity**: Minimal clicks to record a feeding
- **Speed**: Quick entry for busy parents
- **Clarity**: Clear visual hierarchy and readable text
- **Mobile-First**: Works well on phones and tablets
- **Accessibility**: Easy to use with one hand while holding baby

## Layout Structure

### Main Layout
```
┌─────────────────────────────────┐
│ Baby Tracker                    │
├─────────────────────────────────┤
│ [Quick Entry] [History]         │ ← Tab Navigation
├─────────────────────────────────┤
│                                 │
│        Main Content Area        │
│                                 │
└─────────────────────────────────┘
```

## Pages/Views

### 1. Quick Entry Tab

**Purpose**: Primary interface for recording feedings

**Layout**:
```
┌─────────────────────────────────┐
│                                 │
│ Time: [2024-01-15 14:30]        │ ← Time input (for retrospective)
│                                 │
│ Food: [Breast milk        ▼]   │ ← Autocomplete dropdown
│                                 │
│ Notes: [Optional notes...]      │ ← Optional text area
│                                 │
│ [SAVE FEEDING]                  │ ← Primary action button
│                                 │
│ Recent Foods:                   │
│ [Breast milk] [Banana] [Cereal] │ ← Quick action buttons (save immediately)
│ [Apple] [Rice] [Yogurt]         │
│                                 │
│                                 │
│        [QUICK SAVE]             │ ← Big thumb-friendly button
│                                 │
├─────────────────────────────────┤
│ [📝] [📊]                       │ ← Bottom tab navigation (icons only)
└─────────────────────────────────┘
```

**Components**:
- `TimeInput`: Date/time picker for retrospective entries
- `FoodAutocomplete`: Input with dropdown suggestions
- `QuickFoodButtons`: Grid of recent food buttons (save immediately)
- `SaveButton`: Primary action button for form submission
- `QuickSaveButton`: Large thumb-friendly button for instant save
- `BottomTabNavigation`: Icon-only tab navigation at bottom

### 2. History Tab

**Purpose**: View and manage past feeding records

**Two View Modes**:

#### List View (Traditional)
```
┌─────────────────────────────────┐
│ History                         │
├─────────────────────────────────┤
│ [⏰] [Sort: Newest First ▼] [🔍] │ ← Controls (grid/list toggle, sort, search)
├─────────────────────────────────┤
│                                 │
│ Today, Jan 15                   │
│ ┌─────────────────────────────┐ │
│ │ 19:00  Rice cereal          │ │ ← Feeding entry
│ │         [Edit] [Delete]     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 15:45  Breast milk          │ │
│ │         [Edit] [Delete]     │ │
│ └─────────────────────────────┘ │
│                                 │
│ Yesterday, Jan 14               │
│ ┌─────────────────────────────┐ │
│ │ 12:15  Banana               │ │
│ │         [Edit] [Delete]     │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### Time Button Grid View (Default)
```
┌─────────────────────────────────┐
│ History                         │
├─────────────────────────────────┤
│ [📋] [🔍]                       │ ← Controls (list/grid toggle, search)
├─────────────────────────────────┤
│                                 │
│ Today                            │
│ [19:00] [15:45] [12:30] [09:15] │ ← Clickable time buttons
│                                 │
│ Yesterday                        │
│ [18:30] [14:20] [11:45] [08:00] │
│                                 │
│ Jan 13, 2024                    │
│ [17:15] [13:30] [10:20]         │
│                                 │
└─────────────────────────────────┘
```

**Components**:
- `HistoryView`: Main container with view toggle
- `TimeButtonView`: Grid of daily grouped time buttons
- `FeedingList`: Traditional chronological list (list view)
- `FeedingEntry`: Individual feeding record with actions (list view)
- `FeedingDetailsModal`: Modal for viewing/editing feeding details
- `SortControls`: Sort order and search functionality (list view only)
- `ViewToggle`: Toggle between list and grid views

## Component Specifications

### TimeInput Component
```vue
<template>
  <div class="time-input">
    <UInput 
      v-model="selectedTime" 
      type="datetime-local"
      placeholder="Select time (leave empty for current time)"
    />
  </div>
</template>
```

### FoodAutocomplete Component
```vue
<template>
  <USelectMenu
    v-model="selectedFood"
    :options="foodSuggestions"
    searchable
    creatable
    placeholder="What did she eat?"
  />
</template>
```

### QuickFoodButtons Component
```vue
<template>
  <div class="quick-foods">
    <h3>Recent Foods</h3>
    <div class="button-grid">
      <UButton
        v-for="food in recentFoods"
        :key="food"
        @click="saveWithFood(food)"
        variant="outline"
      >
        {{ food }}
      </UButton>
    </div>
  </div>
</template>
```

### QuickSaveButton Component
```vue
<template>
  <div class="quick-save-container">
    <UButton
      @click="quickSave"
      color="primary"
      size="xl"
      block
      class="quick-save-button"
    >
      QUICK SAVE
    </UButton>
  </div>
</template>
```

### BottomTabNavigation Component
```vue
<template>
  <div class="bottom-tabs">
    <UButton
      v-for="tab in tabs"
      :key="tab.id"
      :icon="tab.icon"
      :color="activeTab === tab.id ? 'primary' : 'gray'"
      variant="ghost"
      size="lg"
      @click="setActiveTab(tab.id)"
    />
  </div>
</template>
```

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Larger touch targets (min 44px)
- Simplified navigation
- Swipe gestures for history

### Tablet (768px - 1024px)
- Two-column layout for history
- Larger form inputs
- Side-by-side quick buttons

### Desktop (> 1024px)
- Three-column layout
- Keyboard shortcuts
- Hover states for better UX

## Color Scheme

Using Nuxt UI's default color palette:
- **Primary**: Blue for main actions
- **Success**: Green for successful saves
- **Warning**: Orange for edit actions
- **Error**: Red for delete actions
- **Neutral**: Gray for secondary elements

## Accessibility Features

- High contrast ratios
- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- Alt text for icons
- ARIA labels for form elements

## User Flow

1. **Quick Save Flow** (Primary use case):
   - Open app → Quick Entry tab (default)
   - Press "QUICK SAVE" button
   - Record saved with current time
   - Later edit to add food and notes

2. **Quick Food Flow**:
   - Open app → Quick Entry tab
   - Press any recent food button
   - Record saved with current time and selected food

3. **Full Entry Flow**:
   - Open app → Quick Entry tab
   - Select time (or leave empty for current)
   - Type food or select from quick buttons
   - Add optional notes
   - Press "SAVE FEEDING"

4. **History Management Flow**:
   - Switch to History tab (bottom navigation)
   - Browse chronological list
   - Click "Edit" to modify entry
   - Click "Delete" with confirmation
   - Return to Quick Entry

5. **Retrospective Entry Flow**:
   - Open app → Quick Entry tab
   - Select past time
   - Enter food and notes
   - Save entry
