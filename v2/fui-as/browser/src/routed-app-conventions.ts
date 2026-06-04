export class RoutedAppHeadTag {
  kind: string;
  name: string;
  content: string;

  constructor(kind: string = "", name: string = "", content: string = "") {
    this.kind = kind;
    this.name = name;
    this.content = content;
  }
}

export class RoutedAppRoute {
  key: string;
  title: string;
  headTags: Array<RoutedAppHeadTag>;
  entrypoint: string;
  wasmFile: string;
  shellDir: string;
  sourceRoutePath: string;
  publishedRoutePath: string;

  constructor(
    key: string = "",
    title: string = "",
    headTags: Array<RoutedAppHeadTag> = new Array<RoutedAppHeadTag>(),
    entrypoint: string = "",
    wasmFile: string = "",
    shellDir: string = "",
    sourceRoutePath: string = "",
    publishedRoutePath: string = "",
  ) {
    this.key = key;
    this.title = title;
    this.headTags = headTags;
    this.entrypoint = entrypoint;
    this.wasmFile = wasmFile;
    this.shellDir = shellDir;
    this.sourceRoutePath = sourceRoutePath;
    this.publishedRoutePath = publishedRoutePath;
  }
}

export class RoutedAppRouteManifest {
  sourceRouteBase: string;
  routes: Array<RoutedAppRoute>;

  constructor(sourceRouteBase: string = "", routes: Array<RoutedAppRoute> = new Array<RoutedAppRoute>()) {
    this.sourceRouteBase = sourceRouteBase;
    this.routes = routes;
  }
}

export class ResolvedRoutedAppRoute {
  key: string;
  title: string;
  headTags: Array<RoutedAppHeadTag>;
  shellDir: string;
  wasmFile: string;
  entrypoint: string;
  sourceRoutePath: string;
  publishedRoutePath: string;

  constructor(
    key: string = "",
    title: string = "",
    headTags: Array<RoutedAppHeadTag> = new Array<RoutedAppHeadTag>(),
    shellDir: string = "",
    wasmFile: string = "",
    entrypoint: string = "",
    sourceRoutePath: string = "",
    publishedRoutePath: string = "",
  ) {
    this.key = key;
    this.title = title;
    this.headTags = headTags;
    this.shellDir = shellDir;
    this.wasmFile = wasmFile;
    this.entrypoint = entrypoint;
    this.sourceRoutePath = sourceRoutePath;
    this.publishedRoutePath = publishedRoutePath;
  }
}

export class ResolvedRoutedAppRouteManifest {
  sourceRouteBase: string;
  routes: Array<ResolvedRoutedAppRoute>;

  constructor(sourceRouteBase: string = "", routes: Array<ResolvedRoutedAppRoute> = new Array<ResolvedRoutedAppRoute>()) {
    this.sourceRouteBase = sourceRouteBase;
    this.routes = routes;
  }
}

export class RoutedHarnessRouteSpec {
  routePath: string;
  wasmPath: string;
  title: string;

  constructor(routePath: string = "", wasmPath: string = "", title: string = "") {
    this.routePath = routePath;
    this.wasmPath = wasmPath;
    this.title = title;
  }
}

export class RoutedAppRouteDefinition {
  key: string;
  title: string;
  entrypoint: string;
  wasmFile: string;
  shellDir: string;
  sourceRoutePath: string;
  publishedRoutePath: string;

  constructor(
    key: string = "",
    title: string = "",
    entrypoint: string = "",
    wasmFile: string = "",
    shellDir: string = "",
    sourceRoutePath: string = "",
    publishedRoutePath: string = "",
  ) {
    this.key = key;
    this.title = title;
    this.entrypoint = entrypoint;
    this.wasmFile = wasmFile;
    this.shellDir = shellDir;
    this.sourceRoutePath = sourceRoutePath;
    this.publishedRoutePath = publishedRoutePath;
  }
}

function trimSlashes(path: string): string {
  let normalized = path;
  while (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }
  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function normalizeRouteBase(path: string): string {
  const trimmed = trimSlashes(path);
  return trimmed.length === 0 ? "" : `/${trimmed}`;
}

function toPascalCase(value: string): string {
  let result = "";
  let capitalizeNext = true;
  const normalized = trimSlashes(value);
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized.charAt(index);
    const code = char.charCodeAt(0);
    const isAlphaNum =
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122);
    if (!isAlphaNum) {
      capitalizeNext = true;
      continue;
    }
    result += capitalizeNext ? char.toUpperCase() : char;
    capitalizeNext = false;
  }
  return result;
}

export function routeDef(
  key: string,
  title: string,
  headTags: Array<RoutedAppHeadTag> = new Array<RoutedAppHeadTag>(),
  entrypoint: string = "",
  wasmFile: string = "",
  shellDir: string = "",
  sourceRoutePath: string = "",
  publishedRoutePath: string = "",
): RoutedAppRoute {
  return new RoutedAppRoute(key, title, headTags, entrypoint, wasmFile, shellDir, sourceRoutePath, publishedRoutePath);
}

export function defineRoutedAppManifest(
  sourceRouteBase: string,
  routes: Array<RoutedAppRoute>,
): RoutedAppRouteManifest {
  const normalizedBase = normalizeRouteBase(sourceRouteBase);
  const normalizedRoutes = new Array<RoutedAppRoute>();
  for (let index = 0; index < routes.length; index += 1) {
    const route = routes[index];
    const routeKey = trimSlashes(route.key);
    const entrypoint = route.entrypoint == null || route.entrypoint.length == 0 ? `src/routes/${toPascalCase(routeKey)}App.ts` : route.entrypoint;
    const wasmFile = route.wasmFile == null || route.wasmFile.length == 0 ? `${routeKey}.wasm` : route.wasmFile;
    const shellDir = route.shellDir == null || route.shellDir.length == 0 ? routeKey : route.shellDir;
    const sourceRoutePath = route.sourceRoutePath == null || route.sourceRoutePath.length == 0 ? `${normalizedBase}/${routeKey}/` : route.sourceRoutePath;
    const publishedRoutePath = route.publishedRoutePath == null || route.publishedRoutePath.length == 0 ? `/${routeKey}/` : route.publishedRoutePath;
    normalizedRoutes.push(new RoutedAppRoute(routeKey, route.title, route.headTags, entrypoint, wasmFile, shellDir, sourceRoutePath, publishedRoutePath));
  }
  return new RoutedAppRouteManifest(normalizedBase, normalizedRoutes);
}

export function resolveRouteManifest(manifest: RoutedAppRouteManifest): ResolvedRoutedAppRouteManifest {
  const routes = new Array<ResolvedRoutedAppRoute>();
  for (let index = 0; index < manifest.routes.length; index += 1) {
    const route = manifest.routes[index];
    const routeKey = trimSlashes(route.key);
    routes.push(
      new ResolvedRoutedAppRoute(
        routeKey,
        route.title,
        route.headTags,
        routeKey.length == 0 ? "" : routeKey,
        `${routeKey}.wasm`,
        `src/routes/${toPascalCase(routeKey)}App.ts`,
        `${manifest.sourceRouteBase}/${routeKey}/`,
        `/${routeKey}/`,
      ),
    );
  }
  return new ResolvedRoutedAppRouteManifest(manifest.sourceRouteBase, routes);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pushHeadTag(tags: Array<string>, headTag: RoutedAppHeadTag): void {
  if (headTag.content.length == 0 || headTag.name.length == 0) {
    return;
  }
  const attribute = headTag.kind == "property" ? "property" : "name";
  tags.push(`    <meta ${attribute}="${escapeHtml(headTag.name)}" content="${escapeHtml(headTag.content)}" />`);
}

export function routeHead(...entries: Array<string>): Array<RoutedAppHeadTag> {
  const headTags = new Array<RoutedAppHeadTag>();
  for (let index = 0; index + 1 < entries.length; index += 2) {
    const name = entries[index];
    const content = entries[index + 1];
    const kind = name.startsWith("og:") || name.startsWith("fb:") ? "property" : "name";
    headTags.push(new RoutedAppHeadTag(kind, name, content));
  }
  return headTags;
}

export function renderRoutedPageHead(title: string, headTags: Array<RoutedAppHeadTag> = new Array<RoutedAppHeadTag>()): string {
  const tags = new Array<string>();
  const effectiveTitle = title.length == 0 ? "FUI-AS" : title;
  tags.push(`    <title>${escapeHtml(effectiveTitle)}</title>`);
  for (let index = 0; index < headTags.length; index += 1) {
    pushHeadTag(tags, headTags[index]);
  }
  return tags.join("\n");
}

export function buildRoutedHarnessRoutes(
  manifest: RoutedAppRouteManifest,
  pathname: string,
): Array<RoutedHarnessRouteSpec> {
  const resolvedManifest = resolveRouteManifest(manifest);
  const routePrefix = pathname.startsWith(`${resolvedManifest.sourceRouteBase}/`) ? resolvedManifest.sourceRouteBase : "";
  const routes = new Array<RoutedHarnessRouteSpec>();
  for (let index = 0; index < resolvedManifest.routes.length; index += 1) {
    const route = resolvedManifest.routes[index];
    routes.push(
      new RoutedHarnessRouteSpec(
        `${routePrefix}${route.publishedRoutePath}`,
        `${routePrefix}/${route.wasmFile}`.replace("//", "/"),
        route.title,
      ),
    );
  }
  return routes;
}

export function resolveRoutePath(manifest: RoutedAppRouteManifest, routeKey: string, currentRoutePath: string): string {
  const resolvedManifest = resolveRouteManifest(manifest);
  const isSourceRoute = currentRoutePath.length == 0 || currentRoutePath.startsWith(`${resolvedManifest.sourceRouteBase}/`);
  for (let index = 0; index < resolvedManifest.routes.length; index += 1) {
    const route = resolvedManifest.routes[index];
    if (route.key == routeKey) {
      return isSourceRoute ? route.sourceRoutePath : route.publishedRoutePath;
    }
  }
  return "";
}
