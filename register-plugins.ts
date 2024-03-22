import ts from "typescript";
import { Transformer } from "ts-runtime-checks/dist/transformer.js";
import { BunPlugin, OnLoadResult, Transpiler, plugin } from "bun";
import { tsRuntimeChecks } from './ts-runtime-checks.js';

plugin(tsRuntimeChecks);
