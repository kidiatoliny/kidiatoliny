export function resolveTerminalPalette(theme) {
  if (theme === 'github-dark') {
    return {
      body: '#0d1117',
      border: '#30363d',
      command: '#e6edf3',
      muted: '#8b949e',
      output: '#f0f6fc',
      panel: '#161b22',
      path: '#79c0ff',
      prompt: '#7ee787',
      secondary: '#c9d1d9',
      titleBar: '#21262d',
    };
  }

  return {
    body: '#ffffff',
    border: '#d0d7de',
    command: '#24292f',
    muted: '#57606a',
    output: '#1f2328',
    panel: '#f6f8fa',
    path: '#0969da',
    prompt: '#1a7f37',
    secondary: '#424a53',
    titleBar: '#eaeef2',
  };
}
