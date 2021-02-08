// NOTE: setTimeout and clearTimeout have different interfaces for browsers and Node.js
type TimerId = {};
declare function setTimeout(callback: () => void, ms: number): TimerId;
declare function clearTimeout(timerId: TimerId): void;

export type DebounceOptions<T extends readonly unknown[]> = Readonly<{
  leadingCallback: (args: T, actitve: boolean) => void;
  trailingCallback: (args: T, active: boolean) => void;
  cancelCallback: () => void;
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
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

export class Debounce<T extends readonly unknown[]> {
  private leadingCallback: (args: T, active: boolean) => void;
  private trailingCallback: (args: T, active: boolean) => void;
  private cancelCallback: () => void;
  private wait: number;
  private maxWait: number | undefined;
  private leading: boolean;
  private trailing: boolean;

  private state: DebounceState<T>;
  private isDisposed: boolean;

  constructor(options: DebounceOptions<T>) {
    this.leadingCallback = options.leadingCallback;
    this.trailingCallback = options.trailingCallback;
    this.cancelCallback = options.cancelCallback;
    this.wait = options.wait;
    this.maxWait = options.maxWait;
    this.leading = options.leading ?? false;
    this.trailing = options.trailing ?? true;

    this.state = { type: "standby" };
    this.isDisposed = false;
  }

  trigger(...args: T): void {
    if (this.isDisposed) {
      return;
    }
    // eslint-disable-next-line default-case
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
    }
  }

  flush(): void {
    if (this.isDisposed) {
      return;
    }
    // eslint-disable-next-line default-case
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
    }
  }

  cancel(): void {
    if (this.isDisposed) {
      return;
    }
    // eslint-disable-next-line default-case
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
    }
    const cancelCallback = this.cancelCallback;
    cancelCallback();
  }

  dispose(): void {
    this.isDisposed = true;
    // eslint-disable-next-line default-case
    switch (this.state.type) {
      case "standby":
        break;
      case "waiting": {
        const { timerId, maxWaitTimerId } = this.state;
        clearTimeout(timerId);
        if (maxWaitTimerId !== undefined) {
          clearTimeout(maxWaitTimerId);
        }
        break;
      }
    }
  }
}
