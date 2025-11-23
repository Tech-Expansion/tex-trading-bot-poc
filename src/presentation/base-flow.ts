import { Context, InlineKeyboard } from 'grammy';

interface StepHandler {
  prompt: string; // The message to send to the user
  keyboard?: InlineKeyboard; // Optional inline keyboard for buttons
  validate?: (input: string) => boolean; // Optional validation function
  process?: (state: any, input: string) => void; // Optional processing logic
  skip?: (state: any) => boolean | Promise<boolean>; // Optional function to determine if the step should be skipped
  jumpToStep?: (state: any, input: string) => number | null; // Optional function to jump to a specific step
}

export interface CommandFlow {
  steps: StepHandler[];
  finalize: (ctx: Context, state: any) => Promise<void>; // Finalization logic
}

const userStates = new Map<number, { stepIndex: number; state: any; flow: CommandFlow }>();

export const startFlow = (ctx: Context, flow: CommandFlow) => {
  const userId = ctx.from!.id;

  if (!flow.steps || flow.steps.length === 0) {
    flow.finalize(ctx, {});
    return;
  }

  userStates.set(userId, { stepIndex: 0, state: {}, flow });
  
  const firstStep = flow.steps[0];
  if (firstStep.keyboard) {
    ctx.reply(firstStep.prompt, { reply_markup: firstStep.keyboard });
  } else {
    ctx.reply(firstStep.prompt);
  }
};

export const handleFlowInput = async (ctx: Context) => {
  const userId = ctx.from!.id;
  const userState = userStates.get(userId);

  if (!userState) {
    await ctx.reply('Please start a command first.');
    return;
  }

  const { stepIndex, state, flow } = userState;

  let step = flow.steps[stepIndex];
  const input = ctx.message?.text?.trim();

  if (!input) {
    await ctx.reply('Invalid input. Please try again.');
    return;
  }

  // Validate input if a validation function is provided
  if (!step || (step.validate && !step.validate(input))) {
    await ctx.reply('Invalid input. Please try again.');
    return;
  }

  // Process input if a processing function is provided
  if (step.process) {
    step.process(state, input);
  }

  // Check if we need to jump to a specific step
  if (step.jumpToStep) {
    const jumpIndex = step.jumpToStep(state, input);
    if (jumpIndex !== null && jumpIndex >= 0 && jumpIndex < flow.steps.length) {
      userState.stepIndex = jumpIndex;
      const jumpStep = flow.steps[jumpIndex];
      
      // Show error message when jumping back due to validation failure
      if (jumpIndex < stepIndex) {
        await ctx.reply('❌ Passwords do not match. Please try again.');
      }
      
      if (jumpStep.keyboard) {
        await ctx.reply(jumpStep.prompt, { reply_markup: jumpStep.keyboard });
      } else {
        await ctx.reply(jumpStep.prompt);
      }
      return;
    }
  }

  // Move to the next step, skipping steps if necessary
  do {
    userState.stepIndex++;
    step = flow.steps[userState.stepIndex];
  } while (step?.skip && (await step.skip(state))); // Skip steps where `skip` returns true

  // Prompt for the next step or finalize
  if (userState.stepIndex < flow.steps.length) {
    if (step.keyboard) {
      await ctx.reply(step.prompt, { reply_markup: step.keyboard });
    } else {
      await ctx.reply(step.prompt);
    }
  } else {
    await flow.finalize(ctx, state);
    // userStates.delete(userId);
  }
};

export const handleFlowCallback = async (ctx: Context) => {
  const userId = ctx.from!.id;
  const userState = userStates.get(userId);

  if (!userState || !ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
    return;
  }

  const { stepIndex, state, flow } = userState;
  const callbackData = ctx.callbackQuery.data;

  let step = flow.steps[stepIndex];

  if (!step) {
    await ctx.answerCallbackQuery();
    return;
  }

  // Process callback data if a processing function is provided
  if (step.process) {
    step.process(state, callbackData || '');
  }

  // Check if we need to jump to a specific step
  if (step.jumpToStep) {
    const jumpIndex = step.jumpToStep(state, callbackData || '');
    if (jumpIndex !== null && jumpIndex >= 0 && jumpIndex < flow.steps.length) {
      userState.stepIndex = jumpIndex;
      const jumpStep = flow.steps[jumpIndex];
      
      // Show error message when jumping back due to validation failure
      if (jumpIndex < stepIndex) {
        await ctx.reply('❌ Passwords do not match. Please try again.');
      }
      
      if (jumpStep.keyboard) {
        await ctx.reply(jumpStep.prompt, { reply_markup: jumpStep.keyboard });
      } else {
        await ctx.reply(jumpStep.prompt);
      }
      await ctx.answerCallbackQuery();
      return;
    }
  }

  // Move to the next step, skipping steps if necessary
  do {
    userState.stepIndex++;
    step = flow.steps[userState.stepIndex];
  } while (step?.skip && (await step.skip(state))); // Skip steps where `skip` returns true

  // Prompt for the next step or finalize
  if (userState.stepIndex < flow.steps.length) {
    if (step.keyboard) {
      await ctx.reply(step.prompt, { reply_markup: step.keyboard });
    } else {
      await ctx.reply(step.prompt);
    }
  } else {
    await flow.finalize(ctx, state);
    // userStates.delete(userId);
  }

  await ctx.answerCallbackQuery();
};

export const clearUserState = (userId: number) => {
  userStates.delete(userId);
};
