#!/usr/bin/env node

import { createProgram } from "./main.js";

const program = createProgram();
program.parse(process.argv);
