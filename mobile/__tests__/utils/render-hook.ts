import React from "react";
import { create, act } from "react-test-renderer";

export function renderHook<T>(hookFn: () => T) {
  const result = { current: null as unknown as T };

  function TestComponent() {
    result.current = hookFn();
    return null;
  }

  let renderer: ReturnType<typeof create>;

  act(() => {
    renderer = create(React.createElement(TestComponent));
  });

  async function rerender() {
    await act(async () => {
      renderer.update(React.createElement(TestComponent));
    });
  }

  return { result, rerender };
}

export { act };
