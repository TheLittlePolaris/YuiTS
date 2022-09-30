import { FunctionType } from '../interfaces';

export interface IExecutionContextMetadata {
  target: any;
  propertyKey: string;
  descriptor?: TypedPropertyDescriptor<FunctionType>;
}
