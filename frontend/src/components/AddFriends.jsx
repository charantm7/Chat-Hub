import React from "react";
import { useState } from "react";
import { useEffect } from "react";

function AddFriends() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch("http://https://a3bde5c1549d.ngrok-free.app/v1/auth/get-users");

        if (!response) {
          throw new Error("Unauthorized ");
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  return (
    <div className="border-1 w-[50%] p-[1rem]">
      <div>
        <input type="search" name="user" id="user" />
      </div>
      <div className="text-black">
        {users.map((user) => (
          <p>{user.name}</p>
        ))}
      </div>
    </div>
  );
}

export default AddFriends;
