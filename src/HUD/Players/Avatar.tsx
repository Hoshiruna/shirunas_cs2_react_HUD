import React, { useState, useEffect } from "react";
import { Skull, playerCT, playerT } from "../../assets/Icons";
import axios from "axios";

interface AvatarProps {
  steamid: string;
  teamId?: string | null;
  slot?: number;
  height?: number;
  width?: number;
  showSkull?: boolean;
  showCam?: boolean;
  sidePlayer?: boolean;
  teamSide?: string;
  flashed?: number | undefined;
  avatarUrl?: string | null;
}

const getAvatar = async (steamid: string) => {
  try {
    const player = await axios.get(
      `http://localhost:1349/api/players/avatar/steamid/${steamid}`,
    );
    if (player.data.custom) {
      return player.data.custom;
    }
    return null;
  } catch (error) {
    console.error("Error fetching avatar:", error);
    // Implement fallback logic (e.g., return default avatar URL)
  }
};

const Avatar = ({
  steamid,
  teamId,
  slot,
  height,
  width,
  showSkull,
  showCam,
  sidePlayer,
  teamSide,
  flashed,
  avatarUrl,
}: AvatarProps) => {
  const flashValue = flashed ? (flashed < 100 ? 100 : flashed * 2) : 100;
  const defaultPic = teamSide === "CT" ? playerCT : playerT;
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (avatarUrl) {
      setAvatar(avatarUrl);
      return;
    }

    setAvatar(null);

    const fetchAvatar = async () => {
      try {
        const avatarUrl = await getAvatar(steamid);
        setAvatar(avatarUrl);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAvatar();
  }, [avatarUrl, steamid]);

  return (
    <div className={"avatar"}>
      <img
        src={avatar || defaultPic}
        height={height}
        width={width}
        alt={"Avatar"}
        style={{ filter: `brightness(${flashValue}%)` }}
      />
    </div>
  );
};

export default Avatar;
