# Developer Guide - Practice Settings Dashboard

## Table of Contents
1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Adding New Features](#adding-new-features)
5. [Common Tasks](#common-tasks)
6. [Debugging](#debugging)
7. [Best Practices](#best-practices)

---

## Getting Started

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0
- Basic knowledge of React Hooks
- Understanding of set theory (for override system)

### Initial Setup

```bash
# Clone the repository
cd practice-settings-dashboard

# Install dependencies
npm install

# Start development server
npm start

# App will open at http://localhost:3000
```

### Development Tools
- **React DevTools**: Browser extension for inspecting React components
- **VS Code**: Recommended IDE with ESLint extension
- **Chrome/Firefox DevTools**: For debugging and network inspection

---

## Project Structure

```
practice-settings-dashboard/
│
├── public/
│   ├── index.html              # HTML template
│   └── ...                     # Static assets
│
├── src/
│   ├── utils/
│   │   └── validationHelpers.js    # Validation & formatting utilities
│   │
│   ├── components/
│   │   └── (future components)     # Extracted React components
│   │
│   ├── PracticeSettingsDashboard.jsx  # Main application component
│   ├── App.js                         # Root component
│   ├── index.js                       # Entry point
│   └── index.css                      # Global styles (Tailwind)
│
├── docs/
│   ├── TECHNICAL_DOCUMENTATION.md    # Detailed technical docs
│   ├── DEVELOPER_GUIDE.md            # This file
│   └── ...                           # Additional documentation
│
├── ARCHITECTURE.md             # System architecture and design
├── README.md                   # User-facing documentation
├── package.json                # Dependencies and scripts
└── ...                         # Config files

```

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `PracticeSettingsDashboard.jsx` | Main component with all logic | ~3800 |
| `validationHelpers.js` | Validation utilities | ~70 |
| `ARCHITECTURE.md` | System design and principles | - |
| `TECHNICAL_DOCUMENTATION.md` | Implementation details | - |

---

## Development Workflow

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Edit files in `src/`
   - Hot reload will update browser automatically

3. **Test changes**
   - Manual testing in browser
   - Check for console errors
   - Test edge cases

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: Add feature description"
   ```

### Commit Message Format

```
<type>: <description>

<body (optional)>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes
- `test`: Adding tests
- `chore`: Maintenance tasks

---

## Adding New Features

### Adding a New Setting Type

1. **Define the setting in moduleSettings**:
```javascript
{
  id: 99,
  name: 'My New Setting',
  type: 'my-custom-type',  // New type
  default: 'some value',
  lockState: 'unlocked',
  options: ['option1', 'option2'],  // if applicable
  subtext: 'Help text for users'
}
```

2. **Add rendering logic in SettingRow component**:
```javascript
// In renderFormControl function, add new case:
case 'my-custom-type':
  return (
    <div>
      {/* Your custom UI here */}
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
```

3. **Update validation if needed**:
```javascript
// If your type needs special validation:
if (setting.type === 'my-custom-type') {
  // Custom validation logic
}
```

4. **Test thoroughly**:
   - [ ] Value changes work
   - [ ] Lock state changes work
   - [ ] Override creation works
   - [ ] Override cleanup works
   - [ ] Validation works

---

### Adding a New Modal

1. **Create modal component**:
```javascript
const MyNewModal = () => {
  if (!showMyModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Modal content */}
      </div>
    </div>
  );
};
```

2. **Add state for modal**:
```javascript
const [showMyModal, setShowMyModal] = useState(false);
const [myModalData, setMyModalData] = useState(null);
```

3. **Render in main component**:
```javascript
return (
  <div>
    {/* Other content */}
    <MyNewModal />
  </div>
);
```

---

### Adding a New Validation Rule

1. **Add helper function** (if needed):
```javascript
// In validationHelpers.js
export const myValidationRule = (value, setting) => {
  // Your validation logic
  return isValid;
};
```

2. **Use in validation flow**:
```javascript
// In handleChange or handleSave
if (!myValidationRule(newValue, setting)) {
  setValidationError('Your error message');
  return;
}
```

3. **Add tests** (future):
```javascript
describe('myValidationRule', () => {
  it('should validate correctly', () => {
    expect(myValidationRule('value', setting)).toBe(true);
  });
});
```

---

## Common Tasks

### Task 1: Add a New User

```javascript
// In state initialization
const [allUsers, setAllUsers] = useState([
  // ...existing users
  {
    id: 999,
    name: 'New User',
    type: 'primary',  // or 'secondary'
    specialty: 'Cardiology',  // for primary
    role: 'Nurse',            // for secondary
    email: 'newuser@clinic.com',
    linkedDoctors: []          // for secondary
  }
]);
```

### Task 2: Add a New Module

```javascript
const [settingsModules, setSettingsModules] = useState({
  // ...existing modules
  'my-new-module': {
    title: 'My New Module',
    subtitle: 'Description of module',
    settings: [
      // Array of settings
    ]
  }
});
```

### Task 3: Debug Validation Issue

```javascript
// Add console logs in doesOverrideMatchDefault
const doesOverrideMatchDefault = (...params) => {
  console.log('Validation params:', {
    userId,
    moduleId,
    settingId,
    newValue,
    newLockState
  });

  const result = /* validation logic */;
  console.log('Validation result:', result);

  return result;
};
```

### Task 4: Export/Import Settings

```javascript
// Export current settings
const exportSettings = () => {
  const data = {
    moduleSettings,
    userSettingsOverrides
  };
  const json = JSON.stringify(data, null, 2);
  // Download or save json
};

// Import settings
const importSettings = (json) => {
  const data = JSON.parse(json);
  setModuleSettings(data.moduleSettings);
  setUserSettingsOverrides(data.userSettingsOverrides);
};
```

---

## Debugging

### Common Issues

#### Issue: "Validation not working"

**Debug steps**:
1. Check if `doesOverrideMatchDefault` is called
   ```javascript
   console.log('Validating:', newValue, newLockState);
   ```

2. Check if validation result is correct
   ```javascript
   const result = doesOverrideMatchDefault(...);
   console.log('Would match default?', result);
   ```

3. Check if error is shown
   ```javascript
   if (wouldMatchDefault) {
     console.log('Showing error');
     setValidationError(message);
   }
   ```

#### Issue: "Override not being removed"

**Debug steps**:
1. Check detectRedundantOverrides output
   ```javascript
   const redundant = detectRedundantOverrides(...);
   console.log('Redundant overrides:', redundant);
   ```

2. Check if modal is shown
   ```javascript
   if (redundant.length > 0) {
     console.log('Should show modal');
     setShowOverrideCleanupModal(true);
   }
   ```

3. Check removeMultipleOverrides
   ```javascript
   console.log('Removing overrides:', overridesToRemove);
   ```

#### Issue: "State not updating"

**Common causes**:
- Not using functional update: `setState(prev => ...)`
- Mutating state directly instead of creating new object
- Async timing issues

**Fix**:
```javascript
// ❌ Wrong
setUserSettingsOverrides(userSettingsOverrides);

// ✅ Correct
setUserSettingsOverrides(prev => ({ ...prev }));
```

---

### Using React DevTools

1. **Inspect Component State**:
   - Open React DevTools
   - Select PracticeSettingsDashboard component
   - View all state variables in right panel

2. **Track State Changes**:
   - Enable "Highlight updates"
   - See which components re-render

3. **Debug Props**:
   - Select child component
   - View props passed from parent

---

### Console Logging Best Practices

```javascript
// ❌ Avoid
console.log(data);

// ✅ Better
console.log('User override:', {
  userId,
  setting: setting.name,
  newValue,
  oldValue: currentOverride?.value
});

// ✅ Even better - use labels
console.group('Override Validation');
console.log('Setting:', setting.name);
console.log('User:', userId);
console.log('Would match?', wouldMatchDefault);
console.groupEnd();
```

---

## Best Practices

### React Hooks

1. **Always use functional updates for state that depends on previous state**:
   ```javascript
   // ✅ Good
   setCount(prev => prev + 1);

   // ❌ Bad
   setCount(count + 1);
   ```

2. **Keep useEffect dependencies accurate**:
   ```javascript
   useEffect(() => {
     // Use selectedUser
   }, [selectedUser]);  // Include in dependencies
   ```

3. **Use useCallback for event handlers passed to children**:
   ```javascript
   const handleClick = useCallback(() => {
     // Handle click
   }, [dependencies]);
   ```

### Component Organization

1. **Order within component**:
   ```javascript
   // 1. Imports
   // 2. Constants
   // 3. Component function
   //   a. State declarations
   //   b. Effect hooks
   //   c. Helper functions
   //   d. Event handlers
   //   e. Render logic
   ```

2. **Extract large functions**:
   ```javascript
   // If a function is >50 lines, consider extracting to separate file
   ```

3. **Keep JSX readable**:
   ```javascript
   // ✅ Good
   {isVisible && (
     <div>Content</div>
   )}

   // ❌ Avoid deep nesting
   {a ? b ? c ? d : e : f : g}
   ```

### Validation Logic

1. **Always validate before state changes**:
   ```javascript
   // ✅ Validate first
   if (!isValid(newValue)) {
     showError();
     return;
   }
   updateState(newValue);
   ```

2. **Use helper functions**:
   ```javascript
   // ✅ Use helpers from validationHelpers.js
   import { valuesAreEqual } from '../utils/validationHelpers';

   // ❌ Don't duplicate logic
   if (JSON.stringify(a.sort()) === JSON.stringify(b.sort())) {}
   ```

3. **Provide clear error messages**:
   ```javascript
   // ✅ Specific and actionable
   "Cannot create override: Value and lock state match practice default"

   // ❌ Vague
   "Invalid input"
   ```

### State Management

1. **Use composite keys for lookups**:
   ```javascript
   // ✅ O(1) lookup
   const key = `${userId}-${moduleId}-${settingId}`;
   const override = overrides[key];

   // ❌ O(n) search
   const override = overrides.find(o =>
     o.userId === userId && o.moduleId === moduleId
   );
   ```

2. **Batch related state updates**:
   ```javascript
   // ✅ Single render
   setUserSettingsOverrides(prev => {
     const updated = { ...prev };
     updated[key1] = value1;
     updated[key2] = value2;
     return updated;
   });

   // ❌ Multiple renders
   setUserSetting(key1, value1);
   setUserSetting(key2, value2);
   ```

3. **Keep state normalized**:
   ```javascript
   // ✅ Flat structure with IDs
   {
     users: { '1': {...}, '2': {...} },
     overrides: { 'user1-module-setting': {...} }
   }

   // ❌ Nested structure
   {
     users: [
       { id: 1, overrides: [...] }
     ]
   }
   ```

---

## Code Style

### Naming Conventions

- **Components**: PascalCase (`UserModal`, `SettingRow`)
- **Functions**: camelCase (`getUserSetting`, `handleChange`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SELECTIONS`)
- **Boolean variables**: Prefix with `is`, `has`, `should` (`isVisible`, `hasOverride`)

### Comments

```javascript
// ✅ Good comments explain WHY
// Check both value and lock state because service-settings-combined
// requires all three components to match for redundancy

// ❌ Bad comments explain WHAT (code already shows this)
// Set the value to newValue
setValue(newValue);
```

### Formatting

- Use 2 spaces for indentation
- Max line length: 100 characters
- Always use semicolons
- Use single quotes for strings
- Add trailing commas in objects/arrays

---

## Testing Guidelines (Future)

### Unit Tests

```javascript
// Test validation helpers
describe('valuesAreEqual', () => {
  it('should return true for equal arrays', () => {
    expect(valuesAreEqual([1, 2], [2, 1])).toBe(true);
  });

  it('should return false for different arrays', () => {
    expect(valuesAreEqual([1, 2], [1, 3])).toBe(false);
  });
});
```

### Integration Tests

```javascript
// Test override creation flow
describe('Override Creation', () => {
  it('should block override matching default', () => {
    // 1. Render component
    // 2. Open modal
    // 3. Set values matching default
    // 4. Click save
    // 5. Assert error shown
    // 6. Assert override not created
  });
});
```

---

## Resources

### Internal Documentation
- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md)
- [Architecture Documentation](../ARCHITECTURE.md)
- [README](../README.md)

### External Resources
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev)

### Learning Resources
- [React Hooks Guide](https://react.dev/reference/react)
- [State Management Patterns](https://react.dev/learn/managing-state)
- [Set Theory Basics](https://en.wikipedia.org/wiki/Set_theory)

---

## Getting Help

### Before Asking for Help

1. Check console for errors
2. Review relevant documentation
3. Use React DevTools to inspect state
4. Add console logs to trace execution
5. Search existing issues/documentation

### When Reporting Issues

Include:
1. What you were trying to do
2. What you expected to happen
3. What actually happened
4. Steps to reproduce
5. Console errors (if any)
6. Screenshots (if relevant)

---

*Last Updated: November 24, 2025*
*Version: 1.0*
