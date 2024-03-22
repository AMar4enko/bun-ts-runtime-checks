import ts from "typescript";
import { Transformer } from "ts-runtime-checks/dist/transformer.js";
import { BunPlugin, OnLoadResult, Transpiler, plugin } from "bun";

const host: ts.ParseConfigFileHost = ts.sys as any;

async function runTransform(filePath: string): Promise<string> {
  // Let's explicitly get the config, we might need to make some changes or check things too
  const tsConfigPath = ts.findConfigFile(
    "./",
    ts.sys.fileExists,
    "tsconfig.json"
  );
  const parsedConfig = tsConfigPath
    ? ts.getParsedCommandLineOfConfigFile(tsConfigPath, {}, host)
    : null;
  if (!parsedConfig) {
    throw new Error("Could not parse tsconfig.json");
  }
  // Now let's create a 'program' that will represent the entire project and load all the types.  This is heavy and slow.
  const program = ts.createProgram(
    parsedConfig.fileNames,
    parsedConfig.options
  );

  // This is our custom transformer that will be applied to the AST
  // const transformer = new Transformer(program, ts.createTransformationContext(), {});
  const transformerFactory =
    (context: ts.TransformationContext) => (file: ts.SourceFile) => {
      console.log(`Transforming`, file.fileName);
      return new Transformer(program, context, {}).run(file);
    }

  // const transformer = createReflectTransformer(program);

  // Let's load our code
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile)
    return await require("fs").promises.readFile(filePath, "utf8"); //So failed for some reason, return the original code for bun to figure out, maybe do some error handling later...
  // No we tell TypeScript to apply our transformer to the AST
  const transformedSourceFile = ts.transform(
    sourceFile,
    [transformerFactory],
    parsedConfig.options
  ).transformed[0] as ts.SourceFile;
  // No we need to 'print' our transformed AST back into old fashioned JS code
  const printer = ts.createPrinter();
  // "Prints" to a string we'll just return
  return printer.printFile(transformedSourceFile);
}

const transpiler = new Transpiler({ loader: "ts" });
export const tsRuntimeChecks: BunPlugin = {
  name: "ts-runtime-checks",
  async setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async (args): Promise<OnLoadResult> => {
      console.log(args)
      const newCode = await runTransform(args.path);
      return {
        contents: transpiler.transformSync(newCode),
      };
    });
  },
};