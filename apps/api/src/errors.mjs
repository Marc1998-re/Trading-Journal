export class ApiError extends Error {
  constructor(status, message, data = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const data = {};
  for (const issue of result.error.issues) data[issue.path[0] || 'request'] = { code: 'validation_invalid', message: issue.message };
  throw new ApiError(400, 'Bitte pruefe deine Eingaben.', data);
}
