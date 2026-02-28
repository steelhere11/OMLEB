"use client";

import { PhotoThumbnail } from "./photo-thumbnail";
import type { ReporteFoto } from "@/types";

interface PhotoGalleryRowProps {
  photos: ReporteFoto[];
  onDelete?: (fotoId: string) => void;
  disabled?: boolean;
}

export function PhotoGalleryRow({
  photos,
  onDelete,
  disabled,
}: PhotoGalleryRowProps) {
  if (photos.length === 0) return null;

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {photos.map((foto) => (
        <PhotoThumbnail
          key={foto.id}
          foto={foto}
          onDelete={onDelete}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
