import { FlexBox } from "../nodes/FlexBox";
import { ContextMenuManager } from "./ContextMenuManager";
import { disposeAllFetchRequests } from "./Fetch";
import { disposeAllFileRequests } from "./File";
import { FocusAdornerManager } from "./FocusAdornerManager";
import { ToolTipManager } from "./ToolTipManager";
import * as ui from "../bindings/ui";
import { flushCommit, markNeedsCommit, resetCommitState } from "./FrameScheduler";
import { HandleValue, Unit } from "./ffi";
import { Node } from "./Node";
import { cancelAllTimers } from "./Timers";
import {
  Theme,
  activeTheme,
  isDarkMode,
  isUsingSystemTheme,
  setAccentColor,
  useCustomTheme,
  useSystemTheme,
} from "./Theme";
import { disposeAllWorkers } from "./Worker";
import { ControlTemplateSet, clearControlTemplates, getControlTemplates, useControlTemplates } from "../controls/ControlTemplateSet";

let mountedRoot: Node | null = null;
let mountedShell: FlexBox | null = null;
let exportedApplication: Application<Node> | null = null;

function createEmptyPage(): Node {
  return new FlexBox().width(100.0, Unit.Percent).height(100.0, Unit.Percent);
}

class ApplicationShell extends FlexBox {
  constructor(root: Node) {
    super();
    this.width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .child(root)
      .child(FocusAdornerManager.createDefaultHost())
      .child(ContextMenuManager.createDefaultMenu())
      .child(ToolTipManager.createDefaultHost());
  }
}

export class ApplicationRegistration {
  private buildPageFn: () => Node = createEmptyPage;
  private useSystemThemeOnRegister: bool = false;
  private customThemeOnRegister: Theme | null = null;
  private accentColorOnRegister: u32 = 0;
  private hasAccentColorOnRegister: bool = false;
  private controlTemplatesOnRegister: ControlTemplateSet | null = null;
  private hasControlTemplatesOnRegister: bool = false;

  page(buildPage: () => Node): this {
    this.buildPageFn = buildPage;
    return this;
  }

  themeSystem(): this {
    this.useSystemThemeOnRegister = true;
    this.customThemeOnRegister = null;
    this.hasAccentColorOnRegister = false;
    return this;
  }

  theme(theme: Theme): this {
    this.useSystemThemeOnRegister = false;
    this.customThemeOnRegister = theme;
    this.hasAccentColorOnRegister = false;
    return this;
  }

  accentColor(color: u32): this {
    this.useSystemThemeOnRegister = false;
    this.customThemeOnRegister = null;
    this.accentColorOnRegister = color;
    this.hasAccentColorOnRegister = true;
    return this;
  }

  controlTemplates(templates: ControlTemplateSet | null): this {
    this.controlTemplatesOnRegister = templates;
    this.hasControlTemplatesOnRegister = true;
    return this;
  }

  register(): Application<Node> {
    const app = createApplication(this.buildPageFn);
    app.useControlTemplates(this.hasControlTemplatesOnRegister ? this.controlTemplatesOnRegister : null);
    if (this.useSystemThemeOnRegister) {
      app.useSystemTheme();
      return app;
    }
    const customTheme = this.customThemeOnRegister;
    if (customTheme !== null) {
      app.useCustomTheme(customTheme);
      return app;
    }
    if (this.hasAccentColorOnRegister) {
      app.setAccentColor(this.accentColorOnRegister);
    }
    return app;
  }
}

export class Application<TPage> {
  private activePage: TPage | null = null;
  private readonly buildPage: () => TPage;
  private readonly getRoot: (page: TPage) => Node;
  private readonly mountPage: ((page: TPage) => void) | null;
  private readonly disposePage: ((page: TPage) => void) | null;

  constructor(
    buildPage: () => TPage,
    getRoot: (page: TPage) => Node,
    mountPage: ((page: TPage) => void) | null,
    disposePage: ((page: TPage) => void) | null,
  ) {
    this.buildPage = buildPage;
    this.getRoot = getRoot;
    this.mountPage = mountPage;
    this.disposePage = disposePage;
  }

  run(): void {
    this.dispose();
    const page = this.buildPage();
    this.activePage = page;
    if (this.mountPage !== null) {
      this.mountPage(page);
      return;
    }
    Application.mount(this.getRoot(page));
  }

  dispose(): void {
    const page = this.activePage;
    if (page === null) {
      return;
    }
    this.activePage = null;
    if (this.disposePage !== null) {
      this.disposePage(page);
      return;
    }
    Application.unmount();
  }

  flushRenders(): void {
    Application.flushRenders();
  }

  getActivePage(): TPage | null {
    return this.activePage;
  }

  useSystemTheme(): Theme {
    return useSystemTheme();
  }

  useCustomTheme(theme: Theme): Theme {
    return useCustomTheme(theme);
  }

  setAccentColor(color: u32): Theme {
    return setAccentColor(color);
  }

  isDarkMode(): bool {
    return isDarkMode();
  }

  isUsingSystemTheme(): bool {
    return isUsingSystemTheme();
  }

  getTheme(): Theme {
    return activeTheme.value;
  }

  useControlTemplates(templates: ControlTemplateSet | null): ControlTemplateSet | null {
    return useControlTemplates(templates);
  }

  clearControlTemplates(): void {
    clearControlTemplates();
  }

  getControlTemplates(): ControlTemplateSet | null {
    return getControlTemplates();
  }

  static mount(root: Node): Node {
    const previousShell = mountedShell;
    if (previousShell !== null) {
      previousShell.dispose();
      mountedShell = null;
      mountedRoot = null;
    }

    cancelAllTimers();
    disposeAllFetchRequests();
    disposeAllFileRequests();
    disposeAllWorkers();
    FocusAdornerManager.clear();
    ToolTipManager.clear();
    resetCommitState();
    ui.reset();
    ui.resizeWindow(ui.getViewportWidth(), ui.getViewportHeight());
    const shell = new ApplicationShell(root);
    shell.build();
    ui.setRoot(shell.builtHandle);
    mountedShell = shell;
    mountedRoot = root;
    markNeedsCommit();
    return root;
  }

  static unmount(): void {
    const previous = mountedShell;
    if (previous === null) {
      return;
    }
    previous.dispose();
    mountedShell = null;
    mountedRoot = null;
    cancelAllTimers();
    disposeAllFetchRequests();
    disposeAllFileRequests();
    disposeAllWorkers();
    FocusAdornerManager.clear();
    ToolTipManager.clear();
    resetCommitState();
  }

  static flushRenders(): void {
    const shell = mountedShell;
    if (shell === null) {
      resetCommitState();
      return;
    }
    if (shell.builtHandle == <u64>HandleValue.Invalid) {
      resetCommitState();
      return;
    }
    flushCommit();
    if (FocusAdornerManager.refreshAfterCommit()) {
      flushCommit();
    }
  }

  static capturePersistedUiState(): void {
    const root = mountedRoot;
    if (root === null) {
      return;
    }
    root._capturePersistedStateTree();
  }

  static restorePersistedUiState(): void {
    const root = mountedRoot;
    if (root === null) {
      return;
    }
    root._restorePersistedStateTree();
  }

  static register(configure: (registration: ApplicationRegistration) => void): Application<Node> {
    const registration = new ApplicationRegistration();
    configure(registration);
    return registration.register();
  }
}

function getNodeRoot(page: Node): Node {
  return page;
}

export function createApplication(buildPage: () => Node): Application<Node> {
  const app = new Application<Node>(buildPage, getNodeRoot, null, null);
  exportedApplication = app;
  return app;
}

export function createManagedApplication<TPage>(
  buildPage: () => TPage,
  getRoot: (page: TPage) => Node,
  mountPage: ((page: TPage) => void) | null,
  disposePage: ((page: TPage) => void) | null,
): Application<TPage> {
  const app = new Application<TPage>(buildPage, getRoot, mountPage, disposePage);
  exportedApplication = changetype<Application<Node>>(app);
  return app;
}

export function __runApp(): void {
  const app = exportedApplication;
  if (app === null) {
    return;
  }
  app.run();
}

export function __disposeApp(): void {
  const app = exportedApplication;
  if (app === null) {
    return;
  }
  app.dispose();
  disposeAllFetchRequests();
  disposeAllWorkers();
}

export function __flushRenders(): void {
  const app = exportedApplication;
  if (app === null) {
    Application.flushRenders();
    return;
  }
  app.flushRenders();
}

export function __fui_capture_persisted_ui_state(): void {
  Application.capturePersistedUiState();
}

export function __fui_restore_persisted_ui_state(): void {
  Application.restorePersistedUiState();
}
