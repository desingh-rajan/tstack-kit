import type { EntityNames } from "../../utils/stringUtils.ts";
import type { FileToWrite } from "../../utils/fileWriter.ts";

/**
 * Base scaffolder interface
 * All scaffolders (API, Admin-UI, Flutter-UI) implement this
 */
export interface IScaffolder {
  /**
   * Check if this scaffolder should run
   */
  shouldRun(): Promise<boolean>;

  /**
   * Generate files for this scaffolder
   */
  generateFiles(): Promise<FileToWrite[]>;

  /**
   * Get target directory for files
   */
  getTargetDir(): string;

  /**
   * Get scaffolder type name (for logging)
   */
  getTypeName(): string;

  /**
   * Optional post-processing after files are written
   */
  postProcess?(): Promise<void>;
}

/**
 * Base scaffolder options
 */
export interface BaseScaffolderOptions {
  entityNames: EntityNames;
  force?: boolean;
}

/**
 * Abstract base scaffolder class
 */
export abstract class BaseScaffolder implements IScaffolder {
  protected entityNames: EntityNames;
  protected force: boolean;

  constructor(options: BaseScaffolderOptions) {
    this.entityNames = options.entityNames;
    this.force = options.force ?? false;
  }

  abstract shouldRun(): Promise<boolean>;
  abstract generateFiles(): Promise<FileToWrite[]>;
  abstract getTargetDir(): string;
  abstract getTypeName(): string;
}
