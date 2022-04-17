import { isFunction } from "lodash";

import {
  COMPONENT_METADATA,
  DESIGN_TYPE,
  INJECTABLE_METADATA,
} from "../constants";
import { DiscordEvent } from "../constants/discord-events";
import {
  GenericClassDecorator,
  Prototype,
  Type,
} from "../interfaces/dependencies-injection.interfaces";

export function Entrypoint<T = any>(): GenericClassDecorator<Type<T>> {
  return (target: Type<T>) => {
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
  };
}

// https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators
export const On = (event: DiscordEvent): MethodDecorator => {
  return function (
    target: Prototype,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const propertyDesignType = Reflect.getMetadata(
      DESIGN_TYPE,
      target,
      propertyKey
    );
    if (!isFunction(propertyDesignType))
      throw new Error(`Client's event property has to be a method!`);
    let eventList: { [key: string]: string } =
      Reflect.getMetadata(COMPONENT_METADATA.EVENT_LIST, target.constructor) ||
      [];
    eventList = { ...eventList, [event]: propertyKey };
    Reflect.defineMetadata(
      COMPONENT_METADATA.EVENT_LIST,
      eventList,
      target.constructor
    );
  };
};
