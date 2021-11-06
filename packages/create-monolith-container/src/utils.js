const selectCompilerContext = context => compilerId => context.getValue('compilerContexts')[compilerId];

const selectCompilerContexts = context =>
  context.getValue('compilerIds')
    .map(selectCompilerContext(context));

exports.selectAppContexts = context => {
  return [
    ...selectCompilerContexts(context),
    context.getValue('apiContext'),
  ];
};

