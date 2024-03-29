import type { Mock } from "vitest";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import { Debounce } from ".";

describe("Debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const createMockCallbacks = (): {
    leadingCallback: Mock<[[string], boolean], void>;
    trailingCallback: Mock<[[string], boolean], void>;
    cancelCallback: Mock<[], void>;
  } => ({
    leadingCallback: vi.fn<[[string], boolean], void>(() => {}),
    trailingCallback: vi.fn<[[string], boolean], void>(() => {}),
    cancelCallback: vi.fn<[], void>(() => {}),
  });

  it("should invoke the leading and trailing callbacks on the respective edges of timeout", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
    });
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.trigger("foo");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], false);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    d.trigger("bar");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    d.trigger("baz");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["baz"], true);
  });

  it("should flush waiting timeout after maxWait", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
      maxWait: 1500,
    });
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.trigger("foo");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    d.trigger("bar");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    d.trigger("baz");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["baz"], true);
  });

  it("should invoke the leading callback with active = true when leading = true", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
      leading: true,
    });
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.trigger("foo");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], true);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    d.trigger("bar");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    d.trigger("baz");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["baz"], true);
  });

  it("should invoke the trailing callback with active = false when trailing = false", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
      trailing: false,
    });
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.trigger("foo");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], false);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    d.trigger("bar");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    d.trigger("baz");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["baz"], false);
  });

  it("should invoke the trailing callback with active = false when trailing = true but leading = true and triggered only once", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
      leading: true,
    });
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.trigger("foo");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], true);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], false);
  });

  describe("#flush", () => {
    it("should flush the waiting invocations", () => {
      const callbacks = createMockCallbacks();
      const d = new Debounce({
        ...callbacks,
        wait: 1000,
      });
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      d.trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], false);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      d.trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      d.flush();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["bar"], true);
    });

    it("should do nothing if there is no waiting invocation", () => {
      const callbacks = createMockCallbacks();
      const d = new Debounce({
        ...callbacks,
        wait: 1000,
      });
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      d.flush();
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      d.trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], false);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], true);
    });
  });

  describe("#cancel", () => {
    it("should cancel the waiting invocations", () => {
      const callbacks = createMockCallbacks();
      const d = new Debounce({
        ...callbacks,
        wait: 1000,
      });
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      d.trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], false);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      d.trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      d.cancel();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);
    });

    it("should cancel the waiting invocations with maxWait", () => {
      const callbacks = createMockCallbacks();
      const d = new Debounce({
        ...callbacks,
        wait: 1000,
        maxWait: 1500,
      });
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      d.trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], false);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      d.trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      d.trigger("baz");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      d.cancel();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);
    });

    it("should do nothing if there is no waiting invocation", () => {
      const callbacks = createMockCallbacks();
      const d = new Debounce({
        ...callbacks,
        wait: 1000,
      });
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      d.cancel();
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      d.trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"], false);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], true);
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);
    });
  });
});
