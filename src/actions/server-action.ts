"use server";
import { actionClient } from "./safe-action";

import { formSchema } from "@/lib/form-schema";
import { logger } from "@/lib/debug";

export const serverAction = actionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput }) => {
    // do something with the data
    logger.debug('Server action called', { parsedInput });
    return {
      success: true,
      message: "Form submitted successfully",
    };
  });
