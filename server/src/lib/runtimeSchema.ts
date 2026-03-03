export interface RuntimeSchemaValidationResult {
  valid: boolean;
  error?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateRuntimeSchema(input: unknown): RuntimeSchemaValidationResult {
  if (!isObject(input)) {
    return { valid: false, error: 'Schema must be an object' };
  }

  if (input.schemaVersion !== '1.0') {
    return { valid: false, error: 'schemaVersion must be "1.0"' };
  }

  if (typeof input.lessonId !== 'string' || input.lessonId.trim().length === 0) {
    return { valid: false, error: 'lessonId is required' };
  }

  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    return { valid: false, error: 'title is required' };
  }

  if (!isObject(input.canvas)) {
    return { valid: false, error: 'canvas is required' };
  }

  if (typeof input.canvas.width !== 'number' || typeof input.canvas.height !== 'number') {
    return { valid: false, error: 'canvas width/height must be numbers' };
  }

  if (!Array.isArray(input.nodes) || input.nodes.length === 0) {
    return { valid: false, error: 'nodes must be a non-empty array' };
  }

  return { valid: true };
}
