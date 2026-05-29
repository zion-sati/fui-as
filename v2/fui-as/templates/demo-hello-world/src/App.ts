import { Application } from "./fui/Fui";
export * from "./fui/FuiExports";
export * from "./host/generated/HostEvents";

import { createHelloWorldPage } from "./HelloWorld";

Application.register((app) => app.page(createHelloWorldPage));
