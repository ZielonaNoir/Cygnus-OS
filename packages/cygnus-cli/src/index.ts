#!/usr/bin/env node

import { Command } from "commander";
import { logger } from "./lib/logger.js";
import { syncCommand } from "./commands/sync.js";
import { classifyCommand } from "./commands/classify.js";
import { indexCommand } from "./commands/index-gen.js";
import { initCommand } from "./commands/init.js";

const program = new Command();

program
  .name("cygnus")
  .description("Cygnus-OS CLI tool for project sync and prompt management")
  .version("0.1.0")
  .option("-v, --verbose", "Enable verbose logging", false)
  .option("-c, --config <path>", "Path to config file");

// Register commands
program.addCommand(initCommand);
program.addCommand(syncCommand);
program.addCommand(classifyCommand);
program.addCommand(indexCommand);

// 处理全局选项
program.hook("preAction", (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.verbose) {
    logger.setLevel(0); // DEBUG
  }
});

program.parse();
