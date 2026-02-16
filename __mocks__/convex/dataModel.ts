// Mock Convex data model types
export type Id<T extends string> = string & { __tableName: T }
