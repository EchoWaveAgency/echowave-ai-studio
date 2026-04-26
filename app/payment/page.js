export default function PaymentPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 space-y-6">
      <h1 className="text-3xl font-heading text-gold">Payment</h1>
      <form action="/api/create-checkout-session" method="post"><button className="bg-gold text-black px-4 py-2 rounded">Stripe Checkout</button></form>
      <div className="glass rounded-xl p-4">PayPal: استخدم NEXT_PUBLIC_PAYPAL_BUTTON_ID لعرض زر مستضاف.</div>
      <div className="glass rounded-xl p-4">InstaPay: alaahassanin2025 / amrellaban_83</div>
      <div className="glass rounded-xl p-4">محفظة إلكترونية: 01144408455</div>
    </main>
  );
}
