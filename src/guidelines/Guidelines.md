# TS Manager UI Design Guidelines

## Visual Design Philosophy

TS Manager follows a clean, modern, professional aesthetic designed for university club management. The interface prioritizes clarity, accessibility, and efficiency while maintaining a fresh, contemporary look that appeals to both students and administrators.

## Layout Structure

### Primary Layout Pattern
The application uses a **fixed two-panel layout**:

**Left Sidebar (280px fixed width):**
- Houses primary navigation and branding
- Remains persistent across all pages
- Contains role-based menu items
- Features "TS Manager" branding with "By TE4CH" subtitle

**Right Main Content Area (fluid width):**
- **Top Bar (64px height)**: Team name (left) + user profile/logout (right)
- **Content Panel**: Dynamic content area with consistent padding
- **Responsive**: Adapts to different screen sizes while maintaining structure

### Spacing and Padding System
- **Page-level padding**: 24px (1.5rem) on all sides
- **Component spacing**: 24px (1.5rem) between major sections
- **Card padding**: 24px (1.5rem) internal padding
- **Element spacing**: 16px (1rem) between related elements
- **Tight spacing**: 8px (0.5rem) between closely related items

## Color System

### Primary Color Palette
- **Primary Dark**: #030213 (deep navy for headers, primary actions)
- **Background**: #ffffff (clean white background in light mode)
- **Muted Gray**: #ececf0 (subtle backgrounds, secondary elements)
- **Muted Text**: #717182 (secondary text, descriptions)
- **Accent Gray**: #e9ebef (hover states, borders)

### Dark Mode Palette
- **Background**: oklch(0.145 0 0) (dark charcoal)
- **Foreground**: oklch(0.985 0 0) (near white text)
- **Cards**: Same as background for seamless appearance
- **Muted**: oklch(0.269 0 0) (lighter gray for secondary elements)

### Sidebar-Specific Colors
- **Light Mode Sidebar**: oklch(0.985 0 0) (slightly off-white)
- **Dark Mode Sidebar**: oklch(0.205 0 0) (darker than main background)
- **Sidebar Accents**: Distinct color tokens for active states and highlights

## Typography System

### Base Typography
- **Font Size**: 14px base (--font-size: 14px)
- **Font Weights**: 
  - Medium (500) for headings, labels, buttons
  - Normal (400) for body text, inputs
- **Line Height**: 1.5 for all text elements

### Heading Hierarchy
- **H1**: text-2xl, medium weight - main page titles
- **H2**: text-xl, medium weight - section headers
- **H3**: text-lg, medium weight - subsection titles
- **H4**: text-base, medium weight - component titles

### Text Usage Patterns
- **Primary Text**: Full contrast for main content
- **Secondary Text**: muted-foreground for descriptions, captions
- **Labels**: Medium weight for form labels and UI elements

## Component Design Patterns

### Card Components
```
Visual Style:
- White background (light) / dark background (dark mode)
- Subtle shadow for depth
- 10px border radius (0.625rem)
- 24px internal padding
- Clean borders using border color tokens
```

### Button Hierarchy
```
Primary Buttons:
- Filled with primary color (#030213)
- White text
- Used for main actions (Save, Create, Submit)

Secondary Buttons:
- Outlined with primary color
- Transparent background
- Primary color text
- Used for alternative actions (Cancel, Edit)

Destructive Buttons:
- Red background (--destructive color)
- White text
- Used for delete/remove actions
```

### Navigation Patterns
```
Sidebar Navigation:
- Clean, minimal icons with text labels
- Active state highlighting with background color change
- Hover states for better interaction feedback
- Role-based menu items (different for admin vs team-leader)

Top Bar Navigation:
- Left: Current team context
- Right: User avatar, name, and logout functionality
- Consistent height across all pages
```

### Form Design
```
Input Fields:
- Light gray background (#f3f3f5)
- Transparent borders
- 10px border radius
- Medium weight labels
- Proper spacing between form elements

Form Layout:
- Vertical stacking with consistent spacing
- Clear visual grouping of related fields
- Validation states with appropriate colors
```

### Table Design
```
Data Tables:
- Clean borders using border color tokens
- Alternating row backgrounds for readability
- Sortable headers with clear interaction states
- Pagination controls when needed
- Action buttons aligned consistently
```

## Role-Based Interface Guidelines

### Admin Interface
```
Visual Characteristics:
- Dashboard with statistics cards
- Management-focused layouts (teams, users, requests)
- Emphasis on oversight and control
- Comprehensive data tables
- Bulk action capabilities
```

### Team Leader Interface
```
Visual Characteristics:
- Team-centric dashboard layout
- Member management with profile cards
- Department organization with clear hierarchy
- Chat interface with modern messaging UI
- Events management (reuses admin components)
```

### Department Head Interface (Future)
```
Planned Visual Characteristics:
- Event creation workflows
- Task assignment interfaces
- Member oversight dashboards
- Progress tracking components
```

### Member Interface (Future)
```
Planned Visual Characteristics:
- Task viewing layouts
- Event participation interfaces
- Simple, task-focused design
- Minimal administrative elements
```

## Interactive States

### Hover States
- Subtle background color changes for buttons
- Border color intensification for interactive elements
- Scale transforms for card hover effects (optional)

### Active States
- Distinct background colors for selected navigation items
- Press states for buttons with slight opacity changes
- Focus rings for accessibility compliance

### Loading States
- Skeleton components for data loading
- Subtle animations for better user experience
- Consistent loading indicators across components

## Responsive Design Principles

### Desktop First (1024px+)
- Full two-panel layout with fixed sidebar
- Optimal spacing and padding throughout
- All features accessible and properly spaced

### Tablet (768px - 1023px)
- Collapsible sidebar or overlay pattern
- Adjusted spacing for touch interfaces
- Maintained functionality with adapted layouts

### Mobile (< 768px)
- Mobile-first navigation patterns
- Stacked layouts replacing side-by-side elements
- Touch-optimized button sizes and spacing

## Accessibility Guidelines

### Color Contrast
- All text maintains WCAG AA contrast ratios
- Dark mode provides equivalent accessibility
- Color is never the sole indicator of state/information

### Interactive Elements
- Minimum 44px touch targets for mobile
- Clear focus indicators for keyboard navigation
- Semantic HTML structure throughout

### Typography
- Scalable typography that works with browser zoom
- Sufficient line height for readability
- Clear visual hierarchy through size and weight

## Animation and Transitions

### Subtle Animations
- Smooth transitions for state changes (0.2s ease)
- Hover effects with quick response times
- Page transitions that feel responsive, not jarring

### Loading Animations
- Skeleton loading for content areas
- Smooth fade-ins for dynamic content
- Progress indicators for longer operations

## Theme Implementation

### Light/Dark Mode Toggle
- Automatic system preference detection
- Manual toggle capability
- Consistent color token usage across themes
- Smooth transitions between theme changes

### Custom Properties Usage
- All colors defined as CSS custom properties
- Systematic approach to color token application
- Easy theming and customization capability

---

## Implementation Notes

- Always use the defined color tokens from globals.css
- Maintain consistent spacing using the established scale
- Follow the component patterns for new feature development
- Ensure responsive behavior matches the established breakpoints
- Test both light and dark modes for all new components
- Preserve the role-based navigation and content structure