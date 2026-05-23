export type ToastType = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  message: string;
  type: ToastType;
};

let listeners: Array<(toasts: ToastMessage[]) => void> = [];
let toasts: ToastMessage[] = [];
let nextId = 1;

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

export function showToast(message: string, type: ToastType = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();

  // Auto-dismiss after 4 detik
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function subscribe(fn: (toasts: ToastMessage[]) => void) {
  listeners.push(fn);
  fn([...toasts]); // kirim state awal
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
