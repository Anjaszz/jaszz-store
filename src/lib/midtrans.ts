declare global {
  interface Window {
    snap: any;
  }
}

export const loadMidtransSnap = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const midtransUrl =
      import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === "true"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

    script.src = midtransUrl;
    script.setAttribute(
      "data-client-key",
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY,
    );
    script.onload = () => resolve(window.snap);
    script.onerror = () =>
      reject(new Error("Midtrans Snap SDK failed to load"));
    document.body.appendChild(script);
  });
};
