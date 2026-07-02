export {};

declare global {
  interface IdleDeadline {
    readonly didTimeout: boolean;
    timeRemaining: () => number;
  }

  type IdleRequestCallback = (deadline: IdleDeadline) => void;

  interface IdleRequestOptions {
    timeout?: number;
  }

  var requestIdleCallback:
    | ((callback: IdleRequestCallback, options?: IdleRequestOptions) => number)
    | undefined;

  var cancelIdleCallback: ((handle: number) => void) | undefined;
}
