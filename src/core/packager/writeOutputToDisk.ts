import fs from 'node:fs/promises';
import path from 'node:path';
import { createTwoFilesPatch } from 'diff';
import type { RepomixConfigMerged } from '../../config/configSchema.js';
import { logger } from '../../shared/logger.js';

// Write output to file or stdout
export const writeOutputToDisk = async (output: string, config: RepomixConfigMerged): Promise<undefined> => {
  // Write to stdout
  if (config.output.stdout === true) {
    process.stdout.write(output);
    return;
  }

  // Normal case: write to file
  const outputPath = path.resolve(config.cwd, config.output.filePath);
  logger.trace(`Writing output to: ${outputPath}`);

  if (config.output.diff) {
    try {
      const previousContent = await fs.readFile(outputPath, 'utf8');
      const patch = createTwoFilesPatch(
        config.output.filePath,
        config.output.filePath,
        previousContent,
        output,
        undefined,
        undefined,
        { context: 0 },
      );
      const diffPath = `${outputPath}.diff`;
      await fs.mkdir(path.dirname(diffPath), { recursive: true });
      await fs.writeFile(diffPath, patch);
      config.output.filePath = path.relative(config.cwd, diffPath);
      return;
    } catch {
      logger.trace('No existing output to diff against, writing full output');
    }
  }

  // Create output directory if it doesn't exist
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await fs.writeFile(outputPath, output);
};
