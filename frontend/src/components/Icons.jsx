import React from "react";
import {
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAlt,
  FaFileImage,
  FaFileAudio,
  FaFileVideo,
  FaFileCsv,
} from "react-icons/fa";

const iconByMime = {
  "application/pdf": FaFilePdf,

  // Word
  "application/msword": FaFileWord,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FaFileWord,

  // Excel
  "application/vnd.ms-excel": FaFileExcel,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FaFileExcel,

  // PowerPoint
  "application/vnd.ms-powerpoint": FaFilePowerpoint,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": FaFilePowerpoint,

  // CSV & plain text
  "text/csv": FaFileCsv,
  "text/plain": FaFileAlt,
  "text/markdown": FaFileAlt,
};

const prefixMap = {
  "image/": FaFileImage,
  "audio/": FaFileAudio,
  "video/": FaFileVideo,
};

export default function FileIcons({ type = "", size = 22, className = "" }) {
  if (!type || typeof type !== "string") {
    return <FaFile size={size} className={className} />;
  }

  let Icon = iconByMime[type];

  if (!Icon) {
    for (const prefix in prefixMap) {
      if (type.startsWith(prefix)) {
        Icon = prefixMap[prefix];
        break;
      }
    }
  }

  if (!Icon) Icon = FaFile;

  return <Icon size={size} className={className} />;
}
