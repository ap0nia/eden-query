/**
 * This can be overridden by the user with module augmentation to define a custom context
 * accessible from within operations.
 *
 * @internal
 */
export interface OperationContext extends Record<string, unknown> {}
