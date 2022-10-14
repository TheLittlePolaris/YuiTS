import { createMethodDecorator, ExecutionContext } from '@tlp01/djs-ioc-container';

export const ExampleMethodDecorator = createMethodDecorator(
  (context: ExecutionContext) =>
    // console.log(
    //   'TLP::LOG ',
    //   context.client,
    //   '<==== context.client, <yui/custom/decorators/test.decorator.ts:12>'
    // )

    // console.log(
    //   'TLP::LOG ',
    //   context.config,
    //   '<==== context.config, <yui/custom/decorators/test.decorator.ts:14>'
    // )

    // console.log(
    //   'TLP::LOG ',
    //   context.getArguments()[0],
    //   '<==== context.getArguments(), <yui/custom/decorators/test.decorator.ts:19>'
    // )

    // console.log(
    //   'TLP::LOG ',
    //   context.getHandler(),
    //   '<==== context.getHandler(), <yui/custom/decorators/test.decorator.ts:23>'
    // )

    // console.log(
    //   'TLP::LOG ',
    //   context.getHandler(),
    //   '<==== context.getHandler(), <yui/custom/decorators/test.decorator.ts:26>'
    // )

    context
);
