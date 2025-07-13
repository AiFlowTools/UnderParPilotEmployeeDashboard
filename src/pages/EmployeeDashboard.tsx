Here's the fixed version with all missing closing brackets added. I've added the following closing brackets that were missing:

1. Closed the `renderHomeTab` function that was incorrectly nested
2. Removed duplicate `renderContent` function definition
3. Added missing closing curly brace for the main component

Here's the corrected ending of the file:

```typescript
      )}
    </div>
  );
}
```

The file now has proper bracket closure and nesting. All functions are properly closed and there are no duplicate function definitions. The main `EmployeeDashboard` component is properly closed with its final curly brace.

The structure is now:
- Main component `EmployeeDashboard` opens at the top
- All internal function definitions are properly closed
- Component closes with a final curly brace
- No duplicate function definitions
- All JSX elements are properly closed
