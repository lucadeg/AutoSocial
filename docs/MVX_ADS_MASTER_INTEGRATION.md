# MVX Ads Master integration

Within MVX Ads Master, this fork is exposed as **MVX Social** and owns social distribution queues, schedulers and platform runners.

`src/mvx-queue-bridge.js` is the controlled workflow handoff. It accepts an existing local video, a supported platform, optional account, caption and workflow identifiers; copies the file into the real account/platform `pending` queue; writes the caption sidecar; and returns SHA-256 evidence.

The handoff result is deliberately `published: false`. Queue insertion and `run-once` requests are not treated as publication proof. Publication/performance evidence must be reconciled from observed provider/platform data in MVX Ads Master.

The original AutoSocial attribution and MIT license remain intact.
