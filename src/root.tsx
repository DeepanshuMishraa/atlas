import { createRoot } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import { App } from ".";


const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);

