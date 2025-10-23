import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoClose } from '@/hooks/useAutoClose';

describe('useAutoClose', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('вызывает onClose через указанное время', () => {
    const onClose = vi.fn();
    
    renderHook(() => useAutoClose(true, onClose, 3000));
    
    expect(onClose).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(3000);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('не вызывает onClose если isOpen = false', () => {
    const onClose = vi.fn();
    
    renderHook(() => useAutoClose(false, onClose, 3000));
    
    vi.advanceTimersByTime(3000);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('очищает таймер при размонтировании', () => {
    const onClose = vi.fn();
    
    const { unmount } = renderHook(() => useAutoClose(true, onClose, 3000));
    
    unmount();
    vi.advanceTimersByTime(3000);
    
    expect(onClose).not.toHaveBeenCalled();
  });
});
