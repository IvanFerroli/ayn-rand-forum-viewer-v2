import { BASE_URL } from '../apiConfig';

import React, { useEffect, useState } from "react";

interface UserInfoProps {
  userId: number; // ID do usuário a ser buscado
}

interface UserData {
  real_name: string;
  reputation: number;
  badges: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

const UserInfo: React.FC<UserInfoProps> = ({ userId }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Fetch do endpoint que traz os dados do usuário
        const response = await fetch(`${BASE_URL}/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const data: UserData = await response.json();
        setUserData(data);
      } catch (err) {
        setError("Erro ao carregar os dados do usuário.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;
  if (!userData) return <p>Nenhum dado encontrado.</p>;

  return (
    <div className="user-info">
      <h3>{userData.real_name}</h3>
      <p>Reputation: {userData.reputation}</p>
      <div>
        <span>🏅 {userData.badges.gold} Gold</span>{" "}
        <span>🥈 {userData.badges.silver} Silver</span>{" "}
        <span>🥉 {userData.badges.bronze} Bronze</span>
      </div>
    </div>
  );
};

export default UserInfo;
