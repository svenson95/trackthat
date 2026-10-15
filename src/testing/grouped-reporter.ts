/* eslint-disable no-console */
import chalk from 'chalk';

import type { Reporter, TestCase, TestModule, TestSuite } from 'vitest/node';

type TestGroup = {
  name: string;
  path?: string;
  matches?: (path: string) => boolean;
  children?: TestGroup[];

  sectionByFolder?: boolean;
  nestedSectionRoots?: string[];

  sectionOrder?: string[];
  nestedSectionOrder?: Record<string, string[]>;
};

type SectionNode = {
  modules: TestModule[];
  children: Map<string, SectionNode>;
};

const DEFAULT_SECTION_ORDER: readonly string[] = ['data-access', 'state', 'utils', 'components'];

const TEST_GROUPS: TestGroup[] = [
  {
    name: 'GLOBAL',
    matches: (path) =>
      path.includes('/app.component.spec.') ||
      path.includes('/app.config.spec.') ||
      path.includes('/app.routes.spec.'),
  },
  {
    name: 'CORE',
    path: '/core/',
    sectionByFolder: true,
  },
  {
    name: 'SHARED',
    path: '/shared/',
    sectionByFolder: true,
  },
  {
    name: 'FEATURES',
    children: [
      {
        name: 'TRAINING',
        path: '/features/training/',
        sectionByFolder: true,
        nestedSectionRoots: ['subfeatures'],
        sectionOrder: ['data-access', 'utils', 'subfeatures'],
        nestedSectionOrder: {
          subfeatures: ['workouts', 'workout-routine', 'workout'],
        },
      },
      {
        name: 'BODY',
        path: '/features/body/',
        sectionByFolder: true,
      },
      {
        name: 'OVERVIEW',
        path: '/features/overview/',
        sectionByFolder: true,
      },
      {
        name: 'JOURNAL',
        path: '/features/journal/',
        sectionByFolder: true,
      },
      {
        name: 'MORE',
        path: '/features/more/',
        sectionByFolder: true,
      },
    ],
  },
];

class GroupedReporter implements Reporter {
  onTestRunEnd(testModules: ReadonlyArray<TestModule>): void {
    const groupedModules = this.groupBy(
      testModules,
      (module) => this.getGroup(module.moduleId).name,
    );

    for (const group of TEST_GROUPS) {
      this.printConfiguredGroup(group, groupedModules);
    }

    const otherModules = groupedModules.get('OTHER');

    if (otherModules?.length) {
      this.printGroup({ name: 'OTHER' }, otherModules);
    }

    this.printSummary(testModules);
  }

  private printConfiguredGroup(
    group: TestGroup,
    groupedModules: ReadonlyMap<string, TestModule[]>,
    depth = 0,
  ): void {
    if (group.children?.length) {
      if (!this.hasModules(group, groupedModules)) {
        return;
      }

      console.log();
      console.log(`${this.indent(depth)}${chalk.bold.cyan(group.name)}`);

      for (const child of group.children) {
        this.printConfiguredGroup(child, groupedModules, depth + 1);
      }

      return;
    }

    const modules = groupedModules.get(group.name);

    if (!modules?.length) {
      return;
    }

    this.printGroup(group, modules, depth);
  }

  private hasModules(group: TestGroup, groupedModules: ReadonlyMap<string, TestModule[]>): boolean {
    if (group.children?.length) {
      return group.children.some((child) => this.hasModules(child, groupedModules));
    }

    return Boolean(groupedModules.get(group.name)?.length);
  }

  private printGroup(group: TestGroup, modules: readonly TestModule[], depth = 0): void {
    console.log();
    console.log(`${this.indent(depth)}${chalk.bold.cyan(group.name)}`);

    const rootNode = this.createSectionNode();

    for (const module of modules) {
      const sectionPath = this.getSectionPath(module.moduleId, group);

      if (!sectionPath.length) {
        rootNode.modules.push(module);
        continue;
      }

      this.addModuleToSectionTree(rootNode, sectionPath, module);
    }

    if (rootNode.modules.length) {
      this.printSortedModules(group, rootNode.modules, depth + 1);
    }

    this.printSectionChildren(rootNode, group, depth + 1);
  }

  private createSectionNode(): SectionNode {
    return {
      modules: [],
      children: new Map(),
    };
  }

  private addModuleToSectionTree(
    rootNode: SectionNode,
    sectionPath: readonly string[],
    module: TestModule,
  ): void {
    let currentNode = rootNode;

    for (const sectionName of sectionPath) {
      let childNode = currentNode.children.get(sectionName);

      if (!childNode) {
        childNode = this.createSectionNode();
        currentNode.children.set(sectionName, childNode);
      }

      currentNode = childNode;
    }

    currentNode.modules.push(module);
  }

  private printSectionChildren(
    node: SectionNode,
    group: TestGroup,
    depth: number,
    parentSectionName?: string,
  ): void {
    const sectionOrder = this.getSectionOrder(group, parentSectionName);

    const sections = [...node.children.entries()].sort(([sectionA], [sectionB]) =>
      this.compareSections(sectionA, sectionB, sectionOrder),
    );

    for (const [sectionName, sectionNode] of sections) {
      console.log();
      console.log(`${this.indent(depth)}${chalk.bold.cyan(sectionName)}`);

      if (sectionNode.modules.length) {
        this.printSortedModules(group, sectionNode.modules, depth + 1);
      }

      this.printSectionChildren(sectionNode, group, depth + 1, sectionName);
    }
  }

  private getSectionOrder(group: TestGroup, parentSectionName?: string): readonly string[] {
    if (!parentSectionName) {
      return group.sectionOrder ?? DEFAULT_SECTION_ORDER;
    }

    return group.nestedSectionOrder?.[parentSectionName.toLowerCase()] ?? DEFAULT_SECTION_ORDER;
  }

  private compareSections(
    sectionA: string,
    sectionB: string,
    sectionOrder: readonly string[],
  ): number {
    const normalizedSectionA = sectionA.toLowerCase();
    const normalizedSectionB = sectionB.toLowerCase();

    const indexA = sectionOrder.indexOf(normalizedSectionA);
    const indexB = sectionOrder.indexOf(normalizedSectionB);

    if (indexA === -1 && indexB === -1) {
      return sectionA.localeCompare(sectionB);
    }

    if (indexA === -1) {
      return 1;
    }

    if (indexB === -1) {
      return -1;
    }

    return indexA - indexB;
  }

  private printSortedModules(
    group: TestGroup,
    modules: readonly TestModule[],
    depth: number,
  ): void {
    const sortedModules = [...modules].sort((a, b) => {
      const depthDifference =
        this.getPathDepth(a.moduleId, group) - this.getPathDepth(b.moduleId, group);

      if (depthDifference !== 0) {
        return depthDifference;
      }

      return a.moduleId.localeCompare(b.moduleId);
    });

    for (const module of sortedModules) {
      this.printModule(module, depth);
    }
  }

  private printModule(module: TestModule, depth: number): void {
    const children = [...module.children];

    for (const child of children) {
      if (child.type === 'suite') {
        this.printSuite(child, depth);
      } else {
        console.log(`${this.indent(depth)}${chalk.white(this.getFileName(module.moduleId))}`);

        this.printTest(child, depth + 1);
      }
    }

    for (const error of module.errors()) {
      console.log();
      console.log(`${this.indent(depth)}${chalk.bold.red('Failure:')}`);
      console.log(`${this.indent(depth + 1)}${chalk.red(error.message)}`);
    }
  }

  private printSuite(suite: TestSuite, depth: number): void {
    const passed = suite.ok();
    const symbol = passed ? chalk.green('✓') : chalk.red('✕');
    const name = passed ? chalk.white(suite.name) : chalk.red(suite.name);

    console.log(`${this.indent(depth)}${symbol} ${name}`);

    for (const child of suite.children) {
      if (child.type === 'suite') {
        this.printSuite(child, depth + 1);
      } else {
        this.printTest(child, depth + 1);
      }
    }
  }

  private printTest(test: TestCase, depth: number): void {
    const result = test.result();
    const duration = test.diagnostic()?.duration;

    console.log(
      `${this.indent(depth)}` +
        `${this.getTestSymbol(result.state)} ` +
        `${this.getTestName(test, result.state)}` +
        `${this.getDuration(duration)}`,
    );
  }

  private printSummary(modules: readonly TestModule[]): void {
    const tests = modules.flatMap((module) => [...module.children.allTests()]);

    const passedTests = tests.filter((test) => test.result().state === 'passed').length;

    const failedTests = tests.filter((test) => test.result().state === 'failed').length;

    const skippedTests = tests.filter((test) => test.result().state === 'skipped').length;

    const passedModules = modules.filter((module) => module.ok()).length;
    const failedModules = modules.length - passedModules;

    const moduleResults = [
      failedModules > 0 && chalk.red(`${failedModules} failed`),
      passedModules > 0 && chalk.green(`${passedModules} passed`),
    ].filter(Boolean);

    const testResults = [
      failedTests > 0 && chalk.red(`${failedTests} failed`),
      passedTests > 0 && chalk.green(`${passedTests} passed`),
      skippedTests > 0 && chalk.yellow(`${skippedTests} skipped`),
    ].filter(Boolean);

    console.log();
    console.log(chalk.gray('─'.repeat(48)));
    console.log();

    console.log(
      `${chalk.bold('Test Files:')} ${moduleResults.join(', ')}, ${modules.length} total`,
    );

    console.log(`${chalk.bold('Tests:')}      ${testResults.join(', ')}, ${tests.length} total`);
  }

  private getSectionPath(path: string, group: TestGroup): string[] {
    if (!group.path || !group.sectionByFolder) {
      return [];
    }

    const relativePath = path.split(group.path)[1];

    if (!relativePath) {
      return [];
    }

    const pathParts = relativePath.split('/').filter(Boolean);

    if (pathParts.length <= 1) {
      return [];
    }

    const folderParts = pathParts.slice(0, -1);
    const [rootFolder] = folderParts;

    if (!rootFolder) {
      return [];
    }

    if (group.nestedSectionRoots?.includes(rootFolder) && folderParts[1]) {
      const sectionPath = [
        this.formatSectionName(rootFolder),
        this.formatSectionName(folderParts[1]),
      ];

      const nestedSection = folderParts.slice(2).find((folder) => this.isSectionFolder(folder));

      if (nestedSection) {
        sectionPath.push(this.formatSectionName(nestedSection));
      }

      return sectionPath;
    }

    return [this.formatSectionName(rootFolder)];
  }

  private isSectionFolder(folderName: string): boolean {
    return DEFAULT_SECTION_ORDER.includes(folderName);
  }

  private formatSectionName(folderName: string): string {
    return folderName.toUpperCase();
  }

  private getLeafGroups(groups: readonly TestGroup[] = TEST_GROUPS): TestGroup[] {
    return groups.flatMap((group) =>
      group.children?.length ? this.getLeafGroups(group.children) : [group],
    );
  }

  private getGroup(path: string): TestGroup {
    return (
      this.getLeafGroups().find((group) =>
        group.matches ? group.matches(path) : path.includes(group.path ?? ''),
      ) ?? { name: 'OTHER' }
    );
  }

  private getPathDepth(path: string, group: TestGroup): number {
    if (!group.path) {
      return 0;
    }

    const relativePath = path.split(group.path)[1];

    return relativePath?.split('/').length ?? Number.MAX_SAFE_INTEGER;
  }

  private getTestSymbol(state: string): string {
    switch (state) {
      case 'passed':
        return chalk.green('✓');

      case 'failed':
        return chalk.red('✕');

      case 'skipped':
        return chalk.yellow('○');

      case 'pending':
        return chalk.gray('?');

      default:
        return chalk.gray('?');
    }
  }

  private getTestName(test: TestCase, state: string): string {
    return state === 'failed' ? chalk.red(test.name) : chalk.white(test.name);
  }

  private getDuration(duration?: number): string {
    if (duration == null) {
      return '';
    }

    return chalk.gray(` (${Math.round(duration)} ms)`);
  }

  private getFileName(path: string): string {
    return path.split('/').at(-1)?.replace('.spec.ts', '') ?? path;
  }

  private indent(depth: number): string {
    return '  '.repeat(depth);
  }

  private groupBy<T>(items: readonly T[], getKey: (item: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();

    for (const item of items) {
      const key = getKey(item);
      const group = groups.get(key);

      if (group) {
        group.push(item);
      } else {
        groups.set(key, [item]);
      }
    }

    return groups;
  }
}

export default GroupedReporter;
