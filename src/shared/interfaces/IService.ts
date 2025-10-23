/**
 * Base Service Interface
 * Defines common operations for all services
 */

export interface IService {
  initialize?(): Promise<void>
  cleanup?(): Promise<void>
}

export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Partial<T>): Promise<T>
  update(id: ID, data: Partial<T>): Promise<T>
  delete(id: ID): Promise<boolean>
}

export interface IQueryRepository<T, ID = string> extends IRepository<T, ID> {
  findMany(filters?: any, pagination?: any): Promise<T[]>
  count(filters?: any): Promise<number>
}
