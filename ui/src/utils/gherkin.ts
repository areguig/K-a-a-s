// Gherkin language definition for Monaco Editor
export const gherkinLanguageDefinition = {
  keywords: [
    'Feature', 'Background', 'Scenario', 'Scenario Outline', 'Examples',
    'Given', 'When', 'Then', 'And', 'But', '*',
    'Rule', 'Example'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--'
  ],

  // Common patterns
  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  // Define tokenizer
  tokenizer: {
    root: [
      // Keywords at the beginning of lines
      [/^\s*(Feature|Background|Scenario|Scenario Outline|Rule|Example):/, 'keyword.feature'],
      [/^\s*(Given|When|Then|And|But|\*)/, 'keyword.step'],
      
      // Tags
      [/@[a-zA-Z_][a-zA-Z0-9_]*/, 'tag'],
      
      // Comments
      [/#.*$/, 'comment'],
      
      // Strings
      [/".*?"/, 'string'],
      [/'.*?'/, 'string'],
      
      // Docstrings (triple quotes)
      [/"""/, { token: 'string.docstring', next: '@docstring' }],
      
      // Table pipes
      [/\|/, 'delimiter.table'],
      
      // Parameters in examples
      [/<[^>]*>/, 'variable'],
      
      // Numbers
      [/\d+/, 'number'],
      
      // URLs and endpoints
      [/https?:\/\/[^\s]+/, 'string.url'],
      [/\/[^\s]*/, 'string.path'],
      
      // JSON-like structures in steps
      [/\{/, { token: 'delimiter.curly', next: '@json' }],
      [/\[/, { token: 'delimiter.square', next: '@array' }],
      
      // Generic content
      [/[a-zA-Z_$][\w$]*/, 'identifier'],
      [/[ \t\r\n]+/, 'white']
    ],

    docstring: [
      [/[^"]+/, 'string.docstring'],
      [/"""/, { token: 'string.docstring', next: '@pop' }],
      [/"/, 'string.docstring']
    ],

    json: [
      [/[^{}]+/, 'string.json'],
      [/\{/, { token: 'delimiter.curly', next: '@json' }],
      [/\}/, { token: 'delimiter.curly', next: '@pop' }]
    ],

    array: [
      [/[^\[\]]+/, 'string.array'],
      [/\[/, { token: 'delimiter.square', next: '@array' }],
      [/\]/, { token: 'delimiter.square', next: '@pop' }]
    ]
  }
};

// Custom theme for KaaS Gherkin editor
export const kaasLightTheme = {
  base: 'vs',
  inherit: true,
  rules: [
    // Feature-level keywords
    { token: 'keyword.feature', foreground: '#2563eb', fontStyle: 'bold' }, // brand-primary
    
    // Step keywords
    { token: 'keyword.step', foreground: '#059669', fontStyle: 'bold' }, // status-success
    
    // Tags
    { token: 'tag', foreground: '#0284c7' }, // status-info
    
    // Comments
    { token: 'comment', foreground: '#6b7280', fontStyle: 'italic' }, // gray-500
    
    // Strings
    { token: 'string', foreground: '#dc2626' }, // status-error
    { token: 'string.docstring', foreground: '#dc2626', fontStyle: 'italic' },
    { token: 'string.url', foreground: '#06b6d4' }, // brand-accent
    { token: 'string.path', foreground: '#06b6d4' },
    { token: 'string.json', foreground: '#7c2d12' }, // amber-800
    { token: 'string.array', foreground: '#7c2d12' },
    
    // Variables/Parameters
    { token: 'variable', foreground: '#d97706', fontStyle: 'italic' }, // status-warning
    
    // Numbers
    { token: 'number', foreground: '#7c3aed' }, // violet-600
    
    // Table delimiters
    { token: 'delimiter.table', foreground: '#374151', fontStyle: 'bold' }, // gray-700
    
    // JSON/Array delimiters
    { token: 'delimiter.curly', foreground: '#374151' },
    { token: 'delimiter.square', foreground: '#374151' },
    
    // Identifiers
    { token: 'identifier', foreground: '#111827' } // gray-900
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#111827',
    'editor.lineHighlightBackground': '#f8fafc',
    'editor.selectionBackground': '#dbeafe',
    'editor.selectionHighlightBackground': '#eff6ff',
    'editorLineNumber.foreground': '#9ca3af',
    'editorLineNumber.activeForeground': '#374151',
    'editorIndentGuide.background': '#f3f4f6',
    'editorIndentGuide.activeBackground': '#d1d5db'
  }
};

// JSON schema for Karate configuration
export const karateConfigSchema = {
  type: 'object',
  properties: {
    logLevel: {
      type: 'string',
      enum: ['trace', 'debug', 'info', 'warn', 'error'],
      description: 'Logging level for test execution'
    },
    retryCount: {
      type: 'integer',
      minimum: 0,
      maximum: 10,
      description: 'Number of retries for failed steps'
    },
    headers: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          type: 'string'
        }
      },
      description: 'Default HTTP headers for requests'
    },
    timeout: {
      type: 'integer',
      minimum: 1000,
      maximum: 60000,
      description: 'Request timeout in milliseconds'
    },
    baseUrl: {
      type: 'string',
      format: 'uri',
      description: 'Base URL for API requests'
    },
    ssl: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        trustAll: { type: 'boolean' }
      }
    }
  }
};

// Register Gherkin language and theme with Monaco
export const setupGherkinLanguage = (monaco: any) => {
  // Register the language
  monaco.languages.register({ id: 'gherkin' });
  
  // Set the language configuration
  monaco.languages.setLanguageConfiguration('gherkin', {
    comments: {
      lineComment: '#'
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  });
  
  // Set the monarch tokenizer
  monaco.languages.setMonarchTokensProvider('gherkin', gherkinLanguageDefinition);
  
  // Define the theme
  monaco.editor.defineTheme('kaas-light', kaasLightTheme);
  
  // Configure JSON language with Karate schema
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [{
      uri: 'http://kaas.local/karate-config-schema.json',
      fileMatch: ['*'],
      schema: karateConfigSchema
    }]
  });
};