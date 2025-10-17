import React from "react";
import ChatList from "./ChatList";
import ChatArea from "./ChatArea";
import { useState, useEffect } from "react";
import profileBg from "../assets/profile.jpg";
import { GetValidAccessToken } from "./index";
import { CheckCircle, BadgeCheck } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

function Main({ selectedModal, onSelect }) {
  const [selectedUser, setSelectedUser] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  console.log(selectedUser);
  function handleOverlayClick(e) {
    if (e.target.id === "overlay") {
      onSelect([]);
    }
  }

  const [form, setForm] = useState({
    name: "",
    first_name: "",
    last_name: "",
    d_o_b: "",
    about: "",
  });
  console.log(form);
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    const token = await GetValidAccessToken();
    e.preventDefault();

    const updatedForm = Object.fromEntries(
      Object.entries({
        ...currentUser,
        ...form,
      }).map(([Key, value]) => [Key, value === "" ? null : value])
    );
    try {
      const res = await fetch("http://127.0.0.1:8000/v1/auth/update/my/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedForm),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      console.log(data);

      setCurrentUser(data);
      setForm(data);
      onSelect("account");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    async function get_current_user() {
      const token = await GetValidAccessToken();
      try {
        const res = await fetch("http://127.0.0.1:8000/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unable to fetch the current user");

        const data = await res.json();

        setCurrentUser(data);
      } catch (error) {
        console.log(error);
      }
    }

    get_current_user();
  }, []);

  function setOnselectUser(chat) {
    setSelectedUser((prev) => {
      if (!prev) return [chat];

      if (currentUser?.is_pro) {
        // Already selected → move it to the end (so it becomes the "active" chat)
        if (prev.find((c) => c.chat_id === chat.chat_id)) {
          return [...prev.filter((c) => c.chat_id !== chat.chat_id), chat];
        }

        // Limit 2 → drop the oldest and add new
        if (prev.length >= 2) {
          return [prev[1], chat];
        }
        // Normal add
        return [...prev, chat];
      } else {
        return [chat];
      }
    });
  }
  function onCancleSelect(chat_id) {
    if (!chat_id) return;
    console.log(chat_id);
    setSelectedUser((prev) => {
      if (selectedUser.find((c) => c.chat_id === chat_id)) {
        return [...prev.filter((c) => c.chat_id !== chat_id)];
      }
    });
  }

  return (
    <main className="border border-[var(--border)] bg-[#0104099e] h-[90.5vh] rounded-b-lg flex overflow-hidden">
      <ChatList onSelect={setOnselectUser} selectedUser={selectedUser} />
      <ChatArea users={selectedUser} onCancleSelect={onCancleSelect} />
      {selectedModal == "account" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex items-center justify-center z-50"
        >
          <div className="bg-[#ffffffd0] border border-black/10 h-[62%] w-[50%] rounded-2xl overflow-hidden">
            <div className="w-full">
              <img src={profileBg} alt="...." className="h-[10rem] w-full object-cover" />
            </div>
            <div
              className={` ${
                currentUser?.is_pro
                  ? "rounded-[50%]  border-4 flex items-center justify-center border-yellow-400"
                  : ""
              } top-[37%] ml-[40px] absolute`}
            >
              <img src={currentUser.picture} alt="..." className=" p-1  rounded-[50%]" />
            </div>
            <div className="h-[100%] p-[1rem] flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-xl ml-35">{currentUser.name}</p>
                  <FontAwesomeIcon
                    onClick={() => onSelect("update_profile")}
                    className="cursor-pointer"
                    title="Edit"
                    icon={faPenToSquare}
                  />
                </div>
                <div className="flex flex-col items-end gap-3">
                  <p className="flex items-center gap-2">
                    {currentUser.email}
                    {currentUser.is_verified == true ? (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    ) : (
                      <BadgeCheck className="h-5 w-5 text-blue-500 inline-block ml-1" />
                    )}
                  </p>
                  {currentUser?.is_pro ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white text-sm font-semibold tracking-wide shadow-md ring-1 ring-yellow-500/40">
                      🌟 Premium
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold tracking-wide shadow-sm ring-1 ring-gray-300">
                      Free Plan
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-7">
                <div className="w-[40%] mt-10 h-full flex flex-col gap-[1rem]">
                  <p className="border-b-3 w-[3.1rem] ">Details</p>
                  <p className="pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]">
                    First name: {currentUser.first_name}
                  </p>
                  <p className="pt-1 pb-1 pl-3 rounded-md bg-[#b7b7b7b3]">
                    Last name: {currentUser.last_name}
                  </p>
                  <p className="pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]">
                    Date of birth: {currentUser.date_of_birth}
                  </p>
                </div>
                <div className="w-[60%] mt-10 h-full flex flex-col pb-10 gap-[1rem]">
                  <p className="border-b-3 w-[2.7rem] ">About</p>
                  <p className="pt-1 pb-1 pl-3 h-full rounded-md bg-[#b7b7b7b3]"> {currentUser.about}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedModal == "update_profile" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex items-center justify-center z-50"
        >
          <div className="bg-[#ffffffd0] border border-black/10 h-[65%] w-[50%] rounded-2xl overflow-hidden">
            <div className="w-full">
              <img src={profileBg} alt="...." className="h-[10rem] w-full object-cover" />
            </div>
            <img src={currentUser.picture} alt="..." className="absolute top-[34%] ml-[40px] rounded-[50%]" />
            <form onSubmit={handleSubmit} className="h-[100%] p-[1rem] flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className=" text-[18px] ml-35 pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]"
                    placeholder="name*"
                  />
                </div>
                <p className="flex items-center gap-2">
                  {currentUser.email}
                  {currentUser.is_verified == true ? (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  ) : (
                    <BadgeCheck className="h-5 w-5 text-blue-500 inline-block ml-1" />
                  )}
                </p>
              </div>
              <div className="flex gap-7">
                <div className="w-[40%] mt-10 h-full flex flex-col gap-[1rem]">
                  <p className="border-b-3 w-[3.1rem] ">Details*</p>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]"
                    placeholder="first name*"
                  />
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="pt-1 pb-1 pl-3 rounded-md bg-[#b7b7b7b3]"
                    placeholder="last name*"
                  />

                  <input
                    type="date"
                    name="d_o_b"
                    value={form.d_o_b}
                    onChange={handleChange}
                    className="pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]"
                    placeholder="date of birth*"
                  />
                </div>
                <div className="w-[60%] mt-10 h-full flex flex-col pb-10 gap-[1rem]">
                  <p className="border-b-3 w-[2.7rem] ">About*</p>
                  <textarea
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    className="pt-1 pb-1 pl-3 h-full rounded-md bg-[#b7b7b7b3]"
                    placeholder="Write something about your self"
                  />
                </div>
              </div>

              <button
                type="submit"
                className=" mt-5 w-[19%] bg-blue-600 h-8 rounded-md text-white cursor-pointer hover:bg-blue-700"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Main;
