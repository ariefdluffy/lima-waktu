import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => {
  const html = readFileSync(
    join(process.cwd(), "masjid_display_tv_horizontal_template.html"),
    "utf-8"
  );
  return { html };
};
