# Visual Design Specifications

## Color Palette (urlscan.io branding)

### Primary Colors
- **Dark Blue**: `#1e3a8a` - Headers, primary elements
- **Bright Blue**: `#2563eb` / `#1e40af` - Accents, buttons, links
- **Light Blue**: `#eff6ff` - Info boxes background

### UI States
- **Success Green**: `#d1fae5` (background), `#065f46` (text), `#10b981` (border)
- **Error Red**: `#fee2e2` (background), `#991b1b` (text), `#ef4444` (border)

### Neutral Colors
- **White**: `#ffffff` - Main background
- **Light Gray**: `#f9fafb` / `#f3f4f6` - Footer, secondary buttons
- **Medium Gray**: `#e5e7eb` - Borders, dividers
- **Text Gray**: `#374151` - Primary text
- **Muted Text**: `#6b7280` - Secondary text

### Gradients
- **Header**: `linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)`
- **Body Background**: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`
- **Primary Button**: `linear-gradient(135deg, #2563eb 0%, #1e40af 100%)`

## Typography

### Font Family
```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Font Sizes
- **Header Title**: 32px (700 weight)
- **Section Heading**: 20px (600 weight)
- **Info Box Title**: 18px (600 weight)
- **Body Text**: 14-16px (400 weight)
- **Small Text**: 13px (400 weight)
- **Button Text**: 16px (600 weight)

## Layout

### Container
- **Max Width**: 800px
- **Background**: White card on gradient background
- **Border Radius**: 16px
- **Shadow**: `0 20px 60px rgba(0, 0, 0, 0.3)`

### Spacing
- **Page Padding**: 40px
- **Section Margin**: 30px bottom
- **Form Group Margin**: 24px bottom
- **Input Padding**: 12px 16px
- **Button Padding**: 14px 24px

## Components

### Input Fields
- **Border**: 2px solid #e5e7eb (default)
- **Border (Focus)**: 2px solid #2563eb
- **Border Radius**: 8px
- **Shadow (Focus)**: `0 0 0 3px rgba(37, 99, 235, 0.1)`

### Buttons
- **Primary**: Gradient blue, white text
- **Secondary**: Light gray (#f3f4f6), dark gray text (#374151)
- **Border Radius**: 8px
- **Hover Effect**: Slight lift (`translateY(-2px)`)
- **Box Shadow (Hover)**: `0 8px 20px rgba(37, 99, 235, 0.3)`

### Status Messages
- **Border Radius**: 8px
- **Padding**: 16px
- **Font Weight**: 500
- **Animation**: Slide in from top

### Info Box
- **Background**: #eff6ff (light blue)
- **Border Left**: 4px solid #2563eb
- **Border Radius**: 8px
- **Padding**: 20px

## Icons & Visual Elements

### Header Icon
- **Size**: 32x32px
- **Style**: Outlined link icon
- **Color**: White
- **Stroke Width**: 2px

### Status Icons
- **Success**: ✓ (Unicode U+2713)
- **Error**: ✗ (Unicode U+2717)

### Loading Spinner
- **Size**: 16x16px
- **Border**: 2px
- **Color**: White with blue top
- **Animation**: Continuous rotation (0.6s)

## Animations

### Slide In
```css
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

### Spin
```css
@keyframes spin {
    to { transform: rotate(360deg); }
}
```

## Responsive Design

### Breakpoints
- Works on all screen sizes
- Minimum comfortable width: 320px
- Optimal viewing: 800px+

### Mobile Considerations
- Container has 20px padding on small screens
- Font sizes remain readable
- Touch-friendly button sizes (44px minimum)

## Accessibility

### Focus States
- Clear blue outline on focus
- 3px shadow for visibility
- Maintains keyboard navigation

### Color Contrast
- All text meets WCAG AA standards
- Primary text: 4.5:1 minimum
- Large text: 3:1 minimum

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs
- Descriptive button text
- ARIA-friendly structure

## Browser Compatibility

### Supported Features
- CSS Grid and Flexbox
- CSS Gradients
- CSS Animations
- Custom fonts (Google Fonts)
- Modern box-shadow
- Transform properties

### Minimum Firefox Version
- **Required**: Firefox 109+
- **Recommended**: Firefox 115+ (ESR)

## Design Inspiration

The design takes inspiration from:
- **urlscan.io**: Color palette and professional aesthetic
- **Modern Web Apps**: Card-based layouts, gradients
- **Material Design**: Elevation, shadows, animations
- **Tailwind CSS**: Clean spacing, color systems

## Screenshot Recommendations

For Mozilla submission, capture:
1. **Settings page** - Full view showing all fields
2. **Context menu** - Right-click on a link
3. **Notification** - Success message after scan
4. **Validation** - Form with error states
5. **API key toggle** - Show/hide functionality
