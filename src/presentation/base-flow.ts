import { Context } from 'grammy';

interface StepHandler {
  prompt: string; // The message to send to the user
  validate?: (input: string) => boolean; // Optional validation function
  process?: (state: any, input: string) => void; // Optional processing logic
  skip?: (state: any) => boolean | Promise<boolean>; // Optional function to determine if the step should be skipped
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
  ctx.reply(flow.steps[0].prompt);
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

  // Move to the next step, skipping steps if necessary
  do {
    userState.stepIndex++;
    step = flow.steps[userState.stepIndex];
  } while (step?.skip && (await step.skip(state))); // Skip steps where `skip` returns true

  // Prompt for the next step or finalize
  if (userState.stepIndex < flow.steps.length) {
    await ctx.reply(step.prompt);
  } else {
    await flow.finalize(ctx, state);
    // userStates.delete(userId);
  }
};
