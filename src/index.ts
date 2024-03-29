// NOTE: setTimeout and clearTimeout have different interfaces for browsers and Node.js
type TimerId = {};
declare function setTimeout(callback: () => void, ms: number): TimerId;
declare function clearTimeout(timerId: TimerId): void;

export type DebounceOptions<T extends readonly unknown[]> = Readonly<{
  /**
   * The function invoked on the leading edge of timeout, i.e., immediately after the first trigger.
   * It is invoked with active = true if leading = true.
   */
  leadingCallback: (args: T, actitve: boolean) => void;
  /**
   * The function invoked on the trailing edge of timeout, i.e., some time after the last trigger.
   * It is invoked with active = true if trailing = true.
   * When leading = true, however, it is invoked with active = false if there was a only one trigger.
   */
  trailingCallback: (args: T, active: boolean) => void;
  /**
   * The function invoked when the cancel method is called.
   */
  cancelCallback: () => void;
  /**
   * The delay of timeout, in milliseconds.
   */
  wait: number;
  /**
   * The maximum delay of timeout, in milliseconds.
   */
  maxWait?: number | undefined;
  /**
   * Whether to invoke leadingCallback with active = true.
   */
  leading?: boolean | undefined;
  /**
   * Whether to invoke trailingCallback with active = true.
   */
  trailing?: boolean | undefined;
}>;

type DebounceState<T extends readonly unknown[]> =
  | Readonly<{ type: "standby" }>
  | Readonly<{
      type: "waiting";
      timerId: TimerId;
      maxWaitTimerId: TimerId | undefined;
      args: T;
      count: number;
    }>;

/**
 * Debounce provides primitive features for implementing "debounce" function.
 */
export class Debounce<T extends readonly unknown[]> {
  private leadingCallback: (args: T, active: boolean) => void;
  private trailingCallback: (args: T, active: boolean) => void;
  private cancelCallback: () => void;
  private wait: number;
  private maxWait: number | undefined;
  private leading: boolean;
  private trailing: boolean;

  private state: DebounceState<T>;

  constructor(options: DebounceOptions<T>) {
    this.leadingCallback = options.leadingCallback;
    this.trailingCallback = options.trailingCallback;
    this.cancelCallback = options.cancelCallback;
    this.wait = options.wait;
    this.maxWait = options.maxWait;
    this.leading = options.leading ?? false;
    this.trailing = options.trailing ?? true;

    this.state = { type: "standby" };
  }

  /**
   * Triggers debounced invocation.
   */
  trigger(...args: T): void {
    switch (this.state.type) {
      case "standby": {
        const timerId = setTimeout(() => this.flush(), this.wait);
        const maxWaitTimerId =
          this.maxWait !== undefined ? setTimeout(() => this.flush(), this.maxWait) : undefined;
        this.state = { type: "waiting", timerId, maxWaitTimerId, args, count: 1 };
        const leadingCallback = this.leadingCallback;
        leadingCallback(args, this.leading);
        break;
      }
      case "waiting": {
        const { timerId: oldTimerId, maxWaitTimerId, count } = this.state;
        clearTimeout(oldTimerId);
        const timerId = setTimeout(() => this.flush(), this.wait);
        this.state = { type: "waiting", timerId, maxWaitTimerId, args, count: count + 1 };
        break;
      }
      default:
        unreachable(this.state);
    }
  }

  /**
   * Flushes the ongoing debounced invocation, if exists.
   */
  flush(): void {
    switch (this.state.type) {
      case "standby":
        break;
      case "waiting": {
        const { timerId, maxWaitTimerId, args, count } = this.state;
        clearTimeout(timerId);
        if (maxWaitTimerId !== undefined) {
          clearTimeout(maxWaitTimerId);
        }
        this.state = { type: "standby" };
        const trailingCallback = this.trailingCallback;
        trailingCallback(args, this.trailing && !(this.leading && count === 1));
        break;
      }
      default:
        unreachable(this.state);
    }
  }

  /**
   * Cancels the ongoing debounced invocation, if exists.
   */
  cancel(): void {
    switch (this.state.type) {
      case "standby":
        break;
      case "waiting": {
        const { timerId, maxWaitTimerId } = this.state;
        clearTimeout(timerId);
        if (maxWaitTimerId !== undefined) {
          clearTimeout(maxWaitTimerId);
        }
        this.state = { type: "standby" };
        break;
      }
      default:
        unreachable(this.state);
    }
    const cancelCallback = this.cancelCallback;
    cancelCallback();
  }
}

function unreachable(x: never): never {
  throw new Error(`reached: ${JSON.stringify(x)}`);
}
