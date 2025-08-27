import React, { useEffect, useState, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import { GetValidAccessToken } from "./index";

const plans = [
  {
    name: "Pro Monthly",
    price: "₹29 / month",
    description: "Perfect for trying out Pro features with flexibility.",
    features: [
      "Parallel chats (max 3)",
      "AI auto bot reply",
      "Schedule messages",
      "Pinned messages per chat",
      "Export chat history",
      "Extra side panel",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Pro 6 Months",
    price: "₹149 / 6 months (Save ₹25)",
    description: "Best value for consistent users.",
    features: [
      "Parallel chats (max 3)",
      "AI auto bot reply",
      "Schedule messages",
      "Pinned messages per chat",
      "Export chat history",
      "Extra side panel",
    ],
    highlight: false,
  },
];

export default function ProPlans() {
  const [currentUserID, setCurrentUserID] = useState(null);

  useEffect(() => {
    const init = async () => {
      const t = await GetValidAccessToken();

      if (t) {
        try {
          const res = await fetch("http://127.0.0.1:8000/", {
            headers: { Authorization: `Bearer ${t}` },
          });
          if (!res.ok) throw new Error("Unauthorized");
          const data = await res.json();
          setCurrentUserID(data);
        } catch (err) {
          console.error(err);
        }
      }
    };

    init();
  }, []);

  const createOrder = async (user_id, plan) => {
    try {
      const req = await fetch(`http://127.0.0.1:8000/v1/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user_id,
          plan: plan,
        }),
      });

      if (!req.ok) throw new Error("Order creation failed");

      const data = await req.json();
      const order_id = data.order_id;
      const amount = data.amount;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "Chat Hub Pro",
        description: "Upgrade Plan",
        order_id: order_id,
        handler: async function (response) {
          await fetch(`http://127.0.0.1:8000/v1/payment/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              user_id: user_id,
              plan: plan,
            }),
          });
          alert("Payment successful");
        },
        prefill: {
          name: "User Name",
          email: "user@example.com",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1115] via-[#1a1d25] to-[#0f1115] text-white flex flex-col items-center p-8">
      <h1 className="text-4xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Upgrade to Chat-Hub Pro
      </h1>
      <p className="text-gray-400 max-w-2xl text-center mb-12">
        Unlock advanced features to supercharge your productivity and enjoy a smoother chat experience.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-2xl shadow-xl border p-8 backdrop-blur-sm transition transform hover:-translate-y-2 hover:shadow-2xl ${
              plan.highlight ? "border-blue-500 bg-[#1a1d25]/80" : "border-gray-700 bg-[#14171c]/70"
            }`}
          >
            {plan.badge && (
              <span className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-semibold px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}
            <h2 className="text-2xl font-semibold text-center mb-4">{plan.name}</h2>

            <div className="flex flex-col items-center gap-2">
              <p className="text-3xl font-extrabold text-blue-400">{plan.price}</p>
              <p className="text-sm text-gray-400 text-center">{plan.description}</p>
            </div>

            <ul className="w-full mt-6 space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle size={18} className="text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                if (plan.highlight) {
                  createOrder(currentUserID?.id, "monthly");
                } else {
                  createOrder(currentUserID?.id, "6month");
                }
              }}
              className={`w-full mt-8 py-3 px-4 rounded-xl font-semibold transition shadow-md hover:shadow-lg ${
                plan.highlight
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              {plan.highlight ? "Get Started" : "Choose Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
