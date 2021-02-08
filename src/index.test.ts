import { Debounce } from ".";

describe("Debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const createMockCallbacks = (): {
    leadingCallback: jest.Mock<void, [[string]]>;
    trailingCallback: jest.Mock<void, [[string], number]>;
    cancelCallback: jest.Mock<void, []>;
  } => ({
    leadingCallback: jest.fn<void, [[string]]>(() => {}),
    trailingCallback: jest.fn<void, [[string], number]>(() => {}),
    cancelCallback: jest.fn<void, []>(() => {}),
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
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    d.trigger("bar");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    d.trigger("baz");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["baz"], 3);
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

    jest.advanceTimersByTime(500);
    d.trigger("bar");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    d.trigger("baz");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["baz"], 3);
  });

  it("should count the number of triggers", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
    });
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.trigger("foo");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], 1);

    d.trigger("bar");
    d.trigger("baz");
    d.trigger("qux");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(2);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["bar"]);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(2);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(2);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["qux"], 3);
  });

  it("should not invoke the leading callback after it is disposed", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
    });
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();

    d.dispose();

    d.trigger("foo");
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
  });

  it("should not invoke the trailing callback after it is disposed", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
    });
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.trigger("foo");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.dispose();

    jest.advanceTimersByTime(1000);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();
  });

  it("should not invoke the trailing callback with maxWait after it is disposed", () => {
    const callbacks = createMockCallbacks();
    const d = new Debounce({
      ...callbacks,
      wait: 1000,
      maxWait: 1500,
    });
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.trigger("foo");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    d.trigger("bar");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    d.trigger("baz");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    d.dispose();

    jest.advanceTimersByTime(500);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();
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
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      d.trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      d.flush();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["bar"], 2);
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
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], 1);
    });

    it("should do nothing if it has been disposed", () => {
      const callbacks = createMockCallbacks();
      const d = new Debounce({
        ...callbacks,
        wait: 1000,
      });
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      d.trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      d.dispose();

      d.flush();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
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
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      d.trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      d.cancel();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
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
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      d.trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      d.trigger("baz");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      d.cancel();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
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
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], 1);
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);
    });

    it("should do nothing if it has been disposed", () => {
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
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      d.dispose();

      d.cancel();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();
    });
  });
});
