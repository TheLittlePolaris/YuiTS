export interface IExecutionContextMetadata {
  target: any
  propertyKey: string
  descriptor?: TypedPropertyDescriptor<Function>
}
