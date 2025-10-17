import React, { useEffect, useState } from "react";
import { CheckCircle, Crown } from "lucide-react";
import { GetValidAccessToken } from "./index";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const plans = {
  monthly: {
    name: "Pro Monthly",
    features: [
      "Parallel chats (max 2)",
      "AI auto bot reply",
      "Schedule messages",
      "Pinned messages per chat",
      "Export chat history",
      "Extra side panel",
    ],
  },
  month6: {
    name: "Pro 6 Months",
    features: [
      "Parallel chats (max 2)",
      "AI auto bot reply",
      "Schedule messages",
      "Pinned messages per chat",
      "Export chat history",
      "Extra side panel",
    ],
  },
};

const upgrade = [
  {
    key: "monthly",
    name: "Pro Monthly",
    price: "₹29 / month",
    description: "Perfect for trying out Pro features with flexibility.",
    features: plans.monthly.features,
    highlight: true,
    badge: "Most Popular",
  },
  {
    key: "month6",
    name: "Pro 6 Months",
    price: "₹149 / 6 months (Save ₹25)",
    description: "Best value for consistent users.",
    features: plans.month6.features,
    highlight: false,
  },
];

export default function ProPlans() {
  const navigate = useNavigate();
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
        body: JSON.stringify({ user_id, plan }),
      });

      if (!req.ok) throw new Error("Order creation failed");

      const data = await req.json();
      const { order_id, amount } = data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "Chat Hub Pro",
        description: "Upgrade Plan",
        order_id,
        handler: async function (response) {
          await fetch(`http://127.0.0.1:8000/v1/payment/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              user_id,
              plan,
            }),
          });
          alert("Payment successful");
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error", err);
    }
  };

  // If already a Pro User
  if (currentUserID?.is_pro === true) {
    const latestPayment = currentUserID?.payments?.[currentUserID.payments.length - 1];
    const planKey = latestPayment?.plan;
    const expiryDate = new Date(latestPayment?.expiry_date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const planData = plans[planKey] || { features: [], name: planKey };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 flex items-center justify-center px-6">
        <button
          onClick={() => navigate(-1)}
          className=" absolute left-5 top-5 cursor-pointer flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl shadow-md hover:bg-gray-700 transition"
        >
          <FaArrowLeft className="text-lg" />
          <span>Back</span>
        </button>
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full p-10 text-center border border-gray-800">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-500/20 rounded-full shadow-lg">
              <Crown className="w-12 h-12 text-yellow-400 drop-shadow-glow" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white">🎉 You’re a Pro User!</h1>
          <p className="text-gray-400 mt-2 text-base">
            Thanks for upgrading. You now have access to all{" "}
            <span className="font-medium text-yellow-400">premium features</span>.
          </p>

          <div className="mt-8 p-5 bg-gradient-to-br from-yellow-500/10 to-yellow-400/5 rounded-2xl border border-yellow-500/30 text-left shadow-inner">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Current Plan
            </h2>
            <p className="text-yellow-300 mt-2 font-medium capitalize">{planData.name}</p>
            <p className="text-gray-300 text-sm mt-1">
              Expiry Date: <span className="font-semibold text-white">{expiryDate}</span>
            </p>

            <ul className="mt-4 space-y-2">
              {planData.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1115] via-[#1a1d25] to-[#0f1115] text-white flex flex-col items-center p-8">
      <button
        onClick={() => navigate(-1)}
        className=" absolute left-5 top-5 cursor-pointer flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl shadow-md hover:bg-gray-700 transition"
      >
        <FaArrowLeft className="text-lg" />
        <span>Back</span>
      </button>
      <h1 className="text-4xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Upgrade to Chat-Hub Pro
      </h1>
      <p className="text-gray-400 max-w-2xl text-center mb-12">
        Unlock advanced features to supercharge your productivity and enjoy a smoother chat experience.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        {upgrade.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-2xl shadow-xl border p-8 backdrop-blur-sm transition transform hover:scale-105 hover:shadow-2xl ${
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
              className={`w-full mt-8 py-3 px-4 rounded-xl font-semibold transition shadow-md hover:shadow-lg cursor-pointer ${
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
