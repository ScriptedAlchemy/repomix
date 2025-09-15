import { describe, expect, test } from 'vitest';
import { buildCliConfig } from '../../../src/cli/actions/defaultAction.js';
import type { CliOptions } from '../../../src/cli/types.js';

describe('Diff output flag in CLI', () => {
  test('should set output.diff when --diff flag is provided', () => {
    const options: CliOptions = { diff: true };
    const config = buildCliConfig(options);
    expect(config.output?.diff).toBe(true);
  });

  test('should not set output.diff when --diff flag is absent', () => {
    const options: CliOptions = {};
    const config = buildCliConfig(options);
    expect(config.output?.diff).toBeUndefined();
  });
});
