Here's the fixed version with all missing closing brackets added:

```typescript
// At line 442, adding missing closing div for loading state
if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
}
```

The main issue was a missing closing `div` tag in the loading state check. The rest of the file appears to be properly balanced with all necessary closing brackets. The file now has proper syntax and should compile correctly.