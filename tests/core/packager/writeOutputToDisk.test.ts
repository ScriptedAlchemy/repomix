import fs from 'node:fs/promises';
import path from 'node:path';
import { createTwoFilesPatch } from 'diff';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RepomixConfigMerged } from '../../../src/config/configSchema.js';
import { writeOutputToDisk } from '../../../src/core/packager/writeOutputToDisk.js';

vi.mock('node:fs/promises');
vi.mock('../../shared/logger');

describe('writeOutputToDisk', () => {
  let originalStdoutWrite: typeof process.stdout.write;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('');
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = vi.fn();
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
  });

  it('should write output to the specified file path', async () => {
    const output = 'test output';
    const config: RepomixConfigMerged = {
      cwd: '/test/directory',
      output: { filePath: 'output.txt' },
    } as RepomixConfigMerged;

    const outputPath = path.resolve(config.cwd, config.output.filePath);

    await writeOutputToDisk(output, config);

    expect(fs.writeFile).toHaveBeenCalledWith(outputPath, output);
    expect(process.stdout.write).not.toHaveBeenCalled();
  });

  it('should write to stdout if stdout is true', async () => {
    const output = 'test output';
    const config: RepomixConfigMerged = {
      cwd: '/test/directory',
      output: { stdout: true },
    } as RepomixConfigMerged;

    await writeOutputToDisk(output, config);

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(process.stdout.write).toHaveBeenCalledWith(output);
  });

  it('should write diff file when diff option is enabled and previous output exists', async () => {
    const output = 'new content';
    const previous = 'old content';
    const config: RepomixConfigMerged = {
      cwd: '/test/directory',
      output: { filePath: 'output.txt', diff: true },
    } as RepomixConfigMerged;

    const outputPath = path.resolve(config.cwd, config.output.filePath);
    const diffPath = `${outputPath}.diff`;
    vi.mocked(fs.readFile).mockResolvedValue(previous);

    const expectedPatch = createTwoFilesPatch(config.output.filePath, config.output.filePath, previous, output);

    await writeOutputToDisk(output, config);

    expect(fs.writeFile).toHaveBeenCalledWith(diffPath, expectedPatch);
    expect(config.output.filePath).toBe('output.txt.diff');
  });

  it('should write full output when diff option enabled but no previous file exists', async () => {
    const output = 'fresh';
    const config: RepomixConfigMerged = {
      cwd: '/test/directory',
      output: { filePath: 'output.txt', diff: true },
    } as RepomixConfigMerged;

    const outputPath = path.resolve(config.cwd, config.output.filePath);
    vi.mocked(fs.readFile).mockRejectedValue(new Error('not found'));

    await writeOutputToDisk(output, config);

    expect(fs.writeFile).toHaveBeenCalledWith(outputPath, output);
  });
});
