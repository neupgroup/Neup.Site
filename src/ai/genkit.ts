
import {genkit, Flow, type FlowState} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {logErrorToFirestore} from '@/actions/logging';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  telemetry: {
    instrumentation: 'open-telemetry',
    logger: {
      log(span) {
        if (span.status.code !== 'ok') {
          logErrorToFirestore({
            message: `[${span.name}] Flow failed: ${span.status.message}`,
            source: 'genkit-flow',
            details: JSON.stringify(
              {
                name: span.name,
                status: span.status,
                attributes: span.attributes,
                events: span.events,
                __raw_span_obj: span,
              },
              null,
              2
            ),
          });
        }
      },
    },
  },
  flowStateStore: 'firebase',
  traceStore: 'firebase',
});
